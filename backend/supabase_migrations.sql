-- ==============================================================================
-- SilentNeed AI — Production Supabase & PostgreSQL Migration
-- Append-Only Civic Signal Records & Database-Level Immutability Enforcement
-- ==============================================================================

-- 1. Ensure Table Structure for Append-Only Signals
CREATE TABLE IF NOT EXISTS signal_records (
    id SERIAL PRIMARY KEY,
    community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    signal_type VARCHAR(80) NOT NULL,
    source VARCHAR(120) NOT NULL DEFAULT 'Municipal Portal',
    summary TEXT NOT NULL,
    severity VARCHAR(50) DEFAULT 'Medium',
    corrects_signal_id INTEGER REFERENCES signal_records(id),
    metadata_payload JSONB DEFAULT '{}'::jsonb,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index for high-performance chronological querying
CREATE INDEX IF NOT EXISTS idx_signal_records_community_received
    ON signal_records(community_id, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_signal_records_corrects_id
    ON signal_records(corrects_signal_id);

-- Ensure communities table has last_signal_received_at
ALTER TABLE communities 
    ADD COLUMN IF NOT EXISTS last_signal_received_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 2. PostgreSQL Database-Level Immutability Trigger
-- Forbids ANY direct UPDATE or DELETE operations on signal_records.
-- Guarantees that neither application code nor direct SQL can tamper with signals.

CREATE OR REPLACE FUNCTION prevent_signal_record_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'Append-Only Violation: Signal record #% cannot be updated. Civic audit trails are strictly immutable. File a new record referencing corrects_signal_id instead.', OLD.id;
    ELSIF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Append-Only Violation: Signal record #% cannot be deleted. Civic signal logs form a permanent historical record.', OLD.id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers to signal_records table
DROP TRIGGER IF EXISTS trg_signal_records_prevent_update ON signal_records;
CREATE TRIGGER trg_signal_records_prevent_update
BEFORE UPDATE ON signal_records
FOR EACH ROW
EXECUTE FUNCTION prevent_signal_record_modification();

DROP TRIGGER IF EXISTS trg_signal_records_prevent_delete ON signal_records;
CREATE TRIGGER trg_signal_records_prevent_delete
BEFORE DELETE ON signal_records
FOR EACH ROW
EXECUTE FUNCTION prevent_signal_record_modification();

-- 3. Automatic Community Silence Clock Reset Trigger
-- Whenever a new signal record is inserted, automatically advance the ward's
-- last_signal_received_at timestamp at the database layer.

CREATE OR REPLACE FUNCTION advance_community_silence_clock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE communities
    SET last_signal_received_at = NEW.received_at
    WHERE id = NEW.community_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_signal_records_advance_clock ON signal_records;
CREATE TRIGGER trg_signal_records_advance_clock
AFTER INSERT ON signal_records
FOR EACH ROW
EXECUTE FUNCTION advance_community_silence_clock();

-- 4. Supabase Row Level Security (RLS) Configuration
ALTER TABLE signal_records ENABLE ROW LEVEL SECURITY;

-- Allow public / authenticated users to read all signal history
CREATE POLICY "Allow public read on signal_records"
    ON signal_records
    FOR SELECT
    USING (true);

-- Allow authenticated users and anonymous civic reporters to insert new signals
CREATE POLICY "Allow append-only insertion on signal_records"
    ON signal_records
    FOR INSERT
    WITH CHECK (true);

-- Explicitly DO NOT create UPDATE or DELETE policies.
-- Under Postgres RLS, operations with no matching policy are rejected by default.
-- Combined with the BEFORE UPDATE / BEFORE DELETE triggers above, tampering is impossible.
