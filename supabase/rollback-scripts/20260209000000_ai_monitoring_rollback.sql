-- ============================================================================
-- AI Monitoring & Observability Schema ROLLBACK
-- ============================================================================
-- Feature: FEAT-203
-- Version: 1.0
-- Date: 2026-02-09
-- Description: Safely rollback all changes from ai_monitoring_schema.sql
-- ============================================================================

-- WARNING: This will permanently delete all AI monitoring data
-- Run this only if you need to completely remove the monitoring system

BEGIN;

-- ============================================================================
-- STEP 1: Drop scheduled job references (if using pg_cron)
-- ============================================================================
-- Note: Adjust these if you've set up pg_cron jobs
-- SELECT cron.unschedule('refresh-ai-views');
-- SELECT cron.unschedule('archive-ai-metrics');

-- ============================================================================
-- STEP 2: Drop triggers
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_update_conversation_aggregate ON public.ai_metrics;
DROP TRIGGER IF EXISTS trigger_auto_flag_routing ON public.ai_routing_decisions;

-- ============================================================================
-- STEP 3: Drop trigger functions
-- ============================================================================
DROP FUNCTION IF EXISTS public.update_conversation_aggregate();
DROP FUNCTION IF EXISTS public.auto_flag_routing_decisions();

-- ============================================================================
-- STEP 4: Drop utility functions
-- ============================================================================
DROP FUNCTION IF EXISTS public.refresh_ai_monitoring_views();
DROP FUNCTION IF EXISTS public.delete_user_ai_data(UUID);
DROP FUNCTION IF EXISTS public.archive_old_ai_metrics();

-- ============================================================================
-- STEP 5: Drop materialized views
-- ============================================================================
DROP MATERIALIZED VIEW IF EXISTS public.mv_service_performance_last_7d;
DROP MATERIALIZED VIEW IF EXISTS public.mv_top_errors_last_24h;
DROP MATERIALIZED VIEW IF EXISTS public.mv_routing_quality_daily;
DROP MATERIALIZED VIEW IF EXISTS public.mv_user_cost_last_30d;

-- ============================================================================
-- STEP 6: Drop tables (in reverse dependency order)
-- ============================================================================
DROP TABLE IF EXISTS public.ai_daily_summary CASCADE;
DROP TABLE IF EXISTS public.ai_conversations CASCADE;
DROP TABLE IF EXISTS public.ai_errors CASCADE;
DROP TABLE IF EXISTS public.ai_routing_decisions CASCADE;
DROP TABLE IF EXISTS public.ai_metrics CASCADE;

-- ============================================================================
-- STEP 7: Drop helper functions used for RLS
-- ============================================================================
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_service_account();

-- ============================================================================
-- STEP 8: Verify cleanup
-- ============================================================================
-- Check that all objects are removed
DO $$
DECLARE
    remaining_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
        'ai_metrics',
        'ai_routing_decisions',
        'ai_errors',
        'ai_conversations',
        'ai_daily_summary'
    );

    IF remaining_count > 0 THEN
        RAISE EXCEPTION 'Rollback incomplete: % tables still exist', remaining_count;
    ELSE
        RAISE NOTICE 'Rollback successful: All AI monitoring tables removed';
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- END OF ROLLBACK
-- ============================================================================

-- If rollback is successful, you should see:
-- "Rollback successful: All AI monitoring tables removed"

-- To verify complete cleanup, run:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'ai_%';
-- (Should return 0 rows)

-- SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name LIKE '%ai%';
-- (Should not show any ai monitoring functions)
