-- Glimmer Logs Table
-- Logging for individual glimmer moments - micro-moments of safety, joy, or regulation
-- Separate from the discovery exercise - this is for daily positive moment tracking

CREATE TABLE IF NOT EXISTS glimmer_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Glimmer classification
  glimmer_type TEXT NOT NULL CHECK (glimmer_type IN ('sensory', 'relational', 'activity', 'nature', 'general')),

  -- Glimmer details
  description TEXT NOT NULL, -- What was the glimmer (required)
  body_sensation TEXT, -- How did their body feel
  context TEXT, -- Where/when it happened
  what_made_it_special TEXT, -- Why it stood out

  -- Impact rating
  felt_shift INTEGER CHECK (felt_shift >= 1 AND felt_shift <= 5), -- How much did it shift them

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_glimmer_logs_user_id ON glimmer_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_glimmer_logs_created_at ON glimmer_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_glimmer_logs_type ON glimmer_logs(glimmer_type);
CREATE INDEX IF NOT EXISTS idx_glimmer_logs_shift ON glimmer_logs(felt_shift);

-- Row Level Security
ALTER TABLE glimmer_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY glimmer_logs_select_policy ON glimmer_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY glimmer_logs_insert_policy ON glimmer_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY glimmer_logs_update_policy ON glimmer_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY glimmer_logs_delete_policy ON glimmer_logs
  FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE glimmer_logs IS 'Logging of individual glimmer moments - micro-moments of safety, joy, or regulation';
COMMENT ON COLUMN glimmer_logs.description IS 'What was the glimmer moment (required)';
COMMENT ON COLUMN glimmer_logs.body_sensation IS 'Physical sensations experienced';
COMMENT ON COLUMN glimmer_logs.context IS 'Where and when it happened';
COMMENT ON COLUMN glimmer_logs.what_made_it_special IS 'Why this moment stood out';
COMMENT ON COLUMN glimmer_logs.felt_shift IS 'How much the glimmer shifted their state (1-5)';
