# Attachment Reflection — resume after interruption

Status: **Code DONE, tests green (11/11). UNCOMMITTED.
Migration APPLIED ✅ (user ran it; verified live 2026-08-16).
Resume device-verified 2026-08-17 ✅. Pending-entry auto-reply fix (below) also
device-confirmed working 2026-08-17 ✅. Ready to commit.**

## 2026-08-17 follow-up: auto-reply to the pending entry

Device testing confirmed resume worked, but surfaced a UX gap: resuming only ever
picked up on the user's NEXT typed message. If the interruption happened right after
the user sent a message (before Huxley replied), reopening the reflection just showed
that message sitting there unanswered — no welcome back, no response, until the user
typed something new.

Fixed in `components/ConversationalAttachmentInterview.js`:
- `loadInProgressSession()` now detects when the last saved transcript entry is the
  user's own (unanswered) message. It holds that message's text in `pendingReplyRef`
  instead of replaying it into `restoreHistory` (replaying it would have made the
  handler treat it as already-processed, since `handler_state` was checkpointed
  *before* that message was ever run through `processResponse()`).
- `initialize()` then calls `sendMessage(pendingText, { skipEcho: true, resuming: true })`
  — the exact normal-turn path (so the handler advances phase / captures the answer
  correctly), but `skipEcho` avoids a duplicate bubble since the message is already
  visible from the loaded transcript, and `resuming` passes a `modeContext.resuming`
  flag + short instruction so Huxley opens with a brief welcome-back line before
  responding to what was said.
- This was NOT built as a bespoke "just call chat('')" shortcut — that path was
  considered and rejected because it would have passed an empty string as
  `processResponse(userMessage, ...)`'s first arg, silently skipping capture/phase
  advancement for the pending answer.

Device-confirmed working 2026-08-17.

Resume line: **Read handoffs/attachment-reflection-resume.md and continue.**

## Task

User was device-testing the Attachment Reflection (AAI mode) and asked for three things.
This session did #3; #1 and #2 were scoped into `context/features/` only:

1. A summary reviewable by the person and sendable to a therapist → **scoped, not built**
2. Cross-modality memory (attachment material informing IFS etc.) → **scoped, not built**
3. **Resume after interruption → BUILT (this doc)**

Resume was done first because it protects work in progress: before this, backing out of
the reflection lost everything.

## The gap that was found

The session was only written to Supabase on completion (`isComplete`), via `insert` only.
The handler already had an `initializeWithContext()` resume path — fully written and
**never called by anything**. `attachment_reflection_sessions` was written but never read
by any code. So the machinery half-existed and was simply unwired.

## What was done

**`lib/modeHandlers/AdultAttachmentInterviewModeHandler.js`**
- `getSessionSummary()` now also emits the phase cursors (`currentCaregiverIndex`,
  `currentAdjectiveIndex`, `currentExperienceIndex`), the per-phase counters
  (`phaseOnlyCounts`, `phaseExchangeCounts`), `stateDocument.askedQuestions`, and
  `_patternSignals`. Without the cursors a resume restored *what* was said but not
  *where* we were, so `_tryAdvance()` replayed finished phases.
- `initializeWithContext()` now restores those, plus the later free-form captures
  (`caregiverMotivations`, `lossDisclosed`, `lossNotes`, `adultEffects`,
  `integrationTakeaway`). Those gates read those fields — without them a resume past
  `loss_disruption` immediately re-advanced and skipped the user to `complete`.

**`lib/huxleyService.js`**
- Added `restoreHistory(messages)` (~L1475). Rebuilds `conversationHistory` from a saved
  transcript, tagging entries with current mode/phase + `_restored: true` so existing
  history filters treat them like live turns. Without this the handler knew the phase but
  the model had no memory of what was said and would repeat itself.
- NOTE: `lib/huxleyService.js` also carries a LATER, unrelated cross-session-memory change
  (see `handoffs/huxley-cross-session-memory.md`). Both are uncommitted in the same file.

**`components/ConversationalAttachmentInterview.js`**
- `loadInProgressSession()` — on mount, finds the user's most recent `completed = false`
  row, rehydrates transcript + handler state + conversation history, skips the opening
  message. A row with no transcript is treated as unresumable (starts fresh).
- `persistProgress()` — single row-writer used by BOTH the per-turn checkpoint and the
  final save. Inserts once (capturing the id in `sessionIdRef`), updates thereafter, so
  there is exactly one row per reflection rather than one per turn.
