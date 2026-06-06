# Exercise → Journal Template Audit

**Created:** 2026-05-22 (during curriculum-trail scoping chat)
**Status:** Draft — to be picked up in separate journal-overhaul chat
**Purpose:** Identify which entries in `content/exercises-comprehensive.js` aren't really "exercises" — they're structured journal templates or tracking flows that belong in the journal/tracking area, not on a curriculum trail.

## The pattern

A real "exercise" has a clear start, middle, end. You do it once (or repeatedly as a discrete practice — like a body scan), it has a duration, and "completing" it is a clear state.

A "journal template" is a structured prompt — situation, thought, evidence, balanced thought, etc. — that you USE on an ongoing basis to process whatever is happening in your life. There is no "completed" state for the template itself; what gets completed is each *entry* against the template.

A "tracking flow" is a recurring log — daily, weekly, around specific events. Same template applied many times, value comes from the longitudinal view.

Currently all three are flattened into `exercises-comprehensive.js` and tagged with a single mechanism category. The trail design surfaces the mismatch: many "exercises" don't fit on a trail because they have no endpoint.

## Strong candidates for moving to journal/tracking

| ID | Current title | Type | Reasoning |
|---|---|---|---|
| **CBT-001** | Thought Record | Journal template | The foundational CBT structured journal. 7-step prompt (situation → emotion → automatic thought → distortion → evidence for/against → balanced thought → re-rate). Used repeatedly on triggering thoughts. Two strong integration points: (a) entry type in DailyJournal, (b) attached to a TriggerTracker entry as the "work it through" action. User wants both. |
| **CBT-002** | Core Belief Identification | Journal template | Downward-arrow journal prompt. Repeated use on different automatic thoughts. Strong overlap with CoreBeliefsAssessment but the assessment is one-time; this is ongoing. Could be a CoreBeliefs-attached journal entry type. |
| **CBT-009** | Worry Time Scheduling | Tracking flow | Daily 15-min "worry window" log. Postponed worries written down across the day, reviewed during the window. Pure tracking — not something you "complete." |
| **CBT-001 / CBT-002 overlap** | (see above) | — | Both feed the same belief-work pipeline. Consider unifying as belief-related journal entry types. |
| **HAB-001 → HAB-007** | All 7 habit exercises | Tracking flows | Anchoring, two-minute start, specific action plans, reward pairing, accountability, identity-based, environment shaping. Every single one is a habit definition + ongoing tracking, not a one-off. HabitTracker already exists in the codebase — these are the *templates* for setting up entries in it. |
| **ST-004** | Morning Stoic Preparation | Tracking flow | Daily morning ritual log: anticipated challenges + virtue intention. Recurring. |
| **ST-005** | Evening Stoic Review | Tracking flow | Daily evening ritual log: what went well, what didn't, lessons. Recurring. Pairs with ST-004. |
| **TR-019** | Three Blessings (Gratitude Practice) | Tracking flow | Daily gratitude log, 3 entries. Recurring. Classic positive psychology daily tracking. |
| **TR-020** | Taking In the Good | Tracking flow | "Linger and absorb positive moments." Daily noticing log. Recurring. |
| **PI-001** | Integration Journaling | Journal template | Currently on the Integration trail as marker `i4`. The IRONY: it's literally a journal template. Should be the PRIMARY post-session entry type in DailyJournal (or its own "session journal" surface), not a trail marker you complete once. **Trail implication:** remove from Integration track once it lives in journal as an entry type. Replace with something the user actually completes. |
| **PI-007** | Integration Circle Check-in | Tracking flow | Recurring before/after integration-circle attendance. Pre/post tracking. |
| **PI-010** | Daily Practice Commitment | Tracking flow | Currently on Integration trail as `i8`. Defines a daily practice + tracks adherence. Belongs in HabitTracker, not on a trail. |

## Borderline cases

