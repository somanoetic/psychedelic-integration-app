-- =============================================================================
-- Migration: FEAT-102 Security & Performance Fixes
-- Date: 2026-02-17
-- Fixes: SEC-001 (DELETE RLS), SEC-007 (SECURITY DEFINER search_path),
--        PERF-001 (composite indexes for is_deleted filter)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- SEC-003: Add explicit DELETE RLS policy to session_intentions
--
-- The original migration only defined SELECT, INSERT, and UPDATE policies.
-- Without an explicit DELETE policy, future code changes could introduce
-- unauthorized deletion. This adds a clear, intentional DELETE policy.
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can delete own intentions" ON public.session_intentions;

CREATE POLICY "Users can delete own intentions"
    ON public.session_intentions
    FOR DELETE
    USING (auth.uid() = user_id);

-- Note: We still use soft-delete (is_deleted flag) as the primary pattern.
-- This DELETE policy is a defense-in-depth safety net.

-- -----------------------------------------------------------------------------
-- SEC-007: Fix SECURITY DEFINER functions — add search_path restriction
-- and revoke public EXECUTE from cron-job functions
-- -----------------------------------------------------------------------------

-- Fix auto_delete_old_intentions
CREATE OR REPLACE FUNCTION public.auto_delete_old_intentions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    WITH users_with_auto_delete AS (
        SELECT user_id, auto_delete_after_days
        FROM public.user_intention_preferences
        WHERE auto_delete_after_days IS NOT NULL
    )
    UPDATE public.session_intentions si
    SET
        is_deleted = TRUE,
        deleted_at = NOW()
    FROM users_with_auto_delete uad
    WHERE si.user_id = uad.user_id
      AND si.is_deleted = FALSE
      AND si.created_at < NOW() - (uad.auto_delete_after_days || ' days')::INTERVAL;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Auto-deleted % intentions based on user preferences', deleted_count;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- Revoke public/authenticated execution — only service_role (cron) may call this
REVOKE EXECUTE ON FUNCTION public.auto_delete_old_intentions() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_delete_old_intentions() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.auto_delete_old_intentions() TO service_role;

-- Fix cleanup_deleted_intentions
CREATE OR REPLACE FUNCTION public.cleanup_deleted_intentions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    DELETE FROM public.session_intentions
    WHERE is_deleted = TRUE
      AND deleted_at < NOW() - INTERVAL '30 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Permanently deleted % intentions past 30-day recovery window', deleted_count;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.cleanup_deleted_intentions() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_deleted_intentions() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_deleted_intentions() TO service_role;

-- Fix delete_user_intention_data (GDPR function — users may call this for themselves)
CREATE OR REPLACE FUNCTION public.delete_user_intention_data(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    IF auth.uid() != target_user_id THEN
        RAISE EXCEPTION 'Unauthorized: You can only delete your own intention data.';
    END IF;

    DELETE FROM public.session_intentions WHERE user_id = target_user_id;
    DELETE FROM public.user_intention_preferences WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- Only authenticated users can call the GDPR deletion function (for themselves)
REVOKE EXECUTE ON FUNCTION public.delete_user_intention_data(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user_intention_data(UUID) TO authenticated;

-- -----------------------------------------------------------------------------
-- PERF-001: Add composite indexes for faster user/session intention queries
--
-- Uses DO block to add partial index on is_deleted only if that column exists
-- (i.e. the full FEAT-102 schema migration has been applied). Falls back to a
-- plain composite index otherwise — still much faster than a single-column index.
-- -----------------------------------------------------------------------------

DROP INDEX IF EXISTS idx_session_intentions_user_time;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'session_intentions'
          AND column_name  = 'is_deleted'
    ) THEN
        -- Partial indexes (optimal — only index active rows)
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_session_intentions_user_active_time
                     ON public.session_intentions(user_id, created_at DESC)
                     WHERE is_deleted = FALSE';

        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_session_intentions_session_active_time
                     ON public.session_intentions(session_id, created_at ASC)
                     WHERE is_deleted = FALSE';
    ELSE
        -- Plain composite indexes (good — still beats a single-column index)
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_session_intentions_user_active_time
                     ON public.session_intentions(user_id, created_at DESC)';

        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_session_intentions_session_active_time
                     ON public.session_intentions(session_id, created_at ASC)';
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Verification comments
-- -----------------------------------------------------------------------------

COMMENT ON POLICY "Users can delete own intentions"
    ON public.session_intentions
    IS 'SEC-003 fix: Explicit DELETE policy added 2026-02-17. Prefer soft-delete (is_deleted flag). This is a defense-in-depth safety net.';
