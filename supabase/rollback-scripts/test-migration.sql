-- ============================================================================
-- Test Script: AI Monitoring Schema Validation
-- ============================================================================
-- Purpose: Verify that the migration was applied correctly
-- Usage: Run this after applying 20260209000000_ai_monitoring_schema.sql
-- ============================================================================

\echo '=========================='
\echo 'AI Monitoring Schema Tests'
\echo '=========================='
\echo ''

-- ============================================================================
-- TEST 1: Verify Tables Exist
-- ============================================================================
\echo 'TEST 1: Checking if all tables exist...'

SELECT
    table_name,
    CASE WHEN table_name IN (
        'ai_metrics',
        'ai_routing_decisions',
        'ai_errors',
        'ai_conversations',
        'ai_daily_summary'
    ) THEN '✓' ELSE '✗' END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'ai_%'
ORDER BY table_name;

\echo ''

-- ============================================================================
-- TEST 2: Verify RLS is Enabled
-- ============================================================================
\echo 'TEST 2: Checking if RLS is enabled on all tables...'

SELECT
    tablename,
    CASE WHEN rowsecurity = true THEN '✓ Enabled' ELSE '✗ Disabled' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'ai_%'
ORDER BY tablename;

\echo ''

-- ============================================================================
-- TEST 3: Verify Indexes Exist
-- ============================================================================
\echo 'TEST 3: Checking index count per table...'

SELECT
    tablename,
    COUNT(*) as index_count,
    CASE
        WHEN tablename = 'ai_metrics' AND COUNT(*) >= 7 THEN '✓'
        WHEN tablename = 'ai_routing_decisions' AND COUNT(*) >= 6 THEN '✓'
        WHEN tablename = 'ai_errors' AND COUNT(*) >= 6 THEN '✓'
        WHEN tablename = 'ai_conversations' AND COUNT(*) >= 6 THEN '✓'
        WHEN tablename = 'ai_daily_summary' AND COUNT(*) >= 2 THEN '✓'
        ELSE '✗'
    END as status
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename LIKE 'ai_%'
GROUP BY tablename
ORDER BY tablename;

\echo ''

-- ============================================================================
-- TEST 4: Verify Materialized Views Exist
-- ============================================================================
\echo 'TEST 4: Checking if all materialized views exist...'

SELECT
    matviewname,
    CASE WHEN matviewname IN (
        'mv_service_performance_last_7d',
        'mv_top_errors_last_24h',
        'mv_routing_quality_daily',
        'mv_user_cost_last_30d'
    ) THEN '✓' ELSE '✗' END as status
FROM pg_matviews
WHERE schemaname = 'public'
ORDER BY matviewname;

\echo ''

-- ============================================================================
-- TEST 5: Verify RLS Policies Exist
-- ============================================================================
\echo 'TEST 5: Checking RLS policy count per table...'

SELECT
    tablename,
    COUNT(*) as policy_count,
    CASE
        WHEN tablename = 'ai_metrics' AND COUNT(*) >= 3 THEN '✓'
        WHEN tablename = 'ai_routing_decisions' AND COUNT(*) >= 2 THEN '✓'
        WHEN tablename = 'ai_errors' AND COUNT(*) >= 3 THEN '✓'
        WHEN tablename = 'ai_conversations' AND COUNT(*) >= 3 THEN '✓'
        WHEN tablename = 'ai_daily_summary' AND COUNT(*) >= 3 THEN '✓'
        ELSE '✗'
    END as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename LIKE 'ai_%'
GROUP BY tablename
ORDER BY tablename;

\echo ''

-- ============================================================================
-- TEST 6: Verify Triggers Exist
-- ============================================================================
\echo 'TEST 6: Checking if triggers exist...'

SELECT
    trigger_name,
    event_object_table,
    CASE WHEN trigger_name IN (
        'trigger_update_conversation_aggregate',
        'trigger_auto_flag_routing'
    ) THEN '✓' ELSE '✗' END as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table LIKE 'ai_%'
ORDER BY event_object_table, trigger_name;

\echo ''

-- ============================================================================
-- TEST 7: Verify Functions Exist
-- ============================================================================
\echo 'TEST 7: Checking if utility functions exist...'

SELECT
    routine_name,
    CASE WHEN routine_name IN (
        'is_admin',
        'is_service_account',
        'update_conversation_aggregate',
        'auto_flag_routing_decisions',
        'refresh_ai_monitoring_views',
        'delete_user_ai_data',
        'archive_old_ai_metrics'
    ) THEN '✓' ELSE '✗' END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (routine_name LIKE '%ai%' OR routine_name LIKE 'is_%')
ORDER BY routine_name;

\echo ''

-- ============================================================================
-- TEST 8: Insert Sample Data (Test Constraints)
-- ============================================================================
\echo 'TEST 8: Inserting sample data to test constraints...'

-- Insert sample metric
INSERT INTO public.ai_metrics (
    service_name,
    operation_type,
    duration_ms,
    tokens_input,
    tokens_output,
    estimated_cost_usd,
    status,
    model_name,
    metadata
) VALUES (
    'enhancedClaudeService',
    'chat',
    1250,
    150,
    300,
    0.0045,
    'success',
    'claude-3-5-sonnet-20241022',
    '{"test": true}'::jsonb
);

