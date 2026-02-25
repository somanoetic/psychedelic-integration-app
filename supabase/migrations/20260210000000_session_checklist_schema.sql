-- ============================================================================
-- FEAT-101: Session Day Checklist Schema Migration
-- ============================================================================
-- Feature: FEAT-101
-- Version: 1.0
-- Date: 2026-02-10
-- Description: Creates checklist template, session checklist, and checklist
--              items tables for the Session Day Checklist feature.
-- Depends on: sessions table, auth.users, is_admin() function
-- ============================================================================

BEGIN;

-- ============================================================================
-- TABLE 1: checklist_template_items
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.checklist_template_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_essential BOOLEAN NOT NULL DEFAULT FALSE,
    template_version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT checklist_template_title_length CHECK (char_length(title) <= 200),
    CONSTRAINT checklist_template_desc_length CHECK (char_length(description) <= 500),
    CONSTRAINT checklist_template_valid_category CHECK (
        category IN ('physical', 'safety', 'mental', 'practical')
    ),
    CONSTRAINT checklist_template_positive_sort CHECK (sort_order >= 0),
    CONSTRAINT checklist_template_positive_version CHECK (template_version >= 1)
);

COMMENT ON TABLE public.checklist_template_items
    IS 'Default checklist template items for session preparation. Read-only reference data.';

-- Index
CREATE INDEX IF NOT EXISTS idx_template_items_active_version
    ON public.checklist_template_items(template_version, sort_order)
    WHERE is_active = TRUE;

-- RLS
ALTER TABLE public.checklist_template_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read checklist templates" ON public.checklist_template_items;
CREATE POLICY "Authenticated users can read checklist templates"
    ON public.checklist_template_items
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can manage checklist templates" ON public.checklist_template_items;
CREATE POLICY "Admins can manage checklist templates"
    ON public.checklist_template_items
    FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ============================================================================
-- TABLE 2: session_checklists
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.session_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_version INTEGER NOT NULL DEFAULT 1,
    total_items INTEGER NOT NULL DEFAULT 0,
    completed_items INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    CONSTRAINT session_checklists_one_per_session UNIQUE (session_id),
    CONSTRAINT session_checklists_completed_lte_total CHECK (completed_items <= total_items),
    CONSTRAINT session_checklists_non_negative_counts CHECK (
        total_items >= 0 AND completed_items >= 0
    )
);

COMMENT ON TABLE public.session_checklists
    IS 'Checklist instance header for a session. One per session.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_session_checklists_user_time
    ON public.session_checklists(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_session_checklists_incomplete
    ON public.session_checklists(user_id, updated_at DESC)
    WHERE completed_at IS NULL;

-- RLS
ALTER TABLE public.session_checklists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own session checklists" ON public.session_checklists;
CREATE POLICY "Users can view own session checklists"
    ON public.session_checklists
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own session checklists" ON public.session_checklists;
CREATE POLICY "Users can create own session checklists"
    ON public.session_checklists
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.sessions s
            WHERE s.id = session_id
            AND s.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own session checklists" ON public.session_checklists;
CREATE POLICY "Users can update own session checklists"
    ON public.session_checklists
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own session checklists" ON public.session_checklists;
CREATE POLICY "Users can delete own session checklists"
    ON public.session_checklists
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- TABLE 3: session_checklist_items
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.session_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id UUID NOT NULL REFERENCES public.session_checklists(id) ON DELETE CASCADE,
    template_item_id UUID REFERENCES public.checklist_template_items(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'practical',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_essential BOOLEAN NOT NULL DEFAULT FALSE,
    is_custom BOOLEAN NOT NULL DEFAULT FALSE,
    is_checked BOOLEAN NOT NULL DEFAULT FALSE,
    checked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT checklist_item_title_length CHECK (char_length(title) <= 200),
    CONSTRAINT checklist_item_desc_length CHECK (char_length(description) <= 500),
    CONSTRAINT checklist_item_valid_category CHECK (
        category IN ('physical', 'safety', 'mental', 'practical')
    ),
    CONSTRAINT checklist_item_positive_sort CHECK (sort_order >= 0),
    CONSTRAINT checklist_item_checked_consistency CHECK (
        (is_checked = TRUE AND checked_at IS NOT NULL)
        OR (is_checked = FALSE AND checked_at IS NULL)
    )
);

COMMENT ON TABLE public.session_checklist_items
    IS 'Individual checklist items for a session. Cloned from template or user-created.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_checklist_items_checklist_order
    ON public.session_checklist_items(checklist_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_checklist_items_template_checked
    ON public.session_checklist_items(template_item_id, is_checked)
    WHERE template_item_id IS NOT NULL;

-- RLS
ALTER TABLE public.session_checklist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own checklist items" ON public.session_checklist_items;
CREATE POLICY "Users can view own checklist items"
    ON public.session_checklist_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.session_checklists sc
            WHERE sc.id = checklist_id
            AND sc.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can add items to own checklists" ON public.session_checklist_items;
CREATE POLICY "Users can add items to own checklists"
    ON public.session_checklist_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.session_checklists sc
            WHERE sc.id = checklist_id
            AND sc.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own checklist items" ON public.session_checklist_items;
CREATE POLICY "Users can update own checklist items"
    ON public.session_checklist_items
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.session_checklists sc
            WHERE sc.id = checklist_id
            AND sc.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.session_checklists sc
            WHERE sc.id = checklist_id
            AND sc.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete own checklist items" ON public.session_checklist_items;
CREATE POLICY "Users can delete own checklist items"
    ON public.session_checklist_items
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.session_checklists sc
            WHERE sc.id = checklist_id
            AND sc.user_id = auth.uid()
        )
    );