| ID | Title | Notes |
|---|---|---|
| **CBT-005** | Values Clarification | One-time-ish but possibly revisited yearly. Could be either. Probably a "deep dive" tool more than a trail marker — sits alongside CoreBeliefsAssessment. |
| **CBT-006** | Downward Arrow Technique | Used in current Belief trail (`b5`). CBT-002 is basically the same technique applied to core beliefs specifically. Probably trail-OK as a discrete teaching exercise. |
| **CBT-007** | ABCDE Model | A structured framework prompt — used ongoingly OR as a one-time learn-the-framework exercise. Lean: keep on trail as an introduction, but the framework should also be a journal entry template. |
| **CBT-008** | Belief Testing Experiment | Currently on Belief trail (`b7`). Has an open-ended duration, hints it's not really a trail marker — it's a multi-day experiment. Could be a tracking flow ("design experiment → track outcomes over N days"). Flag for journal-overhaul chat. |
| **ST-006** | Dichotomy of Control | One-off framework lesson, but also a recurring application. Could be both. |

## Counts

- **Exercises that should move to journal/tracking:** ~13 strong + ~5 borderline
- **What's left in `exercises-comprehensive.js`:** ~140 real exercises (breath, somatic, IFS, meditation, etc.) — these have discrete starts/endpoints and are genuine exercises.
- **Impact on Belief trail:** v1 stays the same in this audit. CBT-001/002/009 were already NOT on the trail (right call in retrospect). Borderline CBT-007/CBT-008 stay on trail with a flag.
- **Impact on Integration trail:** PI-001 and PI-010 should come OFF the trail once journal templates exist. Replace with marker types we haven't curated yet — possibly the Huxley conversational integration flow, or a session-summary view of the new session-journal entry.

## Integration with existing surfaces

The audit creates natural homes for these:

| Existing surface | What plugs in here |
|---|---|
| `components/DailyJournal.js` | Entry-type picker: Free journal / Thought Record (CBT-001) / Core Belief work (CBT-002) / Gratitude (TR-019) / Taking In the Good (TR-020) / Integration journal (PI-001) / Morning ritual (ST-004) / Evening ritual (ST-005) |
| `components/TriggerTracker.js` | "Work this with a thought record?" action on each trigger entry → opens CBT-001 template prefilled with the trigger as the situation |
| `components/HabitTracker.js` | "New habit" wizard pulls from HAB-001 through HAB-007 as setup templates (anchoring, two-minute, action plan, etc.). Each HAB-* exercise becomes a habit-creation method. |
| `components/CoreBeliefsAssessment.js` | One-time assessment stays. CBT-002 becomes "work a specific belief" — accessed FROM a belief in the assessment results, attached to that belief over time. |
| (new) Session-journal surface | PI-001 + PI-006 + PI-007 as templates around an actual session entry |

## Scope of journal-overhaul chat

Per user 2026-05-22, scope includes:
1. Both integration points for Thought Record (DailyJournal entry type + TriggerTracker-attached)
2. "A bit of an overhaul of the journal" — entry types, structured prompts, longitudinal views
3. Likely touches DailyJournal, TriggerTracker, HabitTracker, CoreBeliefsAssessment, and possibly the Huxley conversational flows

Not in scope for that chat (handled separately):
- Curriculum-trail RN implementation
- The schemas-as-priors v2 framework (deferred)
- Audio recording (tabled)

## Open questions for the journal chat

1. Does "journal" become the primary container (with entry-type sub-views), or do we keep TriggerTracker / HabitTracker / DailyJournal as separate destinations that each accept structured entries?
2. Schema design: do we add an `entries` table with `entry_type` discriminator, or extend existing per-feature tables?
3. AI assistance per entry type — Huxley already does free-journal coaching; does each structured template get its own AI prompt tuned to the template's purpose?
4. Once these move out of `exercises-comprehensive.js`, do the IDs stay (so existing user progress/favorites survive) or get re-issued under new tables?
