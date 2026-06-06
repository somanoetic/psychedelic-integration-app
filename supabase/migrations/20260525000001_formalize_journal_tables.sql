-- 20260525000001_formalize_journal_tables.sql
-- Created: 2026-05-25
-- Purpose: Bring two existing-in-production tables into source control. Both
--          tables were originally created via ad-hoc SQL in database/ (outside
--          the migration pipeline) and have been live for months. This file is
--          idempotent (IF NOT EXISTS / DROP POLICY IF EXISTS) so it is safe to
--          re-run against environments where the tables already exist.
--
-- Tables formalized:
--   - public.baseline_logs       — pre-treatment baseline tracking (written by
--                                  components/PreTreatmentBaselineLog.js)
--   - public.post_session_journals — multi-sensory post-session integration
--                                  (written by components/PostSessionIntegrationJournal.js)
--
-- Why now: FEAT-paper-scan needs a clean canonical journal-entries surface to
-- attach paper scans to. Before adding a new entry type, lock down the existing
-- shape so future migrations have a stable starting point.
--
-- Source of truth for the original DDL:
--   database/create_baseline_logs_table.sql
--   database/create_post_session_journals_table.sql
-- Those files remain as historical reference; this migration is authoritative
-- from 2026-05-25 onward.

BEGIN;

-- ============================================================================
-- baseline_logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.baseline_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    responses JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_baseline_logs_user_id
    ON public.baseline_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_baseline_logs_created_at
    ON public.baseline_logs(created_at DESC);

ALTER TABLE public.baseline_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own baseline logs" ON public.baseline_logs;
CREATE POLICY "Users can read own baseline logs"
    ON public.baseline_logs
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own baseline logs" ON public.baseline_logs;
CREATE POLICY "Users can insert own baseline logs"
    ON public.baseline_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own baseline logs" ON public.baseline_logs;
CREATE POLICY "Users can update own baseline logs"
    ON public.baseline_logs
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own baseline logs" ON public.baseline_logs;
CREATE POLICY "Users can delete own baseline logs"
    ON public.baseline_logs
    FOR DELETE
    USING (auth.uid() = user_id);

COMMENT ON TABLE public.baseline_logs IS
    'Pre-treatment baseline tracking across life domains (sleep, energy, mood, etc.). Free-form JSONB responses keyed by domain.';

-- ============================================================================
-- post_session_journals
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.post_session_journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID,
    session_title TEXT NOT NULL,
    responses JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_session_journals_user_id
    ON public.post_session_journals(user_id);

CREATE INDEX IF NOT EXISTS idx_post_session_journals_created_at
    ON public.post_session_journals(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_session_journals_session_id
    ON public.post_session_journals(session_id);

ALTER TABLE public.post_session_journals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own post-session journals" ON public.post_session_journals;
CREATE POLICY "Users can read own post-session journals"
    ON public.post_session_journals
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own post-session journals" ON public.post_session_journals;
CREATE POLICY "Users can insert own post-session journals"
    ON public.post_session_journals
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own post-session journals" ON public.post_session_journals;
CREATE POLICY "Users can update own post-session journals"
    ON public.post_session_journals
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own post-session journals" ON public.post_session_journals;
CREATE POLICY "Users can delete own post-session journals"
    ON public.post_session_journals
    FOR DELETE
    USING (auth.uid() = user_id);

COMMENT ON TABLE public.post_session_journals IS
    'Multi-sensory post-session integration journals (visuals, somatic, emotions, etc.). Free-form JSONB responses keyed by category.';

COMMIT;
