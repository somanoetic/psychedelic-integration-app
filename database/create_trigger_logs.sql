-- Trigger Logs Table
-- Comprehensive logging for individual trigger events (separate from discovery exercise)
-- Captures the full cycle: cause -> body response -> emotional response -> behavior -> coping -> current state

CREATE TABLE IF NOT EXISTS trigger_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Trigger classification
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('sympathetic', 'dorsal', 'general')),
  intensity INTEGER NOT NULL CHECK (intensity >= 1 AND intensity <= 5),

  -- The trigger cycle
  cause TEXT NOT NULL, -- What caused/triggered it (required)
  body_response TEXT, -- Physical sensations (racing heart, tight chest, etc.)
  emotional_response TEXT, -- Emotions experienced (fear, anger, shame, etc.)
  behavior_response TEXT, -- What did they do (froze, left, yelled, etc.)
  coping_used TEXT, -- What helped (breathing, grounding, etc.)
  current_state TEXT, -- How they feel now (calmer, still activated, etc.)

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trigger_logs_user_id ON trigger_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_trigger_logs_created_at ON trigger_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trigger_logs_type ON trigger_logs(trigger_type);
CREATE INDEX IF NOT EXISTS idx_trigger_logs_intensity ON trigger_logs(intensity);

-- Row Level Security
ALTER TABLE trigger_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY trigger_logs_select_policy ON trigger_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY trigger_logs_insert_policy ON trigger_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY trigger_logs_update_policy ON trigger_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY trigger_logs_delete_policy ON trigger_logs
  FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE trigger_logs IS 'Comprehensive logging of individual trigger events with full cycle tracking';
COMMENT ON COLUMN trigger_logs.cause IS 'What caused or triggered the activation (required)';
COMMENT ON COLUMN trigger_logs.body_response IS 'Physical sensations experienced';
COMMENT ON COLUMN trigger_logs.emotional_response IS 'Emotions that came up';
COMMENT ON COLUMN trigger_logs.behavior_response IS 'What the person did in response';
COMMENT ON COLUMN trigger_logs.coping_used IS 'What helped them regulate';
COMMENT ON COLUMN trigger_logs.current_state IS 'How they feel after logging';
