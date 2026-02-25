# FEAT-101: Session Day Checklist - Deployment Checklist

**Date:** 2026-02-10
**Feature:** FEAT-101 Session Day Checklist
**Phase:** Database Layer Deployment

---

## Pre-Deployment Verification

### Prerequisites Check

- [ ] **Supabase project is accessible**
  - Dashboard URL: ___________________________
  - Database connection working
  - Admin access confirmed

- [ ] **Required dependencies exist**
  - [ ] `sessions` table with `id` and `user_id` columns
  - [ ] `auth.users` table (Supabase built-in)
  - [ ] `is_admin()` function (from security_fixes migration)

  **Verification query:**
  ```sql
  -- Check sessions table
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'sessions'
  AND column_name IN ('id', 'user_id');

  -- Check is_admin function
  SELECT routine_name FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name = 'is_admin';
  ```

- [ ] **Database backup created**
  - Backup timestamp: ___________________________
  - Backup location: ___________________________
  - Restore procedure verified

- [ ] **Migration files reviewed**
  - [ ] `20260210000000_session_checklist_schema.sql` (17KB)
  - [ ] `20260210000000_session_checklist_rollback.sql` (1.2KB)
  - [ ] No syntax errors found
  - [ ] Idempotent (uses IF NOT EXISTS)

---

## Deployment Steps

### Step 1: Run Migration

**Choose one method:**

#### Option A: Supabase CLI (Recommended)
```bash
cd C:\Users\hadfi\psychedelic-integration-app
supabase db push
```
- [ ] Command executed successfully
- [ ] No error messages in output
- [ ] Migration confirmed applied

#### Option B: Supabase Dashboard SQL Editor
1. Open Supabase Dashboard → SQL Editor
2. Create new query
3. Copy/paste contents of `20260210000000_session_checklist_schema.sql`
4. Click "RUN"
5. Wait for "Success" message

- [ ] SQL executed without errors
- [ ] All statements completed
- [ ] Success message displayed

#### Option C: Direct PostgreSQL (Advanced)
```bash
psql -h <db-host> -U postgres -d postgres \
  -f supabase/migrations/20260210000000_session_checklist_schema.sql
```
- [ ] Connected to database
- [ ] Migration executed
- [ ] COMMIT message received

---

### Step 2: Verify Tables Created

**Run verification queries:**

```sql
-- Check all 3 tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'checklist_template_items',
    'session_checklists',
    'session_checklist_items'
);
```

**Expected result:** 3 rows

- [ ] `checklist_template_items` exists
- [ ] `session_checklists` exists
- [ ] `session_checklist_items` exists

---

### Step 3: Verify RLS Enabled

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE '%checklist%'
ORDER BY tablename;
```

**Expected result:** All 3 tables with `rowsecurity = TRUE`

- [ ] `checklist_template_items`: RLS = TRUE
- [ ] `session_checklists`: RLS = TRUE
- [ ] `session_checklist_items`: RLS = TRUE

---

### Step 4: Verify Indexes Created

```sql
SELECT
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename LIKE '%checklist%'
ORDER BY tablename, indexname;
```

**Expected result:** 5+ indexes (3 PKs + 5 custom)

- [ ] `idx_template_items_active_version`
- [ ] `idx_session_checklists_user_time`
- [ ] `idx_session_checklists_incomplete`
- [ ] `idx_checklist_items_checklist_order`
- [ ] `idx_checklist_items_template_checked`

---

### Step 5: Verify RLS Policies

```sql
SELECT
    schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE schemaname = 'public'
