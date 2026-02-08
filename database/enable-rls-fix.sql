-- ============================================================
-- URGENT: Enable Row Level Security (RLS) on All Tables
-- ============================================================
-- Run this in Supabase SQL Editor IMMEDIATELY
-- https://app.supabase.com/project/hxpyeudklnqtwspmdsuz/sql
-- ============================================================

-- STEP 1: Enable RLS on all user data tables
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE trigger_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE glimmer_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_progress ENABLE ROW LEVEL SECURITY;

-- STEP 2: Drop any existing overly permissive policies (if they exist)
-- ============================================================

-- This will clean up any "allow all" policies
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
            pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- STEP 3: Create secure policies for user-owned data
-- ============================================================

-- USERS table: Users can view all profiles (for social features)
-- but can only update their own
CREATE POLICY "Users can view all profiles"
    ON users FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- SESSIONS table: Users can only access their own sessions
CREATE POLICY "Users can view own sessions"
    ON sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
    ON sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
    ON sessions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
    ON sessions FOR DELETE
    USING (auth.uid() = user_id);

-- JOURNAL_ENTRIES table: Strictly private
CREATE POLICY "Users can manage own journal entries"
    ON journal_entries FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- HABIT_TRACKER table: Users can only access their own data
CREATE POLICY "Users can manage own habits"
    ON habit_tracker FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- TRIGGER_LOGS table: Users can only access their own data
CREATE POLICY "Users can manage own trigger logs"
    ON trigger_logs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- GLIMMER_LOGS table: Users can only access their own data
CREATE POLICY "Users can manage own glimmer logs"
    ON glimmer_logs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- EXERCISE_PROGRESS table: Users can only access their own data
CREATE POLICY "Users can manage own exercise progress"
    ON exercise_progress FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- CURRICULUM_PROGRESS table: Users can only access their own data
CREATE POLICY "Users can manage own curriculum progress"
    ON curriculum_progress FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- EXERCISES table: Public read-only (reference data)
-- If you want exercises to be editable only by admins, adjust this
CREATE POLICY "Exercises are publicly viewable"
    ON exercises FOR SELECT
    USING (true);

-- Optional: Allow authenticated users to create exercises
-- Uncomment if needed:
-- CREATE POLICY "Authenticated users can create exercises"
--     ON exercises FOR INSERT
--     WITH CHECK (auth.role() = 'authenticated');

-- STEP 4: Verify RLS is enabled
-- ============================================================

-- This query will show all tables and their RLS status
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- This query will show all policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================
-- IMPORTANT: After running this script
-- ============================================================
-- 1. Verify the output shows rls_enabled = true for all tables
-- 2. Run: node check-rls.js to verify RLS is working
-- 3. Test your app - make sure authenticated users can still access their data
-- 4. Consider rotating your Supabase anon key after this is deployed
-- ============================================================
