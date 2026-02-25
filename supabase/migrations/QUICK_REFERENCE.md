# AI Monitoring Database - Quick Reference

**Migration:** `20260209000000_ai_monitoring_schema.sql`
**Status:** Ready for deployment

---

## Quick Start

### 1. Run Migration

```bash
# Option 1: Supabase CLI (recommended)
supabase db push

# Option 2: SQL Editor in Supabase Dashboard
# Copy/paste 20260209000000_ai_monitoring_schema.sql into SQL editor

# Option 3: psql
psql "postgresql://postgres:[password]@db.hxpyeudklnqtwspmdsuz.supabase.co:5432/postgres" \
  -f supabase/migrations/20260209000000_ai_monitoring_schema.sql
```

### 2. Test Migration

```bash
# Run test script to verify everything works
psql "postgresql://..." -f supabase/migrations/test-migration.sql
```

### 3. Create Service Account

```sql
-- Run this in Supabase SQL Editor
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    aud,
    role
) VALUES (
    gen_random_uuid(),
    'service@psycheteleos.app',
    crypt('CHANGE-THIS-PASSWORD', gen_salt('bf')),
    NOW(),
    '{"account_type": "service"}'::jsonb,
    'authenticated',
    'authenticated'
);

-- Save the generated UUID and password for app configuration!
```

### 4. Set Up Auto-Refresh

```sql
-- Refresh materialized views every 15 minutes
SELECT cron.schedule(
    'refresh-ai-views',
    '*/15 * * * *',
    'SELECT refresh_ai_monitoring_views()'
);

-- Archive old data daily at 2 AM
SELECT cron.schedule(
    'archive-ai-metrics',
    '0 2 * * *',
    'SELECT archive_old_ai_metrics()'
);
```

---

## Tables

| Table | Purpose | Expected Volume |
|-------|---------|-----------------|
| `ai_metrics` | Event stream for all AI interactions | 10K rows/day |
| `ai_routing_decisions` | Routing audit log | 2K rows/day |
| `ai_errors` | Error tracking with stack traces | 100 rows/day |
| `ai_conversations` | Conversation-level aggregates | 5K rows/day |
| `ai_daily_summary` | Daily rollups | 1 row/day |

---

## Materialized Views

| View | Purpose | Refresh |
|------|---------|---------|
| `mv_service_performance_last_7d` | Service health dashboard | Every 15 min |
| `mv_top_errors_last_24h` | Error analysis | Every 15 min |
| `mv_routing_quality_daily` | Routing effectiveness | Every 15 min |
| `mv_user_cost_last_30d` | Per-user cost tracking | Every 15 min |

---

## Common Queries

### Check Service Health

```sql
SELECT * FROM mv_service_performance_last_7d
ORDER BY success_rate ASC;
```

### View Top Errors

```sql
SELECT * FROM mv_top_errors_last_24h
ORDER BY occurrence_count DESC
LIMIT 10;
```

### Check Routing Quality

```sql
SELECT *
FROM mv_routing_quality_daily
WHERE routing_date = CURRENT_DATE
ORDER BY low_confidence_rate DESC;
```

### User Cost Summary

```sql
SELECT *
FROM mv_user_cost_last_30d
ORDER BY total_cost_usd DESC
LIMIT 20;
```

### Recent Flagged Conversations

```sql
SELECT
    conversation_id,
    user_id,
    total_messages,
    total_cost_usd,
    flag_reasons,
    created_at
FROM ai_conversations
WHERE flagged_for_review = TRUE
ORDER BY created_at DESC
LIMIT 10;
```

### Crisis Detections (Last 24h)

```sql
SELECT
    c.conversation_id,
    c.user_id,
    c.created_at,
    r.user_input_preview,
    r.confidence_score
FROM ai_conversations c
JOIN ai_routing_decisions r ON r.conversation_id = c.conversation_id
WHERE c.crisis_detected = TRUE
AND c.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY c.created_at DESC;
```

---

## Maintenance Commands

### Refresh Materialized Views

```sql
-- Refresh all at once
SELECT refresh_ai_monitoring_views();

-- Or individually
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_service_performance_last_7d;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_errors_last_24h;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_routing_quality_daily;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_cost_last_30d;
```

### Archive Old Data

