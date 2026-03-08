-- Migration: Therapeutic Context Persistence
-- Created: 2026-03-08
-- Purpose: Store evolving therapeutic themes, IFS parts, and exercise history
--          across sessions so the AI can build on prior work
-- Used by: lib/therapeuticIntegrationService.js

-- =====================================================
-- TABLE: therapeutic_context
-- One row per user — accumulates across sessions
-- =====================================================

CREATE TABLE IF NOT EXISTS public.therapeutic_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Claude-tracked therapeutic themes (refined each turn)
    -- e.g. ["abandonment wound connected to early loss", "inner critic protecting from shame"]
    themes JSONB DEFAULT '[]'::jsonb,

    -- IFS parts identified across sessions
    -- e.g. [{"name": "Inner Critic", "role": "protector", "notes": "activated around work performance"}]
    parts JSONB DEFAULT '[]'::jsonb,

    -- Exercise history
    completed_exercises JSONB DEFAULT '[]'::jsonb,   -- exercise IDs the user has completed
    recommended_exercises JSONB DEFAULT '[]'::jsonb,  -- exercise IDs recommended this session

    -- Last known nervous system state
    nervous_system_state TEXT CHECK (nervous_system_state IN ('ventral', 'sympathetic', 'dorsal')),

    -- Session tracking
    session_count INTEGER DEFAULT 1,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- One record per user
    CONSTRAINT therapeutic_context_user_unique UNIQUE (user_id)
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_therapeutic_context_user
    ON public.therapeutic_context(user_id);

-- Auto-increment session_count on update
CREATE OR REPLACE FUNCTION increment_session_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Only increment if themes or parts actually changed
    IF NEW.themes IS DISTINCT FROM OLD.themes
       OR NEW.parts IS DISTINCT FROM OLD.parts THEN
        NEW.session_count := OLD.session_count + 1;
    END IF;
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER therapeutic_context_session_counter
    BEFORE UPDATE ON public.therapeutic_context
    FOR EACH ROW
    EXECUTE FUNCTION increment_session_count();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.therapeutic_context ENABLE ROW LEVEL SECURITY;

-- Users can only see/modify their own therapeutic context
CREATE POLICY therapeutic_context_select ON public.therapeutic_context
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY therapeutic_context_insert ON public.therapeutic_context
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY therapeutic_context_update ON public.therapeutic_context
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY therapeutic_context_delete ON public.therapeutic_context
    FOR DELETE USING (auth.uid() = user_id);
