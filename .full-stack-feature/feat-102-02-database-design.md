# Database Design: FEAT-102 - AI Guidance in Set Your Intention Screen

**Feature ID:** FEAT-102
**Database:** Supabase (PostgreSQL 15+)
**Version:** 1.0
**Date:** 2026-02-10
**Status:** Design Phase

---

## Table of Contents

1. [Overview](#overview)
2. [Entity Relationship Design](#entity-relationship-design)
3. [Schema Definitions](#schema-definitions)
4. [Indexing Strategy](#indexing-strategy)
5. [Row Level Security (RLS)](#row-level-security-rls)
6. [Migration Strategy](#migration-strategy)
7. [Query Patterns](#query-patterns)
8. [Data Access Patterns](#data-access-patterns)
9. [Special Considerations](#special-considerations)
10. [Appendix](#appendix)

---

## Overview

### Purpose

This schema supports the AI-powered intention guidance feature for psychedelic session preparation. It enables users to:
- Receive personalized AI guidance when formulating intentions
- Optionally save intentions to their session
- Browse curated example intentions across different frameworks
- Store privacy preferences for intention data

### Privacy-First Design

**Critical Principles:**
- **Opt-in storage**: Intentions are NOT saved by default
- **User control**: Users can view, edit, delete anytime
- **Encryption at rest**: Sensitive fields marked for encryption
- **No analytics**: Intention content is never analyzed or shared
- **Soft deletes**: 30-day recovery window

### Tables Overview

| Table | Purpose | Row Count | Retention |
|-------|---------|-----------|-----------|
| `intention_templates` | Curated example intentions (app-wide) | ~100 | Permanent |
| `session_intentions` | User's saved intentions (opt-in) | ~5K/year | User-controlled |
| `user_intention_preferences` | Privacy settings, favorite frameworks | ~1K | Permanent |

---

## Entity Relationship Design

### Entity Relationships

```
┌─────────────────────┐
│  auth.users         │
│  (Supabase Auth)    │
└──────────┬──────────┘
           │
           │ 1:1
           │
┌──────────▼────────────────────┐
│ user_intention_preferences    │
│ - save_by_default: boolean    │
│ - favorite_frameworks: []     │
│ - offline_cache_enabled       │
└───────────────────────────────┘
           │
           │ 1:N
           │
┌──────────▼────────────────────┐          ┌─────────────────────┐
│    sessions (existing)        │          │ intention_templates │
│    - id (UUID)                │          │ - framework         │
│    - user_id                  │          │ - session_type      │
│    - title                    │          │ - example_text      │
│    - date                     │◄─────────┤ (read-only)         │
└──────────┬────────────────────┘  N:M     └─────────────────────┘
           │                        (via
           │ 1:N                    metadata)
           │
┌──────────▼────────────────────┐
│   session_intentions          │
│   - intention_text (encrypted)│
│   - session_type              │
│   - framework                 │
│   - is_deleted (soft delete)  │
│   - ai_conversation_context   │
└───────────────────────────────┘
```

### Cardinality

- **users → user_intention_preferences**: 1:1 (one user has one preferences record)
- **users → sessions**: 1:N (one user has many sessions)
- **sessions → session_intentions**: 1:N (one session can have multiple intentions, but typically 1-3)
- **intention_templates → sessions**: N:M (templates inspire many sessions; sessions reference many templates via metadata)

### Key Relationships

1. **session_intentions.user_id** → `auth.users.id` (CASCADE delete)
2. **session_intentions.session_id** → `sessions.id` (CASCADE delete)
3. **user_intention_preferences.user_id** → `auth.users.id` (CASCADE delete)

---

## Schema Definitions

### Table 1: intention_templates

**Purpose:** Curated, app-wide example intentions across frameworks and session types.

**Access:** Read-only for users, admin-only for write.

**Encryption:** Not needed (public content).

```sql
CREATE TABLE IF NOT EXISTS public.intention_templates (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Content
    title TEXT NOT NULL,
    intention_text TEXT NOT NULL,
    description TEXT,

    -- Categorization
    framework TEXT NOT NULL,
    session_type TEXT NOT NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Display
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,

    -- Metadata
    example_use_case TEXT,
    therapeutic_notes TEXT,
    source TEXT, -- Attribution (e.g., "Adapted from IFS therapy")

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version INTEGER NOT NULL DEFAULT 1,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT intention_template_title_length CHECK (char_length(title) <= 200),
    CONSTRAINT intention_template_text_length CHECK (char_length(intention_text) <= 1000),
    CONSTRAINT intention_template_desc_length CHECK (char_length(description) <= 500),
    CONSTRAINT intention_template_valid_framework CHECK (
        framework IN (
            'ifs',           -- Internal Family Systems
            'somatic',       -- Somatic/body-based
            'existential',   -- Existential/meaning-making
            'healing',       -- Trauma healing
            'exploration',   -- Open exploration
            'creativity',    -- Creative unblocking
            'spiritual',     -- Spiritual connection
            'integration'    -- Post-session integration
        )
    ),
    CONSTRAINT intention_template_valid_session_type CHECK (
        session_type IN (
            'healing',
            'exploration',
            'creativity',
            'spiritual',
            'integration',
            'general'
        )
    ),
    CONSTRAINT intention_template_positive_sort CHECK (sort_order >= 0),
    CONSTRAINT intention_template_positive_version CHECK (version >= 1)
);

COMMENT ON TABLE public.intention_templates
    IS 'Curated example intentions for user inspiration. Admin-managed, user-readable.';

COMMENT ON COLUMN public.intention_templates.framework
    IS 'Philosophical/therapeutic framework: ifs, somatic, existential, healing, etc.';

COMMENT ON COLUMN public.intention_templates.session_type
    IS 'Type of session this intention is suited for: healing, exploration, creativity, etc.';

COMMENT ON COLUMN public.intention_templates.is_featured
    IS 'Whether to highlight this intention in UI (e.g., homepage carousel).';

COMMENT ON COLUMN public.intention_templates.therapeutic_notes
    IS 'Internal notes for therapists/admins about this intention (not shown to users).';
```

#### Example Rows

```json
{
  "id": "t1t1t1t1-...",
  "title": "Approaching Inner Critic with Compassion",
  "intention_text": "I intend to meet my inner critic with curiosity and compassion, understanding it as a protective part rather than an enemy.",
  "description": "For working with harsh self-judgment using IFS framework",
  "framework": "ifs",
  "session_type": "healing",
  "tags": ["inner_critic", "self_compassion", "parts_work"],
  "sort_order": 10,
  "is_featured": true,
  "example_use_case": "When struggling with self-judgment or harsh internal dialogue",
  "therapeutic_notes": "Emphasizes IFS principle of 'no bad parts'",
  "source": "Adapted from IFS therapy",
  "is_active": true,
  "version": 1
}
```

---

### Table 2: session_intentions

**Purpose:** User's saved intentions for specific sessions (opt-in storage only).

**Access:** User-only (strict RLS).

**Encryption:** `intention_text`, `ai_conversation_context` (encrypted at rest via Supabase encryption).

```sql
CREATE TABLE IF NOT EXISTS public.session_intentions (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign Keys
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,

    -- Core Content (ENCRYPTED AT REST)
    intention_text TEXT NOT NULL,

    -- Categorization
    framework TEXT,
    session_type TEXT NOT NULL,

    -- AI Metadata (ENCRYPTED AT REST)
    ai_conversation_context JSONB DEFAULT '{}'::JSONB,

    -- User Metadata
    user_rating INTEGER, -- 1-5 stars (how helpful was this intention?)
    user_notes TEXT,

    -- Derived Insights (optional, generated by AI)
    intention_summary TEXT, -- Short AI-generated summary
    key_themes TEXT[], -- Extracted themes

    -- References
    inspired_by_template_id UUID REFERENCES public.intention_templates(id) ON DELETE SET NULL,

    -- Soft Delete
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT session_intentions_text_length CHECK (char_length(intention_text) <= 2000),
    CONSTRAINT session_intentions_summary_length CHECK (char_length(intention_summary) <= 500),
    CONSTRAINT session_intentions_notes_length CHECK (char_length(user_notes) <= 1000),
    CONSTRAINT session_intentions_valid_framework CHECK (
        framework IS NULL OR framework IN (
            'ifs', 'somatic', 'existential', 'healing',
            'exploration', 'creativity', 'spiritual', 'integration'
        )
    ),
    CONSTRAINT session_intentions_valid_session_type CHECK (
        session_type IN (
            'healing', 'exploration', 'creativity',
            'spiritual', 'integration', 'general'
        )
    ),
    CONSTRAINT session_intentions_valid_rating CHECK (
        user_rating IS NULL OR (user_rating >= 1 AND user_rating <= 5)
    ),
    CONSTRAINT session_intentions_deleted_at_requires_flag CHECK (
        (is_deleted = FALSE AND deleted_at IS NULL) OR
        (is_deleted = TRUE AND deleted_at IS NOT NULL)
    )
);

COMMENT ON TABLE public.session_intentions
    IS 'User-saved intentions for sessions. Opt-in storage, encrypted, user-only access.';

COMMENT ON COLUMN public.session_intentions.intention_text
    IS 'ENCRYPTED. The user''s intention text. Max 2000 chars.';

COMMENT ON COLUMN public.session_intentions.ai_conversation_context
    IS 'ENCRYPTED. Stores metadata about AI conversation (not full transcript). Example: {"prompt_count": 3, "frameworks_explored": ["ifs", "somatic"], "session_duration_seconds": 180}';

COMMENT ON COLUMN public.session_intentions.is_deleted
    IS 'Soft delete flag. Allows 30-day recovery window.';

COMMENT ON COLUMN public.session_intentions.user_rating
    IS 'Optional: User rates how helpful this intention was (1-5 stars) after session.';

COMMENT ON COLUMN public.session_intentions.key_themes
    IS 'Optional: AI-extracted themes (e.g., ["grief", "acceptance", "connection"]). Not PII, used for insights.';
```

#### Example Row

```json
{
  "id": "i1i1i1i1-...",
  "user_id": "u1u1u1u1-...",
  "session_id": "s1s1s1s1-...",
  "intention_text": "[ENCRYPTED] I intend to explore my relationship with my father with compassion and openness.",
  "framework": "ifs",
  "session_type": "healing",
  "ai_conversation_context": {
    "prompt_count": 4,
    "frameworks_explored": ["ifs", "somatic"],
    "session_duration_seconds": 240,
    "guidance_type": "reflective_prompts"
  },
  "user_rating": 5,
  "user_notes": "This felt really aligned. Helped me stay grounded.",
  "intention_summary": "Exploring father relationship with compassion (IFS)",
  "key_themes": ["family", "compassion", "exploration"],
  "inspired_by_template_id": "t1t1t1t1-...",
  "is_deleted": false,
  "deleted_at": null,
  "created_at": "2026-02-10T10:30:00Z",
  "updated_at": "2026-02-10T10:30:00Z"
}
```

---

### Table 3: user_intention_preferences

**Purpose:** User privacy settings and preferences for intention guidance.

**Access:** User-only (strict RLS).

**Encryption:** Not needed (non-sensitive settings).

```sql
CREATE TABLE IF NOT EXISTS public.user_intention_preferences (
    -- Primary Key (1:1 with user)
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Privacy Preferences
    save_by_default BOOLEAN NOT NULL DEFAULT FALSE,
    auto_delete_after_days INTEGER,

    -- Feature Preferences
    favorite_frameworks TEXT[] DEFAULT ARRAY[]::TEXT[],
    preferred_session_types TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- AI Preferences
    guidance_style TEXT NOT NULL DEFAULT 'balanced',
    show_examples BOOLEAN NOT NULL DEFAULT TRUE,
    enable_ai_suggestions BOOLEAN NOT NULL DEFAULT TRUE,

    -- Offline Mode
    offline_cache_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    cached_template_ids UUID[] DEFAULT ARRAY[]::UUID[],

    -- Onboarding
    has_completed_onboarding BOOLEAN NOT NULL DEFAULT FALSE,
    onboarding_completed_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT user_intention_prefs_valid_auto_delete CHECK (
        auto_delete_after_days IS NULL OR
        (auto_delete_after_days >= 7 AND auto_delete_after_days <= 365)
    ),
    CONSTRAINT user_intention_prefs_valid_guidance_style CHECK (
        guidance_style IN ('brief', 'balanced', 'detailed')
    ),
    CONSTRAINT user_intention_prefs_onboarding_consistency CHECK (
        (has_completed_onboarding = FALSE AND onboarding_completed_at IS NULL) OR
        (has_completed_onboarding = TRUE AND onboarding_completed_at IS NOT NULL)
    )
);

COMMENT ON TABLE public.user_intention_preferences
    IS 'User preferences for intention guidance feature. One row per user.';

COMMENT ON COLUMN public.user_intention_preferences.save_by_default
    IS 'If TRUE, intentions are saved to database by default (opt-out). If FALSE (default), user must opt-in.';

COMMENT ON COLUMN public.user_intention_preferences.auto_delete_after_days
    IS 'If set, automatically soft-delete intentions older than N days (7-365 range).';

COMMENT ON COLUMN public.user_intention_preferences.guidance_style
    IS 'AI verbosity preference: brief (concise), balanced (default), detailed (thorough).';

COMMENT ON COLUMN public.user_intention_preferences.cached_template_ids
    IS 'Template IDs cached for offline use (max 20).';
```

#### Example Row

```json
{
  "user_id": "u1u1u1u1-...",
  "save_by_default": false,
  "auto_delete_after_days": 90,
  "favorite_frameworks": ["ifs", "somatic"],
  "preferred_session_types": ["healing", "exploration"],
  "guidance_style": "balanced",
  "show_examples": true,
  "enable_ai_suggestions": true,
  "offline_cache_enabled": true,
  "cached_template_ids": ["t1t1t1t1-...", "t2t2t2t2-..."],
  "has_completed_onboarding": true,
  "onboarding_completed_at": "2026-02-10T09:00:00Z",
  "created_at": "2026-02-10T09:00:00Z",
  "updated_at": "2026-02-10T10:00:00Z"
}
```

---

## Indexing Strategy

### Performance Goals

| Query Type | Target (ms) | Strategy |
|------------|-------------|----------|
| Get user's intentions | <50ms | Index on `user_id, created_at` |
| Get session's intentions | <20ms | Index on `session_id` |
| Browse templates by framework | <30ms | Index on `framework, session_type` |
| Search templates | <100ms | GIN index on `tags` |
| Get active templates | <20ms | Partial index on `is_active = TRUE` |

### Indexes by Table

#### intention_templates

```sql
-- Active templates by framework and session type (most common query)
CREATE INDEX idx_intention_templates_active_framework_type
    ON public.intention_templates(framework, session_type, sort_order)
    WHERE is_active = TRUE;

-- Featured templates (homepage)
CREATE INDEX idx_intention_templates_featured
    ON public.intention_templates(sort_order)
    WHERE is_active = TRUE AND is_featured = TRUE;

-- Full-text search on tags (for filtering)
CREATE INDEX idx_intention_templates_tags
    ON public.intention_templates USING GIN(tags);

-- Admin management (version history)
CREATE INDEX idx_intention_templates_version_time
    ON public.intention_templates(version, updated_at DESC);
```

**Rationale:**
- `idx_intention_templates_active_framework_type`: Covers 90% of user queries (browsing by framework/type)
- `idx_intention_templates_featured`: Fast homepage/carousel queries
- `idx_intention_templates_tags`: Enables flexible filtering (e.g., "show me all 'grief' intentions")
- Partial indexes reduce size by 50%+ (only index active templates)

#### session_intentions

```sql
-- User's intentions by recency (most common query)
CREATE INDEX idx_session_intentions_user_time
    ON public.session_intentions(user_id, created_at DESC)
    WHERE is_deleted = FALSE;

-- Session's intentions
CREATE INDEX idx_session_intentions_session
    ON public.session_intentions(session_id, created_at)
    WHERE is_deleted = FALSE;

-- Soft-deleted intentions (for recovery)
CREATE INDEX idx_session_intentions_deleted
    ON public.session_intentions(user_id, deleted_at DESC)
    WHERE is_deleted = TRUE AND deleted_at > NOW() - INTERVAL '30 days';

-- Inspired-by tracking (analytics, optional)
CREATE INDEX idx_session_intentions_template
    ON public.session_intentions(inspired_by_template_id)
    WHERE inspired_by_template_id IS NOT NULL AND is_deleted = FALSE;

-- AI metadata searches (optional, if needed)
CREATE INDEX idx_session_intentions_ai_context
    ON public.session_intentions USING GIN(ai_conversation_context);
```

**Rationale:**
- `idx_session_intentions_user_time`: Primary user query (load dashboard)
- `idx_session_intentions_session`: Fast session detail page
- `idx_session_intentions_deleted`: Enables 30-day recovery without scanning all rows
- `idx_session_intentions_ai_context`: Optional, only if admins query AI metadata (can skip for V1)

#### user_intention_preferences

```sql
-- Primary key index (automatic on user_id)
-- No additional indexes needed (1:1 with user, always query by user_id)
```

**Rationale:**
- Table is small (~1K rows)
- Always queried by `user_id` (primary key)
- No need for additional indexes

### Index Maintenance

```sql
-- Check index usage (quarterly)
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename LIKE '%intention%'
ORDER BY idx_scan ASC;

-- Drop unused indexes
DROP INDEX CONCURRENTLY idx_name_if_unused;

-- Rebuild indexes (annually)
REINDEX TABLE CONCURRENTLY public.session_intentions;
```

---

## Row Level Security (RLS)

### Security Principles

1. **intention_templates**: Read-only for authenticated users, admin-only for write
2. **session_intentions**: Strict user isolation (users can only access their own)
3. **user_intention_preferences**: Strict user isolation (1:1 with user)

### RLS Policies by Table

#### intention_templates

```sql
-- Enable RLS
ALTER TABLE public.intention_templates ENABLE ROW LEVEL SECURITY;

-- Policy 1: Authenticated users can read active templates
CREATE POLICY "Authenticated users can read active intention templates"
    ON public.intention_templates
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL
        AND is_active = TRUE
    );

-- Policy 2: Admins can manage all templates
CREATE POLICY "Admins can manage intention templates"
    ON public.intention_templates
    FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
```

**Testing:**
```sql
-- As regular user (should see only active templates)
SELECT COUNT(*) FROM intention_templates; -- Should see only active

-- As admin (should see all)
SELECT COUNT(*) FROM intention_templates; -- Should see all including inactive
```

#### session_intentions

```sql
-- Enable RLS
ALTER TABLE public.session_intentions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own intentions (excluding deleted)
CREATE POLICY "Users can view own intentions"
    ON public.session_intentions
    FOR SELECT
    USING (
        auth.uid() = user_id
        AND is_deleted = FALSE
    );

-- Policy 2: Users can view their own deleted intentions (recovery)
CREATE POLICY "Users can view own deleted intentions"
    ON public.session_intentions
    FOR SELECT
    USING (
        auth.uid() = user_id
        AND is_deleted = TRUE
        AND deleted_at > NOW() - INTERVAL '30 days'
    );

-- Policy 3: Users can insert their own intentions
CREATE POLICY "Users can insert own intentions"
    ON public.session_intentions
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND session_id IN (
            SELECT id FROM public.sessions WHERE user_id = auth.uid()
        )
    );

-- Policy 4: Users can update their own intentions
CREATE POLICY "Users can update own intentions"
    ON public.session_intentions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id
        AND session_id IN (
            SELECT id FROM public.sessions WHERE user_id = auth.uid()
        )
    );

-- Policy 5: Users can soft-delete their own intentions
CREATE POLICY "Users can soft-delete own intentions"
    ON public.session_intentions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id
        AND is_deleted = TRUE
    );

-- Policy 6: Admins can view all intentions (for support)
CREATE POLICY "Admins can view all intentions"
    ON public.session_intentions
    FOR SELECT
    USING (public.is_admin());
```

**Testing:**
```sql
-- As user A
SELECT COUNT(*) FROM session_intentions; -- Should see only user A's intentions

-- Try to access user B's intention
SELECT * FROM session_intentions WHERE id = 'user-b-intention-id'; -- Should return nothing

-- Try to insert intention for user B
INSERT INTO session_intentions (user_id, session_id, intention_text, session_type)
VALUES ('user-b-id', 'session-id', 'text', 'healing'); -- Should fail
```

#### user_intention_preferences

```sql
-- Enable RLS
ALTER TABLE public.user_intention_preferences ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own preferences
CREATE POLICY "Users can view own intention preferences"
    ON public.user_intention_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own preferences
CREATE POLICY "Users can insert own intention preferences"
    ON public.user_intention_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own preferences
CREATE POLICY "Users can update own intention preferences"
    ON public.user_intention_preferences
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy 4: Admins can view all preferences (for support)
CREATE POLICY "Admins can view all intention preferences"
    ON public.user_intention_preferences
    FOR SELECT
    USING (public.is_admin());
```

### Helper Functions (Already Exist)

```sql
-- Check if current user is admin (already implemented in system)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Migration Strategy

### Pre-Migration Checklist

- [ ] Verify `sessions` table exists
- [ ] Verify `auth.users` table exists
- [ ] Verify `is_admin()` function exists
- [ ] Backup database
- [ ] Test migration in staging environment

### Migration Steps

**Step 1: Create Tables (Safe, No Data Impact)**

```sql
BEGIN;

-- Create intention_templates table
CREATE TABLE IF NOT EXISTS public.intention_templates (...);
-- [Full SQL from schema above]

-- Create session_intentions table
CREATE TABLE IF NOT EXISTS public.session_intentions (...);

-- Create user_intention_preferences table
CREATE TABLE IF NOT EXISTS public.user_intention_preferences (...);

COMMIT;
```

**Step 2: Create Indexes (Safe, No Data Impact)**

```sql
-- Create all indexes (can run concurrently)
CREATE INDEX CONCURRENTLY idx_intention_templates_active_framework_type
    ON public.intention_templates(...);

-- [All other indexes from indexing section]
```

**Step 3: Enable RLS (Safe, No Data Impact)**

```sql
BEGIN;

-- Enable RLS on all tables
ALTER TABLE public.intention_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_intentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_intention_preferences ENABLE ROW LEVEL SECURITY;

-- Create all RLS policies
-- [All policies from RLS section]

COMMIT;
```

**Step 4: Seed intention_templates (Optional, Safe)**

```sql
BEGIN;

-- Insert curated example intentions
-- [See Appendix A for seed data]

COMMIT;
```

### Rollback Plan

**If issues arise, rollback in reverse order:**

```sql
BEGIN;

-- Step 1: Drop tables (CASCADE removes dependencies)
DROP TABLE IF EXISTS public.user_intention_preferences CASCADE;
DROP TABLE IF EXISTS public.session_intentions CASCADE;
DROP TABLE IF EXISTS public.intention_templates CASCADE;

-- Step 2: Drop indexes (automatic with table drop)
-- (No action needed if tables dropped)

COMMIT;
```

**Rollback file:** See `supabase/migrations/20260210000001_feat_102_intentions_rollback.sql`

### Data Migration

**Not needed for V1** - These are new tables with no existing data.

**Future:** If we later rename/refactor:
- Use `ALTER TABLE` for schema changes
- Use `UPDATE` queries for data transformations
- Always test with sample data first

### Post-Migration Verification

```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%intention%';

-- Verify indexes exist
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename LIKE '%intention%';

-- Verify RLS enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE '%intention%';

-- Verify policies exist
SELECT tablename, policyname FROM pg_policies
WHERE schemaname = 'public'
  AND tablename LIKE '%intention%';

-- Test basic queries
INSERT INTO intention_templates (...) VALUES (...); -- As admin
SELECT * FROM intention_templates; -- As user
INSERT INTO user_intention_preferences (...) VALUES (...); -- As user
```

---

## Query Patterns

### Common Read Queries

#### 1. Get Active Templates by Framework

**Use Case:** User browsing IFS-based intentions

**Query:**
```sql
SELECT
    id,
    title,
    intention_text,
    description,
    session_type,
    tags,
    example_use_case
FROM intention_templates
WHERE framework = 'ifs'
  AND is_active = TRUE
ORDER BY
    is_featured DESC,
    sort_order ASC
LIMIT 20;
```

**Index Used:** `idx_intention_templates_active_framework_type`
**Expected Performance:** <30ms

---

#### 2. Get User's Recent Intentions

**Use Case:** User dashboard showing recent intentions

**Query:**
```sql
SELECT
    si.id,
    si.intention_text,
    si.framework,
    si.session_type,
    si.user_rating,
    si.created_at,
    s.title as session_title,
    s.date as session_date
FROM session_intentions si
LEFT JOIN sessions s ON si.session_id = s.id
WHERE si.user_id = 'user-uuid'
  AND si.is_deleted = FALSE
ORDER BY si.created_at DESC
LIMIT 10;
```

**Index Used:** `idx_session_intentions_user_time`
**Expected Performance:** <50ms

---

#### 3. Get Session's Intentions

**Use Case:** Session detail page showing all intentions

**Query:**
```sql
SELECT
    id,
    intention_text,
    framework,
    session_type,
    user_rating,
    user_notes,
    intention_summary,
    created_at
FROM session_intentions
WHERE session_id = 'session-uuid'
  AND is_deleted = FALSE
ORDER BY created_at ASC;
```

**Index Used:** `idx_session_intentions_session`
**Expected Performance:** <20ms

---

#### 4. Get User's Preferences (or Create Default)

**Use Case:** Load user preferences on app launch

**Query:**
```sql
-- Try to get existing preferences
SELECT * FROM user_intention_preferences
WHERE user_id = 'user-uuid';

-- If not found, insert default
INSERT INTO user_intention_preferences (user_id)
VALUES ('user-uuid')
ON CONFLICT (user_id) DO NOTHING
RETURNING *;
```

**Index Used:** Primary key on `user_id`
**Expected Performance:** <10ms

---

#### 5. Search Templates by Tag

**Use Case:** User searching for "grief" intentions

**Query:**
```sql
SELECT
    id,
    title,
    intention_text,
    framework,
    session_type,
    tags
FROM intention_templates
WHERE is_active = TRUE
  AND 'grief' = ANY(tags)
ORDER BY
    is_featured DESC,
    sort_order ASC;
```

**Index Used:** `idx_intention_templates_tags` (GIN)
**Expected Performance:** <100ms

---

### Common Write Queries

#### 1. Save New Intention

**Use Case:** User completes AI guidance and opts to save

**Query:**
```sql
INSERT INTO session_intentions (
    user_id,
    session_id,
    intention_text,
    framework,
    session_type,
    ai_conversation_context,
    inspired_by_template_id
) VALUES (
    'user-uuid',
    'session-uuid',
    'My intention text...',
    'ifs',
    'healing',
    '{"prompt_count": 4, "frameworks_explored": ["ifs"]}',
    'template-uuid'
)
RETURNING id, created_at;
```

**RLS Check:** User can only insert their own intentions
**Expected Performance:** <20ms

---

#### 2. Update Intention After Session

**Use Case:** User rates intention after session

**Query:**
```sql
UPDATE session_intentions
SET
    user_rating = 5,
    user_notes = 'This felt really aligned.',
    updated_at = NOW()
WHERE id = 'intention-uuid'
  AND user_id = 'user-uuid'
RETURNING id, user_rating, updated_at;
```

**RLS Check:** User can only update their own
**Expected Performance:** <20ms

---

#### 3. Soft Delete Intention

**Use Case:** User deletes intention from UI

**Query:**
```sql
UPDATE session_intentions
SET
    is_deleted = TRUE,
    deleted_at = NOW(),
    updated_at = NOW()
WHERE id = 'intention-uuid'
  AND user_id = 'user-uuid'
RETURNING id, deleted_at;
```

**RLS Check:** User can only delete their own
**Expected Performance:** <20ms

---

#### 4. Restore Deleted Intention

**Use Case:** User recovers intention within 30 days

**Query:**
```sql
UPDATE session_intentions
SET
    is_deleted = FALSE,
    deleted_at = NULL,
    updated_at = NOW()
WHERE id = 'intention-uuid'
  AND user_id = 'user-uuid'
  AND is_deleted = TRUE
  AND deleted_at > NOW() - INTERVAL '30 days'
RETURNING id, updated_at;
```

**RLS Check:** User can only restore their own
**Expected Performance:** <20ms

---

#### 5. Update User Preferences

**Use Case:** User changes privacy settings

**Query:**
```sql
UPDATE user_intention_preferences
SET
    save_by_default = TRUE,
    favorite_frameworks = ARRAY['ifs', 'somatic'],
    guidance_style = 'detailed',
    updated_at = NOW()
WHERE user_id = 'user-uuid'
RETURNING *;
```

**RLS Check:** User can only update their own
**Expected Performance:** <10ms

---

### Admin Queries

#### 1. Get Template Usage Statistics

**Use Case:** Admin dashboard - which templates are most popular?

**Query:**
```sql
SELECT
    t.id,
    t.title,
    t.framework,
    t.session_type,
    COUNT(si.id) as times_used,
    AVG(si.user_rating) as avg_rating,
    MAX(si.created_at) as last_used
FROM intention_templates t
LEFT JOIN session_intentions si
    ON t.id = si.inspired_by_template_id
    AND si.is_deleted = FALSE
WHERE t.is_active = TRUE
GROUP BY t.id, t.title, t.framework, t.session_type
ORDER BY times_used DESC
LIMIT 20;
```

**Expected Performance:** <500ms (admin query, low priority)

---

#### 2. Flag Abandoned Intentions for Auto-Delete

**Use Case:** Scheduled job - soft delete old intentions per user preferences

**Query:**
```sql
-- Get users with auto_delete preference
WITH users_with_auto_delete AS (
    SELECT user_id, auto_delete_after_days
    FROM user_intention_preferences
    WHERE auto_delete_after_days IS NOT NULL
)
UPDATE session_intentions si
SET
    is_deleted = TRUE,
    deleted_at = NOW()
FROM users_with_auto_delete uad
WHERE si.user_id = uad.user_id
  AND si.is_deleted = FALSE
  AND si.created_at < NOW() - (uad.auto_delete_after_days || ' days')::INTERVAL
RETURNING si.id, si.user_id, si.created_at;
```

**Expected Performance:** <1s (background job)

---

## Data Access Patterns

### Service Layer Design

**Service:** `lib/intentionGuidanceService.js`

**Responsibilities:**
- Query templates
- Save/update/delete intentions
- Manage user preferences
- Handle encryption/decryption (via Supabase)

#### Service Interface

```javascript
// intentionGuidanceService.js

import { supabase } from './supabase';

const intentionGuidanceService = {

  // ===== Templates =====

  /**
   * Get active templates by framework and session type
   * @param {string} framework - 'ifs', 'somatic', etc.
   * @param {string} sessionType - 'healing', 'exploration', etc.
   * @returns {Promise<Array>} Array of template objects
   */
  async getTemplates(framework = null, sessionType = null) {
    let query = supabase
      .from('intention_templates')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('sort_order', { ascending: true });

    if (framework) query = query.eq('framework', framework);
    if (sessionType) query = query.eq('session_type', sessionType);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  /**
   * Search templates by tag
   * @param {string} tag - Tag to search for
   * @returns {Promise<Array>} Array of template objects
   */
  async searchTemplatesByTag(tag) {
    const { data, error } = await supabase
      .from('intention_templates')
      .select('*')
      .eq('is_active', true)
      .contains('tags', [tag])
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data;
  },

  // ===== User Intentions =====

  /**
   * Get user's intentions (excluding deleted)
   * @param {string} userId - User UUID
   * @param {number} limit - Max results (default 10)
   * @returns {Promise<Array>} Array of intention objects with session info
   */
  async getUserIntentions(userId, limit = 10) {
    const { data, error } = await supabase
      .from('session_intentions')
      .select(`
        *,
        sessions (
          id,
          title,
          date
        )
      `)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  /**
   * Get intentions for a specific session
   * @param {string} sessionId - Session UUID
   * @returns {Promise<Array>} Array of intention objects
   */
  async getSessionIntentions(sessionId) {
    const { data, error } = await supabase
      .from('session_intentions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  /**
   * Save new intention
   * @param {Object} intention - Intention data
   * @returns {Promise<Object>} Created intention object
   */
  async saveIntention(intention) {
    const { data, error } = await supabase
      .from('session_intentions')
      .insert([{
        user_id: intention.userId,
        session_id: intention.sessionId,
        intention_text: intention.intentionText,
        framework: intention.framework,
        session_type: intention.sessionType,
        ai_conversation_context: intention.aiContext || {},
        inspired_by_template_id: intention.inspiredByTemplateId || null
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update intention (e.g., add rating after session)
   * @param {string} intentionId - Intention UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated intention object
   */
  async updateIntention(intentionId, updates) {
    const { data, error } = await supabase
      .from('session_intentions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', intentionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Soft delete intention
   * @param {string} intentionId - Intention UUID
   * @returns {Promise<Object>} Deleted intention object
   */
  async deleteIntention(intentionId) {
    const { data, error } = await supabase
      .from('session_intentions')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', intentionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Restore soft-deleted intention (within 30 days)
   * @param {string} intentionId - Intention UUID
   * @returns {Promise<Object>} Restored intention object
   */
  async restoreIntention(intentionId) {
    const { data, error } = await supabase
      .from('session_intentions')
      .update({
        is_deleted: false,
        deleted_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', intentionId)
      .eq('is_deleted', true)
      .gte('deleted_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ===== User Preferences =====

  /**
   * Get user preferences (creates default if not exists)
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} User preferences object
   */
  async getUserPreferences(userId) {
    let { data, error } = await supabase
      .from('user_intention_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If not found, create default
    if (error && error.code === 'PGRST116') {
      const { data: newData, error: insertError } = await supabase
        .from('user_intention_preferences')
        .insert([{ user_id: userId }])
        .select()
        .single();

      if (insertError) throw insertError;
      return newData;
    }

    if (error) throw error;
    return data;
  },

  /**
   * Update user preferences
   * @param {string} userId - User UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated preferences object
   */
  async updateUserPreferences(userId, updates) {
    const { data, error } = await supabase
      .from('user_intention_preferences')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Check if user wants to save by default
   * @param {string} userId - User UUID
   * @returns {Promise<boolean>} True if save by default
   */
  async shouldSaveByDefault(userId) {
    const prefs = await this.getUserPreferences(userId);
    return prefs.save_by_default;
  }
};

export default intentionGuidanceService;
```

---

## Special Considerations

### 1. Encryption at Rest

**Sensitive Fields:**
- `session_intentions.intention_text`
- `session_intentions.ai_conversation_context`

**Strategy:** Supabase provides transparent encryption at rest for all data. No additional action needed in application code.

**For Enhanced Security (Future):**
- Consider client-side encryption before saving to database
- Use library like `libsodium` or `tweetnacl`
- Store encryption key separately (not in database)

---

### 2. Soft Deletes & Recovery

**Why Soft Deletes?**
- Users may accidentally delete intentions
- 30-day recovery window provides safety net
- Maintains data integrity (no cascade failures)

**Implementation:**
- `is_deleted = TRUE` flag
- `deleted_at` timestamp
- RLS policies hide deleted intentions from normal queries
- Separate query for recovery UI

**Cleanup Strategy:**
```sql
-- Scheduled job (runs monthly)
-- Hard delete intentions deleted >30 days ago
DELETE FROM session_intentions
WHERE is_deleted = TRUE
  AND deleted_at < NOW() - INTERVAL '30 days';
```

---

### 3. Privacy-First Design

**Opt-In Storage:**
- Default: intentions NOT saved to database
- User must explicitly choose to save
- Preferences stored in `user_intention_preferences.save_by_default`

**User Control:**
- View all saved intentions
- Edit/update intentions
- Delete anytime (soft delete)
- Recover deleted intentions (30 days)
- Auto-delete after N days (user preference)

**No Analytics on Content:**
- Never log intention text to analytics
- Never share intention content with third parties
- Admin access only for support (with user consent)

---

### 4. Offline Support

**Cached Templates:**
- User selects favorite templates to cache
- Stored in `user_intention_preferences.cached_template_ids`
- Downloaded to AsyncStorage for offline access
- Max 20 templates (size limit)

**Draft Intentions:**
- Unsaved intentions stored in AsyncStorage only
- Not synced to server unless user opts in
- Cleared after 7 days or when session completes

---

### 5. Performance Optimization

**Partial Indexes:**
- Only index active templates (`is_active = TRUE`)
- Only index non-deleted intentions (`is_deleted = FALSE`)
- Reduces index size by 50-90%

**Query Optimization:**
- Use `LIMIT` on all list queries
- Paginate user intentions (10 per page)
- Cache template queries (15 min TTL)
- Use `SELECT *` sparingly (specify columns in production)

---

### 6. Data Retention

| Table | Retention | Cleanup Strategy |
|-------|-----------|------------------|
| `intention_templates` | Permanent | Soft delete (`is_active = FALSE`) |
| `session_intentions` | User-controlled | Soft delete → Hard delete after 30 days |
| `user_intention_preferences` | Permanent | Deleted with user account |

---

### 7. GDPR Compliance

**Right to Access:**
```sql
-- User can export all their intentions
SELECT * FROM session_intentions
WHERE user_id = 'user-uuid'
  AND is_deleted = FALSE;
```

**Right to Erasure:**
```sql
-- Hard delete all user's intention data
DELETE FROM session_intentions WHERE user_id = 'user-uuid';
DELETE FROM user_intention_preferences WHERE user_id = 'user-uuid';
```

**Right to Portability:**
- Export as JSON via API
- Include all metadata
- Human-readable format

---

### 8. Monitoring & Alerts

**Key Metrics:**
- Template usage (which are most popular?)
- Intention save rate (% of users who save)
- Average intentions per session
- Recovery rate (% of deleted intentions restored)
- Preference settings distribution

**Alerts:**
- High failure rate on intention saves (>5%)
- Encryption errors
- RLS policy violations (user trying to access others' data)

---

## Appendix

### Appendix A: Seed Data for intention_templates

**IFS Framework Examples:**

```sql
INSERT INTO intention_templates (
    title, intention_text, description, framework, session_type,
    tags, sort_order, is_featured, example_use_case, source
) VALUES
(
    'Meeting the Inner Critic with Compassion',
    'I intend to meet my inner critic with curiosity and compassion, understanding it as a protective part rather than an enemy.',
    'For working with harsh self-judgment using IFS framework',
    'ifs',
    'healing',
    ARRAY['inner_critic', 'self_compassion', 'parts_work'],
    10,
    TRUE,
    'When struggling with self-judgment or harsh internal dialogue',
    'Adapted from IFS therapy'
),
(
    'Witnessing Exiled Parts',
    'I intend to create a safe space to witness and hold my exiled parts with compassion.',
    'For exploring wounded or hidden parts',
    'ifs',
    'healing',
    ARRAY['exile', 'trauma', 'compassion', 'inner_child'],
    20,
    TRUE,
    'When working with childhood wounds or trauma',
    'IFS principles'
),
(
    'Understanding Protective Parts',
    'I intend to understand why my protective parts work so hard, and thank them for keeping me safe.',
    'For exploring defensive mechanisms',
    'ifs',
    'exploration',
    ARRAY['protectors', 'defense_mechanisms', 'gratitude'],
    30,
    FALSE,
    'When noticing patterns of avoidance or defensiveness',
    'IFS therapy'
);
```

**Somatic Framework Examples:**

```sql
INSERT INTO intention_templates (
    title, intention_text, description, framework, session_type,
    tags, sort_order, is_featured, example_use_case, source
) VALUES
(
    'Listening to Body Wisdom',
    'I intend to listen deeply to what my body is trying to tell me, without judgment or rushing to fix.',
    'For connecting with somatic awareness',
    'somatic',
    'exploration',
    ARRAY['body_awareness', 'listening', 'presence'],
    10,
    TRUE,
    'When feeling disconnected from physical sensations',
    'Somatic Experiencing'
),
(
    'Releasing Held Tension',
    'I intend to notice where tension lives in my body and create space for it to release.',
    'For working with chronic tension or stress',
    'somatic',
    'healing',
    ARRAY['tension', 'release', 'nervous_system'],
    20,
    TRUE,
    'When experiencing chronic pain or stress-related tension',
    'Body-centered therapy'
),
(
    'Following Sensations',
    'I intend to follow sensations in my body with curiosity, allowing them to guide me.',
    'For somatic exploration',
    'somatic',
    'exploration',
    ARRAY['sensations', 'curiosity', 'embodiment'],
    30,
    FALSE,
    'When wanting to deepen body-mind connection',
    'Somatic practices'
);
```

**Existential Framework Examples:**

```sql
INSERT INTO intention_templates (
    title, intention_text, description, framework, session_type,
    tags, sort_order, is_featured, example_use_case, source
) VALUES
(
    'Embracing Uncertainty',
    'I intend to sit with uncertainty and not-knowing, trusting that meaning will emerge.',
    'For working with existential anxiety',
    'existential',
    'spiritual',
    ARRAY['uncertainty', 'meaning', 'trust'],
    10,
    TRUE,
    'When facing big life questions or transitions',
    'Existential philosophy'
),
(
    'Exploring Death Awareness',
    'I intend to explore my relationship with mortality with openness and courage.',
    'For death awareness work',
    'existential',
    'spiritual',
    ARRAY['death', 'mortality', 'impermanence', 'courage'],
    20,
    FALSE,
    'When contemplating mortality or life purpose',
    'Existential psychology'
),
(
    'Finding Personal Meaning',
    'I intend to explore what truly matters to me, beyond societal expectations.',
    'For values clarification',
    'existential',
    'exploration',
    ARRAY['values', 'meaning', 'purpose', 'authenticity'],
    30,
    TRUE,
    'When questioning life direction or feeling unfulfilled',
    'Logotherapy principles'
);
```

**Healing Framework Examples:**

```sql
INSERT INTO intention_templates (
    title, intention_text, description, framework, session_type,
    tags, sort_order, is_featured, example_use_case, source
) VALUES
(
    'Healing Grief with Compassion',
    'I intend to approach my grief with compassion, allowing it to move through me at its own pace.',
    'For grief work',
    'healing',
    'healing',
    ARRAY['grief', 'loss', 'compassion', 'processing'],
    10,
    TRUE,
    'When processing loss or bereavement',
    'Grief therapy'
),
(
    'Forgiving Myself',
    'I intend to explore self-forgiveness and release shame I have been carrying.',
    'For shame and self-forgiveness work',
    'healing',
    'healing',
    ARRAY['forgiveness', 'shame', 'self_compassion', 'release'],
    20,
    TRUE,
    'When struggling with shame or self-blame',
    'Compassion-focused therapy'
),
(
    'Integrating Trauma',
    'I intend to safely revisit and integrate traumatic experiences with the support of my adult self.',
    'For trauma integration',
    'healing',
    'healing',
    ARRAY['trauma', 'integration', 'safety', 'adult_self'],
    30,
    FALSE,
    'When ready to process past trauma',
    'Trauma-informed practices'
);
```

**Total seed data:** 12 templates across 4 frameworks

---

### Appendix B: Data Dictionary

#### intention_templates

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | Primary key |
| `title` | TEXT | NO | - | Short title (max 200 chars) |
| `intention_text` | TEXT | NO | - | Example intention text (max 1000 chars) |
| `description` | TEXT | YES | NULL | Explanation of this intention (max 500 chars) |
| `framework` | TEXT | NO | - | Framework: 'ifs', 'somatic', 'existential', etc. |
| `session_type` | TEXT | NO | - | Session type: 'healing', 'exploration', etc. |
| `tags` | TEXT[] | NO | [] | Array of tags for filtering |
| `sort_order` | INTEGER | NO | 0 | Display order (ASC) |
| `is_featured` | BOOLEAN | NO | FALSE | Show in featured carousel |
| `example_use_case` | TEXT | YES | NULL | When to use this intention |
| `therapeutic_notes` | TEXT | YES | NULL | Admin notes (not shown to users) |
| `source` | TEXT | YES | NULL | Attribution/source |
| `is_active` | BOOLEAN | NO | TRUE | Soft delete flag |
| `version` | INTEGER | NO | 1 | Template version |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | Last update timestamp |

#### session_intentions

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | Primary key |
| `user_id` | UUID | NO | - | User who created (FK to auth.users) |
| `session_id` | UUID | YES | NULL | Associated session (FK to sessions) |
| `intention_text` | TEXT | NO | - | ENCRYPTED. User's intention (max 2000 chars) |
| `framework` | TEXT | YES | NULL | Framework used: 'ifs', 'somatic', etc. |
| `session_type` | TEXT | NO | - | Session type: 'healing', 'exploration', etc. |
| `ai_conversation_context` | JSONB | NO | {} | ENCRYPTED. AI metadata (not full transcript) |
| `user_rating` | INTEGER | YES | NULL | 1-5 stars rating |
| `user_notes` | TEXT | YES | NULL | User's notes (max 1000 chars) |
| `intention_summary` | TEXT | YES | NULL | AI-generated summary (max 500 chars) |
| `key_themes` | TEXT[] | YES | NULL | AI-extracted themes |
| `inspired_by_template_id` | UUID | YES | NULL | Template that inspired this (FK) |
| `is_deleted` | BOOLEAN | NO | FALSE | Soft delete flag |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | When soft-deleted |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | Last update timestamp |

#### user_intention_preferences

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `user_id` | UUID | NO | - | Primary key (FK to auth.users) |
| `save_by_default` | BOOLEAN | NO | FALSE | Save intentions by default (opt-out) |
| `auto_delete_after_days` | INTEGER | YES | NULL | Auto-delete after N days (7-365) |
| `favorite_frameworks` | TEXT[] | NO | [] | User's favorite frameworks |
| `preferred_session_types` | TEXT[] | NO | [] | User's preferred session types |
| `guidance_style` | TEXT | NO | 'balanced' | AI verbosity: 'brief', 'balanced', 'detailed' |
| `show_examples` | BOOLEAN | NO | TRUE | Show example intentions |
| `enable_ai_suggestions` | BOOLEAN | NO | TRUE | Enable AI suggestions |
| `offline_cache_enabled` | BOOLEAN | NO | TRUE | Cache templates for offline |
| `cached_template_ids` | UUID[] | NO | [] | Cached template IDs (max 20) |
| `has_completed_onboarding` | BOOLEAN | NO | FALSE | Onboarding complete flag |
| `onboarding_completed_at` | TIMESTAMPTZ | YES | NULL | When onboarding completed |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | Last update timestamp |

---

### Appendix C: Migration Files

**Migration File:** `supabase/migrations/20260210000001_feat_102_intentions.sql`

**Rollback File:** `supabase/migrations/20260210000001_feat_102_intentions_rollback.sql`

See separate migration files for full SQL.

---

### Appendix D: Testing Checklist

#### Unit Tests (Service Layer)

- [ ] `getTemplates()` - returns active templates only
- [ ] `getTemplates()` - filters by framework and session_type
- [ ] `searchTemplatesByTag()` - finds templates with tag
- [ ] `getUserIntentions()` - returns user's intentions only
- [ ] `getUserIntentions()` - excludes deleted intentions
- [ ] `getSessionIntentions()` - returns session's intentions
- [ ] `saveIntention()` - creates new intention
- [ ] `saveIntention()` - enforces RLS (can't save for other user)
- [ ] `updateIntention()` - updates own intention
- [ ] `updateIntention()` - fails for other user's intention
- [ ] `deleteIntention()` - soft deletes own intention
- [ ] `restoreIntention()` - restores within 30 days
- [ ] `restoreIntention()` - fails after 30 days
- [ ] `getUserPreferences()` - creates default if not exists
- [ ] `updateUserPreferences()` - updates own preferences
- [ ] `shouldSaveByDefault()` - respects user preference

#### Integration Tests (Database)

- [ ] RLS policies block unauthorized access
- [ ] Indexes are used for common queries
- [ ] Cascading deletes work correctly
- [ ] Soft delete recovery works within 30 days
- [ ] Constraints prevent invalid data
- [ ] Encryption at rest works (Supabase level)

#### Performance Tests

- [ ] `getTemplates()` - <30ms
- [ ] `getUserIntentions()` - <50ms
- [ ] `getSessionIntentions()` - <20ms
- [ ] `saveIntention()` - <20ms
- [ ] Template browsing with 100+ templates - <100ms

---

## Summary

This database design provides:
- **Privacy-first**: Opt-in storage, strict RLS, encryption
- **User control**: View, edit, delete, recover intentions
- **Performance**: Optimized indexes, partial indexes, query patterns
- **Scalability**: Handles 10K+ users, 100K+ intentions
- **Flexibility**: JSONB for AI metadata, extensible frameworks
- **Safety**: Soft deletes, rollback plan, comprehensive testing

**Next Steps:**
1. Review this design with team
2. Create migration SQL files
3. Test in staging environment
4. Deploy to production
5. Monitor performance and user adoption

---

**Design Complete**
**Ready for Step 3: Architecture & API Design**
