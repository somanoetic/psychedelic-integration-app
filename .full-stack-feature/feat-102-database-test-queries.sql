-- ============================================================================
-- FEAT-102: Database Testing Queries
-- ============================================================================
-- Quick reference for testing the database implementation
-- Run these queries to verify everything works correctly
-- ============================================================================

-- ============================================================================
-- PART 1: VERIFICATION QUERIES (Run after migration)
-- ============================================================================

-- 1. Verify tables exist
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%intention%'
ORDER BY table_name;
-- Expected: 3 tables (intention_templates, session_intentions, user_intention_preferences)

-- 2. Verify indexes created
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename LIKE '%intention%'
ORDER BY tablename, indexname;
-- Expected: 15 indexes total

-- 3. Verify RLS enabled
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE '%intention%';
-- Expected: rowsecurity = TRUE for all 3 tables

-- 4. Verify RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename LIKE '%intention%'
ORDER BY tablename, policyname;
-- Expected: 13 policies total

-- 5. Verify functions created
SELECT
  proname AS function_name,
  pronargs AS arg_count,
  pg_get_function_result(oid) AS return_type
FROM pg_proc
WHERE proname IN (
  'auto_delete_old_intentions',
  'cleanup_deleted_intentions',
  'delete_user_intention_data',
  'update_updated_at_column'
)
ORDER BY proname;
-- Expected: 4 functions

-- 6. Verify triggers created
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table LIKE '%intention%'
ORDER BY event_object_table, trigger_name;
-- Expected: 3 triggers (updated_at on all 3 tables)

-- 7. Verify seed data loaded
SELECT
  framework,
  COUNT(*) as template_count,
  COUNT(*) FILTER (WHERE is_featured = TRUE) as featured_count
FROM intention_templates
GROUP BY framework
ORDER BY framework;
-- Expected: ifs (3, 2 featured), somatic (3, 2 featured), existential (3, 2 featured), healing (3, 2 featured)

-- ============================================================================
-- PART 2: FUNCTIONAL TESTS
-- ============================================================================

-- Test 1: Get active templates by framework
SELECT id, title, framework, session_type, is_featured
FROM intention_templates
WHERE framework = 'ifs'
  AND is_active = TRUE
ORDER BY is_featured DESC, sort_order ASC;
-- Expected: 3 IFS templates

-- Test 2: Search templates by tag
SELECT title, framework, tags
FROM intention_templates
WHERE 'grief' = ANY(tags)
  AND is_active = TRUE;
-- Expected: At least 1 template with 'grief' tag

-- Test 3: Get featured templates
SELECT title, framework, sort_order
FROM intention_templates
WHERE is_active = TRUE
  AND is_featured = TRUE
ORDER BY sort_order ASC
LIMIT 5;
-- Expected: 5 featured templates

-- Test 4: Create user preferences (simulating service call)
-- Note: Replace 'YOUR-USER-UUID' with actual user UUID
/*
INSERT INTO user_intention_preferences (user_id)
VALUES ('YOUR-USER-UUID')
ON CONFLICT (user_id) DO NOTHING
RETURNING *;
*/

-- Test 5: Save intention (simulating service call)
-- Note: Replace UUIDs with actual values
/*
INSERT INTO session_intentions (
  user_id,
  session_id,
  intention_text,
  framework,
  session_type,
  ai_conversation_context
) VALUES (
  'YOUR-USER-UUID',
  'YOUR-SESSION-UUID',
  'I intend to explore my grief with compassion and openness.',
  'ifs',
  'healing',
  '{"prompt_count": 4, "frameworks_explored": ["ifs"], "session_duration_seconds": 180}'::jsonb
)
RETURNING id, created_at;
*/

-- Test 6: Get user's intentions
-- Note: Replace 'YOUR-USER-UUID' with actual user UUID
/*
SELECT
  id,
  intention_text,
  framework,
  session_type,
  created_at
FROM session_intentions
WHERE user_id = 'YOUR-USER-UUID'
  AND is_deleted = FALSE
ORDER BY created_at DESC
LIMIT 10;
*/

-- Test 7: Soft delete intention
-- Note: Replace 'INTENTION-UUID' with actual intention UUID
/*
UPDATE session_intentions
SET
  is_deleted = TRUE,
  deleted_at = NOW()
WHERE id = 'INTENTION-UUID'
RETURNING id, is_deleted, deleted_at;
*/

-- Test 8: Get deleted intentions (within 30 days)
-- Note: Replace 'YOUR-USER-UUID' with actual user UUID
/*
SELECT
  id,
  intention_text,
  deleted_at
FROM session_intentions
WHERE user_id = 'YOUR-USER-UUID'
  AND is_deleted = TRUE
  AND deleted_at > NOW() - INTERVAL '30 days'
ORDER BY deleted_at DESC;
*/

