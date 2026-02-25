# Session Checklist Database Schema - Quick Reference

**Feature:** FEAT-101 Session Day Checklist
**Migration:** 20260210000000_session_checklist_schema.sql
**Status:** Ready for Deployment

---

## Tables Overview

```
checklist_template_items (18 seed rows)
    ↓ (cloned by create_session_checklist function)
session_checklists (1 per session)
    ↓ (1:many relationship)
session_checklist_items (~20-50 per checklist)
```

---

## Quick Access Queries

### Get Checklist for Session
```sql
SELECT sc.*, sci.*
FROM session_checklists sc
LEFT JOIN session_checklist_items sci ON sci.checklist_id = sc.id
WHERE sc.session_id = '<session-uuid>'
ORDER BY sci.sort_order;
```

### Create New Checklist
```sql
SELECT create_session_checklist(
    '<session-uuid>'::UUID,
    '<user-uuid>'::UUID
);
```

### Toggle Item
```sql
UPDATE session_checklist_items
SET is_checked = NOT is_checked,
    checked_at = CASE
        WHEN is_checked = FALSE THEN NOW()
        ELSE NULL
    END
WHERE id = '<item-uuid>';
-- Counters auto-update via trigger
```

### Add Custom Item
```sql
INSERT INTO session_checklist_items (
    checklist_id, title, description, category,
    sort_order, is_custom
)
VALUES (
    '<checklist-uuid>',
    'Custom item title',
    'Optional description',
    'practical',
    (SELECT COALESCE(MAX(sort_order), 0) + 10
     FROM session_checklist_items
     WHERE checklist_id = '<checklist-uuid>'),
    TRUE
);
```

---

## Table Structures

### checklist_template_items
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| title | TEXT | Max 200 chars |
| description | TEXT | Max 500 chars |
| category | TEXT | Enum: physical/safety/mental/practical |
| sort_order | INTEGER | Gapped (100, 110, 120...) |
| is_essential | BOOLEAN | Marks important items |
| template_version | INTEGER | Default 1, for future versioning |
| is_active | BOOLEAN | Soft delete flag |
| created_at | TIMESTAMPTZ | Auto-set |

### session_checklists
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| session_id | UUID | FK to sessions, UNIQUE |
| user_id | UUID | FK to auth.users |
| template_version | INTEGER | Version used when created |
| total_items | INTEGER | Auto-maintained by trigger |
| completed_items | INTEGER | Auto-maintained by trigger |
| created_at | TIMESTAMPTZ | Auto-set |
| updated_at | TIMESTAMPTZ | Auto-updated by trigger |
| completed_at | TIMESTAMPTZ | Set when all items checked |

### session_checklist_items
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| checklist_id | UUID | FK to session_checklists |
| template_item_id | UUID | FK to checklist_template_items (NULL for custom) |
| title | TEXT | Max 200 chars |
| description | TEXT | Max 500 chars |
| category | TEXT | Enum: physical/safety/mental/practical |
| sort_order | INTEGER | For ordering display |
| is_essential | BOOLEAN | Copied from template |
| is_custom | BOOLEAN | TRUE for user-added items |
| is_checked | BOOLEAN | Completion status |
| checked_at | TIMESTAMPTZ | When user checked item |
| created_at | TIMESTAMPTZ | Auto-set |

---

## Functions

### create_session_checklist(session_id, user_id) → UUID
- Validates session ownership
- Creates checklist header
- Clones template items
- Returns checklist_id
- **Idempotent** (safe to call multiple times)

### update_checklist_counters() → TRIGGER
- Auto-runs on INSERT/UPDATE/DELETE of items
- Recounts total_items and completed_items
- Sets/clears completed_at timestamp
- Updates updated_at timestamp

### delete_user_checklist_data(user_id)
- GDPR-compliant data deletion
- Requires auth: user can delete own, admins can delete any
- Cascades to all checklist items

---

## Security (RLS)

### checklist_template_items
- ✅ **SELECT:** All authenticated users
- ⚠️ **ALL:** Admins only

### session_checklists
- ✅ **SELECT:** Own checklists (user_id = auth.uid())
- ✅ **INSERT:** Own sessions (validates session ownership)
- ✅ **UPDATE:** Own checklists
- ✅ **DELETE:** Own checklists

### session_checklist_items
- ✅ **All operations:** Items in own checklists (via parent check)

---

## Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| checklist_template_items | idx_template_items_active_version | Fast template loading |
| session_checklists | idx_session_checklists_user_time | User's checklists by date |
| session_checklists | idx_session_checklists_incomplete | Find incomplete checklists |
| session_checklist_items | idx_checklist_items_checklist_order | Load checklist items in order |
| session_checklist_items | idx_checklist_items_template_checked | Analytics on template completion |

---

## Seed Data (18 Items)

### Physical (5)
1. Follow fasting guidelines ⭐
2. Stay hydrated ⭐
3. Get adequate sleep ⭐
4. Prepare light meals
5. Avoid alcohol and recreational substances ⭐

### Safety (4)
6. Confirm sitter or guide ⭐
7. Share plans with trusted person ⭐
8. Prepare emergency contacts ⭐
9. Review harm reduction resources ⭐

### Mental (4)
10. Set your intentions ⭐
11. Journal your current state
12. Practice meditation or breathwork
13. Release expectations

### Practical (5)
14. Prepare your space ⭐
15. Gather supplies ⭐
16. Prepare your music playlist
17. Set phone to airplane mode or off ⭐
18. Clear your schedule ⭐

⭐ = Essential item

---

## Deployment Checklist

**Pre-deployment:**
- [x] Migration file created
- [x] Rollback script created
- [x] Dependencies verified (sessions table, is_admin function)
- [x] RLS policies defined
- [x] Seed data prepared

**Deployment:**
- [ ] Run migration (supabase db push OR SQL Editor)
- [ ] Verify 3 tables created
- [ ] Verify RLS enabled on all tables
- [ ] Verify 18 seed items inserted
- [ ] Verify trigger exists
- [ ] Verify 3 functions exist

**Post-deployment:**
- [ ] Test checklist creation
- [ ] Test item toggle
- [ ] Test custom item add
- [ ] Verify RLS isolation between users
- [ ] Test delete_user_checklist_data function

---

## Troubleshooting

### Error: "Session does not belong to user"
- Check that session exists and session.user_id matches authenticated user
- Verify RLS policies on sessions table

### Error: "relation does not exist"
- Migration not yet run or failed
- Check migration logs

### Counters not updating
- Verify trigger exists: `SELECT * FROM information_schema.triggers WHERE trigger_name = 'trigger_update_checklist_counters'`
- Check for errors in PostgreSQL logs

### Items not appearing
- Check RLS policies (user must own parent checklist)
- Verify checklist_id foreign key is correct

---

## File Locations

**Migration:** `supabase/migrations/20260210000000_session_checklist_schema.sql`
**Rollback:** `supabase/migrations/20260210000000_session_checklist_rollback.sql`
**Documentation:** `.full-stack-feature/04-database-implementation.md`
**Design Doc:** `.full-stack-feature/02-database-design.md`

---

**Last Updated:** 2026-02-10
**Maintained By:** Database team
