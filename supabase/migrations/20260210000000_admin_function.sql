-- ============================================================================
-- Admin Helper Function
-- ============================================================================
-- Purpose: Check if current user is an admin
-- Used by: Session checklist template management policies
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Simple admin check: user metadata has admin role
    -- You can customize this based on your auth setup
    RETURN (
        SELECT COALESCE(
            (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
            FALSE
        )
    );
END;
$$;

COMMENT ON FUNCTION public.is_admin() IS 'Returns true if the current user has admin role in their user metadata';

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
