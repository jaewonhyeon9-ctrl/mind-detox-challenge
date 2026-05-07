-- Mind Detox Challenge — allow public CRUD on participants
-- Run AFTER migration-001-init.sql, in Supabase SQL Editor.
--
-- The 001 migration only allows SELECT on mdc_participants. This adds
-- INSERT/UPDATE/DELETE so the trusted group can manage names from the app.

DROP POLICY IF EXISTS "mdc_participants_insert" ON mdc_participants;
DROP POLICY IF EXISTS "mdc_participants_update" ON mdc_participants;
DROP POLICY IF EXISTS "mdc_participants_delete" ON mdc_participants;

CREATE POLICY "mdc_participants_insert" ON mdc_participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "mdc_participants_update" ON mdc_participants
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "mdc_participants_delete" ON mdc_participants
  FOR DELETE USING (true);
