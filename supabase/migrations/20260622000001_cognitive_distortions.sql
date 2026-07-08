-- Cognitive Distortion Tracker
-- A CBT-style thought record. The user notices an automatic/upsetting thought,
-- identifies which cognitive distortion(s) it reflects (Burns' classic 10, plus
-- a free-text "other"), weighs the evidence, and writes a more balanced/reframed
-- thought. Belief strength is captured before and after the reframe so progress
-- in cognitive restructuring is visible over time.
--
-- Non-clinical wellness posture (ADR-009): this is a self-reflection tool, not a
-- diagnostic instrument. `distortion_types` are user-selected labels for their own
-- noticing, never assigned to the user by the app.

CREATE TABLE IF NOT EXISTS cognitive_distortions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- The situation that prompted the thought (CBT thought-record column 1)
  situation TEXT,

  -- The automatic / upsetting thought (required — the core of an entry)
  automatic_thought TEXT NOT NULL,

  -- Which distortion(s) the thought reflects. Multi-select from Burns' 10 plus
  -- 'other'. Stored as a text array of stable ids:
  --   all_or_nothing | overgeneralization | mental_filter | discounting_positives
  --   | jumping_to_conclusions | magnification | emotional_reasoning
  --   | should_statements | labeling | personalization | other
  distortion_types TEXT[] NOT NULL DEFAULT '{}',

  -- Free-text companion for the 'other' selection (or general notes on the type)
  distortion_other TEXT,

  -- Evidence weighing
  evidence_for TEXT,      -- evidence that supports the thought
  evidence_against TEXT,  -- evidence that does not support it

  -- The reframed / more balanced thought
  balanced_thought TEXT,

  -- Belief strength in the ORIGINAL thought, 0–100%, before and after the reframe.
  -- Captures the restructuring shift (e.g. 90 -> 40).
  belief_before INTEGER CHECK (belief_before IS NULL OR (belief_before >= 0 AND belief_before <= 100)),
  belief_after INTEGER CHECK (belief_after IS NULL OR (belief_after >= 0 AND belief_after <= 100)),

  -- Optional mood/emotion note (free text — what the thought stirred up)
  emotion TEXT
);

CREATE INDEX IF NOT EXISTS idx_cognitive_distortions_user_id
  ON cognitive_distortions(user_id);

CREATE INDEX IF NOT EXISTS idx_cognitive_distortions_created_at
  ON cognitive_distortions(created_at DESC);

CREATE OR REPLACE FUNCTION update_cognitive_distortions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_cognitive_distortions_updated_at
  BEFORE UPDATE ON cognitive_distortions
  FOR EACH ROW
  EXECUTE FUNCTION update_cognitive_distortions_updated_at();

ALTER TABLE cognitive_distortions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cognitive distortions"
  ON cognitive_distortions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cognitive distortions"
  ON cognitive_distortions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cognitive distortions"
  ON cognitive_distortions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cognitive distortions"
  ON cognitive_distortions FOR DELETE
  USING (auth.uid() = user_id);
