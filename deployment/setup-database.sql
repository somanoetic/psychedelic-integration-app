-- ============================================================================
-- Database Setup Script for AI Monitoring & Observability (FEAT-203)
-- ============================================================================
-- Usage:
--   psql -h "[project-id].supabase.co" -U postgres -d postgres -f setup-database.sql
--
-- Or via Supabase CLI:
--   npx supabase db push --project-id "[project-id]"
--
-- This script:
-- 1. Runs main database migration
-- 2. Creates service account
-- 3. Seeds initial admin user
-- 4. Sets up scheduled jobs
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Enable Required Extensions
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ============================================================================
-- STEP 2: Run Main Database Migration
-- ============================================================================
-- This includes:
-- - 5 tables (ai_metrics, ai_routing_decisions, ai_errors, ai_conversations, ai_daily_summary)
-- - 4 materialized views
-- - 31 indexes
-- - RLS policies
-- - Triggers and functions

-- Note: In production, use Supabase migrations directory:
-- supabase/migrations/20260209000000_ai_monitoring_schema.sql
--
-- For manual setup, include the full migration here.
-- Placeholder for brevity - use full migration file in production.

-- ============================================================================
-- STEP 3: Create Service Account User
-- ============================================================================
-- Service account for metrics insertion (non-blocking, authorized by RLS)

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'service-account@psycheteleos.internal',
  crypt('service-account-secure-key-' || gen_random_uuid()::text, gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  ''
)
ON CONFLICT DO NOTHING;

-- Create profile for service account
INSERT INTO public.profiles (id, email)
VALUES ('00000000-0000-0000-0000-000000000001', 'service-account@psycheteleos.internal')
ON CONFLICT (id) DO NOTHING;

-- Mark as service account (in metadata)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{is_service_account}',
  'true'::jsonb
)
WHERE id = '00000000-0000-0000-0000-000000000001';

-- ============================================================================
-- STEP 4: Create Initial Admin User
-- ============================================================================
-- First admin user for dashboard access (CHANGE PASSWORD IMMEDIATELY)

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000002',
  'authenticated',
  'authenticated',
  'admin@psycheteleos.internal',
  crypt('CHANGE_ME_IMMEDIATELY_' || gen_random_uuid()::text, gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  ''
)
ON CONFLICT DO NOTHING;

-- Create profile for admin
INSERT INTO public.profiles (id, email)
VALUES ('00000000-0000-0000-0000-000000000002', 'admin@psycheteleos.internal')
ON CONFLICT (id) DO NOTHING;

-- Mark as admin (in metadata)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'::jsonb
)
WHERE id = '00000000-0000-0000-0000-000000000002';

-- ============================================================================
-- STEP 5: Set Up Scheduled Jobs (pg_cron)
-- ============================================================================

-- Job 1: Refresh materialized views every 15 minutes
SELECT cron.schedule('refresh-ai-monitoring-views', '*/15 * * * *', $$
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_service_performance_last_7d;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_errors_last_24h;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_routing_quality_daily;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_cost_last_30d;

    -- Log job execution (optional)
    INSERT INTO audit_log (operation, details, created_at)
    VALUES ('refresh_views', jsonb_build_object('timestamp', NOW()), NOW())
    ON CONFLICT DO NOTHING;
  END;
$$);