- Checkpoint now fires after **every** exchange, fire-and-forget, so a failed save can
  never block or interrupt the conversation.
- `messagesRef` mirrors `messages` (setState is async — reading state right after an
  update missed the newest turn).
- `priorMinutesRef` banks elapsed minutes so duration accumulates across sittings.
- A "Picking up where you left off" banner when `resumed` is true.

**`supabase/migrations/20260807000001_attachment_reflection_resume.sql`** (NEW, **APPLIED 2026-08-16**)
- Adds `messages` JSONB and `handler_state` JSONB; adds a
  `(user_id, completed, updated_at DESC)` index for the "find the resumable session" query.
- RLS needed no change — the original migration (`20260618000001`) already has
  SELECT/INSERT/UPDATE/DELETE policies scoped to `auth.uid()`.

**`__tests__/lib/attachmentInterviewHandler.test.js`**
- New `describe('resume ...')` block, 5 tests: cursors restore; the arc continues rather
  than replaying; later free-form phases don't skip ahead; pattern signals keep
  accumulating; and the practitioner-only pattern still never reaches the model-facing
  context after a resume.

## Current state

*(re-verified 2026-08-16)*

- Branch: `master`, **4 commits ahead of origin** (unrelated, already committed work —
  includes `a83aa29`, the cross-session memory feature, committed 2026-08-16).
- Tests: `npx jest __tests__/lib/attachmentInterviewHandler.test.js` → **11/11 pass**,
  re-run and confirmed 2026-08-16.
  - Full `__tests__/lib` today: **408 pass / 5 fail**. The 5 failures are all
    `intentionGuidanceAIService` (10s timeouts on error-fallback cases) and are
    **pre-existing** — confirmed by stashing the whole tree and re-running on clean
    `master`, where the same 5 fail. Unrelated to this work, but genuinely red.
- **Migration is applied.** Verified by probing the live schema via PostgREST:
  `messages` and `handler_state` both resolve on `attachment_reflection_sessions`.
- **Nothing from this session is committed.**
- The cross-session-memory work that used to sit alongside this in the tree
  (`App.js`, `lib/conversationalRoutingService.js`, `lib/huxleyService.js`,
  `supabase/migrations/20260814000001_*`) **was committed as `a83aa29` on 2026-08-16**
  and is no longer in the way — see `handoffs/huxley-cross-session-memory.md`.
- Still unrelated and still uncommitted in the tree: `components/CravingTracker.js`,
  `.claude/settings.json`, `context/features/planned.md` and the two `context/features/`
  spec docs. **Do not sweep those into a commit for this work.**

## What's next

1. ~~**Apply the migration**~~ — ✅ done by the user, verified live 2026-08-16.
2. ~~**Device-verify**~~ — ✅ done 2026-08-17, including the pending-entry auto-reply fix.
3. **Commit — START HERE.** Suggested: `feat(attachment): resume an interrupted reflection`.
   Stage only: the handler, the component, the test file, the migration, and the
   `restoreHistory` hunk of `lib/huxleyService.js`.
4. Then FEAT-601 / FEAT-602 (see below) — summary/export is the natural next one, and it
   is mostly a rendering job since capture is already complete.

## Known issues / watch-outs

- **Resume picks the most recent incomplete row.** If a user abandons several reflections,
  older incomplete rows are never offered and never cleaned up. Acceptable for now; worth
  revisiting if it accumulates.
- **`handler_state` contains practitioner-only material** (`_patternSignals`). It is
  stored, never rendered. Any future summary/export screen must keep it that way — this
  is the guardrail most likely to leak, and is covered by test.
- The migration was written after an earlier misread on my part: I initially said the
  table lacked an UPDATE RLS policy. It does have one. No policy work is needed.

## Reference

- Scoped follow-ons: `context/features/attachment-reflection-summary-export.md` (FEAT-601)
  and `context/features/cross-modality-memory.md` (FEAT-602); both indexed in
  `context/features/planned.md`.
- Working reference for the resume pattern: `screens/ExperienceMappingScreen.js`
  (`loadMessages()` → `initializeWithContext`).
- Posture: ADR-009 (non-HIPAA wellness) — reflection language, never assessment.

Read handoffs/attachment-reflection-resume.md and continue.
