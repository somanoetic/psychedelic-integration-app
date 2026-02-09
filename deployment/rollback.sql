-- ============================================================================
-- Rollback Script for AI Monitoring & Observability (FEAT-203)
-- ============================================================================
-- Purpose: Safely rollback the feature to pre-deployment state
--
-- Usage:
--   psql -h "[project-id].supabase.co" -U postgres -d postgres -f rollback.sql
--
-- WARNING: This script will:
-- - DROP all AI monitoring tables
-- - REMOVE all scheduled jobs
-- - DELETE all metrics data
-- - This operation CANNOT be undone (use backup to restore)
--
-- RECOMMENDATION: Run archival/backup before rollback:
--   INSERT INTO metrics_backup SELECT * FROM ai_metrics;
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Cancel Scheduled Jobs
-- ============================================================================

-- Stop all AI monitoring cron jobs
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE command LIKE '%ai_%' OR command LIKE '%mv_%';

RAISE NOTICE 'Cancelled scheduled jobs';

-- ============================================================================
-- STEP 2: Drop Materialized Views
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS public.mv_user_cost_last_30d CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.mv_routing_quality_daily CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.mv_top_errors_last_24h CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.mv_service_performance_last_7d CASCADE;

RAISE NOTICE 'Dropped materialized views';

-- ============================================================================
-- STEP 3: Drop Regular Views (if any)
-- ============================================================================

DROP VIEW IF EXISTS public.ai_metrics_view CASCADE;
DROP VIEW IF EXISTS public.ai_routing_view CASCADE;
DROP VIEW IF EXISTS public.ai_errors_view CASCADE;

RAISE NOTICE 'Dropped views';

-- ============================================================================
-- STEP 4: Drop Triggers and Functions
-- ============================================================================

-- Drop triggers
DROP TRIGGER IF EXISTS update_ai_conversations_on_metric ON public.ai_metrics;
DROP TRIGGER IF EXISTS update_daily_summary_on_metric ON public.ai_metrics;

-- Drop trigger functions
DROP FUNCTION IF EXISTS public.update_ai_conversations_trigger();
DROP FUNCTION IF EXISTS public.update_daily_summary_trigger();

-- Drop utility functions
DROP FUNCTION IF EXISTS public.get_service_health(TEXT);
DROP FUNCTION IF EXISTS public.get_cost_summary(TEXT);
DROP FUNCTION IF EXISTS public.get_routing_effectiveness();
DROP FUNCTION IF EXISTS public.estimate_token_cost(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.archive_old_metrics();
DROP FUNCTION IF EXISTS public.calculate_conversation_metrics(UUID);

RAISE NOTICE 'Dropped triggers and functions';

-- ============================================================================
-- STEP 5: Drop Tables (with Data)
-- ============================================================================

-- Drop in order of dependencies
DROP TABLE IF EXISTS public.ai_daily_summary CASCADE;
DROP TABLE IF EXISTS public.ai_conversations CASCADE;
DROP TABLE IF EXISTS public.ai_errors CASCADE;
DROP TABLE IF EXISTS public.ai_routing_decisions CASCADE;
DROP TABLE IF EXISTS public.ai_metrics CASCADE;

-- Drop archive tables if they exist
DROP TABLE IF EXISTS public.ai_metrics_archive CASCADE;
DROP TABLE IF EXISTS public.ai_routing_decisions_archive CASCADE;
DROP TABLE IF EXISTS public.ai_errors_archive CASCADE;

RAISE NOTICE 'Dropped all AI monitoring tables';

-- ============================================================================
-- STEP 6: Remove Service Accounts
-- ============================================================================

-- Delete service account user
DELETE FROM auth.users
WHERE email = 'service-account@psycheteleos.internal';

-- Delete admin user (optional - comment out to keep)
-- DELETE FROM auth.users
-- WHERE email = 'admin@psycheteleos.internal';

-- Delete associated profiles
DELETE FROM public.profiles
WHERE email IN (
  'service-account@psycheteleos.internal'
  -- Uncomment to also delete admin profile:
  -- 'admin@psycheteleos.internal'
);

RAISE NOTICE 'Removed service accounts';

-- ============================================================================
-- STEP 7: Verify Rollback
-- ============================================================================

-- Verify tables dropped
DO $$
DECLARE
  remaining_tables INT;
BEGIN
  SELECT COUNT(*) INTO remaining_tables
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename LIKE 'ai_%';

  IF remaining_tables = 0 THEN
    RAISE NOTICE 'SUCCESS: All AI monitoring tables dropped';
  ELSE
    RAISE WARNING 'WARNING: % AI tables remain', remaining_tables;
  END IF;
END $$;

-- Verify views dropped
DO $$
DECLARE
  remaining_views INT;
BEGIN
  SELECT COUNT(*) INTO remaining_views
  FROM pg_matviews
  WHERE schemaname = 'public' AND matviewname LIKE 'mv_%';

  IF remaining_views = 0 THEN
    RAISE NOTICE 'SUCCESS: All materialized views dropped';
  ELSE
    RAISE WARNING 'WARNING: % materialized views remain', remaining_views;
  END IF;
END $$;

-- Verify scheduled jobs removed
DO $$
DECLARE
  remaining_jobs INT;
BEGIN
  SELECT COUNT(*) INTO remaining_jobs
  FROM cron.job
  WHERE command LIKE '%ai_%' OR command LIKE '%mv_%';

  IF remaining_jobs = 0 THEN
    RAISE NOTICE 'SUCCESS: All scheduled jobs removed';
  ELSE
    RAISE WARNING 'WARNING: % scheduled jobs remain', remaining_jobs;
  END IF;
END $$;

-- ============================================================================
-- STEP 8: Log Rollback Event
-- ============================================================================

-- Insert rollback event into audit log (if table exists)
INSERT INTO public.audit_log (operation, details, created_at)
VALUES (
  'feature_rollback',
  jsonb_build_object(
    'feature', 'FEAT-203-AI-Monitoring',
    'timestamp', NOW(),
    'status', 'complete'
  ),
  NOW()
)
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- Summary
-- ============================================================================

-- Run these queries to verify rollback success:
/*
SELECT COUNT(*) as ai_tables FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'ai_%';
-- Expected: 0

SELECT COUNT(*) as materialized_views FROM pg_matviews
WHERE schemaname = 'public' AND matviewname LIKE 'mv_%';
-- Expected: 0

SELECT COUNT(*) as scheduled_jobs FROM cron.job
WHERE command LIKE '%ai_%' OR command LIKE '%mv_%';
-- Expected: 0

SELECT * FROM pg_policies
WHERE schemaname = 'public' AND tablename LIKE 'ai_%';
-- Expected: 0 rows
*/

-- ============================================================================
-- Restoration Instructions
-- ============================================================================
-- To restore from backup:
--
-- 1. List available backups:
--    - Log into Supabase dashboard
--    - Settings > Database > Backups
--
-- 2. Restore from backup:
--    - Click "Restore" on pre-deployment backup
--    - Confirm restoration
--
-- 3. Or restore manually:
--    psql -h "[project-id].supabase.co" -U postgres -d postgres -f backup.sql
--
-- After restoration, verify with setup-database.sql health checks
-- ============================================================================
