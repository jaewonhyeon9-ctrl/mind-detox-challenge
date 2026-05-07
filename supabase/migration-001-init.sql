-- Mind Detox Challenge — initial schema
-- Run in Supabase SQL Editor on project pwnegioardhvvkxttjsx

-- Teilnehmer (participants)
CREATE TABLE IF NOT EXISTS mdc_participants (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mdc_participants_order ON mdc_participants(display_order, name);

-- Meditations-Eintraege (one row per check, presence = TRUE, absence = FALSE)
CREATE TABLE IF NOT EXISTS mdc_logs (
  id BIGSERIAL PRIMARY KEY,
  participant_id BIGINT NOT NULL REFERENCES mdc_participants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (participant_id, date)
);

CREATE INDEX IF NOT EXISTS idx_mdc_logs_date ON mdc_logs(date);
CREATE INDEX IF NOT EXISTS idx_mdc_logs_participant ON mdc_logs(participant_id);

-- RLS: open access (no auth, trusted group)
ALTER TABLE mdc_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdc_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mdc_participants_read" ON mdc_participants;
DROP POLICY IF EXISTS "mdc_logs_read" ON mdc_logs;
DROP POLICY IF EXISTS "mdc_logs_insert" ON mdc_logs;
DROP POLICY IF EXISTS "mdc_logs_delete" ON mdc_logs;

CREATE POLICY "mdc_participants_read" ON mdc_participants FOR SELECT USING (true);
CREATE POLICY "mdc_logs_read"         ON mdc_logs         FOR SELECT USING (true);
CREATE POLICY "mdc_logs_insert"       ON mdc_logs         FOR INSERT WITH CHECK (true);
CREATE POLICY "mdc_logs_delete"       ON mdc_logs         FOR DELETE USING (true);