```sql
-- Delete metrics older than 90 days
SELECT archive_old_ai_metrics();
-- Returns: number of rows deleted
```

### GDPR Data Deletion

```sql
-- Delete all data for a user
SELECT delete_user_ai_data('user-uuid-here');
```

---

## RLS Policy Testing

### Create Test Admin User

```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'
)
WHERE email = 'your-admin-email@example.com';
```

### Test User Can't See Others' Data

```sql
-- Set session as user
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "user-uuid-here"}';

-- This should only return their own metrics
SELECT COUNT(*) FROM ai_metrics;

-- This should fail (no access to routing decisions)
SELECT COUNT(*) FROM ai_routing_decisions;
```

### Test Admin Can See All Data

```sql
-- Set session as admin
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "admin-uuid-here"}';

-- Should return all metrics
SELECT COUNT(*) FROM ai_metrics;

-- Should have access to routing decisions
SELECT COUNT(*) FROM ai_routing_decisions;
```

---

## Performance Monitoring

### Check Table Sizes

```sql
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size('public.'||tablename)) AS table_size
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'ai_%'
ORDER BY pg_total_relation_size('public.'||tablename) DESC;
```

### Check Index Usage

```sql
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as times_used,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND tablename LIKE 'ai_%'
ORDER BY idx_scan DESC;
```

### Check Slow Queries

```sql
SELECT
    LEFT(query, 100) as query_preview,
    calls,
    ROUND(total_exec_time::numeric, 2) as total_time_ms,
    ROUND(mean_exec_time::numeric, 2) as avg_time_ms
FROM pg_stat_statements
WHERE query LIKE '%ai_%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## Rollback

### Complete Rollback (DESTRUCTIVE)

```bash
# WARNING: This deletes all AI monitoring data permanently
psql "postgresql://..." -f supabase/migrations/20260209000000_ai_monitoring_rollback.sql
```

### Partial Rollback (Keep Data, Drop Indexes)

```sql
-- Example: Drop specific index if causing issues
DROP INDEX IF EXISTS idx_ai_metrics_metadata;
```

---

## Troubleshooting

### Problem: Can't insert metrics

**Cause:** Service account not configured

**Solution:**
```sql
-- Verify service account exists
SELECT id, email, raw_user_meta_data
FROM auth.users
WHERE raw_user_meta_data->>'account_type' = 'service';

-- If empty, create service account (see "Create Service Account" above)
```

### Problem: Dashboard shows stale data

**Cause:** Materialized views not refreshed

**Solution:**
```sql
-- Manual refresh
SELECT refresh_ai_monitoring_views();

-- Set up auto-refresh (see "Set Up Auto-Refresh" above)
```

### Problem: Database growing too fast

**Cause:** No data archival

**Solution:**
```sql
-- Run archive function
SELECT archive_old_ai_metrics();

-- Set up daily archival (see "Set Up Auto-Refresh" above)
```

### Problem: Queries are slow

**Cause 1:** Not using materialized views

**Solution:** Query `mv_*` views instead of base tables

**Cause 2:** Indexes not being used

**Solution:** Check query plan:
```sql
EXPLAIN ANALYZE
SELECT * FROM ai_metrics WHERE service_name = 'huxley' LIMIT 10;
-- Look for "Index Scan" (good) vs "Seq Scan" (bad)
```

---

## Environment Variables

Add to `.env`:

```bash
# Service Account Credentials (for metrics logging)
SUPABASE_SERVICE_ACCOUNT_EMAIL=service@psycheteleos.app
SUPABASE_SERVICE_ACCOUNT_PASSWORD=your-secure-password-here
```

---

## Next Steps

1. ✅ Run migration
2. ✅ Test with `test-migration.sql`
3. ✅ Create service account
4. ✅ Set up auto-refresh and archival
5. ⏳ Implement `metricsService.js` (backend)
6. ⏳ Instrument AI services with logging
7. ⏳ Create admin dashboard (frontend)
8. ⏳ Deploy to production

---

## Documentation

- **Full Guide:** `README.md`
- **Schema Diagram:** `SCHEMA_DIAGRAM.md`
- **Implementation Details:** `.full-stack-feature/04-database-impl.md`
- **Database Design:** `.full-stack-feature/02-database-design.md`

---

**Quick Reference v1.0**
**Last Updated:** 2026-02-09
