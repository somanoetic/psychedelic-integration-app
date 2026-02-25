-- ============================================================================
-- FEAT-101: Complete Database Setup (Combined Migration)
-- ============================================================================
-- Purpose: Sets up all database tables, functions, and policies for:
--   1. Session Day Checklist feature
--   2. Claude API proxy with rate limiting
--
-- Instructions:
--   1. Go to your Supabase Dashboard: https://app.supabase.com
--   2. Select your project (hxpyeudklnqtwspmdsuz)
--   3. Click "SQL Editor" in the left sidebar
--   4. Click "New Query"
--   5. Copy and paste this ENTIRE file
--   6. Click "Run" button
--   7. Wait for "Success. No rows returned" message
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: Admin Helper Function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Simple admin check: user metadata has admin role
    RETURN (
        SELECT COALESCE(
            (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
            FALSE
        )
    );
END;
$$;

COMMENT ON FUNCTION public.is_admin() IS 'Returns true if the current user has admin role in their user metadata';
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ============================================================================
-- PART 2: Session Checklist Tables
-- ============================================================================

-- TABLE 1: checklist_template_items
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

COMMENT ON TABLE public.checklist_template_items IS 'Default checklist template items for session preparation';

CREATE INDEX IF NOT EXISTS idx_template_items_active_version
    ON public.checklist_template_items(template_version, sort_order)
    WHERE is_active = TRUE;

ALTER TABLE public.checklist_template_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read checklist templates" ON public.checklist_template_items;
CREATE POLICY "Authenticated users can read checklist templates"
    ON public.checklist_template_items FOR SELECT
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can manage checklist templates" ON public.checklist_template_items;
CREATE POLICY "Admins can manage checklist templates"
    ON public.checklist_template_items FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- TABLE 2: session_checklists
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
    CONSTRAINT session_checklists_non_negative_counts CHECK (total_items >= 0 AND completed_items >= 0)
);

COMMENT ON TABLE public.session_checklists IS 'Checklist instance header for a session';

CREATE INDEX IF NOT EXISTS idx_session_checklists_user_time
    ON public.session_checklists(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_session_checklists_incomplete
    ON public.session_checklists(user_id, updated_at DESC)
    WHERE completed_at IS NULL;

ALTER TABLE public.session_checklists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own session checklists" ON public.session_checklists;
CREATE POLICY "Users can view own session checklists"
    ON public.session_checklists FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own session checklists" ON public.session_checklists;
CREATE POLICY "Users can create own session checklists"
    ON public.session_checklists FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own session checklists" ON public.session_checklists;
CREATE POLICY "Users can update own session checklists"
    ON public.session_checklists FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own session checklists" ON public.session_checklists;
CREATE POLICY "Users can delete own session checklists"
    ON public.session_checklists FOR DELETE
    USING (auth.uid() = user_id);

-- TABLE 3: session_checklist_items
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
    CONSTRAINT checklist_item_valid_category CHECK (category IN ('physical', 'safety', 'mental', 'practical')),
    CONSTRAINT checklist_item_positive_sort CHECK (sort_order >= 0),
    CONSTRAINT checklist_item_checked_consistency CHECK (
        (is_checked = TRUE AND checked_at IS NOT NULL)
        OR (is_checked = FALSE AND checked_at IS NULL)
    )
);

COMMENT ON TABLE public.session_checklist_items IS 'Individual checklist items for a session';

