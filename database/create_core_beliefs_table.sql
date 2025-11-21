-- Core Beliefs Inventory Table
-- Based on "Prisoners of Belief" by Matthew McKay, Ph.D.
-- Tracks 10 core belief domains over time to measure psychedelic integration impact

CREATE TABLE IF NOT EXISTS core_beliefs_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Assessment context
  assessment_type TEXT NOT NULL CHECK (assessment_type IN (
    'baseline',           -- Pre-treatment baseline
    'post_session',       -- After specific session
    'follow_up_1week',    -- 1 week post-session
    'follow_up_1month',   -- 1 month post-session
    'follow_up_3month',   -- 3 months post-session
    'follow_up_6month',   -- 6 months post-session
    'periodic'            -- Regular check-in
  )),

  -- Link to session if post-session assessment
  session_id UUID,  -- Links to post_session_journals.session_id

  -- 10 Core Belief Domain Scores (0-10 each, higher = healthier)
  value_worthiness INTEGER CHECK (value_worthiness >= 0 AND value_worthiness <= 10),
  security_safety INTEGER CHECK (security_safety >= 0 AND security_safety <= 10),
  performance_competence INTEGER CHECK (performance_competence >= 0 AND performance_competence <= 10),
  control_power INTEGER CHECK (control_power >= 0 AND control_power <= 10),
  love_nurturance INTEGER CHECK (love_nurturance >= 0 AND love_nurturance <= 10),
  autonomy_independence INTEGER CHECK (autonomy_independence >= 0 AND autonomy_independence <= 10),
  justice_fairness INTEGER CHECK (justice_fairness >= 0 AND justice_fairness <= 10),
  belonging_connection INTEGER CHECK (belonging_connection >= 0 AND belonging_connection <= 10),
  others_trust INTEGER CHECK (others_trust >= 0 AND others_trust <= 10),
  standards_compassion INTEGER CHECK (standards_compassion >= 0 AND standards_compassion <= 10),

  -- Domain-specific notes (what beliefs surfaced)
  value_notes TEXT,
  security_notes TEXT,
  performance_notes TEXT,
  control_notes TEXT,
  love_notes TEXT,
  autonomy_notes TEXT,
  justice_notes TEXT,
  belonging_notes TEXT,
  others_notes TEXT,
  standards_notes TEXT,

  -- Overall assessment data
  overall_notes TEXT,
  completion_duration_minutes INTEGER,
  completed BOOLEAN DEFAULT false,

  -- Timestamps
  assessment_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_core_beliefs_user_id ON core_beliefs_assessments(user_id);
CREATE INDEX idx_core_beliefs_assessment_type ON core_beliefs_assessments(assessment_type);
CREATE INDEX idx_core_beliefs_session_id ON core_beliefs_assessments(session_id);
CREATE INDEX idx_core_beliefs_assessment_date ON core_beliefs_assessments(assessment_date DESC);
CREATE INDEX idx_core_beliefs_completed ON core_beliefs_assessments(user_id, completed);

-- Composite index for tracking progress over time
CREATE INDEX idx_core_beliefs_user_timeline ON core_beliefs_assessments(
  user_id,
  assessment_date DESC
);

-- Row Level Security
ALTER TABLE core_beliefs_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own core beliefs assessments"
  ON core_beliefs_assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own core beliefs assessments"
  ON core_beliefs_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own core beliefs assessments"
  ON core_beliefs_assessments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own core beliefs assessments"
  ON core_beliefs_assessments FOR DELETE
  USING (auth.uid() = user_id);

-- Updated timestamp trigger
CREATE TRIGGER update_core_beliefs_assessments_updated_at
  BEFORE UPDATE ON core_beliefs_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE core_beliefs_assessments IS 'Tracks core beliefs inventory assessments over time to measure psychedelic integration impact';
COMMENT ON COLUMN core_beliefs_assessments.session_id IS 'Optional link to post_session_journals.session_id for post-session assessments';
COMMENT ON COLUMN core_beliefs_assessments.value_worthiness IS 'Domain 1: "I am worthy" - Self-worth, deserving of love and respect (0-10)';
COMMENT ON COLUMN core_beliefs_assessments.security_safety IS 'Domain 2: "I am safe" - Sense of safety in the world (0-10)';
COMMENT ON COLUMN core_beliefs_assessments.performance_competence IS 'Domain 3: "I am competent" - Ability to perform tasks, trust in judgment (0-10)';
COMMENT ON COLUMN core_beliefs_assessments.control_power IS 'Domain 4: "I am powerful" - Sense of control over life (0-10)';
COMMENT ON COLUMN core_beliefs_assessments.love_nurturance IS 'Domain 5: "I am loved" - Feeling cared for, supported, nurtured (0-10)';
COMMENT ON COLUMN core_beliefs_assessments.autonomy_independence IS 'Domain 6: "I am autonomous" - Independence, self-reliance (0-10)';
COMMENT ON COLUMN core_beliefs_assessments.justice_fairness IS 'Domain 7: "I am treated justly" - Accepting life as fair/reasonable (0-10)';
COMMENT ON COLUMN core_beliefs_assessments.belonging_connection IS 'Domain 8: "I belong" - Connection to community, humanity (0-10)';
COMMENT ON COLUMN core_beliefs_assessments.others_trust IS 'Domain 9: "People are good" - Trust in others, expecting positive behavior (0-10)';
COMMENT ON COLUMN core_beliefs_assessments.standards_compassion IS 'Domain 10: "My standards are reasonable" - Self-compassion, reasonable expectations (0-10)';
