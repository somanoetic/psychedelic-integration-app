-- 20260525000002_paper_scans.sql
-- Created: 2026-05-25
-- Purpose: FEAT-paper-scan. Users photograph handwritten worksheets or
--          free-form journal pages; Claude vision interprets them; the
--          interpretation + a pointer to the original image are persisted
--          here. Scans live alongside text journal entries in the user's
--          stream as a first-class entry type (one row per scan).
--
-- Design decisions (see project_feature_paper_scan memory + mockup
-- mockups/paper-scan-flow.html for the user-facing context):
--   - Storage path is a TEXT pointer into the paper-scans Storage bucket
--     (created in the companion migration 20260525000003_paper_scans_bucket).
--     Bucket-level RLS guarantees the user can only fetch their own image;
--     we do not duplicate that gate here.
--   - worksheet_id is NULL for free-form scans. When non-null, it identifies
--     the worksheet config in content/worksheets/ that drove interpretation.
--     worksheet_version captures the v{n} the user actually filled in (the
--     glyph encodes worksheet_id + version) so future migrations can re-run
--     interpretation against the correct schema.
--   - transcription is a JSONB blob shaped by the worksheet:
--       worksheet scans: { fields: { fieldId: text, ... } }
--       free-form scans: { full_text: "..." }
--     User can edit individual fields in the review screen — corrections
--     overwrite this column in place; the original Claude output lives in
--     ai_raw_output for debugging / re-extraction.
--   - thematic_notes is the light Claude reflection layer (parts, body refs,
--     themes) shown below the transcription. Free-text, may be empty.
--   - therapist_share_enabled defaults TRUE (opt-out, not opt-in). Aligned
--     with the design choice that scans flow into the therapist-share feature
--     by default; user can toggle off per scan from the stream view.
--   - session_id is nullable. Some scans are session-tied (post-session
--     integration worksheet), some aren't (free-form daily journaling).
--     Matches the pattern in post_session_journals.

BEGIN;

CREATE TABLE IF NOT EXISTS public.paper_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID,

    -- Storage pointer. Path within the paper-scans bucket, e.g.
    --   {user_id}/{uuid}.jpg
    image_storage_path TEXT NOT NULL,

    -- Worksheet identification (both NULL for free-form scans).
    worksheet_id TEXT,
    worksheet_version INTEGER,

    -- User-facing extracted content. See header for shape.
    transcription JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Light AI reflection (parts, body refs, themes). Plain text, may be empty.
    thematic_notes TEXT NOT NULL DEFAULT '',

    -- Raw Claude response for debugging + future re-extraction. Never shown to
    -- the user. Includes glyph-detection result + full model output.
    ai_raw_output JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Sharing posture. Defaults TRUE (opt-out per scan in the stream view).
    therapist_share_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- If a worksheet is identified, the version must be too (and vice versa).
ALTER TABLE public.paper_scans
    DROP CONSTRAINT IF EXISTS paper_scans_worksheet_id_version_together;
ALTER TABLE public.paper_scans
    ADD CONSTRAINT paper_scans_worksheet_id_version_together
    CHECK (
        (worksheet_id IS NULL AND worksheet_version IS NULL)
        OR
        (worksheet_id IS NOT NULL AND worksheet_version IS NOT NULL)
    );

CREATE INDEX IF NOT EXISTS idx_paper_scans_user_id
    ON public.paper_scans(user_id);

CREATE INDEX IF NOT EXISTS idx_paper_scans_created_at
    ON public.paper_scans(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_paper_scans_session_id
    ON public.paper_scans(session_id)
    WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_paper_scans_worksheet_id
    ON public.paper_scans(worksheet_id)
    WHERE worksheet_id IS NOT NULL;

ALTER TABLE public.paper_scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own paper scans" ON public.paper_scans;
CREATE POLICY "Users can read own paper scans"
    ON public.paper_scans
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own paper scans" ON public.paper_scans;
CREATE POLICY "Users can insert own paper scans"
    ON public.paper_scans
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own paper scans" ON public.paper_scans;
CREATE POLICY "Users can update own paper scans"
    ON public.paper_scans
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own paper scans" ON public.paper_scans;
CREATE POLICY "Users can delete own paper scans"
    ON public.paper_scans
    FOR DELETE
    USING (auth.uid() = user_id);

COMMENT ON TABLE public.paper_scans IS
    'Handwritten worksheets and free-form journal pages photographed by the user, interpreted by Claude vision. One row per scan. Images themselves live in the paper-scans storage bucket.';

COMMIT;
