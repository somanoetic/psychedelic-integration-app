-- 20260511000003_contributed_exercises.sql
-- ADR-009 Phase B2: public library contribution pipeline.
--
-- Approved contributors can submit exercises (Pattern B in the ADR: a
-- practitioner-curated public library). Submissions are admin-reviewed
-- before publication. Once approved and published, any authenticated user
-- can read them and they appear in the in-app exercise library alongside
-- the bundled 160 — distinguished by an attribution badge and a
-- reviewed-for-safety disclaimer in the UI.
--
-- Schema choices:
--   - `instructions` (not "description") matches the bundled exercise shape
--     in content/exercises-comprehensive.js so the user-facing library can
--     merge bundled + contributed entries with no per-field remap.
--   - `category` is constrained to the 13 existing category IDs used by the
--     library. Admin can re-categorize before approval if needed.
--   - `review_status` mirrors the B1 pattern (pending / approved / rejected /
--     needs_revision). `needs_revision` is the content-side analogue of
--     `needs_more_info` from contributor applications.
--   - `published_at` is the gate for user visibility. Approval alone is not
--     enough — admin sets published_at when ready (in v1, approval and
--     publish happen in the same action; the column gives us room to add
--     scheduled publishing later without another migration).
--   - `attribution_name` defaults to the contributor's full_name from their
--     application but is editable per-submission (e.g., to use a pen name).
--
-- RLS:
--   - Contributor SELECT/INSERT their own; UPDATE only while status='pending'
--     or 'needs_revision' (so they can revise after admin feedback).
--   - Admin SELECT/UPDATE all.
--   - Any authenticated user SELECT where status='approved' AND
--     published_at IS NOT NULL.
--
-- Safe to re-run: IF NOT EXISTS / DROP IF EXISTS preceding CREATE.
--
-- Depends on: public.is_admin() (unified to user_roles in 20260508000001).

BEGIN;

-- ============================================================================
-- TABLE: contributed_exercises
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.contributed_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contributor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    attribution_name TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    instructions TEXT NOT NULL,
    steps TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    duration INTEGER NOT NULL DEFAULT 5,

    review_status TEXT NOT NULL DEFAULT 'pending',
    review_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,

    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,

    CONSTRAINT contributed_exercises_title_length
        CHECK (char_length(title) BETWEEN 3 AND 200),
    CONSTRAINT contributed_exercises_attribution_length
        CHECK (char_length(attribution_name) BETWEEN 1 AND 120),
    CONSTRAINT contributed_exercises_instructions_length
        CHECK (char_length(instructions) BETWEEN 10 AND 2000),
    CONSTRAINT contributed_exercises_steps_nonempty
        CHECK (array_length(steps, 1) >= 1),
    CONSTRAINT contributed_exercises_duration_range
        CHECK (duration BETWEEN 1 AND 240),
    CONSTRAINT contributed_exercises_valid_status
        CHECK (review_status IN ('pending', 'approved', 'rejected', 'needs_revision')),
    CONSTRAINT contributed_exercises_valid_category CHECK (
        category IN (
            'breathing', 'grounding', 'somatic', 'polyvagal', 'partsWork',
            'selfCompassion', 'meditation', 'jungian', 'cbt', 'habits',
            'psychedelicIntegration', 'yoga', 'stoic', 'trauma'
        )
    ),
    CONSTRAINT contributed_exercises_publish_only_when_approved CHECK (
        published_at IS NULL OR review_status = 'approved'
    )
);

COMMENT ON TABLE public.contributed_exercises IS
    'Exercises submitted by approved contributors for inclusion in the public library. Admin-reviewed; user-visible only when review_status=approved AND published_at IS NOT NULL. ADR-009 Phase B2.';

COMMENT ON COLUMN public.contributed_exercises.attribution_name IS
    'Display name shown on the exercise card (e.g., "Contributed by Jane Doe, LMFT"). Editable per-submission so contributors can use credentials or a pen name.';

COMMENT ON COLUMN public.contributed_exercises.instructions IS
    'The one-line purpose/description shown in the exercise modal. Field name matches content/exercises-comprehensive.js so the merge is trivial.';

