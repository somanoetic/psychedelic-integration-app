# Handoff — Attachment Reflection (Huxley AAI mode)

## Task
Build a Huxley version of the Adult Attachment Interview (AAI). User decided
(via clarifying Qs): user-facing = **reflective themes only, NO diagnosis/label**;
back-end = Huxley quietly notes a **tentative attachment pattern** for the
practitioner (saved, never shown to user); integrate as a **new mode + handler**;
launch from the **Inner Work hub**. Per ADR-009 (non-clinical wellness posture)
the real AAI's classification coding is deliberately NOT surfaced.

## Status: BUILT + committed + automated tests green — NOT device-verified

## What was done
New mode follows the existing data-driven mode pattern (mode config + optional
ModeHandler plugin), modeled closely on the NS-Mapping mode.

- **Mode config:** `adultAttachmentInterviewMode` added to `lib/huxleyModeConfigs.js`
  (UI name "Attachment Reflection") + registered in `ALL_MODES`. Prompt encodes the
  AAI's signature five-words-then-supporting-memory technique and a hard rule never
  to tell the user an attachment style.
- **Handler:** `lib/modeHandlers/AdultAttachmentInterviewModeHandler.js` — drives an
  11-phase arc (orientation → family → per-caregiver general/5-adjectives/memory-per-
  adjective → 5 specific-experience probes → caregiver motivations → loss → adult
  effects → integration → complete). Accumulates coarse discourse signals and rolls
  them into a tentative pattern in `getSessionSummary().backendPattern`. The pattern
  is intentionally kept OUT of `getModeContext()` so it can't leak to the model.
- **Service:** handler registered in `lib/huxleyService.js` (import + `modeHandlers` map).
- **Screen:** `components/ConversationalAttachmentInterview.js` — drives the mode via
  `huxleyService`, renders via `ChatConversation`, auto-saves on completion.
- **Nav:** card added to `screens/InnerWorkScreen.js` (emoji fallback, no icon asset
  yet); route `AttachmentReflection` registered in `App.js`.
- **DB:** migration `supabase/migrations/20260618000001_attachment_reflection_sessions.sql`
  (RLS, owner-scoped). **User has already run this migration.**
- **Tests:** `__tests__/lib/attachmentInterviewHandler.test.js` (6 tests, all pass):
  full arc, single caregiver, loss decline (incl. elaborated-"no" regression), loss
  disclosure, unsupported adjective, and the never-leak-pattern guarantee.
- **Test guide:** `docs/attachment-reflection-test-guide.md` — manual QA / device
  walkthrough, edge cases, persistence SQL, sign-off checklist.

## Bugs caught & fixed during build
- Apostrophe in a single-quoted keyword string broke the JSX transform.
- Phase counters for `family_structure`/`loss_disruption`/`integration` were keyed on
  a stale caregiver index → added a caregiver-independent `phaseOnlyCounts`.
- Elaborated loss declines ("No, there were no major losses…") didn't advance → broadened
  the decline detection (now covered by a regression test).

## Current state
- **Branch:** `feat/attachment-reflection-aai` (created off `master`).
- **Commit:** `dc5eaf3` — 9 files, +1618. NOT pushed, no PR.
- Only the 9 feature files were committed; unrelated working-tree changes
  (`.claude/settings.json`, `LOG.md`, the python scripts, `__pycache__`, other handoff
  docs) were deliberately left uncommitted.
- All 384 lib tests + the 6 new tests pass.

## Known issues / limitations
- **Not device-verified.** Live conversation quality untested. Use the test guide.
- Phase advancement is **keyword-heuristic** (caregiver detection, adjective extraction,
  decline detection) — robust on clean inputs, will be messier with real users.
- **No icon asset** — Inner Work card uses a 🪢 emoji fallback.
- Not added to the persona-matrix harness (`__tests__/e2e/personaMatrix.test.js`) yet.

## What's next
1. Device walkthrough per `docs/attachment-reflection-test-guide.md` (esp. the
   never-label guarantee + the "so what am I?" redirect + crisis-latch override).
2. Optionally add `adult_attachment_interview` to the persona matrix to stress the prompt.
3. Optional: a real icon for the Inner Work card.
4. Push branch + open PR when device-verified.

Read handoffs/attachment-reflection-aai.md and continue.
