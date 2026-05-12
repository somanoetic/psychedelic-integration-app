-- 20260512000002_role_string_rename_contributor.sql
-- ADR-009 Phase B3: rename role string 'therapist' -> 'contributor'.
--
-- Phase A renamed all user-facing UI to "Contributor" copy already; this
-- migration is internal cleanup so the DB string and JS-side string
-- comparisons match the language the rest of the app uses.
--
-- Scope:
--   1. Drop the existing valid_role CHECK constraint if present (the repo
--      baseline lists it as ('admin', 'service_account', 'moderator') but
--      the live schema drifted to include 'therapist'; we recreate
--      defensively below).
--   2. UPDATE user_roles SET role='contributor' WHERE role='therapist'.
--   3. Recreate valid_role CHECK with the post-B3 vocabulary
--      ('user', 'contributor', 'admin') — the three roles userRoleService
--      and getRoleDisplayInfo() actually branch on.
--
-- RLS impact: NONE. No active RLS policy filters on role='therapist' (verified
-- by repo grep at B3 time): admin gates use public.is_admin(), contributor
-- gates use auth.uid() ownership. Only the JS-side string comparisons need
-- to match, which is handled in the same commit.
--
-- Safe to re-run: the WHERE role='therapist' UPDATE is a no-op after the
-- first run, and the constraint is dropped IF EXISTS before being recreated.
--
-- Rollback (if needed): swap the rename direction and recreate the prior
-- constraint with 'therapist' included. Application code on master expects
-- 'contributor' after this migration, so rollback also requires reverting
-- the userRoleService commit from the same B3 batch.

BEGIN;

-- 1. Drop existing role CHECK so the UPDATE can move strings freely.
ALTER TABLE public.user_roles
    DROP CONSTRAINT IF EXISTS valid_role;

-- Some Supabase environments named the constraint differently when the
-- 'therapist' role was added out-of-band. Drop those defensively too so this
-- migration is portable across the live + dev projects without manual prep.
ALTER TABLE public.user_roles
    DROP CONSTRAINT IF EXISTS user_roles_role_check;

-- 2. Rename the role string. Idempotent — no-op on subsequent runs.
UPDATE public.user_roles
   SET role = 'contributor'
 WHERE role = 'therapist';

-- 3. Recreate the constraint with the current vocabulary. 'service_account'
-- and 'moderator' from the original baseline are dropped: neither is
-- referenced anywhere in the codebase or in any other migration, and
-- userRoleService only branches on user / contributor / admin.
ALTER TABLE public.user_roles
    ADD CONSTRAINT valid_role
    CHECK (role IN ('user', 'contributor', 'admin'));

COMMENT ON COLUMN public.user_roles.role IS
    'User role: user (default), contributor (approved practitioner who can submit to the public library), or admin. ADR-009 Phase B3 renamed legacy ''therapist'' -> ''contributor''.';

COMMIT;
