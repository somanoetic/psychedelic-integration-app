# Supabase Migrations

This directory contains database migrations for the Psychedelic Integration App.

## Migration Files

### 20260209000000_ai_monitoring_schema.sql
**Purpose:** AI Monitoring & Observability system (FEAT-203)

**Creates:**
- 5 tables: `ai_metrics`, `ai_routing_decisions`, `ai_errors`, `ai_conversations`, `ai_daily_summary`
- 4 materialized views for dashboard queries
- Row Level Security (RLS) policies for all tables
- Triggers for auto-updating aggregates
- Utility functions for maintenance and GDPR compliance

**Expected Runtime:** ~30 seconds

### 20260209000000_ai_monitoring_rollback.sql
**Purpose:** Complete rollback of AI monitoring schema

**Use only if:** You need to completely remove the monitoring system

---

## How to Run Migrations

### Option 1: Using Supabase CLI (Recommended)

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Link your project**:
   ```bash
   supabase link --project-ref hxpyeudklnqtwspmdsuz
   ```

3. **Run migrations**:
   ```bash
   supabase db push
   ```

### Option 2: Using Supabase Dashboard

1. Go to https://app.supabase.com/project/hxpyeudklnqtwspmdsuz/editor
2. Open SQL Editor
3. Copy the entire contents of `20260209000000_ai_monitoring_schema.sql`
4. Paste into SQL Editor and click "Run"

### Option 3: Using psql

1. **Connect to your database**:
   ```bash
   psql "postgresql://postgres:[password]@db.hxpyeudklnqtwspmdsuz.supabase.co:5432/postgres"
   ```

2. **Run migration**:
   ```sql
   \i supabase/migrations/20260209000000_ai_monitoring_schema.sql
   ```

---

## Testing the Migration

### 1. Verify Tables Were Created

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'ai_%'
ORDER BY table_name;
```

**Expected output:**
```
ai_conversations
ai_daily_summary
ai_errors
ai_metrics
ai_routing_decisions
```

### 2. Verify Materialized Views Were Created

```sql
SELECT matviewname
FROM pg_matviews
WHERE schemaname = 'public'
ORDER BY matviewname;
```

**Expected output:**
```
mv_routing_quality_daily
mv_service_performance_last_7d
mv_top_errors_last_24h
mv_user_cost_last_30d
```

### 3. Verify RLS is Enabled

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'ai_%';
```

**Expected:** All tables should have `rowsecurity = true`

### 4. Verify RLS Policies

```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Expected:** Should see policies for SELECT (users/admins), INSERT/UPDATE (service accounts)

### 5. Test with Sample Data

```sql
-- Insert sample metric (will fail if RLS is not set up correctly for service accounts)
INSERT INTO public.ai_metrics (
    service_name,
    operation_type,
    duration_ms,
    tokens_input,
    tokens_output,
    estimated_cost_usd,
    status,
    model_name
) VALUES (
    'enhancedClaudeService',
    'chat',
    1250,
    150,
    300,
    0.0045,
    'success',
    'claude-3-5-sonnet-20241022'
);

-- Verify insert
SELECT COUNT(*) FROM public.ai_metrics;

-- Query materialized view
SELECT * FROM public.mv_service_performance_last_7d;
```

---

## Testing RLS Policies

### Setup Test Users

You'll need to create test users with different roles:

1. **Regular user** (default - can only see their own data)
2. **Admin user** (has `raw_user_meta_data->>'role' = 'admin'`)
3. **Service account** (has `raw_user_meta_data->>'account_type' = 'service'`)

### Create Admin User

```sql
-- Update existing user to admin
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'
)
WHERE email = 'your-admin-email@example.com';
```

### Create Service Account

```sql
-- Insert service account (for app backend to use)
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
    crypt('secure-password-here', gen_salt('bf')),
    NOW(),
    '{"account_type": "service"}'::jsonb,
    'authenticated',
    'authenticated'
);
```

### Test RLS as Different Users

```sql
-- Test as regular user (should only see own data)
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "user-uuid-here"}';
SELECT COUNT(*) FROM ai_metrics; -- Should only return their metrics

-- Test as admin (should see all data)
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "admin-uuid-here"}';
SELECT COUNT(*) FROM ai_metrics; -- Should return all metrics

-- Test as service account (should be able to insert)
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "service-uuid-here"}';
INSERT INTO ai_metrics (...) VALUES (...); -- Should succeed
SELECT COUNT(*) FROM ai_metrics; -- Should fail (no SELECT permission)
```

---

## Refreshing Materialized Views

Materialized views need to be refreshed periodically to show up-to-date data.

### Manual Refresh

```sql
-- Refresh all views
SELECT refresh_ai_monitoring_views();

