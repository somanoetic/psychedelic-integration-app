# ADR-007: Intention as Goalpost — Brevity Over Depth

**Date:** 2026-02-17
**Status:** Accepted
**Deciders:** Product owner

---

## Context

FEAT-102 shipped a 5-stage conversational intention-setting flow:
`welcome → exploration → formulation → refinement → review`

This was designed as a therapeutic deep-dive — up to 10+ message exchanges, critiquing the draft intention for specificity, alignment, and actionability.

During first-user testing, the product owner identified a fundamental philosophical mismatch: **the feature treated intention like a plan, when an intention is actually a direction.**

---

## Decision

**The intention is a goalpost, not a roadmap.**

> "There is the top of the mountain — that's where we're going — and then let the mind and the medicine take it from there. The intention should never be held too tightly."

The session should be **short** (3–4 exchanges maximum) and **directional** (pointing toward something, not defining it). Huxley's role is to help the user find and name a direction, affirm it warmly, and get out of the way.

---

## Rationale

- Psychedelic experiences are non-linear and uncontrollable. A tightly-crafted intention creates attachment to outcome, which is counterproductive and potentially anxiety-inducing.
- Users preparing for a session are often already activated (nervous, excited, altered). A lengthy reflective process adds cognitive load at the wrong time.
- The therapeutic depth — parts work, somatic inquiry, trauma exploration — belongs in **integration** (after the experience), not in preparation.
- A simple direction ("I want to open to grief", "I'm curious about connection") is enough. The medicine knows.

---

## Consequences

### Positive
- Faster, lower-friction user experience
- More aligned with psychedelic-informed practice
- Reduces pre-session anxiety (no pressure to "get it right")
- Easier to complete — reduces abandonment

### Negative
- Less differentiated from a simple text input field (must ensure Huxley still adds genuine value in 3–4 turns)
- Users who want deep pre-session reflection have fewer affordances (may need an optional "go deeper" path)

### Neutral
- Significant changes required to conversation prompts, stage logic, and UI (see Implementation Notes)

---

## Alternatives Considered

### Option A: Keep the 5-stage deep flow (rejected)
Full therapeutic exploration before the session. Too long, too prescriptive, creates attachment.

### Option B: Single text input, no AI (rejected)
Loses the unique value of Huxley as an attuned guide. The warm, brief check-in is still valuable.

### Option C: Optional depth (deferred)
Quick mode by default, with a "Go deeper" option for users who want more. Worth revisiting post-launch.

---

## Implementation Notes

### Conversation flow changes

**New target:** 3 exchanges maximum before Huxley invites them to confirm.

```
Exchange 1 (welcome):
  Huxley: Warm, varied opening. One simple question: "What's calling you today?"

Exchange 2 (direction):
  User shares something.
  Huxley: Reflects it back. Offers a simple directional framing: "So it sounds like you're
  moving toward [X]. Does that feel right?"

Exchange 3 (confirm):
  User affirms or adjusts.
  Huxley: Names the direction cleanly. "Your intention: [X]. Hold it lightly."
  → Surface "Save intention" action.
```

### Prompt changes (lib/intentionGuidanceAIService.js → buildIntentionPrompt)
- Remove the formulation/refinement critique ("Is it specific enough?")
- Remove the 5-stage enumeration
- Add explicit instruction: max 2–3 sentences per response, max 3 exchanges
- Change framing from "craft an intention" to "find a direction"
- Final affirmation should include: "Hold it lightly — let the medicine take you from here."

### Stage logic changes (detectConversationStage)
- Collapse to 3 stages: `welcome → direction → confirm`
- Trigger `confirm` after 2 user messages (not 10+)
- Remove `refinement` critique logic

### UI changes
- Remove or simplify the multi-stage progress indicator
- The screen should feel more like a brief, grounded check-in than a structured intake

---

## References

- FEAT-102: AI Guidance in Set Your Intention Screen
- BUG-208: Opening statement variability (related — varied openings support this philosophy)
- Integration literature: "Set and setting" (Leary), "Holding intentions lightly" (Françoise Bourzat)