COMMENT ON COLUMN public.contributed_exercises.published_at IS
    'Gate for user visibility. NULL = approved but not yet shown to users. In v1 this is set in the same action as approval; the column gives room for scheduled publishing later.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contributed_exercises_contributor
    ON public.contributed_exercises(contributor_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_contributed_exercises_review_queue
    ON public.contributed_exercises(review_status, submitted_at DESC)
    WHERE review_status IN ('pending', 'needs_revision');

CREATE INDEX IF NOT EXISTS idx_contributed_exercises_published
    ON public.contributed_exercises(category, published_at DESC)
    WHERE review_status = 'approved' AND published_at IS NOT NULL;

-- ============================================================================
-- updated_at trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION public.touch_contributed_exercises_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_contributed_exercises_updated_at
    ON public.contributed_exercises;
CREATE TRIGGER trg_contributed_exercises_updated_at
    BEFORE UPDATE ON public.contributed_exercises
    FOR EACH ROW
    EXECUTE FUNCTION public.touch_contributed_exercises_updated_at();

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE public.contributed_exercises ENABLE ROW LEVEL SECURITY;

-- Contributor: see all of own submissions regardless of status.
DROP POLICY IF EXISTS "Contributors view own submissions"
    ON public.contributed_exercises;
CREATE POLICY "Contributors view own submissions"
    ON public.contributed_exercises
    FOR SELECT
    USING (auth.uid() = contributor_id);

-- Contributor: insert own submissions. The user-side service should also
-- check role=therapist/verified=true before calling, but the source of
-- truth for visibility is RLS — and any authenticated user CAN submit a row
-- pointing at themselves. We rely on the admin queue to reject non-contributor
-- submissions; if abuse becomes real we can tighten with an EXISTS subquery
-- against user_roles in this policy.
DROP POLICY IF EXISTS "Contributors create own submissions"
    ON public.contributed_exercises;
CREATE POLICY "Contributors create own submissions"
    ON public.contributed_exercises
    FOR INSERT
    WITH CHECK (
        auth.uid() = contributor_id
        AND review_status = 'pending'
        AND published_at IS NULL
        AND reviewed_by IS NULL
        AND reviewed_at IS NULL
    );

-- Contributor: revise own submissions while pending or under needs_revision.
-- Approved/rejected entries are immutable to the contributor (approval
-- protects published content from author edits without re-review; rejection
-- is terminal). Constrained to keep status as 'pending' so revising a
-- needs_revision entry automatically returns it to the queue.
DROP POLICY IF EXISTS "Contributors revise own pending submissions"
    ON public.contributed_exercises;
CREATE POLICY "Contributors revise own pending submissions"
    ON public.contributed_exercises
    FOR UPDATE
    USING (
        auth.uid() = contributor_id
        AND review_status IN ('pending', 'needs_revision')
    )
    WITH CHECK (
        auth.uid() = contributor_id
        AND review_status = 'pending'
        AND published_at IS NULL
    );

-- Contributor: delete own submission, but only while pending or
-- needs_revision (don't let them un-publish approved content).
DROP POLICY IF EXISTS "Contributors delete own pending submissions"
    ON public.contributed_exercises;
CREATE POLICY "Contributors delete own pending submissions"
    ON public.contributed_exercises
    FOR DELETE
    USING (
        auth.uid() = contributor_id
        AND review_status IN ('pending', 'needs_revision')
    );

-- Admin: full read.
DROP POLICY IF EXISTS "Admins view all submissions"
    ON public.contributed_exercises;
CREATE POLICY "Admins view all submissions"
    ON public.contributed_exercises
    FOR SELECT
    USING (public.is_admin());

-- Admin: full update (approve / reject / request-revision / set published_at).
DROP POLICY IF EXISTS "Admins update all submissions"
    ON public.contributed_exercises;
CREATE POLICY "Admins update all submissions"
    ON public.contributed_exercises
    FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Admin: delete (cleanup).
DROP POLICY IF EXISTS "Admins delete submissions"
    ON public.contributed_exercises;
CREATE POLICY "Admins delete submissions"
    ON public.contributed_exercises
    FOR DELETE
    USING (public.is_admin());

-- Any authenticated user: read approved + published entries (the
-- user-facing library).
DROP POLICY IF EXISTS "Users view published contributions"
    ON public.contributed_exercises;
CREATE POLICY "Users view published contributions"
    ON public.contributed_exercises
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL
        AND review_status = 'approved'
        AND published_at IS NOT NULL
    );

COMMIT;