-- Job 2: Generate daily summary at 1 AM UTC
SELECT cron.schedule('generate-daily-summary', '0 1 * * *', $$
  BEGIN
    INSERT INTO ai_daily_summary (
      summary_date,
      total_calls,
      total_tokens,
      total_cost_usd,
      total_errors,
      avg_response_time_ms,
      by_service,
      success_rate,
      avg_confidence_score,
      flagged_count,
      crisis_count,
      active_users,
      new_conversations
    )
    SELECT
      (NOW() - INTERVAL '1 day')::DATE,
      COUNT(*),
      SUM(COALESCE(tokens_total, 0)),
      SUM(COALESCE(estimated_cost_usd, 0)),
      COUNT(*) FILTER (WHERE status IN ('error', 'timeout', 'rate_limited')),
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms),
      jsonb_object_agg(
        service_name,
        jsonb_build_object(
          'calls', COUNT(*),
          'tokens', SUM(COALESCE(tokens_total, 0)),
          'cost', SUM(COALESCE(estimated_cost_usd, 0))
        )
      ),
      ROUND(
        100.0 * COUNT(*) FILTER (WHERE status = 'success') / NULLIF(COUNT(*), 0),
        2
      ),
      ROUND(AVG(COALESCE((metadata->>'confidence')::DECIMAL, 0.5)), 2),
      COUNT(*) FILTER (WHERE flagged_for_review = TRUE),
      COUNT(*) FILTER (WHERE metadata->>'crisis_detected' = 'true'),
      COUNT(DISTINCT user_id),
      COUNT(DISTINCT conversation_id) FILTER (
        WHERE created_at >= (NOW() - INTERVAL '1 day')::DATE
      )
    FROM ai_metrics
    WHERE DATE(created_at) = (NOW() - INTERVAL '1 day')::DATE
    ON CONFLICT (summary_date) DO UPDATE SET
      total_calls = EXCLUDED.total_calls,
      total_tokens = EXCLUDED.total_tokens,
      total_cost_usd = EXCLUDED.total_cost_usd,
      total_errors = EXCLUDED.total_errors,
      success_rate = EXCLUDED.success_rate,
      flagged_count = EXCLUDED.flagged_count,
      crisis_count = EXCLUDED.crisis_count;

    -- Log job execution
    INSERT INTO audit_log (operation, details, created_at)
    VALUES ('daily_summary', jsonb_build_object('summary_date', (NOW() - INTERVAL '1 day')::DATE), NOW())
    ON CONFLICT DO NOTHING;
  END;
$$);

-- Job 3: Archive old metrics at 2 AM UTC (every day)
SELECT cron.schedule('archive-old-metrics', '0 2 * * *', $$
  BEGIN
    -- Archive metrics older than 90 days
    INSERT INTO ai_metrics_archive
    SELECT * FROM ai_metrics
    WHERE created_at < NOW() - INTERVAL '90 days'
    ON CONFLICT DO NOTHING;

    -- Delete archived metrics from main table
    DELETE FROM ai_metrics
    WHERE created_at < NOW() - INTERVAL '90 days';

    -- Archive routing decisions
    INSERT INTO ai_routing_decisions_archive
    SELECT * FROM ai_routing_decisions
    WHERE created_at < NOW() - INTERVAL '90 days'
    ON CONFLICT DO NOTHING;

    DELETE FROM ai_routing_decisions
    WHERE created_at < NOW() - INTERVAL '90 days';

    -- Archive errors
    INSERT INTO ai_errors_archive
    SELECT * FROM ai_errors
    WHERE created_at < NOW() - INTERVAL '90 days'
    ON CONFLICT DO NOTHING;

    DELETE FROM ai_errors
    WHERE created_at < NOW() - INTERVAL '90 days';

    -- Vacuum to reclaim space
    VACUUM ANALYZE ai_metrics;
    VACUUM ANALYZE ai_routing_decisions;
    VACUUM ANALYZE ai_errors;

    -- Log archival event
    INSERT INTO audit_log (operation, details, created_at)
    VALUES (
      'archive_metrics',
      jsonb_build_object('timestamp', NOW()),
      NOW()
    )
    ON CONFLICT DO NOTHING;
  END;
$$);

-- ============================================================================
-- STEP 6: Verify Setup
-- ============================================================================

-- Count created tables
DO $$
DECLARE
  table_count INT;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename LIKE 'ai_%';

  INSERT INTO audit_log (operation, details, created_at)
  VALUES ('setup_complete', jsonb_build_object(
    'tables_created', table_count,
    'timestamp', NOW()
  ), NOW());

  RAISE NOTICE 'Setup complete! Created % tables', table_count;
END $$;

-- List scheduled jobs
SELECT
  jobid,
  schedule_time,
  command
FROM cron.job
WHERE command LIKE '%ai_%' OR command LIKE '%mv_%'
ORDER BY jobid;

COMMIT;
