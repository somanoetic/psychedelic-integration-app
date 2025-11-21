-- Nervous System Context Table
-- High-level summary of user's nervous system awareness and regulation capacity

CREATE TABLE IF NOT EXISTS nervous_system_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Current Understanding & Awareness
  understands_three_states BOOLEAN DEFAULT false,
  can_identify_current_state BOOLEAN DEFAULT false,
  notices_state_shifts BOOLEAN DEFAULT false,

  -- Pattern Awareness
  knows_their_triggers BOOLEAN DEFAULT false,
  knows_their_glimmers BOOLEAN DEFAULT false,
  recognizes_cycles TEXT, -- "I notice I go from anxiety to shutdown when overwhelmed for too long"

  -- Regulation Capacity
  has_individual_resources BOOLEAN DEFAULT false,
  has_interactive_resources BOOLEAN DEFAULT false,
  uses_resources_regularly BOOLEAN DEFAULT false,

  regulation_capacity TEXT DEFAULT 'building' CHECK (regulation_capacity IN ('building', 'developing', 'moderate', 'strong')),
  awareness_level TEXT DEFAULT 'beginning' CHECK (awareness_level IN ('beginning', 'developing', 'practiced', 'embodied')),

  -- Integration Progress
  can_stay_present_in_dysregulation BOOLEAN DEFAULT false,
  has_compassion_for_states BOOLEAN DEFAULT false,
  sees_states_as_protective BOOLEAN DEFAULT false,

  -- Overall Notes
  progress_notes TEXT,
  therapist_notes TEXT, -- If working with a therapist, for their observations

  -- Metadata
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_ns_context_user ON nervous_system_context(user_id);

-- Row Level Security
ALTER TABLE nervous_system_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own context" ON nervous_system_context
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own context" ON nervous_system_context
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own context" ON nervous_system_context
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own context" ON nervous_system_context
  FOR DELETE USING (auth.uid() = user_id);

-- Function to auto-update last_updated timestamp
CREATE OR REPLACE FUNCTION update_ns_context_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS ns_context_last_updated_trigger ON nervous_system_context;
CREATE TRIGGER ns_context_last_updated_trigger
  BEFORE UPDATE ON nervous_system_context
  FOR EACH ROW
  EXECUTE FUNCTION update_ns_context_last_updated();

COMMENT ON TABLE nervous_system_context IS 'High-level tracking of user nervous system awareness and regulation capacity development';
