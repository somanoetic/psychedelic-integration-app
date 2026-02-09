-- ============================================================================
-- Health Check Script for AI Monitoring & Observability (FEAT-203)
-- ============================================================================
-- Purpose: Verify deployment success and system health
--
-- Usage:
--   psql -h "[project-id].supabase.co" -U postgres -d postgres -f health-check.sql
--
-- Or in Supabase SQL editor:
--   1. Copy contents
--   2. Paste into SQL editor
--   3. Run and check results
--
-- All queries should return expected counts/data.
-- If any return 0 or errors, see troubleshooting section.
-- ============================================================================

-- ============================================================================
-- SECTION 1: Table Verification
-- ============================================================================
\echo '=== TABLE VERIFICATION ==='

-- Verify all 5 required tables exist
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size
FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'ai_%'
ORDER BY tablename;

-- Expected output: 5 rows
-- ai_conversations
-- ai_daily_summary
-- ai_errors
-- ai_metrics
-- ai_routing_decisions

-- Count rows in each table
\echo '--- Row Counts ---'
SELECT 'ai_metrics' as table_name, COUNT(*) as row_count FROM ai_metrics
UNION ALL
SELECT 'ai_routing_decisions', COUNT(*) FROM ai_routing_decisions
UNION ALL
SELECT 'ai_errors', COUNT(*) FROM ai_errors
UNION ALL
SELECT 'ai_conversations', COUNT(*) FROM ai_conversations
UNION ALL
SELECT 'ai_daily_summary', COUNT(*) FROM ai_daily_summary
ORDER BY table_name;

-- ============================================================================
-- SECTION 2: Index Verification
-- ============================================================================
\echo '=== INDEX VERIFICATION ==='

-- Count indexes per table
SELECT
  schemaname,
  tablename,
  COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public' AND tablename LIKE 'ai_%'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Expected: 31+ indexes total
-- Breakdown:
-- ai_metrics: 7 indexes
-- ai_routing_decisions: 6 indexes
-- ai_errors: 6 indexes
-- ai_conversations: 6 indexes
-- ai_daily_summary: varies

-- Verify specific indexes exist
\echo '--- Critical Indexes ---'
SELECT
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'ai_metrics'
  AND indexname LIKE 'idx_ai_metrics%'
ORDER BY indexname;

-- ============================================================================
-- SECTION 3: Materialized Views Verification
-- ============================================================================
\echo '=== MATERIALIZED VIEWS VERIFICATION ==='

-- Verify all 4 materialized views exist
SELECT
  schemaname,
  matviewname,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) as view_size,
  ispopulated
FROM pg_matviews
WHERE schemaname = 'public'
ORDER BY matviewname;

-- Expected output: 4 rows, all ispopulated = true
-- mv_routing_quality_daily
-- mv_service_performance_last_7d
-- mv_top_errors_last_24h
-- mv_user_cost_last_30d

-- Check view data
\echo '--- View Data Check ---'
SELECT COUNT(*) as records FROM mv_service_performance_last_7d;
SELECT COUNT(*) as records FROM mv_top_errors_last_24h;
SELECT COUNT(*) as records FROM mv_routing_quality_daily;
SELECT COUNT(*) as records FROM mv_user_cost_last_30d;

-- ============================================================================
-- SECTION 4: RLS Policies Verification
-- ============================================================================
\echo '=== RLS POLICIES VERIFICATION ==='

-- Count RLS policies per table
SELECT
  schemaname,
  tablename,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ' ORDER BY policyname) as policies
FROM pg_policies
WHERE schemaname = 'public' AND tablename LIKE 'ai_%'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Expected: RLS policies on all AI tables
-- Each table should have policies for:
-- - Users accessing their own data
-- - Service accounts (if applicable)
-- - Admins accessing all data

-- Verify RLS is enabled
\echo '--- RLS Enabled Tables ---'
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'ai_%' AND rowsecurity = true;

-- Expected: All 5 AI tables should show rowsecurity = true

-- ============================================================================
-- SECTION 5: Triggers and Functions Verification
-- ============================================================================
\echo '=== TRIGGERS AND FUNCTIONS VERIFICATION ==='

-- List all triggers on AI tables
SELECT
  trigger_schema,
  event_object_table,
  trigger_name,
  action_orientation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public' AND event_object_table LIKE 'ai_%';

-- Expected: 2 triggers
-- - update_ai_conversations_on_metric
-- - update_daily_summary_on_metric

-- List functions
\echo '--- Utility Functions ---'
SELECT
  p.oid,
  p.proname,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname LIKE 'get_%' OR p.proname LIKE 'estimate_%';

