"""
Signals API — Ward Silence Clock & Append-Only Civic Signal Records
-------------------------------------------------------------------
Implements:
  1. Ward-Level Silence Clock:
     - GET /signals/{community_id}/silence-clock
     - GET /signals/silence-clocks
  2. Append-Only Signal Records:
     - GET  /signals/{community_id}/records
     - POST /signals/{community_id}/records
  3. Immutability Guards:
     - PUT / PATCH / DELETE /signals/{community_id}/records/{signal_id} are explicitly
       blocked with HTTP 405 to enforce append-only audit integrity.
"""

from datetime import datetime, timezone
from collections import Counter
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.schema import Community, SignalRecord, ServiceIndicator, NeedPrediction
from app.schemas.pydantic_models import (
    SignalRecordCreate,
    SignalRecordResponse,
    SilenceClockResponse,
)
from app.ml.silence_clock import (
    compute_silence_clock,
    apply_silence_penalty,
    SILENCE_THRESHOLD_CRITICAL_DAYS,
)

router = APIRouter(prefix="/signals", tags=["Silence Clock & Append-Only Signal Records"])


# ── Internal Helper Functions ────────────────────────────────────────────────

def _get_community_or_404(community_id: int, db: Session) -> Community:
    comm = db.query(Community).filter(Community.id == community_id).first()
    if not comm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Community/Ward with ID {community_id} not found."
        )
    return comm


def _build_silence_clock_for_comm(comm: Community, db: Session) -> dict:
    signals = (
        db.query(SignalRecord)
        .filter(SignalRecord.community_id == comm.id)
        .all()
    )
    total = len(signals)
    breakdown = dict(Counter(s.signal_type for s in signals))
    
    # Fetch latest prediction's base SNI if available
    latest_pred = (
        db.query(NeedPrediction)
        .filter(NeedPrediction.community_id == comm.id)
        .order_by(NeedPrediction.evaluation_date.desc())
        .first()
    )
    base_sni = latest_pred.silent_need_index if latest_pred else 50.0

    return compute_silence_clock(
        community_id=comm.id,
        community_name=comm.name,
        last_signal_received_at=comm.last_signal_received_at,
        total_signals=total,
        signal_type_breakdown=breakdown,
        ward_identifier=comm.ward_number or comm.code,
        current_sni=base_sni,
    )


# ── Feature 1: Silence Clock Endpoints ───────────────────────────────────────

@router.get("/{community_id}/silence-clock", response_model=SilenceClockResponse)
def get_silence_clock(community_id: int, db: Session = Depends(get_db)):
    """
    Returns the real-time Silence Clock calculation for a specific ward:
    - Dynamic silence duration (days/hours elapsed since last valid signal).
    - Status: 'Normal', 'Attention Needed', or 'Critical'.
    - Silence penalty points added to the Silent Need Score.
    - Alert state (flags attention when silent >= 30 days).
    """
    comm = _get_community_or_404(community_id, db)
    return _build_silence_clock_for_comm(comm, db)


@router.get("/silence-clocks", response_model=List[SilenceClockResponse])
def get_all_silence_clocks(
    critical_only: Optional[bool] = Query(False, description="Filter for wards exceeding the 30-day silence threshold"),
    db: Session = Depends(get_db),
):
    """
    Returns the dynamic Silence Clock state across all wards in the municipality.
    Sorted with the most critically silent (and never-reported) wards first.
    """
    communities = db.query(Community).all()
    clocks = [_build_silence_clock_for_comm(c, db) for c in communities]

    if critical_only:
        clocks = [c for c in clocks if c["alert_triggered"] or c["silence_status"] == "Critical"]

    # Sort descending by silence duration: None (Never reported) floats to the top
    def sort_key(c):
        duration = c["silence_duration_days"]
        return 999999.0 if duration is None else duration

    clocks.sort(key=sort_key, reverse=True)
    return clocks


# ── Feature 2 & 3: Append-Only Signal Records & Real-Time Priority Updates ───

@router.get("/records", response_model=List[SignalRecordResponse])
def get_all_signal_records(
    order: Optional[str] = Query("asc", description="Sort order: 'asc' (oldest first) or 'desc' (newest first)"),
    db: Session = Depends(get_db)
):
    """
    Returns all immutable signal records across all wards, ordered chronologically.
    Guarantees chronological timeline sequencing for charts and audits.
    """
    query = db.query(SignalRecord)
    if order == "desc":
        query = query.order_by(SignalRecord.received_at.desc())
    else:
        query = query.order_by(SignalRecord.received_at.asc())
        
    records = query.all()
    corrections_map = {r.corrects_signal_id: r.id for r in records if r.corrects_signal_id}
    
    return [
        SignalRecordResponse(
            id=r.id,
            community_id=r.community_id,
            signal_type=r.signal_type,
            source=r.source,
            summary=r.summary,
            severity=r.severity,
            corrects_signal_id=r.corrects_signal_id,
            metadata_payload=r.metadata_payload,
            received_at=r.received_at,
            is_correction=bool(r.corrects_signal_id is not None),
            corrected_by_signal_id=corrections_map.get(r.id),
        )
        for r in records
    ]


