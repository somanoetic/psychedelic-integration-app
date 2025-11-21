-- ============================================================================
-- INTEGRATION FEATURES MIGRATION
-- Run this file to create all 5 new tables for integration features
-- ============================================================================

-- ============================================================================
-- Table 1: IFS Parts Inventory
-- ============================================================================

CREATE TABLE IF NOT EXISTS ifs_parts_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parts JSONB NOT NULL DEFAULT '{"managers": [], "firefighters": [], "exiles": []}',
  custom_notes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE ifs_parts_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own parts inventory"
  ON ifs_parts_inventory
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own parts inventory"
  ON ifs_parts_inventory
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own parts inventory"
  ON ifs_parts_inventory
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own parts inventory"
  ON ifs_parts_inventory
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ifs_parts_inventory_user_id
  ON ifs_parts_inventory(user_id);

CREATE INDEX IF NOT EXISTS idx_ifs_parts_inventory_updated_at
  ON ifs_parts_inventory(updated_at DESC);

-- ============================================================================
-- Table 2: Daily Glimmers
-- ============================================================================

CREATE TABLE IF NOT EXISTS daily_glimmers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  glimmer_text TEXT NOT NULL,
  context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE daily_glimmers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own glimmers"
  ON daily_glimmers
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own glimmers"
  ON daily_glimmers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own glimmers"
  ON daily_glimmers
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own glimmers"
  ON daily_glimmers
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_daily_glimmers_user_id
  ON daily_glimmers(user_id);

CREATE INDEX IF NOT EXISTS idx_daily_glimmers_created_at
  ON daily_glimmers(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_daily_glimmers_user_date
  ON daily_glimmers(user_id, created_at DESC);

-- ============================================================================
-- Table 3: Post-Session Integration Journals
-- ============================================================================

CREATE TABLE IF NOT EXISTS post_session_journals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID,
  session_title TEXT NOT NULL,
  responses JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE post_session_journals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own post-session journals"
  ON post_session_journals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own post-session journals"
  ON post_session_journals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own post-session journals"
  ON post_session_journals
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own post-session journals"
  ON post_session_journals
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_post_session_journals_user_id
  ON post_session_journals(user_id);

CREATE INDEX IF NOT EXISTS idx_post_session_journals_created_at
  ON post_session_journals(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_session_journals_session_id
  ON post_session_journals(session_id);

-- ============================================================================
-- Table 4: Baseline Logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS baseline_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  responses JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE baseline_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own baseline logs"
  ON baseline_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own baseline logs"
  ON baseline_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own baseline logs"
  ON baseline_logs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own baseline logs"
  ON baseline_logs
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_baseline_logs_user_id
  ON baseline_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_baseline_logs_created_at
  ON baseline_logs(created_at DESC);

-- ============================================================================
-- Table 5: Session Intentions
-- ============================================================================

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

ALTER TABLE session_intentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own session intentions"
  ON session_intentions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own session intentions"
  ON session_intentions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own session intentions"
  ON session_intentions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own session intentions"
  ON session_intentions
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_session_intentions_user_id
  ON session_intentions(user_id);

CREATE INDEX IF NOT EXISTS idx_session_intentions_session_id
  ON session_intentions(session_id);

CREATE INDEX IF NOT EXISTS idx_session_intentions_created_at
  ON session_intentions(created_at DESC);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- All 5 tables created successfully!
-- Tables: ifs_parts_inventory, daily_glimmers, post_session_journals,
--         baseline_logs, session_intentions
-- ============================================================================