AND tablename LIKE '%checklist%'
ORDER BY tablename, policyname;
```

**Expected result:** 10 policies across 3 tables

**checklist_template_items (2 policies):**
- [ ] "Authenticated users can read checklist templates"
- [ ] "Admins can manage checklist templates"

**session_checklists (4 policies):**
- [ ] "Users can view own session checklists"
- [ ] "Users can create own session checklists"
- [ ] "Users can update own session checklists"
- [ ] "Users can delete own session checklists"

**session_checklist_items (4 policies):**
- [ ] "Users can view own checklist items"
- [ ] "Users can add items to own checklists"
- [ ] "Users can update own checklist items"
- [ ] "Users can delete own checklist items"

---

### Step 6: Verify Trigger Exists

```sql
SELECT
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_checklist_counters';
```

**Expected result:** 1 row

- [ ] Trigger name: `trigger_update_checklist_counters`
- [ ] Events: INSERT, UPDATE, DELETE
- [ ] Timing: AFTER
- [ ] Function: `update_checklist_counters()`

---

### Step 7: Verify Functions Created

```sql
SELECT
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'create_session_checklist',
    'update_checklist_counters',
    'delete_user_checklist_data'
)
ORDER BY routine_name;
```

**Expected result:** 3 rows

- [ ] `create_session_checklist` (function)
- [ ] `update_checklist_counters` (function)
- [ ] `delete_user_checklist_data` (function)

---

### Step 8: Verify Seed Data

```sql
-- Check total items
SELECT COUNT(*) as total_items
FROM checklist_template_items
WHERE is_active = TRUE;

-- Check items by category
SELECT
    category,
    COUNT(*) as item_count,
    SUM(CASE WHEN is_essential THEN 1 ELSE 0 END) as essential_count
FROM checklist_template_items
WHERE is_active = TRUE
GROUP BY category
ORDER BY category;
```

**Expected results:**
- Total items: 18
- Physical: 5 items (4 essential)
- Safety: 4 items (4 essential)
- Mental: 4 items (1 essential)
- Practical: 5 items (4 essential)

- [ ] 18 total items seeded
- [ ] 13 essential items
- [ ] All 4 categories present
- [ ] Template version = 1

---

## Post-Deployment Testing

### Test 1: Create Checklist (Functional Test)

**Requires:** Real session_id and user_id from database

```sql
-- Replace with actual UUIDs
SELECT create_session_checklist(
    '<session-uuid>'::UUID,
    '<user-uuid>'::UUID
) AS checklist_id;
```

- [ ] Function returns UUID (no error)
- [ ] Checklist created in session_checklists
- [ ] 18 items cloned to session_checklist_items

**Verify items cloned:**
```sql
SELECT COUNT(*)
FROM session_checklist_items
WHERE checklist_id = '<returned-checklist-uuid>';
```
Expected: 18 items

- [ ] Item count matches template (18)

---

### Test 2: Toggle Item (Trigger Test)

```sql
-- Get first unchecked item
SELECT id, title, is_checked
FROM session_checklist_items
WHERE checklist_id = '<checklist-uuid>'
AND is_checked = FALSE
LIMIT 1;

-- Toggle it
UPDATE session_checklist_items
SET is_checked = TRUE,
    checked_at = NOW()
WHERE id = '<item-uuid>'
RETURNING *;

-- Verify counters updated
SELECT total_items, completed_items, updated_at
FROM session_checklists
WHERE id = '<checklist-uuid>';
```

- [ ] Item toggled successfully
- [ ] `checked_at` timestamp set
- [ ] `completed_items` counter incremented
- [ ] `updated_at` timestamp updated

---

### Test 3: RLS Security Test

**Test user isolation:**

```sql
-- As User A (authenticated)
SET request.jwt.claim.sub = '<user-a-uuid>';

-- Try to access User B's checklist
SELECT * FROM session_checklists
WHERE user_id = '<user-b-uuid>';

-- Expected: 0 rows (RLS blocks cross-user access)
```

- [ ] User A cannot see User B's checklists
- [ ] RLS policies enforcing isolation

---

### Test 4: Add Custom Item

```sql
-- Add custom item to checklist
INSERT INTO session_checklist_items (
    checklist_id,
    title,
    description,
    category,
    sort_order,
    is_custom
)
VALUES (
    '<checklist-uuid>',
    'Test custom item',
    'This is a test',
    'practical',
    1000,
    TRUE
)
RETURNING id;

-- Verify counter updated
SELECT total_items FROM session_checklists
WHERE id = '<checklist-uuid>';
-- Expected: 19 (was 18, now +1)
```

- [ ] Custom item added
- [ ] `total_items` counter incremented to 19
- [ ] `is_custom` flag = TRUE

---

### Test 5: Delete Item

```sql
-- Delete custom item
DELETE FROM session_checklist_items
WHERE id = '<custom-item-uuid>';