-- Test 9: Restore deleted intention
-- Note: Replace 'INTENTION-UUID' with actual intention UUID
/*
UPDATE session_intentions
SET
  is_deleted = FALSE,
  deleted_at = NULL
WHERE id = 'INTENTION-UUID'
  AND is_deleted = TRUE
  AND deleted_at > NOW() - INTERVAL '30 days'
RETURNING id, is_deleted, deleted_at;
*/

-- ============================================================================
-- PART 3: RLS SECURITY TESTS
-- ============================================================================

-- Test 1: Verify users can only see active templates
-- Run as regular user (should only see active templates)
SELECT COUNT(*) as active_count
FROM intention_templates;
-- Expected: Only active templates visible

-- Test 2: Verify users can only see their own intentions
-- Run as user A (should only see user A's intentions)
SELECT user_id, COUNT(*) as intention_count
FROM session_intentions
WHERE is_deleted = FALSE
GROUP BY user_id;
-- Expected: Only current user's ID in results

-- Test 3: Verify users cannot access other users' intentions
-- This query should return empty if RLS is working correctly
-- Note: Replace 'OTHER-USER-UUID' with different user's UUID
/*
SELECT *
FROM session_intentions
WHERE user_id = 'OTHER-USER-UUID'
  AND is_deleted = FALSE;
*/
-- Expected: Empty result (RLS blocks access)

-- Test 4: Verify users can only update their own preferences
-- Note: Replace 'YOUR-USER-UUID' with actual user UUID
/*
UPDATE user_intention_preferences
SET guidance_style = 'detailed'
WHERE user_id = 'YOUR-USER-UUID'
RETURNING *;
*/
-- Expected: Success for own user_id

-- Test 5: Verify users cannot update other users' preferences
-- Note: Replace 'OTHER-USER-UUID' with different user's UUID
/*
UPDATE user_intention_preferences
SET guidance_style = 'detailed'
WHERE user_id = 'OTHER-USER-UUID'
RETURNING *;
*/
-- Expected: No rows returned (RLS blocks)

-- ============================================================================
-- PART 4: FUNCTION TESTS
-- ============================================================================

-- Test 1: Auto-delete old intentions (dry run - check what would be deleted)
-- Note: This is read-only, safe to run
SELECT
  si.id,
  si.user_id,
  si.created_at,
  uip.auto_delete_after_days,
  si.created_at < NOW() - (uip.auto_delete_after_days || ' days')::INTERVAL as would_be_deleted
FROM session_intentions si
JOIN user_intention_preferences uip ON si.user_id = uip.user_id
WHERE uip.auto_delete_after_days IS NOT NULL
  AND si.is_deleted = FALSE;

-- Test 2: Cleanup deleted intentions (dry run - check what would be deleted)
-- Note: This is read-only, safe to run
SELECT
  id,
  user_id,
  deleted_at,
  NOW() - deleted_at as age
FROM session_intentions
WHERE is_deleted = TRUE
  AND deleted_at < NOW() - INTERVAL '30 days';

-- Test 3: Trigger test - verify updated_at auto-updates
-- Note: Replace 'YOUR-USER-UUID' with actual user UUID
/*
-- Get current updated_at
SELECT updated_at FROM user_intention_preferences WHERE user_id = 'YOUR-USER-UUID';

-- Update a field
UPDATE user_intention_preferences
SET show_examples = TRUE
WHERE user_id = 'YOUR-USER-UUID';

-- Check updated_at changed
SELECT updated_at FROM user_intention_preferences WHERE user_id = 'YOUR-USER-UUID';
-- Expected: updated_at should be more recent than before
*/

-- ============================================================================
-- PART 5: PERFORMANCE TESTS
-- ============================================================================

-- Test 1: Get templates by framework (should use index)
EXPLAIN ANALYZE
SELECT *
FROM intention_templates
WHERE framework = 'ifs'
  AND session_type = 'healing'
  AND is_active = TRUE
ORDER BY sort_order ASC;
-- Expected: Uses idx_intention_templates_active_framework_type, <30ms

-- Test 2: Get user's intentions (should use index)
-- Note: Replace 'YOUR-USER-UUID' with actual user UUID
/*
EXPLAIN ANALYZE
SELECT *
FROM session_intentions
WHERE user_id = 'YOUR-USER-UUID'
  AND is_deleted = FALSE
ORDER BY created_at DESC
LIMIT 10;
*/
-- Expected: Uses idx_session_intentions_user_time, <50ms

-- Test 3: Search by tag (should use GIN index)
EXPLAIN ANALYZE
SELECT *
FROM intention_templates
WHERE 'grief' = ANY(tags)
  AND is_active = TRUE;
-- Expected: Uses idx_intention_templates_tags, <100ms

-- ============================================================================
-- PART 6: DATA INTEGRITY TESTS
-- ============================================================================

-- Test 1: Check for orphaned intentions (intentions without users)
SELECT COUNT(*) as orphaned_count
FROM session_intentions si
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = si.user_id
);
-- Expected: 0 (CASCADE DELETE should prevent this)

