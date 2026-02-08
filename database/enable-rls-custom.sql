-- ============================================================
-- Enable RLS on YOUR actual tables
-- Generated: 2026-02-08T15:18:52.973Z
-- ============================================================

-- Enable RLS on users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on sessions
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on journal_entries
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Enable RLS on journals
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;

-- Enable RLS on entries
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Enable RLS on exercises
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Enable RLS on habit_tracker
ALTER TABLE habit_tracker ENABLE ROW LEVEL SECURITY;

-- Enable RLS on habits
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

-- Enable RLS on trigger_logs
ALTER TABLE trigger_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on triggers
ALTER TABLE triggers ENABLE ROW LEVEL SECURITY;

-- Enable RLS on glimmer_logs
ALTER TABLE glimmer_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on glimmers
ALTER TABLE glimmers ENABLE ROW LEVEL SECURITY;

-- Enable RLS on exercise_progress
ALTER TABLE exercise_progress ENABLE ROW LEVEL SECURITY;

-- Enable RLS on progress
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

-- Enable RLS on curriculum_progress
ALTER TABLE curriculum_progress ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on integration_sessions
ALTER TABLE integration_sessions ENABLE ROW LEVEL SECURITY;


-- Add policies (customize based on your schema)
-- Example for tables with user_id column:


-- Policies for users
-- IMPORTANT: Adjust these based on your actual column names!
-- If table has 'user_id' column:
CREATE POLICY "Users manage own users"
  ON users FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- If table has 'id' column and is a user profile table:
-- CREATE POLICY "Users manage own users"
--   ON users FOR ALL
--   USING (auth.uid() = id)
--   WITH CHECK (auth.uid() = id);

-- If table is public/reference data (no user_id):
-- CREATE POLICY "users are publicly viewable"
--   ON users FOR SELECT
--   USING (true);


-- Policies for profiles
-- IMPORTANT: Adjust these based on your actual column names!
-- If table has 'user_id' column:
CREATE POLICY "Users manage own profiles"
  ON profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- If table has 'id' column and is a user profile table:
-- CREATE POLICY "Users manage own profiles"
--   ON profiles FOR ALL
--   USING (auth.uid() = id)
--   WITH CHECK (auth.uid() = id);

-- If table is public/reference data (no user_id):
-- CREATE POLICY "profiles are publicly viewable"
--   ON profiles FOR SELECT
--   USING (true);


-- Policies for sessions
-- IMPORTANT: Adjust these based on your actual column names!
-- If table has 'user_id' column:
CREATE POLICY "Users manage own sessions"
  ON sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- If table has 'id' column and is a user profile table:
-- CREATE POLICY "Users manage own sessions"
--   ON sessions FOR ALL
--   USING (auth.uid() = id)
--   WITH CHECK (auth.uid() = id);

-- If table is public/reference data (no user_id):
-- CREATE POLICY "sessions are publicly viewable"
--   ON sessions FOR SELECT
--   USING (true);


-- Policies for journal_entries
-- IMPORTANT: Adjust these based on your actual column names!
-- If table has 'user_id' column:
CREATE POLICY "Users manage own journal_entries"
  ON journal_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- If table has 'id' column and is a user profile table:
-- CREATE POLICY "Users manage own journal_entries"
--   ON journal_entries FOR ALL
--   USING (auth.uid() = id)
--   WITH CHECK (auth.uid() = id);

-- If table is public/reference data (no user_id):
-- CREATE POLICY "journal_entries are publicly viewable"
--   ON journal_entries FOR SELECT
--   USING (true);


-- Policies for journals
-- IMPORTANT: Adjust these based on your actual column names!
-- If table has 'user_id' column:
CREATE POLICY "Users manage own journals"
  ON journals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- If table has 'id' column and is a user profile table:
-- CREATE POLICY "Users manage own journals"
--   ON journals FOR ALL
--   USING (auth.uid() = id)
--   WITH CHECK (auth.uid() = id);

-- If table is public/reference data (no user_id):
-- CREATE POLICY "journals are publicly viewable"
--   ON journals FOR SELECT
--   USING (true);


