-- IFS Session History Table
-- Stores detailed history of each IFS session for continuity and context

CREATE TABLE IF NOT EXISTS ifs_session_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  part_id UUID REFERENCES ifs_parts_inventory(id) ON DELETE CASCADE,

  -- Session Identification
  session_type TEXT NOT NULL CHECK (session_type IN ('discovery', 'check_in', 'exile_access', 'unburdening', 'follow_up')),
  session_phase TEXT, -- The phase during this session
  duration_minutes INTEGER,

  -- Session Content
  starting_question TEXT, -- "What part is coming up?"
  part_was_known BOOLEAN DEFAULT false, -- Was this an existing part or new discovery?
  conversation_summary TEXT, -- AI-generated or manual summary
  key_insights TEXT, -- Main learnings from this session

  -- Relationship Work
  protector_permissions JSONB DEFAULT '[]'::jsonb, -- [{part_name, granted_permission: true/false, concerns: "..."}]
  exile_work_attempted BOOLEAN DEFAULT false,
  exile_work_successful BOOLEAN,

  -- User State
  nervous_system_state_start TEXT, -- ventral/sympathetic/dorsal at start
  nervous_system_state_end TEXT, -- State at end
  grounding_needed BOOLEAN DEFAULT false,

  -- Outcomes & Next Steps
  completed BOOLEAN DEFAULT false,
  session_outcome TEXT, -- "discovered new manager", "accessed exile", "unburdened shame"
  next_steps TEXT,
  follow_up_needed BOOLEAN DEFAULT false,
  follow_up_date DATE, -- When to check back in

  -- Metadata
  session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ifs_sessions_user ON ifs_session_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ifs_sessions_part ON ifs_session_history(part_id);
CREATE INDEX IF NOT EXISTS idx_ifs_sessions_type ON ifs_session_history(session_type);
CREATE INDEX IF NOT EXISTS idx_ifs_sessions_date ON ifs_session_history(session_date DESC);

-- Row Level Security
ALTER TABLE ifs_session_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON ifs_session_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON ifs_session_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON ifs_session_history
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON ifs_session_history
  FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE ifs_session_history IS 'Detailed history of each IFS session for tracking progress and maintaining therapeutic continuity';
