-- Craving / Urge Tracker
-- A neutral, non-judgmental log of an urge or craving as it arises — substance,
-- behavior, food, or any compulsion. The user notes what was urged, how intense
-- it got, what was happening, and whether they rode it out ("urge surfing").
--
-- Per design: this tracker deliberately invites nervous-system and parts (IFS)
-- exploration, since urges so often ride on a dysregulated state or a protector
-- part. `ns_state` and `part_note` connect this log into the app's polyvagal +
-- IFS spine so Huxley and the insights view can relate cravings to those domains.
--
-- Non-clinical wellness posture (ADR-009): "urge" framing, not addiction/SUD
-- diagnosis. Nothing here labels the user.

CREATE TABLE IF NOT EXISTS craving_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- What the urge was toward (required). Free text so it stays general:
  -- a substance, a behavior, a food, scrolling, etc.
  urge_for TEXT NOT NULL,

  -- Coarse category for grouping in insights. Stable ids:
  --   substance | behavior | food | digital | other
  urge_category TEXT NOT NULL DEFAULT 'other'
    CHECK (urge_category IN ('substance', 'behavior', 'food', 'digital', 'other')),

  -- Peak intensity of the urge, 1–5 (mild .. overwhelming), mirroring the other trackers.
  intensity INTEGER NOT NULL DEFAULT 3 CHECK (intensity >= 1 AND intensity <= 5),

  -- Context / antecedent: what was happening, what set it off
  trigger_context TEXT,

  -- Body sensations that accompanied the urge
  body_sensation TEXT,

  -- Nervous-system state at the time (polyvagal). NULL = not noted. Stable ids
  -- match nervous_system_checkins.ns_state:
  --   ventral | sympathetic | dorsal | mixed
  ns_state TEXT CHECK (ns_state IS NULL OR ns_state IN ('ventral', 'sympathetic', 'dorsal', 'mixed')),

  -- Parts (IFS) exploration: which part(s) the urge seemed to come from / be
  -- protecting, in the user's own words. Free text, optional.
  part_note TEXT,

  -- Did they ride the wave (urge surfing)? NULL = didn't note / N/A.
  rode_the_wave BOOLEAN,

  -- What they did in response / what helped
  what_helped TEXT,

  -- How they feel now / outcome
  outcome TEXT
);

CREATE INDEX IF NOT EXISTS idx_craving_logs_user_id
  ON craving_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_craving_logs_created_at
  ON craving_logs(created_at DESC);

CREATE OR REPLACE FUNCTION update_craving_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_craving_logs_updated_at
  BEFORE UPDATE ON craving_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_craving_logs_updated_at();

ALTER TABLE craving_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own craving logs"
  ON craving_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own craving logs"
  ON craving_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own craving logs"
  ON craving_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own craving logs"
  ON craving_logs FOR DELETE
  USING (auth.uid() = user_id);
