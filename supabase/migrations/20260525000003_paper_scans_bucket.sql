-- 20260525000003_paper_scans_bucket.sql
-- Created: 2026-05-25
-- Purpose: Private Supabase Storage bucket for paper-scan images. Each user
--          can only read/write objects under a path prefixed by their own
--          user_id, enforced via storage.objects RLS.
--
-- Path convention (enforced by client + RLS):
--   {user_id}/{scan_uuid}.{ext}
--
-- This is the first use of Supabase Storage in the app. If we add more
-- buckets later (avatars, attachments, etc.) the per-bucket RLS pattern
-- here is the template to copy.
--
-- Why a separate bucket (vs. an "attachments" catch-all):
--   - Different retention / privacy posture per content type. Scans are
--     handwritten reflections — most sensitive content surface in the app.
--   - Easier to nuke / migrate one content type without touching others.
--   - Per-bucket usage metrics for cost tracking.
--
-- Idempotent: ON CONFLICT for bucket insert, DROP POLICY IF EXISTS before
-- CREATE POLICY.

BEGIN;

-- ============================================================================
-- Bucket
-- ============================================================================
-- Private (public = false). file_size_limit = 10 MB per object: dewarped JPEGs
-- of A4 pages at the resolution our pipeline produces sit comfortably under
-- 2 MB; 10 MB leaves headroom for high-DPI captures without permitting
-- arbitrarily large uploads. allowed_mime_types limited to JPEG/PNG/HEIC
-- (HEIC because iPhone defaults; expo-image-manipulator converts but if a raw
-- HEIC slips through we still want it accepted).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'paper-scans',
    'paper-scans',
    FALSE,
    10485760,  -- 10 MB
    ARRAY['image/jpeg', 'image/png', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE
SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- RLS policies on storage.objects (scoped to this bucket)
-- ============================================================================
-- Path layout: the first path segment must be the user's own auth.uid().
-- storage.foldername(name) returns the path components as a text array;
-- element 1 is the first segment.

DROP POLICY IF EXISTS "Users can read own paper-scan objects" ON storage.objects;
CREATE POLICY "Users can read own paper-scan objects"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'paper-scans'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can upload own paper-scan objects" ON storage.objects;
CREATE POLICY "Users can upload own paper-scan objects"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'paper-scans'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can update own paper-scan objects" ON storage.objects;
CREATE POLICY "Users can update own paper-scan objects"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'paper-scans'
        AND (storage.foldername(name))[1] = auth.uid()::text
    )
    WITH CHECK (
        bucket_id = 'paper-scans'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can delete own paper-scan objects" ON storage.objects;
CREATE POLICY "Users can delete own paper-scan objects"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'paper-scans'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

COMMIT;
