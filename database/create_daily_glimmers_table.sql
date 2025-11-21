-- Daily Glimmers Table
-- Tracks micro-moments of safety, joy, and connection for nervous system regulation

CREATE TABLE IF NOT EXISTS daily_glimmers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  glimmer_text TEXT NOT NULL,
  context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE daily_glimmers ENABLE ROW LEVEL SECURITY;

-- Users can read their own glimmers
CREATE POLICY "Users can read own glimmers"
  ON daily_glimmers
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own glimmers
CREATE POLICY "Users can insert own glimmers"
  ON daily_glimmers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own glimmers
CREATE POLICY "Users can update own glimmers"
  ON daily_glimmers
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own glimmers
CREATE POLICY "Users can delete own glimmers"
  ON daily_glimmers
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_glimmers_user_id
  ON daily_glimmers(user_id);

CREATE INDEX IF NOT EXISTS idx_daily_glimmers_created_at
  ON daily_glimmers(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_daily_glimmers_user_date
  ON daily_glimmers(user_id, created_at DESC);
