-- 20260512000001_user_roles_self_select.sql
-- Close an RLS hole exposed by smoke-testing the ADR-009 contributor flow.
--
-- Background:
--   The original user_roles RLS (archived 20260209000001_security_fixes.sql)
--   only granted admins SELECT access. Non-admin users calling
--   userRoleService.getCurrentUserRole() got 0 rows back, hit the PGRST116
--   fallback in the service, and were silently treated as
--   { role: 'user', verified: true } regardless of what was actually in the
--   DB. Consequence: even after admin approval flipped
--   user_roles.verified=true, the contributor's own session continued to
--   see them as a plain user — so the Contributor Tools "Submit an
--   Exercise" gate never opened.
--
--   The apply-time UPDATE in requestTherapistVerification (which would
--   have flipped role->'therapist' verified=false) was also RLS-denied for
--   the same reason — no user-self UPDATE policy — and the service
--   swallowed the error. So role often stayed 'user' even after a
--   successful application submission.
--
-- Fix:
--   Add ONE policy: users can SELECT their own user_roles row. This is
--   the minimum change that makes the existing flow correct:
--     - On approval, approveApplication() now writes role='therapist'
--       AND verified=true (single authoritative grant — see service change
--       in the same commit). Apply-time role flip is dropped as dead code.
--     - With this SELECT policy in place, the approved contributor's
--       session can actually read the granted role and the UI gate opens.
--
--   This does NOT relax admin protections:
--     - Admins still SELECT all rows via the existing admin policy.
--     - No INSERT/UPDATE/DELETE policy is added for users — they cannot
--       grant or modify their own role.
--
-- Safe to re-run: DROP IF EXISTS preceding CREATE.

BEGIN;

DROP POLICY IF EXISTS "Users can view own role"
    ON public.user_roles;

CREATE POLICY "Users can view own role"
    ON public.user_roles
    FOR SELECT
    USING (auth.uid() = user_id);

COMMIT;
