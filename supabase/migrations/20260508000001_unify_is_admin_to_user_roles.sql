-- 20260508000001_unify_is_admin_to_user_roles.sql
-- Unify the SQL-side admin check with the JS-side admin check.
--
-- Background:
--   - The live public.is_admin() (from 20260210000000_admin_function.sql) reads
--     auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'. This is mutable by
--     any user via supabase.auth.updateUser({ data: { role: 'admin' } }) — a
--     privilege-escalation vector.
--   - The JS-side userRoleService.isAdmin() reads the user_roles table and
--     requires role='admin' AND verified=true. This is the secure source of
--     truth (only admins can write to user_roles per existing policies).
--   - Result: SQL-side and JS-side disagree, and the SQL side is exploitable.
--
-- Fix:
--   Replace public.is_admin() to query the user_roles table. After this
--   migration, both sides agree on a single source of truth and the JWT
--   metadata escalation path is closed.
--
-- Affects: any RLS policy or function that calls public.is_admin(), including
-- the B1 admin-review policies (20260506000001) and the session checklist
-- template policies that prompted the original admin function.
--
-- Safe to re-run: CREATE OR REPLACE.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role = 'admin'
          AND verified = TRUE
    );
END;
$$;

COMMENT ON FUNCTION public.is_admin() IS
    'Returns true if the current user has role=admin and verified=true in user_roles. Single source of truth — matches userRoleService.isAdmin() in the app.';

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
