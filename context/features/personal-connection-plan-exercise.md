# Feature Spec: Personal Connection Plan (interactive exercise)

**Status:** Planned (spec only — not yet built)
**Created:** 2026-06-22
**Companion to:** `neurobiology_of_connection` Learn article (already shipped in `content/education.js`)
**Pattern to copy:** the `triggers_glimmers` interactive flow (the closest analog — same 3-category "map something about yourself" shape)

---

## 1. What it is

A guided, conversational exercise where Huxley helps the user map and grow connection
across **four domains** (sourced from Deb Dana's *Personal Connection Plan* and the
Natureza Gabriel / Hearth Science *Autonomic Mandala*):

1. **People** — who you feel genuinely connected to, and what you do together
2. **Self** — how you nourish connection to yourself
3. **Spirit / something larger** — connection to spirit, meaning, awe (optional/skippable; keep
   language inclusive per ADR-009 non-clinical wellness framing)
4. **World** — connection to nature, place, the living world around you

Each domain has two passes, mirroring Dana's worksheet:
- **What's nourishing now** (no-judgment snapshot — anchor in ventral first; see the
  Regulating Resources two-phase approach in memory `feedback_resources_clinical_approach`)
- **What you'd like to invite in / explore** (gentle, curiosity-led, not goal-pressured)

