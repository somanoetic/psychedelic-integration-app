-- SEC-003 FIX: Add DELETE RLS Policy for session_intentions
-- Migration: 20260210000003
-- Purpose: Prevent unauthorized deletion of intentions

BEGIN;

CREATE POLICY "Users can delete own intentions"
    ON public.session_intentions
    FOR DELETE
    USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can delete own intentions" ON public.session_intentions IS
    'SEC-003 FIX: Allows users to hard-delete own intentions only. Soft-delete pattern preferred.';

COMMIT;