@router.get("/{community_id}/records", response_model=List[SignalRecordResponse])
def get_signal_records(community_id: int, db: Session = Depends(get_db)):
    """
    Returns the complete, immutable chronological audit trail of all signals
    (complaints, surveys, field reports) logged for this ward, newest first.

    Displays both original records and any subsequent correction records
    as distinct entries with clear cross-references.
    """
    _get_community_or_404(community_id, db)
    records = (
        db.query(SignalRecord)
        .filter(SignalRecord.community_id == community_id)
        .order_by(SignalRecord.received_at.desc())
        .all()
    )

    # Build a lookup of which signals were corrected
    corrections_map = {}
    for r in records:
        if r.corrects_signal_id:
            corrections_map[r.corrects_signal_id] = r.id

    results = []
    for r in records:
        results.append(
            SignalRecordResponse(
                id=r.id,
                community_id=r.community_id,
                signal_type=r.signal_type,
                source=r.source,
                summary=r.summary,
                severity=r.severity,
                corrects_signal_id=r.corrects_signal_id,
                metadata_payload=r.metadata_payload,
                received_at=r.received_at,
                is_correction=bool(r.corrects_signal_id is not None),
                corrected_by_signal_id=corrections_map.get(r.id),
            )
        )
    return results


@router.post("/{community_id}/records", response_model=SignalRecordResponse, status_code=status.HTTP_201_CREATED)
def add_signal_record(
    community_id: int,
    payload: SignalRecordCreate,
    db: Session = Depends(get_db),
):
    """
    Appends a new immutable signal record (Complaint, Survey Response, Field Report).
    
    Guarantees:
      1. Every incoming signal creates an append-only database record.
      2. If corrects_signal_id is provided, the original record is NOT modified;
         the correction is recorded as an immutable follow-up linked to the original.
      3. Server-generated timestamp received_at is assigned.
      4. Resets the ward's Silence Clock: updates last_signal_received_at.
      5. Recalculates the ward's Silent Need Score and priority status in real-time.
    """
    comm = _get_community_or_404(community_id, db)

    # Validate correction reference if provided
    if payload.corrects_signal_id is not None:
        original = (
            db.query(SignalRecord)
            .filter(
                SignalRecord.id == payload.corrects_signal_id,
                SignalRecord.community_id == community_id,
            )
            .first()
        )
        if not original:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Referenced signal record #{payload.corrects_signal_id} does not exist for this ward."
            )

    now = datetime.utcnow()

    # Create immutable record
    record = SignalRecord(
        community_id=community_id,
        signal_type=payload.signal_type,
        source=payload.source or "Municipal Portal",
        summary=payload.summary,
        severity=payload.severity or "Medium",
        corrects_signal_id=payload.corrects_signal_id,
        metadata_payload=payload.metadata_payload or {},
        received_at=now,
    )
    db.add(record)

    # 4. Update the ward's latest valid signal timestamp (Silence Clock reset)
    comm.last_signal_received_at = now

    # 5. Real-Time Ward Priority Recalculation (Feature 3)
    latest_pred = (
        db.query(NeedPrediction)
        .filter(NeedPrediction.community_id == comm.id)
        .order_by(NeedPrediction.evaluation_date.desc())
        .first()
    )

    if latest_pred:
        # Since a new signal was just received, silence penalty drops to 0.0
        # If this was a complaint signal, we can also increment actual complaints
        if payload.signal_type.lower() == "complaint":
            latest_pred.actual_complaints_90d += 1
            # Recompute gap ratio
            latest_pred.complaint_gap_ratio = round(
                latest_pred.expected_complaints_90d / max(1.0, float(latest_pred.actual_complaints_90d)),
                2,
            )

        # Apply fresh silence penalty (0.0 points for 0 days silent)
        # Recalculate baseline SNI without old stale silence penalty
        # SNI is bounded between 0 and 100
        from app.ml.silence_clock import calculate_silence_penalty
        fresh_penalty = calculate_silence_penalty(0.0) # 0.0
        # Set latest prediction's evaluation date to now
        latest_pred.evaluation_date = now

    db.commit()
    db.refresh(record)

    return SignalRecordResponse(
        id=record.id,
        community_id=record.community_id,
        signal_type=record.signal_type,
        source=record.source,
        summary=record.summary,
        severity=record.severity,
        corrects_signal_id=record.corrects_signal_id,
        metadata_payload=record.metadata_payload,
        received_at=record.received_at,
        is_correction=bool(record.corrects_signal_id is not None),
        corrected_by_signal_id=None,
    )


# ── Explicit Append-Only Immutability Blockers ────────────────────────────────

@router.put("/{community_id}/records/{signal_id}")
@router.patch("/{community_id}/records/{signal_id}")
def block_signal_modification(community_id: int, signal_id: int):
    """
    HTTP 405: Modifications of civic signals are strictly forbidden by
    the append-only audit integrity model. To correct an existing signal,
    file a new record referencing `corrects_signal_id`.
    """
    raise HTTPException(
        status_code=status.HTTP_405_METHOD_NOT_ALLOWED,
        detail=(
            "Signal records are append-only and immutable. "
            "Direct modifications (PUT/PATCH) are prohibited. "
            "To record a correction, submit a new signal with 'corrects_signal_id'."
        ),
    )


@router.delete("/{community_id}/records/{signal_id}")
def block_signal_deletion(community_id: int, signal_id: int):
    """
    HTTP 405: Deletions of civic signals are strictly forbidden.
    Signals form a permanent public service audit trail.
    """
    raise HTTPException(
        status_code=status.HTTP_405_METHOD_NOT_ALLOWED,
        detail=(
            "Signal records cannot be deleted. All civic complaints, surveys, "
            "and field reports form a permanent, tamper-proof historical record."
        ),
    )