-- Policies for entries
-- IMPORTANT: Adjust these based on your actual column names!
-- If table has 'user_id' column:
CREATE POLICY "Users manage own entries"
  ON entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- If table has 'id' column and is a user profile table:
-- CREATE POLICY "Users manage own entries"
--   ON entries FOR ALL
--   USING (auth.uid() = id)
--   WITH CHECK (auth.uid() = id);

-- If table is public/reference data (no user_id):
-- CREATE POLICY "entries are publicly viewable"
--   ON entries FOR SELECT
--   USING (true);


-- Policies for exercises
-- IMPORTANT: Adjust these based on your actual column names!
-- If table has 'user_id' column:
CREATE POLICY "Users manage own exercises"
  ON exercises FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- If table has 'id' column and is a user profile table:
-- CREATE POLICY "Users manage own exercises"
--   ON exercises FOR ALL
--   USING (auth.uid() = id)
--   WITH CHECK (auth.uid() = id);

-- If table is public/reference data (no user_id):
-- CREATE POLICY "exercises are publicly viewable"
--   ON exercises FOR SELECT
--   USING (true);


-- Policies for habit_tracker
-- IMPORTANT: Adjust these based on your actual column names!
-- If table has 'user_id' column:
CREATE POLICY "Users manage own habit_tracker"
  ON habit_tracker FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- If table has 'id' column and is a user profile table:
-- CREATE POLICY "Users manage own habit_tracker"
--   ON habit_tracker FOR ALL
--   USING (auth.uid() = id)
--   WITH CHECK (auth.uid() = id);

-- If table is public/reference data (no user_id):
-- CREATE POLICY "habit_tracker are publicly viewable"
--   ON habit_tracker FOR SELECT
--   USING (true);


-- Policies for habits
-- IMPORTANT: Adjust these based on your actual column names!
-- If table has 'user_id' column:
CREATE POLICY "Users manage own habits"
  ON habits FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- If table has 'id' column and is a user profile table:
-- CREATE POLICY "Users manage own habits"
--   ON habits FOR ALL
--   USING (auth.uid() = id)
--   WITH CHECK (auth.uid() = id);

-- If table is public/reference data (no user_id):
-- CREATE POLICY "habits are publicly viewable"
--   ON habits FOR SELECT
--   USING (true);


-- Policies for trigger_logs
-- IMPORTANT: Adjust these based on your actual column names!
-- If table has 'user_id' column:
CREATE POLICY "Users manage own trigger_logs"
  ON trigger_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- If table has 'id' column and is a user profile table:
-- CREATE POLICY "Users manage own trigger_logs"
--   ON trigger_logs FOR ALL
--   USING (auth.uid() = id)
--   WITH CHECK (auth.uid() = id);

-- If table is public/reference data (no user_id):
-- CREATE POLICY "trigger_logs are publicly viewable"
--   ON trigger_logs FOR SELECT
--   USING (true);


-- Policies for triggers
-- IMPORTANT: Adjust these based on your actual column names!
-- If table has 'user_id' column:
CREATE POLICY "Users manage own triggers"
  ON triggers FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- If table has 'id' column and is a user profile table:
-- CREATE POLICY "Users manage own triggers"
--   ON triggers FOR ALL
--   USING (auth.uid() = id)
--   WITH CHECK (auth.uid() = id);

-- If table is public/reference data (no user_id):
-- CREATE POLICY "triggers are publicly viewable"
--   ON triggers FOR SELECT
--   USING (true);


-- Policies for glimmer_logs
-- IMPORTANT: Adjust these based on your actual column names!
-- If table has 'user_id' column:
CREATE POLICY "Users manage own glimmer_logs"
  ON glimmer_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- If table has 'id' column and is a user profile table:
-- CREATE POLICY "Users manage own glimmer_logs"
--   ON glimmer_logs FOR ALL
--   USING (auth.uid() = id)
--   WITH CHECK (auth.uid() = id);