CREATE INDEX IF NOT EXISTS idx_checklist_items_checklist_order
    ON public.session_checklist_items(checklist_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_checklist_items_template_checked
    ON public.session_checklist_items(template_item_id, is_checked)
    WHERE template_item_id IS NOT NULL;

ALTER TABLE public.session_checklist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own checklist items" ON public.session_checklist_items;
CREATE POLICY "Users can view own checklist items"
    ON public.session_checklist_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.session_checklists sc
            WHERE sc.id = checklist_id AND sc.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can add items to own checklists" ON public.session_checklist_items;
CREATE POLICY "Users can add items to own checklists"
    ON public.session_checklist_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.session_checklists sc
            WHERE sc.id = checklist_id AND sc.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own checklist items" ON public.session_checklist_items;
CREATE POLICY "Users can update own checklist items"
    ON public.session_checklist_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.session_checklists sc
            WHERE sc.id = checklist_id AND sc.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete own checklist items" ON public.session_checklist_items;
CREATE POLICY "Users can delete own checklist items"
    ON public.session_checklist_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.session_checklists sc
            WHERE sc.id = checklist_id AND sc.user_id = auth.uid()
        )
    );

-- ============================================================================
-- PART 3: Checklist Trigger Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_checklist_counters()
RETURNS TRIGGER AS $$
DECLARE
    target_checklist_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_checklist_id := OLD.checklist_id;
    ELSE
        target_checklist_id := NEW.checklist_id;
    END IF;

    UPDATE public.session_checklists
    SET
        total_items = (
            SELECT COUNT(*) FROM public.session_checklist_items
            WHERE checklist_id = target_checklist_id
        ),
        completed_items = (
            SELECT COUNT(*) FROM public.session_checklist_items
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
                (SELECT completed_at FROM public.session_checklists WHERE id = target_checklist_id),
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

-- ============================================================================
-- PART 4: Checklist Creation Function
-- ============================================================================

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

    -- Check if checklist already exists
    SELECT id INTO v_checklist_id
    FROM public.session_checklists
    WHERE session_id = p_session_id;

    IF v_checklist_id IS NOT NULL THEN
        RETURN v_checklist_id;
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
    INSERT INTO public.session_checklists (session_id, user_id, template_version, total_items)
    VALUES (p_session_id, p_user_id, v_template_version, v_item_count)
    RETURNING id INTO v_checklist_id;

    -- Clone template items
    INSERT INTO public.session_checklist_items (
        checklist_id, template_item_id, title, description,
        category, sort_order, is_essential, is_custom
    )
    SELECT
        v_checklist_id, id, title, description,
        category, sort_order, is_essential, FALSE
    FROM public.checklist_template_items
    WHERE is_active = TRUE
    ORDER BY sort_order;

    RETURN v_checklist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.create_session_checklist(UUID, UUID)
    IS 'Creates a session checklist by cloning active template items';

-- ============================================================================
-- PART 5: Seed Data (18 Template Items)
-- ============================================================================

INSERT INTO public.checklist_template_items
    (title, description, category, sort_order, is_essential, template_version)
VALUES
    -- Physical (100-140)
    ('Follow fasting guidelines', 'Adhere to recommended dietary restrictions', 'physical', 100, TRUE, 1),
    ('Stay hydrated', 'Drink plenty of water throughout the day', 'physical', 110, TRUE, 1),
    ('Get adequate sleep', 'Aim for 7-9 hours of restful sleep', 'physical', 120, TRUE, 1),
    ('Prepare light meals', 'Have easily digestible food available', 'physical', 130, FALSE, 1),
    ('Avoid alcohol and substances', 'Abstain for at least 24-48 hours before', 'physical', 140, TRUE, 1),

    -- Safety (200-230)
    ('Confirm sitter or guide', 'Ensure trusted companion is confirmed', 'safety', 200, TRUE, 1),
    ('Share plans with trusted person', 'Inform someone of plans and location', 'safety', 210, TRUE, 1),
    ('Prepare emergency contacts', 'Have emergency contacts accessible', 'safety', 220, TRUE, 1),
    ('Review harm reduction resources', 'Familiarize with safety protocols', 'safety', 230, TRUE, 1),

    -- Mental (300-330)
    ('Set your intentions', 'Write clear intentions for your session', 'mental', 300, TRUE, 1),
    ('Journal your current state', 'Write about physical and emotional state', 'mental', 310, FALSE, 1),
    ('Practice meditation or breathwork', 'Spend 10-20 minutes centering yourself', 'mental', 320, FALSE, 1),
    ('Release expectations', 'Let go of specific outcomes', 'mental', 330, FALSE, 1),

    -- Practical (400-440)
    ('Prepare your space', 'Create comfortable environment with blankets', 'practical', 400, TRUE, 1),
    ('Gather supplies', 'Eye mask, headphones, journal, water, tissues', 'practical', 410, TRUE, 1),
    ('Prepare music playlist', 'Have curated playlist ready and tested', 'practical', 420, FALSE, 1),
    ('Set phone to airplane mode', 'Minimize interruptions', 'practical', 430, TRUE, 1),
    ('Clear your schedule', 'Ensure no obligations for 24+ hours', 'practical', 440, TRUE, 1)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PART 6: GDPR Deletion Function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.delete_user_checklist_data(target_user_id UUID)
RETURNS void AS $$
BEGIN
    IF auth.uid() != target_user_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: You can only delete your own data';
    END IF;

    DELETE FROM public.session_checklists WHERE user_id = target_user_id;
    RAISE NOTICE 'Deleted all checklist data for user %', target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- PART 7: Claude API Proxy Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service TEXT NOT NULL CHECK (service IN ('claude_api', 'other_services')),
    request_count INTEGER NOT NULL DEFAULT 0,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_request_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, service)
);