\echo '  ✓ Sample metric inserted'

-- Insert sample routing decision
INSERT INTO public.ai_routing_decisions (
    user_input_preview,
    selected_route,
    confidence_score,
    reasoning,
    alternative_routes,
    context_signals
) VALUES (
    'I am feeling overwhelmed and anxious...',
    'polyvagal',
    0.92,
    'User expressing distress - route to nervous system regulation',
    '[{"route": "huxley", "score": 0.75}, {"route": "ifs", "score": 0.68}]'::jsonb,
    '{"emotional_state": "distressed", "recent_topics": ["anxiety", "overwhelm"]}'::jsonb
);

\echo '  ✓ Sample routing decision inserted'

-- Insert sample error
INSERT INTO public.ai_errors (
    service_name,
    operation_type,
    error_type,
    error_message,
    error_code,
    user_impact
) VALUES (
    'ifsAIService',
    'analysis',
    'timeout',
    'Request timed out after 30 seconds',
    'ETIMEDOUT',
    'medium'
);

\echo '  ✓ Sample error inserted'

\echo ''

-- ============================================================================
-- TEST 9: Verify Sample Data
-- ============================================================================
\echo 'TEST 9: Verifying inserted data...'

SELECT
    'ai_metrics' as table_name,
    COUNT(*) as row_count,
    CASE WHEN COUNT(*) > 0 THEN '✓' ELSE '✗' END as status
FROM public.ai_metrics
UNION ALL
SELECT
    'ai_routing_decisions',
    COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN '✓' ELSE '✗' END
FROM public.ai_routing_decisions
UNION ALL
SELECT
    'ai_errors',
    COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN '✓' ELSE '✗' END
FROM public.ai_errors;

\echo ''

-- ============================================================================
-- TEST 10: Test Materialized View Query
-- ============================================================================
\echo 'TEST 10: Querying materialized views (should return data)...'

-- Refresh views first
SELECT refresh_ai_monitoring_views();

-- Query service performance view
SELECT
    service_name,
    total_calls,
    success_rate,
    avg_duration_ms,
    total_tokens,
    '✓' as status
FROM public.mv_service_performance_last_7d
LIMIT 3;

\echo ''

-- ============================================================================
-- TEST 11: Test Trigger Functionality
-- ============================================================================
\echo 'TEST 11: Testing trigger for conversation aggregates...'

-- Insert metric with conversation_id
INSERT INTO public.ai_metrics (
    service_name,
    operation_type,
    conversation_id,
    duration_ms,
    tokens_input,
    tokens_output,
    estimated_cost_usd,
    status,
    model_name
) VALUES (
    'enhancedClaudeService',
    'chat',
    '12345678-1234-1234-1234-123456789abc'::uuid,
    1500,
    200,
    400,
    0.006,
    'success',
    'claude-3-5-sonnet-20241022'
);

-- Check if conversation aggregate was created
SELECT
    conversation_id,
    total_messages,
    total_tokens,
    total_cost_usd,
    CASE WHEN total_messages > 0 THEN '✓ Trigger working' ELSE '✗ Trigger failed' END as status
FROM public.ai_conversations
WHERE conversation_id = '12345678-1234-1234-1234-123456789abc'::uuid;

\echo ''

-- ============================================================================
-- TEST 12: Test Auto-Flag Trigger
-- ============================================================================
\echo 'TEST 12: Testing auto-flag trigger for low confidence routes...'

-- Insert low confidence routing decision
INSERT INTO public.ai_routing_decisions (
    user_input_preview,
    selected_route,
    confidence_score,
    reasoning
) VALUES (
    'Test low confidence route',
    'huxley',
    0.65,
    'Low confidence test'
);

-- Check if it was auto-flagged
SELECT
    selected_route,
    confidence_score,
    flagged_for_review,
    flag_reason,
    CASE WHEN flagged_for_review = TRUE THEN '✓ Auto-flag working' ELSE '✗ Auto-flag failed' END as status
FROM public.ai_routing_decisions
WHERE user_input_preview = 'Test low confidence route';

\echo ''

-- ============================================================================
-- TEST 13: Clean Up Test Data
-- ============================================================================
\echo 'TEST 13: Cleaning up test data...'

DELETE FROM public.ai_conversations WHERE conversation_id = '12345678-1234-1234-1234-123456789abc'::uuid;
DELETE FROM public.ai_routing_decisions WHERE user_input_preview LIKE 'Test%' OR user_input_preview LIKE 'I am feeling%';
DELETE FROM public.ai_errors WHERE error_message LIKE '%test%' OR error_message LIKE '%timed out%';
DELETE FROM public.ai_metrics WHERE metadata->>'test' = 'true';

\echo '  ✓ Test data cleaned up'
\echo ''

-- ============================================================================
-- SUMMARY
-- ============================================================================
\echo '=========================='
\echo 'Test Summary'
\echo '=========================='
\echo ''
\echo 'If all tests show ✓, the migration was successful!'
\echo ''
\echo 'Next steps:'
\echo '  1. Create service account (see migrations/README.md)'
\echo '  2. Set up materialized view refresh (every 15 min)'
\echo '  3. Set up data archival (daily)'
\echo '  4. Implement metricsService.js in app'
\echo '  5. Instrument AI services with metrics logging'
\echo ''
\echo '=========================='
