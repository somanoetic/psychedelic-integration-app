-- Post-Session Integration Journals Table
-- Comprehensive multi-sensory tracking for psychedelic integration

CREATE TABLE IF NOT EXISTS post_session_journals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID,
  session_title TEXT NOT NULL,
  responses JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE post_session_journals ENABLE ROW LEVEL SECURITY;

-- Users can read their own journals
CREATE POLICY "Users can read own post-session journals"
  ON post_session_journals
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own journals
CREATE POLICY "Users can insert own post-session journals"
  ON post_session_journals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own journals
CREATE POLICY "Users can update own post-session journals"
  ON post_session_journals
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own journals
CREATE POLICY "Users can delete own post-session journals"
  ON post_session_journals
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_post_session_journals_user_id
  ON post_session_journals(user_id);

CREATE INDEX IF NOT EXISTS idx_post_session_journals_created_at
  ON post_session_journals(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_session_journals_session_id
  ON post_session_journals(session_id);