-- Or refresh individually
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_service_performance_last_7d;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_errors_last_24h;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_routing_quality_daily;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_cost_last_30d;
```

### Automated Refresh (Recommended)

**Option 1: Using pg_cron (if available)**

```sql
-- Refresh every 15 minutes
SELECT cron.schedule(
    'refresh-ai-views',
    '*/15 * * * *',
    'SELECT refresh_ai_monitoring_views()'
);
```

**Option 2: Using Supabase Edge Function**

Create an edge function that calls `refresh_ai_monitoring_views()` and trigger it with a cron job.

---

## GDPR Compliance

### Delete User Data

```sql
-- Delete all AI monitoring data for a specific user
SELECT delete_user_ai_data('user-uuid-here');
```

This will remove:
- All metrics logged for the user
- All routing decisions for the user
- All errors associated with the user
- All conversation aggregates for the user

**Note:** `ai_daily_summary` is anonymized and doesn't contain user-specific data.

---

## Data Retention

### Archive Old Data

```sql
-- Delete metrics older than 90 days
SELECT archive_old_ai_metrics();
```

**Recommended:** Schedule this to run daily:

```sql
SELECT cron.schedule(
    'archive-ai-metrics',
    '0 2 * * *', -- 2 AM daily
    'SELECT archive_old_ai_metrics()'
);
```

---

## Rollback

### Complete Rollback (Destructive)

⚠️ **WARNING:** This will permanently delete all AI monitoring data.

```bash
# Using Supabase CLI
supabase db reset

# Or manually run rollback script
psql "postgresql://..." -f supabase/migrations/20260209000000_ai_monitoring_rollback.sql
```

### Partial Rollback (Keep Data, Remove Indexes)

If you want to keep the data but improve performance:

```sql
-- Drop specific indexes
DROP INDEX IF EXISTS idx_ai_metrics_metadata;
DROP INDEX IF EXISTS idx_routing_alternatives;
```

---

## Performance Monitoring

### Check Index Usage

```sql
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND tablename LIKE 'ai_%'
ORDER BY idx_scan DESC;
```

### Check Table Sizes

```sql
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'ai_%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check Slow Queries

```sql
SELECT
    LEFT(query, 100) as query_preview,
    calls,
    ROUND(total_exec_time::numeric, 2) as total_time_ms,
    ROUND(mean_exec_time::numeric, 2) as avg_time_ms,
    ROUND((100 * total_exec_time / sum(total_exec_time) over ())::numeric, 2) as percent_of_total
FROM pg_stat_statements
WHERE query LIKE '%ai_%'
ORDER BY total_exec_time DESC
LIMIT 10;
```

---

## Troubleshooting

### Issue: RLS Blocking Inserts

**Symptom:** Service can't insert metrics, getting "permission denied" errors.

**Solution:** Verify service account is properly configured:

```sql
SELECT id, email, raw_user_meta_data
FROM auth.users
WHERE raw_user_meta_data->>'account_type' = 'service';
```

If no service account exists, create one using the "Create Service Account" section above.

### Issue: Materialized Views Not Updating

**Symptom:** Dashboard shows stale data.

**Solution:** Manually refresh views:

```sql
SELECT refresh_ai_monitoring_views();
```

Then set up automated refresh using pg_cron or Edge Functions.

### Issue: Slow Dashboard Queries

**Symptom:** Queries taking >1 second.

**Solution:**
1. Verify materialized views are being used (not the base tables)
2. Check index usage with performance monitoring queries above
3. Add missing indexes if needed:

```sql
-- Example: Add index if missing
CREATE INDEX IF NOT EXISTS idx_ai_metrics_user_time
ON public.ai_metrics(user_id, created_at DESC)
WHERE user_id IS NOT NULL;
```

### Issue: High Storage Usage

**Symptom:** Database size growing rapidly.

**Solution:**
1. Check table sizes using performance monitoring query
2. Run archive function to remove old data:

```sql
SELECT archive_old_ai_metrics();
```

3. If still too large, consider partitioning (see future enhancements)

---

## Next Steps

After successful migration:

1. ✅ Verify all tables and views created
2. ✅ Test RLS policies with different user roles
3. ✅ Create service account for app backend
4. ✅ Set up automated materialized view refresh
5. ✅ Set up automated data archival (90 days)
6. ✅ Implement `metricsService.js` in app (see backend implementation)
7. ✅ Test metrics logging from app
8. ✅ Create admin dashboard to view metrics
9. ✅ Set up alerts for critical errors (optional)

---

## Related Documentation

- Database design: `.full-stack-feature/02-database-design.md`
- Architecture: `.full-stack-feature/03-architecture.md`
- Backend implementation: (coming next)
- Frontend dashboard: (coming next)

---

**Migration Status:** Ready for deployment
**Last Updated:** 2026-02-09
**Version:** 1.0
