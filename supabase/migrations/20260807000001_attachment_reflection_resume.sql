-- Attachment Reflection: resume support
--
-- The reflection is a long arc (11 phases, often 30+ exchanges). Before this,
-- a session was only written on completion, so backing out midway lost
-- everything. This adds what's needed to resume an interrupted session.
--
-- Same non-clinical posture as the original table (ADR-009). `handler_state`
-- carries the mode handler's cursors/counters so a resumed session picks up
-- mid-phase instead of replaying it. It may contain the practitioner-only
-- pattern signals — it is NEVER rendered to the user.

-- Transcript of the conversation so the user sees their history on resume.
ALTER TABLE attachment_reflection_sessions
  ADD COLUMN IF NOT EXISTS messages JSONB DEFAULT '[]'::jsonb;

-- Full mode-handler state (phase cursors, per-phase counters, pattern signals).
-- Shape: see AdultAttachmentInterviewModeHandler.getSessionSummary().
ALTER TABLE attachment_reflection_sessions
  ADD COLUMN IF NOT EXISTS handler_state JSONB DEFAULT '{}'::jsonb;

-- Finding "the session to resume" = the user's most recent incomplete row.
CREATE INDEX IF NOT EXISTS idx_attachment_reflection_sessions_resume
  ON attachment_reflection_sessions(user_id, completed, updated_at DESC);

-- NOTE: RLS policies (SELECT/INSERT/UPDATE/DELETE, all scoped to auth.uid())
-- already exist from 20260618000001 and cover the upsert this feature needs.
-- The updated_at trigger already fires BEFORE UPDATE.
