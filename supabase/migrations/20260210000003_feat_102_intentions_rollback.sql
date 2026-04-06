-- ============================================================================
-- FEAT-102: AI Guidance in Set Your Intention Screen - ROLLBACK MIGRATION
-- ============================================================================
-- Feature: FEAT-102
-- Version: 1.0
-- Date: 2026-02-10
-- Description: Rolls back all changes from feat_102_intentions migration.
--              WARNING: This will permanently delete all intention data!
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Drop Triggers
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_session_intentions_updated_at ON public.session_intentions;
DROP TRIGGER IF EXISTS trigger_user_intention_preferences_updated_at ON public.user_intention_preferences;
DROP TRIGGER IF EXISTS trigger_intention_templates_updated_at ON public.intention_templates;

-- ============================================================================
-- STEP 2: Drop Functions
-- ============================================================================

DROP FUNCTION IF EXISTS public.delete_user_intention_data(UUID);
DROP FUNCTION IF EXISTS public.cleanup_deleted_intentions();
DROP FUNCTION IF EXISTS public.auto_delete_old_intentions();
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- ============================================================================
-- STEP 3: Drop RLS Policies
-- ============================================================================

-- user_intention_preferences policies
DROP POLICY IF EXISTS "Admins can view all intention preferences" ON public.user_intention_preferences;
DROP POLICY IF EXISTS "Users can update own intention preferences" ON public.user_intention_preferences;
DROP POLICY IF EXISTS "Users can insert own intention preferences" ON public.user_intention_preferences;
DROP POLICY IF EXISTS "Users can view own intention preferences" ON public.user_intention_preferences;

-- session_intentions policies
DROP POLICY IF EXISTS "Admins can view all intentions" ON public.session_intentions;
DROP POLICY IF EXISTS "Users can update own intentions" ON public.session_intentions;
DROP POLICY IF EXISTS "Users can insert own intentions" ON public.session_intentions;
DROP POLICY IF EXISTS "Users can view own deleted intentions" ON public.session_intentions;
DROP POLICY IF EXISTS "Users can view own intentions" ON public.session_intentions;

-- intention_templates policies
DROP POLICY IF EXISTS "Admins can manage intention templates" ON public.intention_templates;
DROP POLICY IF EXISTS "Authenticated users can read active intention templates" ON public.intention_templates;

-- ============================================================================
-- STEP 4: Drop Indexes
-- ============================================================================

-- session_intentions indexes
DROP INDEX IF EXISTS public.idx_session_intentions_ai_context;
DROP INDEX IF EXISTS public.idx_session_intentions_template;
DROP INDEX IF EXISTS public.idx_session_intentions_deleted;
DROP INDEX IF EXISTS public.idx_session_intentions_session;
DROP INDEX IF EXISTS public.idx_session_intentions_user_time;

-- intention_templates indexes
DROP INDEX IF EXISTS public.idx_intention_templates_version_time;
DROP INDEX IF EXISTS public.idx_intention_templates_tags;
DROP INDEX IF EXISTS public.idx_intention_templates_featured;
DROP INDEX IF EXISTS public.idx_intention_templates_active_framework_type;

-- ============================================================================
-- STEP 5: Drop Tables (CASCADE removes all dependencies)
-- ============================================================================

DROP TABLE IF EXISTS public.user_intention_preferences CASCADE;
DROP TABLE IF EXISTS public.session_intentions CASCADE;
DROP TABLE IF EXISTS public.intention_templates CASCADE;

COMMIT;

-- ============================================================================
-- ROLLBACK COMPLETE
-- ============================================================================
-- All FEAT-102 database objects have been removed.
-- WARNING: All intention data has been permanently deleted!
-- ============================================================================