-- ============================================================================
-- TRIGGER: Auto-update session_checklists counters
-- ============================================================================
-- Keeps total_items and completed_items in sync automatically when
-- items are inserted, updated, or deleted.

CREATE OR REPLACE FUNCTION public.update_checklist_counters()
RETURNS TRIGGER AS $$
DECLARE
    target_checklist_id UUID;
BEGIN
    -- Determine which checklist to update
    IF TG_OP = 'DELETE' THEN
        target_checklist_id := OLD.checklist_id;
    ELSE
        target_checklist_id := NEW.checklist_id;
    END IF;

    -- Recount items and completed items
    UPDATE public.session_checklists
    SET
        total_items = (
            SELECT COUNT(*)
            FROM public.session_checklist_items
            WHERE checklist_id = target_checklist_id
        ),
        completed_items = (
            SELECT COUNT(*)
            FROM public.session_checklist_items
            WHERE checklist_id = target_checklist_id AND is_checked = TRUE
        ),
        completed_at = CASE
            WHEN (SELECT COUNT(*) FROM public.session_checklist_items
                  WHERE checklist_id = target_checklist_id AND is_checked = TRUE)
               = (SELECT COUNT(*) FROM public.session_checklist_items
                  WHERE checklist_id = target_checklist_id)
                 AND (SELECT COUNT(*) FROM public.session_checklist_items
                      WHERE checklist_id = target_checklist_id) > 0
            THEN COALESCE(
                (SELECT completed_at FROM public.session_checklists
                 WHERE id = target_checklist_id),
                NOW()
            )
            ELSE NULL
        END,
        updated_at = NOW()
    WHERE id = target_checklist_id;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_checklist_counters ON public.session_checklist_items;
CREATE TRIGGER trigger_update_checklist_counters
    AFTER INSERT OR UPDATE OF is_checked OR DELETE
    ON public.session_checklist_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_checklist_counters();

COMMENT ON FUNCTION public.update_checklist_counters()
    IS 'Automatically recounts total_items and completed_items on session_checklists when items change.';

-- ============================================================================
-- FUNCTION: Create checklist from template
-- ============================================================================
-- Server-side function to atomically create a checklist and clone
-- template items in one call.

