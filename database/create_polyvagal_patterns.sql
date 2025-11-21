-- Polyvagal Patterns Table
-- Stores user's accumulated nervous system patterns over time

CREATE TABLE IF NOT EXISTS polyvagal_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- State-Specific Patterns (accumulated from multiple mapping sessions)
  ventral_patterns JSONB DEFAULT '{
    "situations": [],
    "body_sensations": [],
    "thoughts": [],
    "behaviors": [],
    "personal_language": []
  }'::jsonb,

  sympathetic_patterns JSONB DEFAULT '{
    "situations": [],
    "body_sensations": [],
    "thoughts": [],
    "behaviors": [],
    "personal_language": []
  }'::jsonb,

  dorsal_patterns JSONB DEFAULT '{
    "situations": [],
    "body_sensations": [],
    "thoughts": [],
    "behaviors": [],
    "personal_language": []
  }'::jsonb,

  -- Triggers & Glimmers (accumulated)
  most_common_triggers JSONB DEFAULT '[]'::jsonb, -- Array of trigger objects {type, description, frequency}
  most_reliable_glimmers JSONB DEFAULT '[]'::jsonb, -- Array of glimmer objects {description, effectiveness}

  -- Regulation Resources (accumulated)
  individual_resources JSONB DEFAULT '[]'::jsonb, -- Solo regulation practices
  interactive_resources JSONB DEFAULT '[]'::jsonb, -- Co-regulation resources

  -- Pattern Recognition & Growth
  personal_state_language JSONB DEFAULT '{}'::jsonb, -- How this person uniquely describes their states
  early_warning_signs JSONB DEFAULT '[]'::jsonb, -- What they notice first when dysregulating
  successful_interventions JSONB DEFAULT '[]'::jsonb, -- What's worked to shift states

  regulation_capacity TEXT CHECK (regulation_capacity IN ('building', 'developing', 'moderate', 'strong', NULL)),
  awareness_level TEXT CHECK (awareness_level IN ('beginning', 'developing', 'practiced', 'embodied', NULL)),

  -- Progress Tracking
  mapping_sessions_count INTEGER DEFAULT 0,
  triggers_sessions_count INTEGER DEFAULT 0,
  resources_sessions_count INTEGER DEFAULT 0,

  first_mapped_at TIMESTAMP WITH TIME ZONE,
  last_mapped_at TIMESTAMP WITH TIME ZONE,

  -- User Insights
  user_notes TEXT, -- User's own observations about their patterns
  ai_observations TEXT, -- AI-generated pattern observations

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_polyvagal_user ON polyvagal_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_polyvagal_last_mapped ON polyvagal_patterns(last_mapped_at DESC);

-- Row Level Security
ALTER TABLE polyvagal_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own patterns" ON polyvagal_patterns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own patterns" ON polyvagal_patterns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own patterns" ON polyvagal_patterns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own patterns" ON polyvagal_patterns
  FOR DELETE USING (auth.uid() = user_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_polyvagal_patterns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS polyvagal_patterns_updated_at_trigger ON polyvagal_patterns;
CREATE TRIGGER polyvagal_patterns_updated_at_trigger
  BEFORE UPDATE ON polyvagal_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_polyvagal_patterns_updated_at();

COMMENT ON TABLE polyvagal_patterns IS 'Stores accumulated nervous system patterns helping users recognize their unique expressions of regulation and dysregulation';
