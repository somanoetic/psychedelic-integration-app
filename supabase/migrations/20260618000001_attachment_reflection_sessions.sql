-- Attachment Reflection Sessions table
-- Stores sessions from the Huxley "Attachment Reflection" mode — a reflective,
-- non-clinical adaptation of the Adult Attachment Interview (George/Kaplan/Main).
--
-- IMPORTANT: This is NOT a clinical assessment (see ADR-009, non-HIPAA wellness
-- posture). `backend_pattern` holds a coarse, heuristic, heavily-hedged tentative
-- pattern note for practitioner orientation only. It is NEVER displayed to the
-- user as a label or diagnosis.

CREATE TABLE IF NOT EXISTS attachment_reflection_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Furthest phase reached and whether the arc completed
  phase TEXT,
  completed BOOLEAN DEFAULT false,

  -- Per-caregiver reflection: label, general description, 5 words, and the
  -- memory offered for each word. Shape: see handler getSessionSummary().
  caregivers JSONB DEFAULT '[]'::jsonb,

  -- Specific-experience responses (upset / hurt_ill / separation / rejection / threat)
  experiences JSONB DEFAULT '{}'::jsonb,

  -- Free-form reflective captures
  caregiver_motivations TEXT,
  loss_disclosed BOOLEAN,
  loss_notes TEXT,
  adult_effects TEXT,
  integration_takeaway TEXT,

  -- Practitioner-only tentative pattern hunch (NOT shown to the user)
  backend_pattern JSONB DEFAULT '{}'::jsonb,

  -- Session metadata
  exchange_count INTEGER,
  session_duration_minutes INTEGER,
  session_notes JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_attachment_reflection_sessions_user_id
  ON attachment_reflection_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_attachment_reflection_sessions_created_at
  ON attachment_reflection_sessions(created_at DESC);

CREATE OR REPLACE FUNCTION update_attachment_reflection_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_attachment_reflection_updated_at
  BEFORE UPDATE ON attachment_reflection_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_attachment_reflection_updated_at();

ALTER TABLE attachment_reflection_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attachment reflection sessions"
  ON attachment_reflection_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attachment reflection sessions"
  ON attachment_reflection_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attachment reflection sessions"
  ON attachment_reflection_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own attachment reflection sessions"
  ON attachment_reflection_sessions FOR DELETE
  USING (auth.uid() = user_id);