-- ============================================================================
-- SECTION 6: Scheduled Jobs Verification
-- ============================================================================
\echo '=== SCHEDULED JOBS VERIFICATION ==='

-- List all scheduled jobs (requires pg_cron)
SELECT
  jobid,
  schedule_time,
  command,
  nodename,
  last_run_status,
  last_start,
  last_end
FROM cron.job
WHERE command LIKE '%mv_%' OR command LIKE '%ai_%' OR command LIKE '%archive%'
ORDER BY jobid;

-- Expected output: 3 jobs
-- - refresh-ai-monitoring-views (every 15 minutes)
-- - generate-daily-summary (0 1 * * * = 1 AM UTC daily)
-- - archive-old-metrics (0 2 * * * = 2 AM UTC daily)

-- Check job status (for recently run jobs)
\echo '--- Recent Job Execution ---'
SELECT
  jobid,
  last_run_status,
  last_start,
  last_end,
  EXTRACT(EPOCH FROM (last_end - last_start)) as duration_seconds
FROM cron.job
WHERE command LIKE '%mv_%' OR command LIKE '%ai_%'
ORDER BY last_end DESC;

-- ============================================================================
-- SECTION 7: Data Quality Checks
-- ============================================================================
\echo '=== DATA QUALITY CHECKS ==='

-- Check for constraint violations
\echo '--- Constraint Violations ---'
-- ai_metrics constraints
SELECT 'ai_metrics' as table_name, COUNT(*) as invalid_records
FROM ai_metrics
WHERE duration_ms < 0 OR tokens_input < 0 OR tokens_output < 0;

-- ai_routing_decisions constraints
SELECT 'ai_routing_decisions', COUNT(*)
FROM ai_routing_decisions
WHERE confidence_score < 0 OR confidence_score > 1;

-- ai_errors constraints
SELECT 'ai_errors', COUNT(*)
FROM ai_errors
WHERE user_impact NOT IN ('high', 'medium', 'low', 'none');

-- Check for orphaned records (foreign key integrity)
\echo '--- Orphaned Records Check ---'
SELECT 'ai_routing_decisions -> ai_metrics' as check_type, COUNT(*)
FROM ai_routing_decisions ard
LEFT JOIN ai_metrics am ON ard.metric_id = am.id
WHERE ard.metric_id IS NOT NULL AND am.id IS NULL;

SELECT 'ai_errors -> ai_metrics', COUNT(*)
FROM ai_errors ae
LEFT JOIN ai_metrics am ON ae.metric_id = am.id
WHERE ae.metric_id IS NOT NULL AND am.id IS NULL;

-- ============================================================================
-- SECTION 8: Performance Metrics
-- ============================================================================
\echo '=== PERFORMANCE METRICS ==='

-- Table bloat check
\echo '--- Table Sizes and Bloat ---'
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as heap_size
FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'ai_%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
\echo '--- Index Usage Statistics ---'
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND tablename LIKE 'ai_%'
ORDER BY idx_scan DESC;

-- Table scan statistics
\echo '--- Table Scan Statistics ---'
SELECT
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch
FROM pg_stat_user_tables
WHERE schemaname = 'public' AND tablename LIKE 'ai_%'
ORDER BY seq_scan DESC;

-- ============================================================================
-- SECTION 9: Sentry Configuration Check
-- ============================================================================
\echo '=== SENTRY CONFIGURATION ==='

-- Check for error tracking in ai_errors table
SELECT
  COUNT(*) as total_errors,
  COUNT(DISTINCT service_name) as services_with_errors,
  COUNT(DISTINCT sentry_id) as linked_to_sentry,
  MAX(created_at) as latest_error
FROM ai_errors;

-- Check error distribution by type
SELECT
  error_type,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM ai_errors), 2) as percentage
FROM ai_errors
GROUP BY error_type
ORDER BY count DESC;

-- ============================================================================
-- SECTION 10: User and Service Account Verification
-- ============================================================================
\echo '=== USER AND SERVICE ACCOUNT VERIFICATION ==='

-- Check service account exists
SELECT
  id,
  email,
  raw_user_meta_data->>'is_service_account' as is_service_account
FROM auth.users
WHERE email = 'service-account@psycheteleos.internal';

-- Check admin user exists
SELECT
  id,
  email,
  raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'admin@psycheteleos.internal';

-- Count authenticated users with metrics
SELECT
  COUNT(DISTINCT user_id) as users_with_metrics,
  COUNT(*) as total_metrics,
  MAX(created_at) as latest_metric
FROM ai_metrics
WHERE user_id IS NOT NULL;

