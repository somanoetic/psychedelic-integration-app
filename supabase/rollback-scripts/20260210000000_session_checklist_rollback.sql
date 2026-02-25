-- ============================================================================
-- FEAT-101: Session Day Checklist -- ROLLBACK
-- ============================================================================
-- WARNING: This permanently deletes all checklist data.
-- Date: 2026-02-10
-- ============================================================================

BEGIN;

-- Drop trigger first
DROP TRIGGER IF EXISTS trigger_update_checklist_counters
    ON public.session_checklist_items;

-- Drop functions
DROP FUNCTION IF EXISTS public.update_checklist_counters();
DROP FUNCTION IF EXISTS public.create_session_checklist(UUID, UUID);
DROP FUNCTION IF EXISTS public.delete_user_checklist_data(UUID);

-- Drop tables in dependency order (children first)
DROP TABLE IF EXISTS public.session_checklist_items CASCADE;
DROP TABLE IF EXISTS public.session_checklists CASCADE;
DROP TABLE IF EXISTS public.checklist_template_items CASCADE;

COMMIT;

-- ============================================================================
-- ROLLBACK COMPLETE
-- ============================================================================