-- Test 2: Check for invalid frameworks
SELECT id, framework
FROM session_intentions
WHERE framework NOT IN (
  'ifs', 'somatic', 'existential', 'healing',
  'exploration', 'creativity', 'spiritual', 'integration'
)
  AND framework IS NOT NULL;
-- Expected: 0 (CHECK constraint prevents this)

-- Test 3: Check for invalid session types
SELECT id, session_type
FROM session_intentions
WHERE session_type NOT IN (
  'healing', 'exploration', 'creativity',
  'spiritual', 'integration', 'general'
);
-- Expected: 0 (CHECK constraint prevents this)

-- Test 4: Check for invalid ratings
SELECT id, user_rating
FROM session_intentions
WHERE user_rating IS NOT NULL
  AND (user_rating < 1 OR user_rating > 5);
-- Expected: 0 (CHECK constraint prevents this)

-- Test 5: Check soft delete consistency
SELECT id
FROM session_intentions
WHERE (is_deleted = TRUE AND deleted_at IS NULL)
   OR (is_deleted = FALSE AND deleted_at IS NOT NULL);
-- Expected: 0 (CHECK constraint prevents inconsistency)

-- ============================================================================
-- PART 7: MONITORING QUERIES
-- ============================================================================

-- Query 1: Table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE '%intention%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Query 2: Index usage statistics
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename LIKE '%intention%'
ORDER BY idx_scan DESC;
-- Look for indexes with idx_scan = 0 (unused)

-- Query 3: Row counts by table
SELECT
  'intention_templates' as table_name,
  COUNT(*) as total_rows,
  COUNT(*) FILTER (WHERE is_active = TRUE) as active_rows
FROM intention_templates
UNION ALL
SELECT
  'session_intentions' as table_name,
  COUNT(*) as total_rows,
  COUNT(*) FILTER (WHERE is_deleted = FALSE) as active_rows
FROM session_intentions
UNION ALL
SELECT
  'user_intention_preferences' as table_name,
  COUNT(*) as total_rows,
  COUNT(*) as active_rows
FROM user_intention_preferences;

-- Query 4: Intentions by framework (analytics)
SELECT
  framework,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE is_deleted = TRUE) as deleted_count,
  COUNT(*) FILTER (WHERE user_rating IS NOT NULL) as rated_count,
  AVG(user_rating) as avg_rating
FROM session_intentions
GROUP BY framework
ORDER BY count DESC;

-- Query 5: User preferences distribution
SELECT
  save_by_default,
  COUNT(*) as user_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM user_intention_preferences
GROUP BY save_by_default;

-- Query 6: Check for intentions approaching auto-delete
SELECT
  uip.user_id,
  uip.auto_delete_after_days,
  COUNT(si.id) as intention_count,
  MAX(si.created_at) as newest_intention,
  MIN(si.created_at) as oldest_intention,
  COUNT(*) FILTER (
    WHERE si.created_at < NOW() - (uip.auto_delete_after_days || ' days')::INTERVAL
  ) as ready_for_deletion
FROM user_intention_preferences uip
LEFT JOIN session_intentions si ON uip.user_id = si.user_id AND si.is_deleted = FALSE
WHERE uip.auto_delete_after_days IS NOT NULL
GROUP BY uip.user_id, uip.auto_delete_after_days;

-- ============================================================================
-- QUICK TEST SCRIPT FOR NEW INSTALLATIONS
-- ============================================================================

-- Run this block to quickly verify everything works
DO $$
DECLARE
  table_count INTEGER;
  index_count INTEGER;
  policy_count INTEGER;
  function_count INTEGER;
  template_count INTEGER;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name LIKE '%intention%';

  -- Count indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public' AND tablename LIKE '%intention%';

  -- Count policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename LIKE '%intention%';

  -- Count functions
  SELECT COUNT(*) INTO function_count
  FROM pg_proc
  WHERE proname IN (
    'auto_delete_old_intentions',
    'cleanup_deleted_intentions',
    'delete_user_intention_data',
    'update_updated_at_column'
  );

  -- Count seed templates
  SELECT COUNT(*) INTO template_count
  FROM intention_templates;

  -- Print results
  RAISE NOTICE '=== FEAT-102 Database Verification ===';
  RAISE NOTICE 'Tables created: % (expected: 3)', table_count;
  RAISE NOTICE 'Indexes created: % (expected: 15)', index_count;
  RAISE NOTICE 'RLS policies created: % (expected: 13)', policy_count;
  RAISE NOTICE 'Functions created: % (expected: 4)', function_count;
  RAISE NOTICE 'Seed templates: % (expected: 12)', template_count;

  IF table_count = 3 AND index_count = 15 AND policy_count = 13 AND function_count = 4 AND template_count = 12 THEN
    RAISE NOTICE '✅ ALL CHECKS PASSED - Database migration successful!';
  ELSE
    RAISE WARNING '⚠️ VERIFICATION FAILED - Please review individual counts above';
  END IF;
END $$;

-- ============================================================================
-- END OF TEST QUERIES
-- ============================================================================
