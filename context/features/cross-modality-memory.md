# Feature: cross-modality memory (Huxley remembers across modes)

**Status:** Scoped, not started. Requested 2026-08-07.

## The ask

Data captured in one mode should be available to Huxley in later sessions and in *other*
modalities — the example given: attachment material informing IFS parts work.

## Current state

Every mode handler has `initializeWithContext()`, but each only accepts **its own** prior
state:

- `IFSModeHandler` takes `parts`, `activePartIndex`
- `AdultAttachmentInterviewModeHandler` takes `caregivers`, `experiences`, phase cursors
- `ExperienceMappingModeHandler`, `NervousSystemMappingModeHandler` — same pattern

Nothing passes between modes. There is no shared user-model layer. Each mode also has its
own table (`attachment_reflection_sessions`, IFS session storage, etc.) with no common
schema.

Note: `huxleyService` has a `therapeuticState` that survives `fullReset()` — worth
investigating as the natural home for this rather than inventing a parallel mechanism.

## Why this needs design, not just wiring

The naive version — dump attachment data into the IFS system prompt — creates a real
problem. The AAI mode's central guardrail is that the tentative attachment pattern is
**practitioner-only and never shown to the user**. That guardrail is currently enforced in
three places and covered by tests (including one asserting `backendPattern` never reaches
the model-facing context).

If attachment state flows into IFS, the IFS prompt has no such guardrail — and the model
could easily surface "your avoidant attachment" in a parts conversation, defeating the
protection entirely. A test asserting the pattern stays out of *AAI's* context doesn't
help if another mode leaks it.

**So the carry-forward set must be curated, not raw.** Something like: caregiver labels,
themes the person themselves articulated, their own integration takeaway — explicitly
NOT `backendPattern`, NOT `_patternSignals`, NOT unsupported-adjective tallies.

## Proposed shape (to be validated)

1. **A shared carry-forward store** — small, explicit, mode-agnostic. Curated facts the
   person has said about themselves, not raw handler state.
2. **Explicit contribution** — each handler decides what (if anything) it contributes.
   Opt-in per field, never "serialize everything."
3. **Explicit consumption** — each handler decides what it wants to receive. IFS might
   want relational themes; nervous-system work might want nothing.
4. **A hard denylist** — practitioner-only fields can never enter the store, enforced by
   test, not convention.

## Open questions

- Does the user know/consent that one mode's material shows up in another? A parts
  conversation suddenly referencing childhood could feel surveilled rather than helpful.
- Is this persisted server-side per user, or assembled per session?
- Scope: which mode pairs actually benefit? Attachment→IFS is the motivating case;
  the full N×N is likely not worth it.
- Does `therapeuticState` in `huxleyService` already do part of this?

## Watch-outs

- **The no-label guardrail is the main risk.** Any cross-mode flow must be tested for
  leakage the same way the AAI context is.
- ADR-009 posture applies — carried-forward material must stay reflective in tone.
- Prompt size: the chat-latency work established that prompt bloat costs real time.
  A growing carry-forward blob will regress that. Keep it small and bounded.

## Reference

- Handlers: `lib/modeHandlers/*.js` (all implement `initializeWithContext`)
- Service: `lib/huxleyService.js` (`therapeuticState`, `restoreHistory`, mode switching)
- Guardrail test: `__tests__/lib/attachmentInterviewHandler.test.js`
  ("never places the back-end pattern in the model-facing mode context")
- Posture: ADR-009 (non-HIPAA wellness)
