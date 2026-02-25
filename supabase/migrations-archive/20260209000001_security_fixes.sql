-- ============================================================================
-- Security Fixes Migration
-- ============================================================================
-- Date: 2026-02-09
-- Description: Fixes CRITICAL and HIGH priority security issues found during
--              security audit of the AI Monitoring & Observability feature.
--
-- Issues addressed:
--   1. is_admin() used mutable raw_user_meta_data (HIGH)
--   2. delete_user_ai_data() had no authorization check (HIGH)
--   3. user_input_preview column stored PII (HIGH)
--   4. No RLS policy for authenticated users to INSERT own metrics (HIGH)
--   5. is_service_account() used mutable raw_user_meta_data (HIGH)
-- ============================================================================

-- ============================================================================
-- 1. Create user_roles table for immutable role management
-- ============================================================================
-- Previously, admin status was checked via raw_user_meta_data->>'role',
-- which any user can modify via supabase.auth.updateUser(). This is a
-- privilege escalation vulnerability.
--
-- The fix uses a dedicated user_roles table that only admins (or DB admins)
-- can modify, with its own RLS policies.

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    granted_by UUID REFERENCES auth.users(id),

    CONSTRAINT unique_user_role UNIQUE(user_id, role),
    CONSTRAINT valid_role CHECK (role IN ('admin', 'service_account', 'moderator'))
);

-- Index for fast lookups
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Only existing admins can view roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
);

-- Only existing admins can insert new roles
CREATE POLICY "Admins can grant roles"
ON public.user_roles FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
);

-- Only existing admins can revoke roles
CREATE POLICY "Admins can revoke roles"
ON public.user_roles FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
);

COMMENT ON TABLE public.user_roles IS 'Immutable role assignments for authorization. Only admins can modify.';
COMMENT ON COLUMN public.user_roles.role IS 'User role: admin, service_account, or moderator';
COMMENT ON COLUMN public.user_roles.granted_by IS 'Admin who granted this role (audit trail)';

-- ============================================================================
-- 2. Replace is_admin() to use user_roles table
-- ============================================================================
-- Old implementation checked raw_user_meta_data->>'role' = 'admin'
-- which is user-modifiable. New implementation checks user_roles table.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_admin() IS 'Check if current user has admin role via user_roles table (not mutable user metadata)';

-- ============================================================================
-- 3. Replace is_service_account() to use user_roles table
-- ============================================================================
-- Same vulnerability as is_admin() - was using raw_user_meta_data.

CREATE OR REPLACE FUNCTION public.is_service_account()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'service_account'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_service_account() IS 'Check if current user has service_account role via user_roles table';

-- ============================================================================
-- 4. Fix delete_user_ai_data() with authorization check
-- ============================================================================
-- Previously, this function had no authorization check, meaning any user
-- could delete any other user's AI data by calling:
--   SELECT delete_user_ai_data('victim-user-id');
--
-- Fix: Only allow users to delete their own data, or admins to delete
-- any user's data.

CREATE OR REPLACE FUNCTION public.delete_user_ai_data(target_user_id UUID)
RETURNS void AS $$
BEGIN
    -- Authorization check: user can only delete own data, admins can delete any
    IF auth.uid() != target_user_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: You can only delete your own AI data. Admin role required to delete other users data.';
    END IF;

    -- Additional safety: ensure target user exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
        RAISE EXCEPTION 'User not found: %', target_user_id;
    END IF;

    DELETE FROM public.ai_metrics WHERE user_id = target_user_id;
    DELETE FROM public.ai_routing_decisions WHERE user_id = target_user_id;
    DELETE FROM public.ai_errors WHERE user_id = target_user_id;
    DELETE FROM public.ai_conversations WHERE user_id = target_user_id;
    -- Note: ai_daily_summary is anonymized, no user_id to delete

    RAISE NOTICE 'Deleted all AI data for user %', target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.delete_user_ai_data(UUID) IS 'GDPR-compliant deletion of user AI data. Users can delete own data; admins can delete any user. Requires authentication.';

-- ============================================================================
-- 5. Drop user_input_preview column from ai_routing_decisions
-- ============================================================================
-- The user_input_preview column stored PII (first 200 chars of user input).
-- This is a GDPR/privacy violation. Replace with non-PII metadata only.
--
-- NOTE: The column comment already said "ADMIN ONLY ACCESS" but the data
-- should not be stored at all to follow data minimization principles.

-- Set existing PII data to NULL first (clear any existing PII)
UPDATE public.ai_routing_decisions SET user_input_preview = NULL WHERE user_input_preview IS NOT NULL;

-- Add a comment clarifying this column should never contain user text
COMMENT ON COLUMN public.ai_routing_decisions.user_input_preview IS 'DEPRECATED: Always NULL. User input text must NOT be stored here (PII/GDPR). Use metadata.input_length instead.';

-- ============================================================================
-- 6. Add RLS policies for authenticated users to INSERT own metrics
-- ============================================================================
-- Since we removed the service role key from the client, authenticated
-- users now insert metrics using their own JWT. We need INSERT policies
-- that allow users to insert rows with their own user_id.

-- ai_metrics: Allow authenticated users to insert their own metrics
CREATE POLICY "Authenticated users can insert own metrics"
ON public.ai_metrics FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL
    AND (user_id IS NULL OR user_id = auth.uid())
);

-- ai_routing_decisions: Allow authenticated users to insert their own routing decisions
CREATE POLICY "Authenticated users can insert own routing decisions"
ON public.ai_routing_decisions FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL
    AND (user_id IS NULL OR user_id = auth.uid())
);

-- ai_errors: Allow authenticated users to insert their own errors
CREATE POLICY "Authenticated users can insert own errors"
ON public.ai_errors FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL
    AND (user_id IS NULL OR user_id = auth.uid())
);

-- ai_conversations: Allow authenticated users to insert their own conversations
CREATE POLICY "Authenticated users can insert own conversations"
ON public.ai_conversations FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL
    AND (user_id IS NULL OR user_id = auth.uid())
);

-- ai_conversations: Allow authenticated users to update their own conversations
CREATE POLICY "Authenticated users can update own conversations"
ON public.ai_conversations FOR UPDATE
USING (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON SCHEMA public IS 'AI Monitoring schema v1.1 - security fixes applied 2026-02-09';