> Clinical note from the source (important for the AI prompt): clients often *feel the
> absence* of connection while doing this, which can drop them into sympathetic/dorsal and
> shut down their ability to explore what they want. The AI must keep helping the user
> **anchor in ventral safety** so self-compassion (looking at what's present) and curiosity
> (considering what they want) stay online.

---

## 2. Why it's a feature-sized build (~1000 lines across 6 touchpoints)

The existing interactive exercises (`polyvagal_mapping`, `triggers_glimmers`,
`regulating_resources`) are NOT just article objects. Each one is a full vertical:

| Touchpoint | Existing example | ~LOC |
|---|---|---|
| Conversational component | `components/ConversationalTriggersGlimmers.js` | ~338 |
| Mode handler (phase gates) | `lib/modeHandlers/TriggersGlimmersModeHandler.js` | ~384 |
| Summary screen | `screens/TriggersGlimmersSummaryScreen.js` | ~277 |
| Routing wiring | `lib/conversationalRoutingService.js` (4+ spots) | small |
| AI mode config | `lib/huxleyModeConfigs.js` | small |
| DB table + persistence | Supabase migration + export service | small–med |

This spec follows that exact architecture so it drops in cleanly.

---

## 3. Data shape

### 3.1 Education topic object (`content/education.js`)
Add an `isInteractive: true` topic (like `polyvagal_mapping` at L450):

```js
{
  id: 'connection_plan',
  title: 'Your Personal Connection Plan',
  description: 'Map where connection lives in your life — and where to grow it',
  emoji: '🫶',
  estimatedTime: '10–15 minutes',
  isInteractive: true,
  content: [ /* 2 short intro sections: what it is + the four domains */ ],
  keyTakeaways: [ /* 4 lines */ ],
}
```

### 3.2 Mode handler state (`PersonalConnectionPlanModeHandler` extends `BaseModeHandler`)
```js
this.phase = 'people';              // people → self → spirit → world → summary
this.plan = {
  people:  { current: [], desired: [] },
  self:    { current: [], desired: [] },
  spirit:  { current: [], desired: [] },   // skippable
  world:   { current: [], desired: [] },
};
this.phaseHistory = [];
```
- `getModeContext()` returns `{ sessionPhase, planSoFar, phaseGuidance }` (copy the
  `triggers_glimmers` handler shape exactly).
- `processResponse()` → extract from `therapeuticData`, detect from user message,
  `_tryAdvancePhase()`.
- **Phase gate:** advance a domain when ≥1 `current` item is captured (lighter gate than
  triggers' ≥2, because connection prompts are more open). `spirit` is skippable — advance
  on an explicit skip signal too.

### 3.3 DB table (Supabase migration)
```sql
create table connection_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  plan jsonb not null,        -- the four-domain {current, desired} structure
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table connection_plans enable row level security;
-- RLS: user can CRUD only their own rows (copy policy from triggers_glimmers table)
```
Add to `lib/dataExportService.js` and `lib/therapistShareService.js` alongside the other
exercise exports.

---

## 4. Conversational flow (the AI's job)

Phase-by-phase. Keep Huxley's voice warm, slow, non-interrogating. One domain at a time.

1. **Open / anchor:** brief ventral anchor before diving in ("before we look at this, take a
   breath… bring to mind one moment you felt at ease recently").
2. **People — current:** "Who are the people you feel a genuine sense of connection with?
   What do you do together that feeds it?"
3. **People — desired:** "Is there anyone you'd like to invite more connection with?"
4. **Self — current/desired:** "How do you nourish your connection with yourself? …What
   would you like to explore there?"
5. **Spirit — current/desired (skippable):** offer gently, honor a skip without friction.
6. **World — current/desired:** connection to nature/place/the living world.
7. **Summary:** reflect the plan back, name 1–2 small, concrete next steps the user chose
   themselves (not prescribed).

**Guardrails for the prompt:**
- If the user shows sympathetic/dorsal cues (loneliness, "I don't have anyone"), pause the
  mapping and co-regulate first — validate, anchor, then return. Do NOT push to fill boxes.
- No streaks, no scoring (per memory `project_feature_curriculum_trail` — trail metaphor, no
  streaks).
- Living-document framing: this plan is meant to be revisited and updated (see memory
  `project_living_toolkit`).

---

## 5. Wiring checklist (mirror `triggers_glimmers`)

- [ ] `content/education.js` — add `connection_plan` topic (`isInteractive: true`)
- [ ] `components/ConversationalEducation.js` — `TOPIC_ICONS.connection_plan = icons.compassion`
      (note: `neurobiology_of_connection` article already uses `compassion`; pick a distinct
      icon for the exercise, e.g. `icons.map` or `icons.mapRefined`), add to a category's
      `topics[]` (likely `about_myself`), add to `topicDetails`, add `renderTopicCard`.
- [ ] `screens/EducationScreen.js` — add `handleTopicPress('connection_plan')` branch (see
      L331/L341 for the `polyvagal_mapping`/`triggers_glimmers` pattern).
- [ ] `lib/conversationalRoutingService.js` — add route mapping (`'connection_plan':
      'ConnectionPlan'`), display name, and keyword routing (connection/lonely/belonging cues).
- [ ] `lib/huxleyModeConfigs.js` — add mode config + system-prompt fragment (the flow above).
- [ ] `lib/modeHandlers/PersonalConnectionPlanModeHandler.js` — new handler (copy
      `TriggersGlimmersModeHandler.js`).
- [ ] `components/ConversationalPersonalConnectionPlan.js` — new component (copy
      `ConversationalTriggersGlimmers.js`).
- [ ] `screens/ConnectionPlanSummaryScreen.js` — new summary (copy
      `TriggersGlimmersSummaryScreen.js`).
- [ ] Supabase migration for `connection_plans` table + RLS.
- [ ] `lib/dataExportService.js` + `lib/therapistShareService.js` — include new table.
- [ ] Register route in the navigator (find where `TriggersGlimmers`/`TriggersGlimmersSummary`
      screens are registered).

---

## 6. Source fidelity

- Four-domain structure + reflection prompts: **Deb Dana**, *Polyvagal Exercises for Safety
  and Connection* — "Personal Connection Plan" (also `Worksheet - Personal Connection Plan`,
  `Exercise - Personal Connection Plan` in `knowledge-base/source-materials/extracted-text/`).
- "Connection systems," the three-system mandala, connection chemistry (oxytocin/vasopressin):
  **Natureza Gabriel / Hearth Science**, *Autonomic Mandala* / *Autonomic Spectrum*.
- Two-phase (snapshot then explore) + anchor-in-ventral guardrail: house clinical approach
  (memory `feedback_resources_clinical_approach`).
