-- Nervous System Check-in and Parts Check-in Tables
-- Quick daily tracking tables (like glimmer_logs and trigger_logs)

-- ============================================================
-- Nervous System Check-ins
-- ============================================================

CREATE TABLE IF NOT EXISTS nervous_system_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ns_state TEXT NOT NULL CHECK (ns_state IN ('ventral', 'sympathetic', 'dorsal', 'mixed')),
  intensity INTEGER NOT NULL DEFAULT 3 CHECK (intensity BETWEEN 1 AND 5),
  body_feeling TEXT,
  thoughts TEXT,
  context TEXT,
  what_might_help TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ns_checkins_user_id ON nervous_system_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_ns_checkins_created_at ON nervous_system_checkins(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ns_checkins_state ON nervous_system_checkins(ns_state);

ALTER TABLE nervous_system_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY ns_checkins_select_policy ON nervous_system_checkins
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY ns_checkins_insert_policy ON nervous_system_checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY ns_checkins_update_policy ON nervous_system_checkins
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY ns_checkins_delete_policy ON nervous_system_checkins
  FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE nervous_system_checkins IS 'Quick daily check-ins for tracking nervous system state';
COMMENT ON COLUMN nervous_system_checkins.ns_state IS 'Current polyvagal state: ventral, sympathetic, dorsal, or mixed';
COMMENT ON COLUMN nervous_system_checkins.intensity IS 'How strongly the state is felt (1-5)';
COMMENT ON COLUMN nervous_system_checkins.body_feeling IS 'Physical sensations noticed';
COMMENT ON COLUMN nervous_system_checkins.thoughts IS 'Thought patterns present';
COMMENT ON COLUMN nervous_system_checkins.context IS 'What is happening / situational context';
COMMENT ON COLUMN nervous_system_checkins.what_might_help IS 'What the user thinks might help regulate';

-- ============================================================
-- Parts Check-ins (IFS)
-- ============================================================

CREATE TABLE IF NOT EXISTS parts_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  part_type TEXT NOT NULL CHECK (part_type IN ('protector', 'firefighter', 'exile', 'self')),
  intensity INTEGER NOT NULL DEFAULT 3 CHECK (intensity BETWEEN 1 AND 5),
  part_name TEXT,
  what_its_saying TEXT,
  what_it_needs TEXT,
  body_location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parts_checkins_user_id ON parts_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_parts_checkins_created_at ON parts_checkins(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_parts_checkins_type ON parts_checkins(part_type);

ALTER TABLE parts_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY parts_checkins_select_policy ON parts_checkins
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY parts_checkins_insert_policy ON parts_checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY parts_checkins_update_policy ON parts_checkins
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY parts_checkins_delete_policy ON parts_checkins
  FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE parts_checkins IS 'Quick daily check-ins for tracking which IFS parts are active';
COMMENT ON COLUMN parts_checkins.part_type IS 'Type of part: protector, firefighter, exile, or self';
COMMENT ON COLUMN parts_checkins.intensity IS 'How present/blended the part is (1-5)';
COMMENT ON COLUMN parts_checkins.part_name IS 'Optional name for the part';
COMMENT ON COLUMN parts_checkins.what_its_saying IS 'What the part is communicating';
COMMENT ON COLUMN parts_checkins.what_it_needs IS 'What the part needs right now';
COMMENT ON COLUMN parts_checkins.body_location IS 'Where it is felt in the body';
