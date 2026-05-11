-- 20260511000002_user_resubmit_application.sql
-- ADR-009 B1 follow-up: allow applicants to resubmit when admin requested
-- more information.
--
-- Background:
--   B1 added an admin action that sets status='needs_more_info' with notes.
--   The applicant-side screen displays the notes but had no path to actually
--   respond — they were stranded. This policy enables a constrained UPDATE
--   so the applicant can edit their submission and push it back into the
--   admin's pending queue.
--
-- Policy contract:
--   USING      — the row being updated must be the applicant's own AND in
--                'needs_more_info' status. Approved/rejected/pending rows
--                are off-limits for self-edit (rejection is terminal,
--                approval would let a contributor un-verify themselves,
--                editing while still pending invites a race with the admin).
--   WITH CHECK — the resulting row must still belong to the applicant AND
--                land in 'pending' status. This prevents the applicant from
--                self-approving or otherwise rewriting the verdict.
--
-- The app-side resubmit method also clears reviewed_by / reviewed_at /
-- review_notes so the admin sees a clean re-pended application.
--
-- Safe to re-run: DROP IF EXISTS preceding CREATE.

BEGIN;

DROP POLICY IF EXISTS "Users can resubmit needs_more_info applications"
    ON public.therapist_verification_requests;

CREATE POLICY "Users can resubmit needs_more_info applications"
    ON public.therapist_verification_requests
    FOR UPDATE
    USING (auth.uid() = user_id AND status = 'needs_more_info')
    WITH CHECK (auth.uid() = user_id AND status = 'pending');

COMMIT;