CREATE OR REPLACE FUNCTION public.create_session_checklist(
    p_session_id UUID,
    p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_checklist_id UUID;
    v_template_version INTEGER;
    v_item_count INTEGER;
BEGIN
    -- Verify the session belongs to the user
    IF NOT EXISTS (
        SELECT 1 FROM public.sessions
        WHERE id = p_session_id AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'Session % does not belong to user %', p_session_id, p_user_id;
    END IF;

    -- Check if checklist already exists for this session
    SELECT id INTO v_checklist_id
    FROM public.session_checklists
    WHERE session_id = p_session_id;

    IF v_checklist_id IS NOT NULL THEN
        RETURN v_checklist_id;  -- Return existing checklist
    END IF;

    -- Get current template version
    SELECT COALESCE(MAX(template_version), 1) INTO v_template_version
    FROM public.checklist_template_items
    WHERE is_active = TRUE;

    -- Count items to be cloned
    SELECT COUNT(*) INTO v_item_count
    FROM public.checklist_template_items
    WHERE is_active = TRUE;

    -- Create checklist header
    INSERT INTO public.session_checklists (
        session_id, user_id, template_version, total_items
    ) VALUES (
        p_session_id, p_user_id, v_template_version, v_item_count
    )
    RETURNING id INTO v_checklist_id;

    -- Clone template items
    INSERT INTO public.session_checklist_items (
        checklist_id, template_item_id, title, description,
        category, sort_order, is_essential, is_custom
    )
    SELECT
        v_checklist_id,
        id,
        title,
        description,
        category,
        sort_order,
        is_essential,
        FALSE
    FROM public.checklist_template_items
    WHERE is_active = TRUE
    ORDER BY sort_order;

    RETURN v_checklist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_session_checklist(UUID, UUID)
    IS 'Atomically creates a session checklist by cloning active template items. Returns existing checklist ID if one already exists.';

-- ============================================================================
-- CLEANUP: Remove all template v1 items and checklists for a clean re-seed
-- ============================================================================

-- Wipe existing checklists (items cascade-delete via FK). Safe in early development.
DELETE FROM public.session_checklists;

-- Wipe all v1 template items so the INSERT below starts clean
DELETE FROM public.checklist_template_items WHERE template_version = 1;

-- Add unique constraint so ON CONFLICT works correctly going forward
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'checklist_template_unique_title_version'
    ) THEN
        ALTER TABLE public.checklist_template_items
            ADD CONSTRAINT checklist_template_unique_title_version
            UNIQUE (title, template_version);
    END IF;
END $$;

-- ============================================================================
-- SEED DATA: Default Template Items (18 items)
-- ============================================================================

INSERT INTO public.checklist_template_items
    (title, description, category, sort_order, is_essential, template_version)
VALUES
    -- Physical Preparation (sort_order 100-190)
    ('Follow fasting guidelines',
     'Adhere to recommended dietary restrictions before your session',
     'physical', 100, TRUE, 1),

    ('Stay hydrated',
     'Drink plenty of water throughout the day leading up to your session',
     'physical', 110, TRUE, 1),

    ('Get adequate sleep',
     'Aim for 7-9 hours of restful sleep the night before',
     'physical', 120, TRUE, 1),

    ('Prepare light meals',
     'Have easily digestible food available for before and after your session',
     'physical', 130, FALSE, 1),

    ('Avoid alcohol and recreational substances',
     'Abstain from alcohol and other substances for at least 24-48 hours before',
     'physical', 140, TRUE, 1),

    -- Safety & Support (sort_order 200-290)
    ('Confirm sitter or guide',
     'Ensure your trusted companion or facilitator is confirmed and prepared',
     'safety', 200, TRUE, 1),

    ('Share plans with trusted person',
     'Let someone you trust know your plans, location, and expected timeline',
     'safety', 210, TRUE, 1),

    ('Prepare emergency contacts',
     'Have a list of emergency contacts easily accessible including your therapist if applicable',
     'safety', 220, TRUE, 1),

    ('Review harm reduction resources',
     'Familiarize yourself with dosage guidelines, contraindications, and safety protocols',
     'safety', 230, TRUE, 1),

    -- Mental/Emotional (sort_order 300-390)
    ('Set your intentions',
     'Write down clear intentions for your session in your journal or in this app',
     'mental', 300, TRUE, 1),

    ('Journal your current state',
     'Write about how you are feeling physically, emotionally, and mentally right now',
     'mental', 310, FALSE, 1),

    ('Practice meditation or breathwork',
     'Spend 10-20 minutes in quiet meditation or calming breathwork to center yourself',
     'mental', 320, FALSE, 1),

    ('Release expectations',
     'Consciously let go of specific outcomes and practice openness to whatever arises',
     'mental', 330, FALSE, 1),

    -- Practical (sort_order 400-490)
    ('Prepare your space',
     'Create a comfortable, safe, and clean environment with blankets, pillows, and low lighting',
     'practical', 400, TRUE, 1),

    ('Gather supplies',
     'Eye mask, headphones, journal, pen, water, tissues, comfort objects',
     'practical', 410, TRUE, 1),

    ('Prepare your music playlist',
     'Have your curated playlist ready and tested on your preferred device',
     'practical', 420, FALSE, 1),

    ('Set phone to airplane mode or off',
     'Minimize interruptions by silencing or turning off electronic devices',
     'practical', 430, TRUE, 1),

    ('Clear your schedule',
     'Ensure you have no obligations for the session duration and at least 24 hours after for integration',
     'practical', 440, TRUE, 1)

ON CONFLICT (title, template_version) DO NOTHING;

-- ============================================================================
-- GDPR: Extend user data deletion function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.delete_user_checklist_data(target_user_id UUID)
RETURNS void AS $$
BEGIN
    -- Authorization check
    IF auth.uid() != target_user_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: You can only delete your own checklist data.';
    END IF;

    -- Delete checklists (cascades to items)
    DELETE FROM public.session_checklists WHERE user_id = target_user_id;

    RAISE NOTICE 'Deleted all checklist data for user %', target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.delete_user_checklist_data(UUID)
    IS 'GDPR-compliant deletion of user checklist data. Cascades to items.';

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
