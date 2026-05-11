-- 20260511000001_contributor_application_fields.sql
-- ADR-009 Phase A follow-up: add fields the contributor application screen
-- actually submits but that never made it into the DB schema.
--
-- Background:
--   ADR-009 Phase A (commit 6d10e7b) renamed TherapistVerificationScreen to
--   ContributorApplicationScreen and changed the submitted payload from
--   license/practice fields (license_type, license_number, practice_name, ...)
--   to general-contribution fields (professional_background, contribution_focus).
--   The screen and userRoleService were updated, but no matching migration
--   shipped, so submissions fail with:
--     PGRST204 "Could not find the 'contribution_focus' column of
--      'therapist_verification_requests' in the schema cache"
--
-- Fix:
--   Add the two missing columns. AdminApplicationReviewScreen already reads
--   from these names (Field "Professional Background", Field "What They'd Like
--   to Contribute"), so once these columns exist both submission and review
--   work end-to-end.
--
-- Legacy license_*/practice_* columns are intentionally left in place — they
-- are unused by the post-ADR-009 code but dropping them is a separate cleanup.
--
-- Safe to re-run: ADD COLUMN IF NOT EXISTS.

ALTER TABLE public.therapist_verification_requests
    ADD COLUMN IF NOT EXISTS professional_background TEXT,
    ADD COLUMN IF NOT EXISTS contribution_focus TEXT;

COMMENT ON COLUMN public.therapist_verification_requests.professional_background IS
    'Free-text description of the applicant''s relevant training, credentials, and experience. Replaces the legacy license_type/license_number fields post-ADR-009.';
COMMENT ON COLUMN public.therapist_verification_requests.contribution_focus IS
    'Free-text description of what the applicant would like to contribute and why. Required field on submission.';
