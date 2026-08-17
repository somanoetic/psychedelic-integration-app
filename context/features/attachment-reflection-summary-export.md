# Feature: Attachment Reflection — summary for therapist / self-review

**Status:** Scoped, not started. Requested 2026-08-07.
**Depends on:** resume work (done 2026-08-07) — sessions must survive interruption
before a summary is worth generating.

## The ask

After finishing an Attachment Reflection, produce something that can be (a) reviewed
by the person themselves and (b) sent to their therapist.

## Why this is mostly a rendering job

The capture is already complete. `getSessionSummary()` in
`lib/modeHandlers/AdultAttachmentInterviewModeHandler.js` returns everything:

- caregivers, each with their 5 adjectives **and** the memory offered for each
- all 5 experience probes (upset / hurt_ill / separation / rejection / threat)
- caregiver motivations, loss disclosure + notes, adult effects, integration takeaway
- `phaseHistory`, covered topics, context notes
- `backendPattern` — practitioner-only, **never user-facing**

All of it persists to `attachment_reflection_sessions`. **Nothing reads it back.**
That's the whole gap: no screen renders it, no export exists.

## The design decision that needs making first

The user-facing view and the therapist-facing export should probably NOT be the same
document.

The clinically meaningful signal in an AAI is the *gap between the adjective chosen and
the memory that supports it* — "loving" backed by no memory at all. That's exactly what
`_patternSignals.unsupportedAdjectives` counts. Surfacing that gap directly to the person
risks reading as a verdict on their childhood, which cuts against ADR-009 (consumer
wellness, not clinical) and against the mode's core guardrail of never labelling.

Proposed split:

- **Self-review** — their own words reflected back warmly. Adjectives and the memories
  they told, organised by caregiver. What they said they're taking with them. No gap
  analysis, no pattern, no interpretation.
- **Therapist export** — the same material plus structural observations: which adjectives
  went unsupported, coherence signals, loss handling. Still hedged, still explicitly
  "not a diagnosis."

**Open question for the user (therapist/practitioner):** should the therapist export
include `backendPattern`, or stay purely descriptive and let the clinician form their own
read? The pattern note self-describes as "a coarse, heuristic hunch from keyword signals
only." Including it may anchor a clinician on a weak signal.

## Scope

1. **Summary screen** — renders a completed session. Entry from Inner Work (a "past
   reflections" list) since nothing currently reads the table.
2. **Self-review rendering** — warm, their words, grouped by caregiver.
3. **Therapist export** — share sheet. Format TBD (see below).
4. **Consent/framing copy** — this is sensitive personal material leaving the app; the
   person should actively choose to share it, with clear framing that it's a reflection,
   not an assessment.

## Open questions

- Export format: PDF, plain text via share sheet, or email body? PDF is the most
  therapist-friendly and the most work.
- Does the therapist export include `backendPattern`? (see above)
- Multiple sessions over time — is this a single latest summary, or a history with
  comparison? (Ties to the insights/trends feature.)
- Does the person see the export before sending it? (Strong yes, in my read — but it's
  a design call.)

## Watch-outs

- **ADR-009 posture.** Wellness/reflection language, not treatment/assessment. The
  export must not read like a clinical instrument even though it's AAI-derived.
- **The no-label guardrail is currently well-enforced** (integration phase says "Do NOT
  label their attachment style"; asking "so what am I" redirects). An export is the most
  likely place for that to leak — the summary screen must not undo it.
- This is the person's childhood material. Sharing must be deliberate, never automatic.

## Reference

- Handler: `lib/modeHandlers/AdultAttachmentInterviewModeHandler.js` (`getSessionSummary`)
- Component: `components/ConversationalAttachmentInterview.js`
- Table: `attachment_reflection_sessions` (migrations `20260618000001`, `20260807000001`)
- Posture: ADR-009 (non-HIPAA wellness)
