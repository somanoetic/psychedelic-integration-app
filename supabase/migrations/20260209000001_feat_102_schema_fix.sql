-- =============================================================================
-- Migration: FEAT-102 Pre-requisite Schema Fix
-- Date: 2026-02-17
-- Purpose: session_intentions already exists from an older schema without the
--          columns required by FEAT-102. This migration adds the missing columns
--          and creates the two new tables so that
--          20260210000001_feat_102_intentions.sql can apply cleanly afterwards.
--
-- Apply order:
--   1. THIS FILE (20260209000001)
--   2. 20260210000001_feat_102_intentions.sql
--   3. 20260217000001_feat_102_security_fixes.sql  (already applied? run if not)
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Create intention_templates  (brand-new table — must exist before we can
--    add the FK from session_intentions.inspired_by_template_id)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.intention_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Content
    title TEXT NOT NULL,
    intention_text TEXT NOT NULL,
    description TEXT,

    -- Categorisation
    framework TEXT NOT NULL,
    session_type TEXT NOT NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Display
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,

    -- Metadata
    example_use_case TEXT,
    therapeutic_notes TEXT,
    source TEXT,

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
            'ifs', 'somatic', 'existential', 'healing',
            'exploration', 'creativity', 'spiritual', 'integration'
        )
    ),
    CONSTRAINT intention_template_valid_session_type CHECK (
        session_type IN (
            'healing', 'exploration', 'creativity',
            'spiritual', 'integration', 'general'
        )
    ),
    CONSTRAINT intention_template_positive_sort CHECK (sort_order >= 0),
    CONSTRAINT intention_template_positive_version CHECK (version >= 1)
);

-- -----------------------------------------------------------------------------
-- 2. Add missing columns to session_intentions
--    ADD COLUMN IF NOT EXISTS is idempotent — safe to re-run.
-- -----------------------------------------------------------------------------
ALTER TABLE public.session_intentions
    ADD COLUMN IF NOT EXISTS intention_text          TEXT,
    ADD COLUMN IF NOT EXISTS framework               TEXT,
    ADD COLUMN IF NOT EXISTS session_type            TEXT,
    ADD COLUMN IF NOT EXISTS ai_conversation_context JSONB DEFAULT '{}'::JSONB,
    ADD COLUMN IF NOT EXISTS user_rating             INTEGER,
    ADD COLUMN IF NOT EXISTS user_notes              TEXT,
    ADD COLUMN IF NOT EXISTS intention_summary       TEXT,
    ADD COLUMN IF NOT EXISTS key_themes              TEXT[],
    ADD COLUMN IF NOT EXISTS inspired_by_template_id UUID,
    ADD COLUMN IF NOT EXISTS is_deleted              BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deleted_at              TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Populate NOT NULL columns on any pre-existing rows so we can enforce the
-- constraint below without violating data integrity.
UPDATE public.session_intentions
SET
    intention_text = COALESCE(intention_text, ''),
    session_type   = COALESCE(session_type, 'general')
WHERE intention_text IS NULL OR session_type IS NULL;

-- Now enforce NOT NULL (all rows have values)
ALTER TABLE public.session_intentions
    ALTER COLUMN intention_text SET NOT NULL,
    ALTER COLUMN session_type   SET NOT NULL;

-- FK: session_id → sessions (the old table had no FK — add it now)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
          AND table_name        = 'session_intentions'
          AND constraint_name   = 'session_intentions_session_fk'
    ) THEN
        ALTER TABLE public.session_intentions
            ADD CONSTRAINT session_intentions_session_fk
            FOREIGN KEY (session_id)
            REFERENCES public.sessions(id) ON DELETE CASCADE;
    END IF;
END $$;

-- FK: inspired_by_template_id → intention_templates (table now exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
          AND table_name        = 'session_intentions'
          AND constraint_name   = 'session_intentions_template_fk'
    ) THEN
        ALTER TABLE public.session_intentions
            ADD CONSTRAINT session_intentions_template_fk
            FOREIGN KEY (inspired_by_template_id)
            REFERENCES public.intention_templates(id) ON DELETE SET NULL;
    END IF;
END $$;