COMMENT ON TABLE public.user_rate_limits IS 'Rate limiting per user per service';

CREATE INDEX IF NOT EXISTS idx_user_rate_limits_user_service ON public.user_rate_limits(user_id, service);
CREATE INDEX IF NOT EXISTS idx_user_rate_limits_window ON public.user_rate_limits(window_start);

ALTER TABLE public.user_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own rate limits" ON public.user_rate_limits;
CREATE POLICY "Users can view their own rate limits"
    ON public.user_rate_limits FOR SELECT
    USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service TEXT NOT NULL,
    model TEXT NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    cost_estimate NUMERIC(10, 6) NOT NULL DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.api_usage_logs IS 'API usage logs for cost tracking';

CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user ON public.api_usage_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_service ON public.api_usage_logs(service, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON public.api_usage_logs(created_at DESC);

ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own usage logs" ON public.api_usage_logs;
CREATE POLICY "Users can view their own usage logs"
    ON public.api_usage_logs FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================================================
-- PART 8: Usage Summary View
-- ============================================================================

CREATE OR REPLACE VIEW user_api_usage_summary AS
SELECT
    user_id, service, model, DATE(created_at) AS usage_date,
    COUNT(*) AS request_count,
    SUM(input_tokens) AS total_input_tokens,
    SUM(output_tokens) AS total_output_tokens,
    SUM(cost_estimate) AS total_cost
FROM api_usage_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY user_id, service, model, DATE(created_at);

ALTER VIEW user_api_usage_summary SET (security_invoker = true);

-- ============================================================================
-- PART 9: Cleanup Function
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM user_rate_limits WHERE window_start < NOW() - INTERVAL '7 days';
END;
$$;

-- ============================================================================
-- PART 10: Permissions
-- ============================================================================

GRANT SELECT ON user_rate_limits TO authenticated;
GRANT SELECT ON api_usage_logs TO authenticated;
GRANT SELECT ON user_api_usage_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_session_checklist(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_checklist_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_rate_limits() TO authenticated;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE ✅
-- ============================================================================
-- Created:
--   - 3 checklist tables (template, checklists, items)
--   - 2 rate limiting tables (limits, logs)
--   - 1 usage summary view
--   - 5 functions (admin check, trigger, create checklist, cleanup, GDPR)
--   - 18 template items (seed data)
--   - 12 RLS policies
--   - 5 indexes
--
-- Next steps:
--   1. Verify in Supabase Dashboard: Database → Tables
--   2. Check that 18 items exist: SELECT COUNT(*) FROM checklist_template_items;
--   3. Deploy the Claude API edge function
-- ============================================================================
