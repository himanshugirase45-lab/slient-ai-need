"""
Silence Clock Engine — Ward-Level Inactivity & Underreporting Detector
----------------------------------------------------------------------
SilentNeed AI: Tracks how long each ward has gone without receiving a new
complaint, survey response, or field report.

Key Objectives:
  1. Maintain dynamic elapsed silence tracking from UTC timestamps.
  2. Implement configurable thresholds:
     - Normal: < 15 days without signal
     - Attention Needed: 15–29 days without signal
     - Critical (Silence Alert): >= 30 days without signal
  3. Dynamic scoring formula integrating silence into the Silent Need Score:
     - Base SNI is calculated from physical service distress and complaint gaps.
     - As silence duration increases, an escalating silence penalty is added.
     - Never-reported wards receive maximum penalty (+20.0 points).
     - Final score is bounded strictly between 0.0 and 100.0.
  4. Real-time re-evaluation: Recalculates dynamically on every dashboard
     read/refresh, ensuring alerts update automatically as time elapses without
     requiring daily manual database cron updates.
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any


# ── Configurable Silence Clock Thresholds (in days) ───────────────────────────
SILENCE_THRESHOLD_ATTENTION_DAYS: float = 15.0  # 15 days: triggers Attention Needed
SILENCE_THRESHOLD_CRITICAL_DAYS: float = 30.0   # 30 days: triggers Critical Alert
MAX_SILENCE_PENALTY_POINTS: float = 20.0        # Maximum additive penalty to SNI
MIN_SCORE: float = 0.0                          # Lower bound for Silent Need Score
MAX_SCORE: float = 100.0                        # Upper bound for Silent Need Score


def calculate_silence_penalty(silence_days: Optional[float]) -> float:
    """
    Transparent, documented scoring formula for the Silence Clock penalty.

    Mathematical Definition:
      - None ("Never reported") : +20.0 pts (maximum silence exclusion penalty)
      - 0 <= days < 15 (Normal)  : 0.0 pts (active civic engagement)
      - 15 <= days < 30 (Attention Needed): 4.0 + (days - 15) * 0.4 pts (smooth rise: 4.0 to 10.0 pts)
      - 30 <= days < 60 (Critical Alert) : 10.0 + (days - 30) * 0.33 pts (smooth rise: 10.0 to 20.0 pts)
      - days >= 60 (Ghost Ward)  : 20.0 pts (capped at maximum penalty)

    Returns:
      float: Additive penalty points bounded by [0.0, 20.0].
    """
    if silence_days is None:
        return MAX_SILENCE_PENALTY_POINTS

    days = max(0.0, float(silence_days))

    if days < SILENCE_THRESHOLD_ATTENTION_DAYS:
        return 0.0
    elif days < SILENCE_THRESHOLD_CRITICAL_DAYS:
        # Smooth interpolation between 4.0 and 10.0
        offset = (days - SILENCE_THRESHOLD_ATTENTION_DAYS) / (SILENCE_THRESHOLD_CRITICAL_DAYS - SILENCE_THRESHOLD_ATTENTION_DAYS)
        return round(4.0 + offset * 6.0, 1)
    elif days < 60.0:
        # Smooth interpolation between 10.0 and 20.0
        offset = (days - SILENCE_THRESHOLD_CRITICAL_DAYS) / (60.0 - SILENCE_THRESHOLD_CRITICAL_DAYS)
        return round(min(MAX_SILENCE_PENALTY_POINTS, 10.0 + offset * 10.0), 1)
    else:
        return MAX_SILENCE_PENALTY_POINTS


def apply_silence_penalty(base_sni: float, silence_penalty: float) -> float:
    """
    Integrates silence duration into the Silent Need Score calculation.

    Formula:
      Silent_Need_Score = min(MAX_SCORE, max(MIN_SCORE, base_sni + silence_penalty))

    Guarantees:
      - Strict clamping within [MIN_SCORE, MAX_SCORE] (0.0 to 100.0).
      - Transparent, deterministic, and auditable score adjustments.
    """
    try:
        base = float(base_sni)
    except (TypeError, ValueError):
        base = 50.0

    penalty = max(0.0, float(silence_penalty))
    adjusted = round(min(MAX_SCORE, max(MIN_SCORE, base + penalty)), 1)
    return adjusted


def format_silence_display(silence_days: Optional[float]) -> str:
    """
    Produces human-readable silence duration text:
      - None        -> "Never reported"
      - 0.0 to 0.9  -> "0 days silent" (or "Active today")
      - 1.0 to 1.9  -> "1 day silent"
      - >= 2.0      -> "X days silent"
    """
    if silence_days is None:
        return "Never reported"
    
    days_int = int(silence_days)
    if days_int == 0:
        return "0 days silent"
    elif days_int == 1:
        return "1 day silent"
    else:
        return f"{days_int} days silent"


def compute_silence_clock(
    community_id: int,
    community_name: str,
    last_signal_received_at: Optional[datetime],
    total_signals: int = 0,
    signal_type_breakdown: Optional[Dict[str, int]] = None,
    ward_identifier: Optional[str] = None,
    current_sni: Optional[float] = None,
    now: Optional[datetime] = None,
) -> Dict[str, Any]:
    """
    Dynamically computes the Silence Clock for a ward using UTC timestamps.

    Parameters:
      community_id            : DB id of the ward/community
      community_name          : Display name
      last_signal_received_at : UTC datetime of the latest valid signal (or None)
      total_signals           : Total append-only signal records logged
      signal_type_breakdown   : e.g. {"Complaint": 4, "Field Report": 1}
      ward_identifier         : Optional ward code or number (e.g. "Ward 42-B")
      current_sni             : Optional current base or adjusted Silent Need Score
      now                     : Optional reference datetime (defaults to datetime.utcnow())

    Returns:
      dict adhering to SilenceClockResponse schema.
    """
    if signal_type_breakdown is None:
        signal_type_breakdown = {}

    if now is None:
        now = datetime.utcnow()
    elif now.tzinfo is not None:
        # Convert timezone-aware datetime to naive UTC
        now = now.astimezone(timezone.utc).replace(tzinfo=None)

    # 1. Evaluate elapsed silence in days with UTC consistency
    if last_signal_received_at is None:
        silence_days = None
        silence_display = "Never reported"
        silence_status = "Critical"
        silence_tier = "Ghost Ward"
        silence_tier_color = "rose"
        penalty = MAX_SILENCE_PENALTY_POINTS
        alert_triggered = True
        alert_message = (
            "🚨 Critical Alert: Ward has never submitted any civic complaints, surveys, "
            "or field reports. Full civic exclusion penalty (+20.0 pts) applied."
        )
    else:
        ts = last_signal_received_at
        if ts.tzinfo is not None:
            ts = ts.astimezone(timezone.utc).replace(tzinfo=None)

        delta = now - ts
        # Ensure non-negative float days
        silence_days = max(0.0, delta.total_seconds() / 86400.0)
        silence_display = format_silence_display(silence_days)
        penalty = calculate_silence_penalty(silence_days)

        if silence_days < SILENCE_THRESHOLD_ATTENTION_DAYS:
            silence_status = "Normal"
            silence_tier = "Active"
            silence_tier_color = "emerald"
            alert_triggered = False
            alert_message = (
                f"Ward is actively reporting ({silence_display}). Within normal reporting threshold."
            )
        elif silence_days < SILENCE_THRESHOLD_CRITICAL_DAYS:
            silence_status = "Attention Needed"
            silence_tier = "Drifting"
            silence_tier_color = "amber"
            alert_triggered = False
            alert_message = (
                f"Ward has gone {silence_display} without any signal. "
                "Approaching the 30-day critical silence threshold; proactive outreach recommended."
            )
        elif silence_days < 60.0:
            silence_status = "Critical"
            silence_tier = "Silent"
            silence_tier_color = "orange"
            alert_triggered = True
            alert_message = (
                f"⚠️ Critical Silence Alert: {silence_display} elapsed since last signal "
                f"(exceeds {int(SILENCE_THRESHOLD_CRITICAL_DAYS)}-day threshold). "
                "Silent Need Score has been escalated."
            )
        else:
            silence_status = "Critical"
            silence_tier = "Ghost Ward"
            silence_tier_color = "rose"
            alert_triggered = True
            alert_message = (
                f"🚨 Critical Ghost Ward Alert: {silence_display} of continuous civic silence. "
                "High probability of systematic digital exclusion or reporting suppression. "
                "Immediate ground field audit mandated."
            )

    # Compute final score if base score provided
    final_score = None
    if current_sni is not None:
        final_score = apply_silence_penalty(current_sni, penalty)

    return {
        "community_id": community_id,
        "community_name": community_name,
        "ward_identifier": ward_identifier,
        "last_signal_at": last_signal_received_at,
        "last_signal_received_at": last_signal_received_at,
        "silence_duration_days": round(silence_days, 1) if silence_days is not None else None,
        "silence_display": silence_display,
        "silence_status": silence_status,
        "silence_tier": silence_tier,
        "silence_tier_color": silence_tier_color,
        "silence_penalty_points": penalty,
        "alert_triggered": alert_triggered,
        "alert_message": alert_message,
        "threshold_days": SILENCE_THRESHOLD_CRITICAL_DAYS,
        "total_signals_logged": total_signals,
        "signal_type_breakdown": signal_type_breakdown,
        "silent_need_score": final_score,
    }
