-- Daily Journals Table
-- General purpose journaling with AI conversation support
-- Stores both raw conversation and extracted structured data

CREATE TABLE IF NOT EXISTS daily_journals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic info
  title TEXT, -- Optional title (can be AI-generated from content)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Journal content
  conversation JSONB, -- Full AI conversation history
  raw_text TEXT, -- Raw journal text if user just wants to write

  -- Extracted/structured data from conversation
  mood TEXT, -- Overall mood (AI extracts)
  emotions TEXT[], -- Array of emotions mentioned
  themes TEXT[], -- Key themes identified by AI
  people_mentioned TEXT[], -- Names of people discussed
  activities TEXT[], -- Activities mentioned
  insights TEXT, -- Key insights or realizations
  gratitude TEXT[], -- Things user is grateful for
  challenges TEXT[], -- Challenges mentioned
  goals TEXT[], -- Goals or intentions set

  -- AI discussion phase
  discussion_requested BOOLEAN DEFAULT FALSE,
  discussion_transcript JSONB, -- Separate conversation for deeper discussion
  ai_suggestions TEXT[], -- Suggestions offered by AI
  reframings JSONB, -- Mindset adjustments and reframings offered

  -- Metadata
  word_count INTEGER,
  sentiment_score FLOAT, -- -1 to 1 (negative to positive)
  tags TEXT[], -- User or AI-generated tags

  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_journals_user_id ON daily_journals(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_journals_created_at ON daily_journals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_journals_tags ON daily_journals USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_daily_journals_emotions ON daily_journals USING GIN(emotions);

-- Row Level Security
ALTER TABLE daily_journals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own journals
CREATE POLICY daily_journals_select_policy ON daily_journals
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own journals
CREATE POLICY daily_journals_insert_policy ON daily_journals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own journals
CREATE POLICY daily_journals_update_policy ON daily_journals
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own journals
CREATE POLICY daily_journals_delete_policy ON daily_journals
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_daily_journals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER daily_journals_updated_at_trigger
  BEFORE UPDATE ON daily_journals
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_journals_updated_at();

COMMENT ON TABLE daily_journals IS 'Daily journaling with AI conversation support and structured data extraction';
