-- 20260506000001_b1_admin_review_policies.sql
-- ADR-009 Phase B1: admin-side review of contributor applications.
--
-- Adds:
--   1. Audit columns on therapist_verification_requests (reviewed_by, reviewed_at)
--      so the admin review screen can record who decided what and when.
--   2. RLS policies that let admins SELECT and UPDATE all rows in
--      therapist_verification_requests (currently users can presumably only
--      see/insert their own).
--   3. RLS policy that lets admins UPDATE user_roles (needed to flip
--      verified=true on approval; archived migration only granted admins
--      INSERT/DELETE, not UPDATE).
--
-- Safe to re-run: every CREATE is preceded by DROP IF EXISTS, every column
-- add uses IF NOT EXISTS.
--
-- Depends on: public.is_admin() function (defined in archived
-- 20260209000001_security_fixes.sql, already live).

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Audit columns
-- ----------------------------------------------------------------------------
ALTER TABLE public.therapist_verification_requests
    ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.therapist_verification_requests.reviewed_by IS
    'Admin user_id who approved/rejected/requested-more-info on this application.';
COMMENT ON COLUMN public.therapist_verification_requests.reviewed_at IS
    'Timestamp of the admin review action.';

-- ----------------------------------------------------------------------------
-- 2. therapist_verification_requests — admin SELECT + UPDATE
-- ----------------------------------------------------------------------------
-- (We don't touch existing user-side policies — those allow an applicant to
--  insert and read their own row. We're only ADDING admin-side access.)

DROP POLICY IF EXISTS "Admins can view all applications"
    ON public.therapist_verification_requests;
CREATE POLICY "Admins can view all applications"
    ON public.therapist_verification_requests
    FOR SELECT
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update applications"
    ON public.therapist_verification_requests;
CREATE POLICY "Admins can update applications"
    ON public.therapist_verification_requests
    FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 3. user_roles — admin UPDATE
-- ----------------------------------------------------------------------------
-- Archived migration granted admins SELECT/INSERT/DELETE on user_roles but
-- not UPDATE. Approving a contributor flips verified=false -> true on an
-- existing row, which is an UPDATE.

DROP POLICY IF EXISTS "Admins can update roles"
    ON public.user_roles;
CREATE POLICY "Admins can update roles"
    ON public.user_roles
    FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

COMMIT;
