-- Active Imagination Sessions table
-- Stores session data for Jung/Johnson Active Imagination practice

CREATE TABLE IF NOT EXISTS active_imagination_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Entry method: 'open', 'fantasy', 'inner_place', 'journey_figure'
  entry_method TEXT NOT NULL DEFAULT 'open',

  -- Optional FK to source figure (IFS parts inventory)
  source_figure_id UUID REFERENCES ifs_parts_inventory(id) ON DELETE SET NULL,

  -- Figures encountered during session
  inner_figures JSONB DEFAULT '[]'::jsonb,

  -- Session content
  dialogue_summary TEXT,
  ethical_insights TEXT,
  ritual_designed TEXT,
  ritual_completed BOOLEAN DEFAULT false,

  -- Nervous system tracking
  nervous_system_start TEXT,
  nervous_system_end TEXT,

  -- Session metadata
  session_duration_minutes INTEGER,
  session_notes JSONB DEFAULT '{}'::jsonb
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_active_imagination_sessions_user_id
  ON active_imagination_sessions(user_id);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_active_imagination_sessions_created_at
  ON active_imagination_sessions(created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_active_imagination_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_active_imagination_updated_at
  BEFORE UPDATE ON active_imagination_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_active_imagination_updated_at();

-- Row Level Security
ALTER TABLE active_imagination_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own active imagination sessions"
  ON active_imagination_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own active imagination sessions"
  ON active_imagination_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own active imagination sessions"
  ON active_imagination_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own active imagination sessions"
  ON active_imagination_sessions FOR DELETE
  USING (auth.uid() = user_id);
