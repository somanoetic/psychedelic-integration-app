-- Baseline Logs Table
-- Pre-treatment baseline tracking across life domains

CREATE TABLE IF NOT EXISTS baseline_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  responses JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE baseline_logs ENABLE ROW LEVEL SECURITY;

-- Users can read their own baselines
CREATE POLICY "Users can read own baseline logs"
  ON baseline_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own baselines
CREATE POLICY "Users can insert own baseline logs"
  ON baseline_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own baselines
CREATE POLICY "Users can update own baseline logs"
  ON baseline_logs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own baselines
CREATE POLICY "Users can delete own baseline logs"
  ON baseline_logs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_baseline_logs_user_id
  ON baseline_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_baseline_logs_created_at
  ON baseline_logs(created_at DESC);
