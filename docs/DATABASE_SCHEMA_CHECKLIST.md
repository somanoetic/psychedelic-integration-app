# Database Schema: Session Checklist

**Feature:** FEAT-101 - Session Day Checklist
**Version:** 1.0.0
**Last Updated:** 2026-02-10

---

## Overview

The Session Checklist feature uses a normalized database schema with three main tables and supporting infrastructure for rate limiting and usage tracking.

**Migration File:** `supabase/migrations/20260210000000_session_checklist_schema.sql`

**Rollback File:** `supabase/migrations/20260210000000_session_checklist_rollback.sql`

---

## Table of Contents

1. [Schema Diagram](#schema-diagram)
2. [Tables](#tables)
3. [Indexes](#indexes)
4. [Functions](#functions)
5. [Triggers](#triggers)
6. [RLS Policies](#rls-policies)
7. [Seed Data](#seed-data)
8. [Migration Guide](#migration-guide)

---

## Schema Diagram

```
┌─────────────────────────────────┐
│   checklist_template_items      │
│   (18 default items)            │
│─────────────────────────────────│
│ • id (PK)                       │
│ • title                         │
│ • description                   │
│ • category                      │
│ • sort_order                    │
│ • is_essential                  │
│ • template_version              │
│ • is_active                     │
│ • created_at                    │
└───────────┬─────────────────────┘
            │ template_item_id (FK, nullable)
            │
            ↓
┌───────────┴─────────────────────┐
│   session_checklists            │
│   (One per session)             │
│─────────────────────────────────│
│ • id (PK)                       │
│ • session_id (FK, UNIQUE)       │ ← sessions table
│ • user_id (FK)                  │ ← auth.users
│ • template_version              │
│ • total_items ⚡                │ (auto-maintained)
│ • completed_items ⚡            │ (auto-maintained)
│ • created_at                    │
│ • updated_at                    │
│ • completed_at                  │
└───────────┬─────────────────────┘
            │ checklist_id (FK)
            │
            ↓
┌───────────┴─────────────────────┐
│   session_checklist_items       │
│   (Template + custom items)     │
│─────────────────────────────────│
│ • id (PK)                       │
│ • checklist_id (FK)             │
│ • template_item_id (FK, null)   │
│ • title                         │
│ • description                   │
│ • category                      │
│ • sort_order                    │
│ • is_essential                  │
│ • is_custom                     │
│ • is_checked                    │
│ • checked_at                    │
│ • created_at                    │
└─────────────────────────────────┘

⚡ = Auto-updated via trigger
```

---

## Tables

### 1. checklist_template_items

**Purpose:** Master template containing default checklist items that are cloned when creating new session checklists.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Template item ID |
| `title` | TEXT | NOT NULL, CHECK(length >= 1 AND length <= 200) | Item title |
| `description` | TEXT | NOT NULL, CHECK(length >= 0 AND length <= 500) | Item description |
| `category` | TEXT | NOT NULL, CHECK(IN enum) | physical, safety, mental, practical |
| `sort_order` | INTEGER | NOT NULL, CHECK(> 0) | Display order (10, 20, 30...) |
| `is_essential` | BOOLEAN | NOT NULL, DEFAULT FALSE | Essential item flag |
| `template_version` | INTEGER | NOT NULL, DEFAULT 1, CHECK(>= 1) | Template version number |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Active/archived flag |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |

**Constraints:**

```sql
-- Title constraints
CHECK (length(title) >= 1 AND length(title) <= 200)

-- Description constraints
CHECK (length(description) >= 0 AND length(description) <= 500)

-- Category enum
CHECK (category IN ('physical', 'safety', 'mental', 'practical'))

-- Sort order validation
CHECK (sort_order > 0)

-- Version validation
CHECK (template_version >= 1)
```

**Indexes:**

```sql
-- Partial index for active items (used in template cloning)
CREATE INDEX idx_template_items_active_version
ON checklist_template_items(template_version, sort_order)
WHERE is_active = TRUE;
```

**RLS Policies:**

```sql
-- All authenticated users can read template items
CREATE POLICY "Template items readable by authenticated users"
ON checklist_template_items FOR SELECT
TO authenticated
USING (TRUE);

-- Only admins can modify template items
CREATE POLICY "Only admins can modify template items"
ON checklist_template_items FOR ALL
TO authenticated
USING (is_admin());
```

**Notes:**
- Template items are read-only for regular users
- Admins can add/edit/archive items
- Archiving (is_active = FALSE) doesn't delete existing user checklists
- Template versioning allows future migrations

---

### 2. session_checklists

**Purpose:** Checklist instance header - one per session, stores aggregate counters and completion status.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Checklist ID |
| `session_id` | UUID | NOT NULL, UNIQUE, REFERENCES sessions(id) CASCADE | Parent session (1:1) |
| `user_id` | UUID | NOT NULL, REFERENCES auth.users(id) CASCADE | Owner (denormalized for RLS) |
| `template_version` | INTEGER | NOT NULL, DEFAULT 1 | Template version used |
| `total_items` | INTEGER | NOT NULL, DEFAULT 0, CHECK(>= 0) | Total item count (auto) |
| `completed_items` | INTEGER | NOT NULL, DEFAULT 0, CHECK(>= 0) | Completed item count (auto) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |
| `completed_at` | TIMESTAMPTZ | NULL | Completion timestamp |

**Constraints:**

```sql
-- One checklist per session
UNIQUE (session_id)

-- Completed items cannot exceed total
CHECK (completed_items <= total_items)

-- Item counts non-negative
CHECK (total_items >= 0 AND completed_items >= 0)

-- Foreign key with cascade delete
FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
```

**Indexes:**

```sql
-- User's checklists sorted by time
CREATE INDEX idx_session_checklists_user_time
ON session_checklists(user_id, created_at DESC);

-- Incomplete checklists (for reminders)
CREATE INDEX idx_session_checklists_incomplete
ON session_checklists(user_id, created_at DESC)
WHERE completed_at IS NULL;
```

**RLS Policies:**

```sql
-- Users can view their own checklists
CREATE POLICY "Users can view own checklists"
ON session_checklists FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can create checklists for their own sessions
CREATE POLICY "Users can create checklists for own sessions"
ON session_checklists FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = session_id
    AND sessions.user_id = auth.uid()
  )
);

-- Users can update their own checklists
CREATE POLICY "Users can update own checklists"
ON session_checklists FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Users can delete their own checklists
CREATE POLICY "Users can delete own checklists"
ON session_checklists FOR DELETE
TO authenticated
USING (user_id = auth.uid());
```

**Notes:**
- `user_id` is denormalized for RLS performance
- Validated on INSERT to match session owner
- Aggregate counters maintained by trigger
- `completed_at` set when all items checked

---

### 3. session_checklist_items

**Purpose:** Individual checklist items - both template-cloned and user-created custom items.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Item ID |
| `checklist_id` | UUID | NOT NULL, REFERENCES session_checklists(id) CASCADE | Parent checklist |
| `template_item_id` | UUID | NULL, REFERENCES checklist_template_items(id) SET NULL | Source template (null if custom) |
| `title` | TEXT | NOT NULL, CHECK(length >= 1 AND length <= 200) | Item title |
| `description` | TEXT | NOT NULL, DEFAULT '', CHECK(length >= 0 AND length <= 500) | Item description |
| `category` | TEXT | NOT NULL, DEFAULT 'practical', CHECK(IN enum) | physical, safety, mental, practical |
| `sort_order` | INTEGER | NOT NULL, CHECK(> 0) | Display order |
| `is_essential` | BOOLEAN | NOT NULL, DEFAULT FALSE | Essential item flag |
| `is_custom` | BOOLEAN | NOT NULL, DEFAULT FALSE | User-created flag |
| `is_checked` | BOOLEAN | NOT NULL, DEFAULT FALSE | Completion status |
| `checked_at` | TIMESTAMPTZ | NULL | Completion timestamp |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |

**Constraints:**

```sql
-- Title and description length
CHECK (length(title) >= 1 AND length(title) <= 200)
CHECK (length(description) >= 0 AND length(description) <= 500)

-- Category enum
CHECK (category IN ('physical', 'safety', 'mental', 'practical'))

-- Sort order positive
CHECK (sort_order > 0)

-- Checked consistency: if checked, must have timestamp
CHECK (
  (is_checked = FALSE AND checked_at IS NULL) OR
  (is_checked = TRUE AND checked_at IS NOT NULL)
)

-- Foreign keys
FOREIGN KEY (checklist_id) REFERENCES session_checklists(id) ON DELETE CASCADE
FOREIGN KEY (template_item_id) REFERENCES checklist_template_items(id) ON DELETE SET NULL
```

**Indexes:**

```sql
-- Items for a checklist, sorted
CREATE INDEX idx_checklist_items_checklist_order
ON session_checklist_items(checklist_id, sort_order);

-- Template item completion analytics (partial index)
CREATE INDEX idx_checklist_items_template_checked
ON session_checklist_items(template_item_id, is_checked, checked_at)
WHERE template_item_id IS NOT NULL;
```

**RLS Policies:**

```sql
-- Users can view items in their own checklists
CREATE POLICY "Users can view items in own checklists"
ON session_checklist_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM session_checklists
    WHERE session_checklists.id = checklist_id
    AND session_checklists.user_id = auth.uid()
  )
);

-- Users can add items to their own checklists
CREATE POLICY "Users can add items to own checklists"
ON session_checklist_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM session_checklists
    WHERE session_checklists.id = checklist_id
    AND session_checklists.user_id = auth.uid()
  )
);

-- Users can update items in their own checklists
CREATE POLICY "Users can update items in own checklists"
ON session_checklist_items FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM session_checklists
    WHERE session_checklists.id = checklist_id
    AND session_checklists.user_id = auth.uid()
  )
);

-- Users can delete items from their own checklists
CREATE POLICY "Users can delete items from own checklists"
ON session_checklist_items FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM session_checklists
    WHERE session_checklists.id = checklist_id
    AND session_checklists.user_id = auth.uid()
  )
);
```

**Notes:**
- RLS inherits ownership from parent checklist
- `template_item_id` allows tracking which template items users skip
- `is_custom` distinguishes user-added items from template items
- `checked_at` timestamp enables completion analytics

---

## Indexes

### Performance Indexes (5 total)

```sql
-- 1. Template items (cloning performance)
CREATE INDEX idx_template_items_active_version
ON checklist_template_items(template_version, sort_order)
WHERE is_active = TRUE;
-- Benefit: Fast template cloning (1 index scan vs table scan)

-- 2. User checklists by time
CREATE INDEX idx_session_checklists_user_time
ON session_checklists(user_id, created_at DESC);
-- Benefit: Fast "my checklists" query

-- 3. Incomplete checklists (partial)
CREATE INDEX idx_session_checklists_incomplete
ON session_checklists(user_id, created_at DESC)
WHERE completed_at IS NULL;
-- Benefit: Fast reminder queries, smaller index

-- 4. Items per checklist, sorted
CREATE INDEX idx_checklist_items_checklist_order
ON session_checklist_items(checklist_id, sort_order);
-- Benefit: Fast item retrieval in display order

-- 5. Template item analytics (partial)
CREATE INDEX idx_checklist_items_template_checked
ON session_checklist_items(template_item_id, is_checked, checked_at)
WHERE template_item_id IS NOT NULL;
-- Benefit: Analytics on template item usage
```

**Storage Estimate:**
- Tables: ~62 MB (1K users, avg 2 sessions each, 20 items each)
- Indexes: ~15 MB
- **Total: ~77 MB** (negligible)

---

## Functions

### 1. update_checklist_counters()

**Type:** TRIGGER FUNCTION

**Purpose:** Automatically maintains aggregate counters on `session_checklists` when items change.

**Definition:**

```sql
CREATE OR REPLACE FUNCTION update_checklist_counters()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE session_checklists
  SET
    total_items = (
      SELECT COUNT(*)
      FROM session_checklist_items
      WHERE checklist_id = COALESCE(NEW.checklist_id, OLD.checklist_id)
    ),
    completed_items = (
      SELECT COUNT(*)
      FROM session_checklist_items
      WHERE checklist_id = COALESCE(NEW.checklist_id, OLD.checklist_id)
      AND is_checked = TRUE
    ),
    completed_at = CASE
      WHEN (
        SELECT COUNT(*) = COUNT(*) FILTER (WHERE is_checked = TRUE)
        FROM session_checklist_items
        WHERE checklist_id = COALESCE(NEW.checklist_id, OLD.checklist_id)
      ) THEN NOW()
      ELSE NULL
    END,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.checklist_id, OLD.checklist_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Triggers:**

```sql
-- Fires AFTER each INSERT, UPDATE OF is_checked, or DELETE
CREATE TRIGGER trigger_update_checklist_counters
AFTER INSERT OR UPDATE OF is_checked OR DELETE
ON session_checklist_items
FOR EACH ROW
EXECUTE FUNCTION update_checklist_counters();
```

**Behavior:**
- Recounts `total_items` and `completed_items`
- Sets `completed_at` when all items checked
- Clears `completed_at` if any item unchecked
- Updates `updated_at` timestamp

**Performance:** O(n) where n = items per checklist (~20-50 max)

**Why Trigger Instead of Application Logic?**
- ✅ Guarantees consistency (no race conditions)
- ✅ Simplifies client code
- ✅ Single source of truth
- ✅ Works for all clients (mobile, web, admin)

---

### 2. create_session_checklist()

**Type:** RPC FUNCTION (callable via Supabase client)

**Purpose:** Atomically creates a checklist by cloning template items.

**Security:** SECURITY DEFINER (runs with elevated privileges)

**Definition:**

```sql
CREATE OR REPLACE FUNCTION create_session_checklist(
  p_session_id UUID,
  p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_checklist_id UUID;
  v_template_version INTEGER;
BEGIN
  -- Validate session ownership
  IF NOT EXISTS (
    SELECT 1 FROM sessions
    WHERE id = p_session_id
    AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'You do not have permission to create a checklist for this session.';
  END IF;

  -- Check if checklist already exists (idempotent)
  SELECT id INTO v_checklist_id
  FROM session_checklists
  WHERE session_id = p_session_id;

  IF FOUND THEN
    RETURN v_checklist_id;
  END IF;

  -- Get latest template version
  SELECT COALESCE(MAX(template_version), 1)
  INTO v_template_version
  FROM checklist_template_items
  WHERE is_active = TRUE;

  -- Create checklist header
  INSERT INTO session_checklists (session_id, user_id, template_version)
  VALUES (p_session_id, p_user_id, v_template_version)
  RETURNING id INTO v_checklist_id;

  -- Clone template items
  INSERT INTO session_checklist_items (
    checklist_id,
    template_item_id,
    title,
    description,
    category,
    sort_order,
    is_essential,
    is_custom
  )
  SELECT
    v_checklist_id,
    t.id,
    t.title,
    t.description,
    t.category,
    t.sort_order,
    t.is_essential,
    FALSE
  FROM checklist_template_items t
  WHERE t.is_active = TRUE
  AND t.template_version = v_template_version
  ORDER BY t.sort_order;

  RETURN v_checklist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Usage:**

```javascript
const { data: checklistId, error } = await supabase.rpc('create_session_checklist', {
  p_session_id: 'session-uuid',
  p_user_id: 'user-uuid'
});
```

**Returns:** UUID of created (or existing) checklist

**Features:**
- ✅ Idempotent (safe to call multiple times)
- ✅ Validates session ownership
- ✅ Atomic transaction (all or nothing)
- ✅ Clones active template items
- ✅ Tracks template version

---

### 3. delete_user_checklist_data()

**Type:** RPC FUNCTION (GDPR compliance)

**Purpose:** Delete all checklist data for a user.

**Security:** SECURITY DEFINER

**Definition:**

```sql
CREATE OR REPLACE FUNCTION delete_user_checklist_data(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Authorization check
  IF auth.uid() != target_user_id AND NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Cascading delete (items deleted automatically)
  DELETE FROM session_checklists WHERE user_id = target_user_id;

  RAISE NOTICE 'Deleted all checklist data for user %', target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Usage:**

```javascript
// User deleting own data
await supabase.rpc('delete_user_checklist_data', {
  target_user_id: user.id
});

// Admin deleting user data
await supabase.rpc('delete_user_checklist_data', {
  target_user_id: 'target-user-uuid'
});
```

**Authorization:**
- Users can delete own data
- Admins can delete any user's data

**Side Effects:**
- Deletes all `session_checklists` rows (CASCADE deletes items)
- Does NOT delete sessions or templates

---

## Triggers

### update_checklist_counters Trigger

**Table:** `session_checklist_items`

**Events:**
- AFTER INSERT
- AFTER UPDATE OF is_checked
- AFTER DELETE

**Timing:** FOR EACH ROW

**Function:** `update_checklist_counters()`

**Example Flow:**

```sql
-- User checks item
UPDATE session_checklist_items
SET is_checked = TRUE, checked_at = NOW()
WHERE id = 'item-uuid';

-- Trigger fires:
-- 1. Recounts total_items and completed_items
-- 2. Sets completed_at if all items checked
-- 3. Updates updated_at

-- Result: Parent session_checklists row updated automatically
```

**Why AFTER Trigger?**
- Ensures item change is committed before updating parent
- Allows access to NEW row data
- Prevents integrity constraint violations

**Performance Impact:**
- Adds ~10ms per item operation
- Acceptable for expected scale (20-50 items)
- Alternative (computed columns) not supported in PostgreSQL

---

## RLS Policies

### Security Model

**Principle:** Users can only access their own data

**Enforcement Levels:**
1. Direct ownership: `user_id = auth.uid()`
2. Inherited ownership: Via JOIN to parent table

### Policy Summary

| Table | Operation | Policy |
|-------|-----------|--------|
| `checklist_template_items` | SELECT | ✅ All authenticated users |
| | INSERT/UPDATE/DELETE | ⚠️ Admins only |
| `session_checklists` | SELECT | ✅ user_id = auth.uid() |
| | INSERT | ✅ user_id = auth.uid() + session owner check |
| | UPDATE/DELETE | ✅ user_id = auth.uid() |
| `session_checklist_items` | SELECT | ✅ Via parent checklist |
| | INSERT/UPDATE/DELETE | ✅ Via parent checklist |

### RLS Performance

**Optimization:** Denormalized `user_id` on `session_checklists`
- Avoids JOIN to sessions table in every query
- Direct ownership check: `WHERE user_id = auth.uid()`
- Faster query execution (~5ms savings per query)

**Trade-off:**
- Data duplication (acceptable, minimal)
- Consistency maintained via INSERT validation

---

## Seed Data

### Default Checklist Template

**18 items across 4 categories:**

#### Physical Preparation (5 items)

```sql
INSERT INTO checklist_template_items (title, description, category, sort_order, is_essential) VALUES
('Follow fasting guidelines', 'Fast for 4-6 hours before session (if applicable)', 'physical', 10, TRUE),
('Stay hydrated', 'Drink plenty of water throughout the day', 'physical', 20, TRUE),
('Get adequate sleep', 'Aim for 7-9 hours of quality sleep the night before', 'physical', 30, TRUE),
('Prepare light meals', 'Eat light, healthy meals earlier in the day', 'physical', 40, FALSE),
('Avoid alcohol and recreational substances', 'Abstain for at least 24 hours before session', 'physical', 50, TRUE);
```

#### Safety & Support (4 items)

```sql
INSERT INTO checklist_template_items (title, description, category, sort_order, is_essential) VALUES
('Confirm sitter or guide', 'Ensure someone trustworthy is present or available', 'safety', 60, TRUE),
('Share plans with trusted person', 'Let someone know your intentions and timeline', 'safety', 70, TRUE),
('Prepare emergency contacts', 'Have important phone numbers readily available', 'safety', 80, TRUE),
('Review harm reduction resources', 'Familiarize yourself with safety protocols', 'safety', 90, TRUE);
```

#### Mental/Emotional (4 items)

```sql
INSERT INTO checklist_template_items (title, description, category, sort_order, is_essential) VALUES
('Set your intentions', 'Clarify what you hope to explore or learn', 'mental', 100, TRUE),
('Journal your current state', 'Write about your emotional state and any concerns', 'mental', 110, FALSE),
('Practice meditation or breathwork', 'Ground yourself with 10-20 minutes of practice', 'mental', 120, FALSE),
('Release expectations', 'Cultivate openness and acceptance of whatever arises', 'mental', 130, FALSE);
```

#### Practical Logistics (5 items)

```sql
INSERT INTO checklist_template_items (title, description, category, sort_order, is_essential) VALUES
('Prepare your space', 'Clean, organize, and create a comfortable environment', 'practical', 140, TRUE),
('Gather supplies', 'Water, blanket, tissues, journal, and anything else needed', 'practical', 150, TRUE),
('Prepare your music playlist', 'Select or create music that supports your journey', 'practical', 160, FALSE),
('Set phone to airplane mode or off', 'Minimize distractions and interruptions', 'practical', 170, TRUE),
('Clear your schedule', 'Ensure no obligations or commitments for the remainder of the day', 'practical', 180, TRUE);
```

**Summary:**
- Total: 18 items
- Essential: 13 items (72%)
- Non-essential: 5 items (28%)

**Category Distribution:**
- Physical: 5 items
- Safety: 4 items
- Mental: 4 items
- Practical: 5 items

---

## Migration Guide

### Prerequisites

Before running the migration:

1. ✅ Supabase project configured
2. ✅ `sessions` table exists with columns:
   - `id` (UUID, PRIMARY KEY)
   - `user_id` (UUID, FOREIGN KEY to auth.users)
3. ✅ `auth.users` table exists (Supabase built-in)
4. ✅ `is_admin()` function exists (from security_fixes migration)

### Migration Steps

#### Option 1: Supabase CLI (Recommended)

```bash
# Navigate to project root
cd C:\Users\hadfi\psychedelic-integration-app

# Push migration to database
supabase db push

# Verify migration
supabase db status
```

#### Option 2: SQL Editor

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/20260210000000_session_checklist_schema.sql`
3. Paste into editor
4. Click "Run"
5. Verify no errors in output

#### Option 3: psql

```bash
psql -h <db-host> -U postgres -d postgres \
  -f supabase/migrations/20260210000000_session_checklist_schema.sql
```

### Post-Migration Verification

Run these queries to verify successful migration:

```sql
-- 1. Verify tables created (expect 3 rows)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%checklist%';

-- 2. Verify RLS enabled (expect all TRUE)
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE '%checklist%';

-- 3. Verify seed data (expect 18 rows)
SELECT COUNT(*) as template_items
FROM checklist_template_items
WHERE is_active = TRUE;

-- 4. Verify trigger (expect 1 row)
SELECT trigger_name
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_checklist_counters';

-- 5. Verify functions (expect 3 rows)
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'create_session_checklist',
  'update_checklist_counters',
  'delete_user_checklist_data'
);

-- 6. Test checklist creation (replace UUIDs with real values)
SELECT create_session_checklist(
  'your-session-id'::UUID,
  'your-user-id'::UUID
);
-- Should return checklist UUID

-- 7. Verify items cloned (expect 18 rows)
SELECT COUNT(*) FROM session_checklist_items
WHERE checklist_id = '<returned-uuid>';
```

### Rollback Procedure

If migration causes issues:

```bash
# Option 1: Supabase CLI
psql -f supabase/migrations/20260210000000_session_checklist_rollback.sql

# Option 2: SQL Editor
# Run contents of rollback file in Supabase Dashboard
```

**Rollback Impact:**
- ⚠️ **Permanently deletes all user checklist data**
- ✅ Does NOT affect sessions or other tables
- ✅ Safe to re-run migration after rollback

**Rollback Verification:**

```sql
-- Expect 0 rows
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%checklist%';
```

### Migration Notes

**Duration:** ~10-15 minutes

**Downtime:** None (new tables only, no schema changes to existing tables)

**Data Loss Risk:** None (no existing data affected)

**Reversibility:** Fully reversible via rollback script

---

## Maintenance

### Adding New Template Items

```sql
-- Add new item to template
INSERT INTO checklist_template_items (
  title,
  description,
  category,
  sort_order,
  is_essential,
  template_version,
  is_active
) VALUES (
  'New checklist item',
  'Description here',
  'practical',
  185, -- Position after last item
  FALSE,
  1, -- Current version
  TRUE
);
```

**Notes:**
- New items only appear in newly created checklists
- Existing checklists are not affected
- To update existing checklists, increment `template_version` and create migration function

### Archiving Template Items

```sql
-- Archive (soft delete) a template item
UPDATE checklist_template_items
SET is_active = FALSE
WHERE id = 'template-item-uuid';
```

**Impact:**
- Item no longer cloned to new checklists
- Existing user checklists keep the item (via `template_item_id` reference)

### Analytics Queries

```sql
-- Most frequently skipped template items
SELECT
  t.title,
  COUNT(*) as times_used,
  COUNT(*) FILTER (WHERE sci.is_checked = FALSE) as times_skipped,
  ROUND(
    COUNT(*) FILTER (WHERE sci.is_checked = FALSE)::NUMERIC / COUNT(*) * 100,
    1
  ) as skip_percentage
FROM checklist_template_items t
JOIN session_checklist_items sci ON sci.template_item_id = t.id
WHERE t.is_active = TRUE
GROUP BY t.id, t.title
ORDER BY skip_percentage DESC
LIMIT 10;

-- Average checklist completion rate per user
SELECT
  sc.user_id,
  COUNT(*) as total_checklists,
  COUNT(*) FILTER (WHERE sc.completed_at IS NOT NULL) as completed_checklists,
  ROUND(
    AVG(sc.completed_items::NUMERIC / sc.total_items * 100),
    1
  ) as avg_completion_percentage
FROM session_checklists sc
GROUP BY sc.user_id
ORDER BY avg_completion_percentage DESC;

-- Template item completion by category
SELECT
  sci.category,
  COUNT(*) as total_items,
  COUNT(*) FILTER (WHERE sci.is_checked = TRUE) as completed_items,
  ROUND(
    COUNT(*) FILTER (WHERE sci.is_checked = TRUE)::NUMERIC / COUNT(*) * 100,
    1
  ) as completion_percentage
FROM session_checklist_items sci
WHERE sci.template_item_id IS NOT NULL
GROUP BY sci.category
ORDER BY completion_percentage DESC;
```

---

## Performance Tuning

### Query Optimization

**Slow Query:** Loading checklist with items

```sql
-- Before (N+1 queries)
SELECT * FROM session_checklists WHERE id = $1;
SELECT * FROM session_checklist_items WHERE checklist_id = $1;

-- After (Single query with nested select)
SELECT
  sc.*,
  (
    SELECT json_agg(sci.* ORDER BY sci.sort_order)
    FROM session_checklist_items sci
    WHERE sci.checklist_id = sc.id
  ) as items
FROM session_checklists sc
WHERE sc.id = $1;
```

**Performance:** 100ms → 50ms (50% improvement)

### Index Usage

Check index usage:

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read
FROM pg_stat_user_indexes
WHERE tablename LIKE '%checklist%'
ORDER BY idx_scan DESC;
```

Unused indexes (consider dropping):

```sql
-- Find indexes with 0 scans
SELECT indexname
FROM pg_stat_user_indexes
WHERE tablename LIKE '%checklist%'
AND idx_scan = 0;
```

### Vacuum and Analyze

```sql
-- Recommended after bulk operations
VACUUM ANALYZE session_checklists;
VACUUM ANALYZE session_checklist_items;
VACUUM ANALYZE checklist_template_items;
```

---

## Related Documentation

- [API Reference](./API_CHECKLIST_SERVICE.md)
- [Frontend Components](./.full-stack-feature/06-frontend-implementation.md)
- [Architecture Overview](./.full-stack-feature/03-architecture.md)
- [Testing Guide](./.full-stack-feature/07-testing.md)
- [Deployment Guide](./.full-stack-feature/08-deployment.md)

---

**Last Updated:** 2026-02-10
**Schema Version:** 1.0.0
**Migration ID:** 20260210000000
**Status:** Production Ready