-- CHECK constraints — idempotent via DO block
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = 'public' AND table_name = 'session_intentions'
          AND constraint_name = 'session_intentions_text_length'
    ) THEN
        ALTER TABLE public.session_intentions
            ADD CONSTRAINT session_intentions_text_length
            CHECK (char_length(intention_text) <= 2000);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = 'public' AND table_name = 'session_intentions'
          AND constraint_name = 'session_intentions_summary_length'
    ) THEN
        ALTER TABLE public.session_intentions
            ADD CONSTRAINT session_intentions_summary_length
            CHECK (char_length(intention_summary) <= 500);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = 'public' AND table_name = 'session_intentions'
          AND constraint_name = 'session_intentions_notes_length'
    ) THEN
        ALTER TABLE public.session_intentions
            ADD CONSTRAINT session_intentions_notes_length
            CHECK (char_length(user_notes) <= 1000);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = 'public' AND table_name = 'session_intentions'
          AND constraint_name = 'session_intentions_valid_framework'
    ) THEN
        ALTER TABLE public.session_intentions
            ADD CONSTRAINT session_intentions_valid_framework
            CHECK (framework IS NULL OR framework IN (
                'ifs', 'somatic', 'existential', 'healing',
                'exploration', 'creativity', 'spiritual', 'integration'
            ));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = 'public' AND table_name = 'session_intentions'
          AND constraint_name = 'session_intentions_valid_session_type'
    ) THEN
        ALTER TABLE public.session_intentions
            ADD CONSTRAINT session_intentions_valid_session_type
            CHECK (session_type IN (
                'healing', 'exploration', 'creativity',
                'spiritual', 'integration', 'general'
            ));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = 'public' AND table_name = 'session_intentions'
          AND constraint_name = 'session_intentions_valid_rating'
    ) THEN
        ALTER TABLE public.session_intentions
            ADD CONSTRAINT session_intentions_valid_rating
            CHECK (user_rating IS NULL OR (user_rating >= 1 AND user_rating <= 5));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = 'public' AND table_name = 'session_intentions'
          AND constraint_name = 'session_intentions_deleted_at_requires_flag'
    ) THEN
        ALTER TABLE public.session_intentions
            ADD CONSTRAINT session_intentions_deleted_at_requires_flag
            CHECK (
                (is_deleted = FALSE AND deleted_at IS NULL) OR
                (is_deleted = TRUE  AND deleted_at IS NOT NULL)
            );
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3. Create user_intention_preferences  (brand-new table)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_intention_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Privacy
    save_by_default       BOOLEAN NOT NULL DEFAULT FALSE,
    auto_delete_after_days INTEGER,

    -- Feature preferences
    favorite_frameworks    TEXT[] DEFAULT ARRAY[]::TEXT[],
    preferred_session_types TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- AI preferences
    guidance_style         TEXT    NOT NULL DEFAULT 'balanced',
    show_examples          BOOLEAN NOT NULL DEFAULT TRUE,
    enable_ai_suggestions  BOOLEAN NOT NULL DEFAULT TRUE,

    -- Offline
    offline_cache_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
    cached_template_ids    UUID[]  DEFAULT ARRAY[]::UUID[],

    -- Onboarding
    has_completed_onboarding   BOOLEAN    NOT NULL DEFAULT FALSE,
    onboarding_completed_at    TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT user_intention_prefs_valid_auto_delete CHECK (
        auto_delete_after_days IS NULL OR
        (auto_delete_after_days >= 7 AND auto_delete_after_days <= 365)
    ),
    CONSTRAINT user_intention_prefs_valid_guidance_style CHECK (
        guidance_style IN ('brief', 'balanced', 'detailed')
    ),
    CONSTRAINT user_intention_prefs_onboarding_consistency CHECK (
        (has_completed_onboarding = FALSE AND onboarding_completed_at IS NULL) OR
        (has_completed_onboarding = TRUE  AND onboarding_completed_at IS NOT NULL)
    )
);

COMMIT;

-- =============================================================================
-- NEXT STEP: Apply 20260210000001_feat_102_intentions.sql
-- The CREATE TABLE IF NOT EXISTS statements will skip (tables now exist), but
-- the COMMENT, INDEX, RLS, FUNCTION, TRIGGER, and seed-data statements will all
-- succeed.
-- =============================================================================
