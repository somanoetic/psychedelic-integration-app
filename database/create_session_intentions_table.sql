-- Session Intentions Table
-- Stores user intentions and goals for psychedelic sessions

CREATE TABLE IF NOT EXISTS session_intentions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID,
  goals TEXT[] DEFAULT '{}',
  intentions TEXT[] DEFAULT '{}',
  openness TEXT,
  surrender TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE session_intentions ENABLE ROW LEVEL SECURITY;

-- Users can read their own intentions
CREATE POLICY "Users can read own session intentions"
  ON session_intentions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own intentions
CREATE POLICY "Users can insert own session intentions"
  ON session_intentions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own intentions
CREATE POLICY "Users can update own session intentions"
  ON session_intentions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own intentions
CREATE POLICY "Users can delete own session intentions"
  ON session_intentions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_session_intentions_user_id
  ON session_intentions(user_id);

CREATE INDEX IF NOT EXISTS idx_session_intentions_session_id
  ON session_intentions(session_id);

CREATE INDEX IF NOT EXISTS idx_session_intentions_created_at
  ON session_intentions(created_at DESC);