-- Verify counter updated
SELECT total_items FROM session_checklists
WHERE id = '<checklist-uuid>';
-- Expected: 18 (back to original)
```

- [ ] Item deleted
- [ ] `total_items` counter decremented to 18

---

### Test 6: GDPR Deletion

```sql
-- Create test user data
-- (insert test checklist)

-- Delete all data for test user
SELECT delete_user_checklist_data('<test-user-uuid>');

-- Verify deletion
SELECT COUNT(*) FROM session_checklists
WHERE user_id = '<test-user-uuid>';
-- Expected: 0
```

- [ ] Deletion function works
- [ ] All checklists removed
- [ ] Items cascaded deleted

---

## Performance Verification

### Query Performance Tests

```sql
-- Test 1: Load checklist with items (should be < 100ms)
EXPLAIN ANALYZE
SELECT sc.*, sci.*
FROM session_checklists sc
LEFT JOIN session_checklist_items sci ON sci.checklist_id = sc.id
WHERE sc.session_id = '<session-uuid>'
ORDER BY sci.sort_order;
```

- [ ] Query time < 100ms
- [ ] Index used: `idx_checklist_items_checklist_order`

```sql
-- Test 2: Find incomplete checklists (should use partial index)
EXPLAIN ANALYZE
SELECT * FROM session_checklists
WHERE user_id = '<user-uuid>'
AND completed_at IS NULL
ORDER BY updated_at DESC;
```

- [ ] Query time < 50ms
- [ ] Index used: `idx_session_checklists_incomplete`

---

## Monitoring Setup

### Set Up Alerts (Optional)

- [ ] **Error monitoring** for trigger failures
- [ ] **Performance monitoring** for slow queries
- [ ] **Usage tracking** for checklist creation rate

### Logging

```sql
-- Check recent checklist activity
SELECT
    COUNT(*) as total_checklists,
    COUNT(DISTINCT user_id) as unique_users,
    AVG(completed_items::float / NULLIF(total_items, 0) * 100) as avg_completion_pct
FROM session_checklists
WHERE created_at >= NOW() - INTERVAL '7 days';
```

- [ ] Baseline metrics recorded
- [ ] Monitoring dashboard configured (if applicable)

---

## Rollback Procedure (If Needed)

### When to Rollback

Rollback if:
- Critical errors during deployment
- Data corruption detected
- RLS policies not working correctly
- Performance issues unresolvable

### Rollback Steps

1. **Stop new checklist creation** (disable feature flag if exists)
2. **Run rollback script:**
   ```bash
   psql -f supabase/migrations/20260210000000_session_checklist_rollback.sql
   ```
3. **Verify rollback:**
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name LIKE '%checklist%';
   -- Expected: 0 rows
   ```
4. **Restore from backup if needed**
5. **Notify team**

- [ ] Rollback procedure documented
- [ ] Team notified of rollback plan

---

## Sign-Off

### Deployment Team

| Role | Name | Signature | Date/Time |
|------|------|-----------|-----------|
| Database Engineer | _____________ | _____________ | _____________ |
| Backend Lead | _____________ | _____________ | _____________ |
| DevOps | _____________ | _____________ | _____________ |
| QA Lead | _____________ | _____________ | _____________ |

### Deployment Summary

**Deployment Status:** [ ] Success / [ ] Failed / [ ] Rolled Back

**Issues Encountered:**
- _______________________________________________________
- _______________________________________________________

**Resolution:**
- _______________________________________________________
- _______________________________________________________

**Post-Deployment Notes:**
_______________________________________________________
_______________________________________________________
_______________________________________________________

---

## Next Steps After Deployment

- [ ] **Notify frontend team** - Database ready for integration
- [ ] **Update project documentation** - Mark database layer complete
- [ ] **Schedule service layer development** - Step 5 of 8
- [ ] **Update context/features/in-progress.md** - FEAT-101 database complete
- [ ] **Create integration guide** - For frontend developers

---

## Documentation References

- **Implementation Doc:** `.full-stack-feature/04-database-implementation.md`
- **Database Design:** `.full-stack-feature/02-database-design.md`
- **Quick Reference:** `supabase/migrations/CHECKLIST_SCHEMA_REFERENCE.md`
- **Summary:** `.full-stack-feature/DATABASE_IMPLEMENTATION_SUMMARY.txt`

---

**Checklist Version:** 1.0
**Last Updated:** 2026-02-10
**Status:** Ready for use