-- ============================================================================
-- SECTION 11: Summary Report
-- ============================================================================
\echo '=== HEALTH CHECK SUMMARY ==='

-- Summary of all checks
DO $$
DECLARE
  v_tables INT;
  v_indexes INT;
  v_views INT;
  v_policies INT;
  v_jobs INT;
  v_metrics INT;
  v_health_score INT := 0;
BEGIN
  -- Check tables
  SELECT COUNT(*) INTO v_tables
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename LIKE 'ai_%';
  RAISE NOTICE 'Tables: % / 5 ', v_tables;
  IF v_tables = 5 THEN v_health_score := v_health_score + 20; END IF;

  -- Check indexes
  SELECT COUNT(*) INTO v_indexes
  FROM pg_indexes
  WHERE schemaname = 'public' AND tablename LIKE 'ai_%';
  RAISE NOTICE 'Indexes: % / 31 ', v_indexes;
  IF v_indexes >= 31 THEN v_health_score := v_health_score + 20; END IF;

  -- Check views
  SELECT COUNT(*) INTO v_views
  FROM pg_matviews
  WHERE schemaname = 'public';
  RAISE NOTICE 'Materialized Views: % / 4 ', v_views;
  IF v_views = 4 THEN v_health_score := v_health_score + 20; END IF;

  -- Check RLS policies
  SELECT COUNT(*) INTO v_policies
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename LIKE 'ai_%';
  RAISE NOTICE 'RLS Policies: % (expected > 5)', v_policies;
  IF v_policies > 5 THEN v_health_score := v_health_score + 20; END IF;

  -- Check scheduled jobs
  SELECT COUNT(*) INTO v_jobs
  FROM cron.job
  WHERE command LIKE '%mv_%' OR command LIKE '%ai_%' OR command LIKE '%archive%';
  RAISE NOTICE 'Scheduled Jobs: % / 3 ', v_jobs;
  IF v_jobs = 3 THEN v_health_score := v_health_score + 20; END IF;

  -- Final score
  RAISE NOTICE '===== HEALTH SCORE: %% / 100 =====', v_health_score;
  IF v_health_score = 100 THEN
    RAISE NOTICE 'Status: ✓ ALL CHECKS PASSED - Deployment Successful!';
  ELSIF v_health_score >= 80 THEN
    RAISE WARNING 'Status: ⚠ Most checks passed - Review warnings above';
  ELSE
    RAISE ERROR 'Status: ✗ CRITICAL ISSUES - See errors above';
  END IF;
END $$;

-- ============================================================================
-- Troubleshooting Guide
-- ============================================================================
/*
If any checks fail, refer to troubleshooting section in deployment guide:
deployment/08-deployment.md

Common issues:

1. Tables missing:
   - Run main migration: supabase/migrations/20260209000000_ai_monitoring_schema.sql
   - Verify no errors in Supabase SQL editor

2. Indexes missing:
   - Check migration completed successfully
   - Manually create missing indexes if needed

3. Views empty (ispopulated = false):
   - Trigger manual refresh: REFRESH MATERIALIZED VIEW CONCURRENTLY mv_name;
   - Wait 2 minutes for data to populate

4. RLS policies missing:
   - Check migration created policies
   - Manually create if needed (see migration file)

5. Scheduled jobs not created:
   - Verify pg_cron extension is installed
   - Check cron.job table for errors
   - Recreate jobs manually (see setup-database.sql)

6. Metrics not flowing:
   - Check application metrics service logs
   - Verify RLS policies allow authenticated inserts
   - Check Supabase connection from app

For detailed help, see:
- docs/MONITORING.md
- docs/AI_ARCHITECTURE.md
- .full-stack-feature/03-architecture.md
*/

-- ============================================================================
-- Manual Test: Insert Test Metric
-- ============================================================================
\echo '=== MANUAL INSERT TEST ==='

-- Insert a test metric (if you have an active user)
-- Uncomment to test insertion:
/*
INSERT INTO ai_metrics (
  service_name,
  operation_type,
  user_id,
  duration_ms,
  tokens_input,
  tokens_output,
  estimated_cost_usd,
  status,
  model_name
)
VALUES (
  'test-service',
  'test',
  auth.uid(), -- Replace with actual user UUID if needed
  100,
  50,
  25,
  0.00025,
  'success',
  'claude-3-5-sonnet-20241022'
);

-- Verify insertion
SELECT * FROM ai_metrics ORDER BY created_at DESC LIMIT 1;
*/

-- ============================================================================
-- End of Health Check
-- ============================================================================
\echo '=== HEALTH CHECK COMPLETE ==='