-- If table is public/reference data (no user_id):
-- CREATE POLICY "glimmer_logs are publicly viewable"
--   ON glimmer_logs FOR SELECT
--   USING (true);


-- Policies for glimmers
-- IMPORTANT: Adjust these based on your actual column names!
-- If table has 'user_id' column:
CREATE POLICY "Users manage own glimmers"
  ON glimmers FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- If table has 'id' column and is a user profile table:
-- CREATE POLICY "Users manage own glimmers"
--   ON glimmers FOR ALL
--   USING (auth.uid() = id)
--   WITH CHECK (auth.uid() = id);

-- If table is public/reference data (no user_id):
-- CREATE POLICY "glimmers are publicly viewable"
--   ON glimmers FOR SELECT
--   USING (true);


-- Policies for exercise_progress
-- IMPORTANT: Adjust these based on your actual column names!
-- If table has 'user_id' column:
CREATE POLICY "Users manage own exercise_progress"
  ON exercise_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- If table has 'id' column and is a user profile table:
-- CREATE POLICY "Users manage own exercise_progress"
--   ON exercise_progress FOR ALL
--   USING (auth.uid() = id)
--   WITH CHECK (auth.uid() = id);

-- If table is public/reference data (no user_id):
-- CREATE POLICY "exercise_progress are publicly viewable"
--   ON exercise_progress FOR SELECT
--   USING (true);


-- Policies for progress
-- IMPORTANT: Adjust these based on your actual column names!
-- If table has 'user_id' column:
CREATE POLICY "Users manage own progress"
  ON progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- If table has 'id' column and is a user profile table:
-- CREATE POLICY "Users manage own progress"
--   ON progress FOR ALL
--   USING (auth.uid() = id)
--   WITH CHECK (auth.uid() = id);

-- If table is public/reference data (no user_id):
-- CREATE POLICY "progress are publicly viewable"
--   ON progress FOR SELECT
--   USING (true);


-- Policies for curriculum_progress
-- IMPORTANT: Adjust these based on your actual column names!
-- If table has 'user_id' column:
CREATE POLICY "Users manage own curriculum_progress"
  ON curriculum_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- If table has 'id' column and is a user profile table:
-- CREATE POLICY "Users manage own curriculum_progress"
--   ON curriculum_progress FOR ALL
--   USING (auth.uid() = id)
--   WITH CHECK (auth.uid() = id);

-- If table is public/reference data (no user_id):
-- CREATE POLICY "curriculum_progress are publicly viewable"
--   ON curriculum_progress FOR SELECT
--   USING (true);


-- Policies for user_profiles
-- IMPORTANT: Adjust these based on your actual column names!
-- If table has 'user_id' column:
CREATE POLICY "Users manage own user_profiles"
  ON user_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- If table has 'id' column and is a user profile table:
-- CREATE POLICY "Users manage own user_profiles"
--   ON user_profiles FOR ALL
--   USING (auth.uid() = id)
--   WITH CHECK (auth.uid() = id);

-- If table is public/reference data (no user_id):
-- CREATE POLICY "user_profiles are publicly viewable"
--   ON user_profiles FOR SELECT
--   USING (true);


-- Policies for integration_sessions
-- IMPORTANT: Adjust these based on your actual column names!
-- If table has 'user_id' column:
CREATE POLICY "Users manage own integration_sessions"
  ON integration_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- If table has 'id' column and is a user profile table:
-- CREATE POLICY "Users manage own integration_sessions"
--   ON integration_sessions FOR ALL
--   USING (auth.uid() = id)
--   WITH CHECK (auth.uid() = id);

-- If table is public/reference data (no user_id):
-- CREATE POLICY "integration_sessions are publicly viewable"
--   ON integration_sessions FOR SELECT
--   USING (true);


-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'profiles', 'sessions', 'journal_entries', 'journals', 'entries', 'exercises', 'habit_tracker', 'habits', 'trigger_logs', 'triggers', 'glimmer_logs', 'glimmers', 'exercise_progress', 'progress', 'curriculum_progress', 'user_profiles', 'integration_sessions');
