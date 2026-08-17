-- Migration: Major events + rolling session summary on therapeutic_context
-- Created: 2026-08-14
-- Purpose: Give Huxley continuity across sessions beyond themes/parts — the
--          "what's going on in this person's life" layer (a death, a diagnosis,
--          a trauma that surfaced) plus a short recap of where things left off.
-- Used by: lib/huxleyService.js, lib/conversationalRoutingService.js
--
-- DESIGN NOTE — deliberately coarse.
-- major_events stores a SHORT NEUTRAL LABEL and nothing more. No verbatim
-- disclosure, no narrative detail, no clinical interpretation. The purpose is to
-- keep Huxley from being tone-deaf (breezy when grief is live), NOT to build a
-- clinical record. ADR-009 puts this app in consumer-wellness posture, and a
-- coarse label is what that posture can carry safely.
--
-- Practitioner-only material must NEVER land here — specifically the Adult
-- Attachment Interview's backendPattern / _patternSignals, which are guarded
-- because the tentative attachment pattern is never shown to the user. These
-- columns are read by EVERY mode and by the main routing chat, so anything
-- written here is effectively user-facing. Enforced by test, not convention.

-- =====================================================
-- COLUMNS
-- =====================================================

-- Significant life events / disclosures, coarse-grained.
-- Shape: [{"label": "grief around father's death",
--          "surfaced_at": "2026-08-14",
--          "mode": "ifs"}]
-- Bounded FIFO (~15) in application code, same as the themes cap.
ALTER TABLE public.therapeutic_context
    ADD COLUMN IF NOT EXISTS major_events JSONB DEFAULT '[]'::jsonb;

-- Rolling 2-3 sentence recap of where the last session left off. Rewritten each
-- turn as part of the existing extraction JSON (no extra API round-trip).
ALTER TABLE public.therapeutic_context
    ADD COLUMN IF NOT EXISTS session_summary TEXT;

-- When the user last actually talked to Huxley. Lets the prompt say "three weeks
-- ago" rather than implying the last session was yesterday.
ALTER TABLE public.therapeutic_context
    ADD COLUMN IF NOT EXISTS last_session_at TIMESTAMPTZ;

COMMENT ON COLUMN public.therapeutic_context.major_events IS
    'Coarse labels only ({label, surfaced_at, mode}). No verbatim detail, no clinical interpretation. Read by all modes + routing chat, so treat as user-facing.';
COMMENT ON COLUMN public.therapeutic_context.session_summary IS
    'Rolling 2-3 sentence recap of where the last session left off.';
COMMENT ON COLUMN public.therapeutic_context.last_session_at IS
    'Timestamp of the user''s last Huxley exchange, for recency-aware phrasing.';

-- =====================================================
-- SESSION COUNTER
-- =====================================================
-- The existing trigger increments session_count when themes/parts change. Now
-- that events carry comparable weight, count those too. Summary changes are
-- deliberately EXCLUDED — it's rewritten nearly every turn, so counting it would
-- turn session_count into a turn counter.
CREATE OR REPLACE FUNCTION increment_session_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.themes IS DISTINCT FROM OLD.themes
       OR NEW.parts IS DISTINCT FROM OLD.parts
       OR NEW.major_events IS DISTINCT FROM OLD.major_events THEN
        NEW.session_count := OLD.session_count + 1;
    END IF;
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- RLS: no new policies needed. The existing four policies on therapeutic_context
-- are table-scoped (auth.uid() = user_id) and already cover these columns.
