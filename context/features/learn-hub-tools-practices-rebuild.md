# "Tools & Daily Practices" — Learn Hub Rebuild

**Status:** Done (code complete, not yet device-verified)
**Date:** 2026-06-18
**Category:** Learn hub → "Tools & daily practices"
**Companion docs:** `learn-hub-body-brain-outlines.md` / `-backlog.md` (the prior Body/Brain rebuild,
whose quality bar this matches)

## What this did

The four articles in the "Tools & daily practices" category read as thin fly-overs (~5 sections,
~500 words, no sourcing, no practice, no links). Rebuilt all four to the **same standard as the
Body/Brain rebuild**: 6–7 narrative sections (~1,000+ words), **named book/author sourcing**, a
bespoke `tryThis` practice, `relatedExercises` links, `seeAlso` cross-links, and a `sources` footer.

Plus a new dimension the Body/Brain set didn't have: **in-article interactivity** (flashcards +
"name the distortion" scenario quiz), proven on the cognitive-distortions article.

All content in `content/education.js`. Render path unchanged for the static fields (already supported
the new fields); interactivity is a new optional `interactive[]` field + a new component.

## The four articles

| id | Title | Primary sources (all in-library unless noted) | Interactive |
|----|-------|-----------------------------------------------|-------------|
| `building_habits` | Building Integration Habits | James Clear, *Atomic Habits*; BJ Fogg, *Tiny Habits* | — |
| `cognitive_patterns` | Cognitive Patterns & Distortions | Grohol, *Common Cognitive Distortions*; *CBT Workbook for Therapists*; Robertson, *Philosophy of CBT*; Kahneman, *Thinking, Fast and Slow* | flashcards + scenario |
| `contemplative_practices` | Contemplative & Mindfulness Practices | Salzberg, *Real Happiness*; Yates/Culadasa, *The Mind Illuminated*; Brach (RAIN); Wright, *Why Buddhism Is True* | — |
| `acceptance_commitment` | Acceptance & Commitment (ACT) | Steven C. Hayes (ACT founder — see sourcing note) | — |

Sourcing rule used (per practitioner): cite library books where present; where the canon isn't
imported, attribute to the canonical author without claiming a specific imported text; log gaps below.

## Interactive component (new)

- **`components/LearnInteractive.js`** — self-contained, ephemeral state, no backend/persistence.
  Two widget types so far:
  - `flashcards` — tap-to-flip cards, prev/next nav. `{ type, title, intro, cards: [{front, back}] }`
  - `scenario` — multiple-choice with per-option correct/wrong feedback + explanation + next/restart.
    `{ type, title, intro, prompt, items: [{scenario, options:[], answer:<idx>, explanation}] }`
- **Wired in** `screens/EducationScreen.js` (`renderSelectedTopic`) right after the `tryThis` block:
  `{topic.interactive && <LearnInteractive items={topic.interactive} />}`. Styles live in the component.
- **Seed content** (cognitive_patterns): a **17-card "Distortion Deck"** + a **9-item "Name the
  Distortion"** quiz. Built from the union of two in-library sources: the *CBT Workbook for Therapists*
  taught set (all-or-nothing, overgeneralization, mental filters, labeling, shoulds, fortune-telling,
  mind reading, emotional reasoning, comparison game, discounting the positive, catastrophizing,
  magnification/minimization) + Grohol's *Common Cognitive Distortions* (adds jumping-to-conclusions
  umbrella, personalization, blaming, fallacy of fairness, control fallacies). The article's "Common
  Thinking Traps" prose was widened to match and now points readers to the deck as the full reference.

## Source-gap / follow-up notes (mirrors Body/Brain backlog discipline)

### S1. ACT (`acceptance_commitment`) — no imported Hayes text  (sourcing note, low priority)
- The `cbt-act/` library dir has CBT/Stoic material but **no core ACT book** (no *Get Out of Your Mind
  and Into Your Life*, no *A Liberated Mind*). I attributed the framework to **Steven C. Hayes (ACT
  founder)** by name without claiming a specific imported text — consistent with the agreed rule.
- **To unblock a firmer citation:** import a Hayes ACT title (or Russ Harris, *The Happiness Trap*).
  Until then prose stays at "the work of Steven C. Hayes / the broader ACT tradition." No fabricated
  page-level claims shipped.

### S2. Stutz/*The Tools* not used
- `The Tools.txt` (Stutz) is in-library and was floated as an ACT enrichment, but it's a distinct
  method (not ACT) — left out to avoid muddying the ACT framing. Available later if we want a separate
  "tools/practices" piece.

### S5. Logical fallacies & cognitive biases (deck layer 2)  ✅ BUILT 2026-06-18
- The Distortion Deck covers the *cognitive distortion* family; this layer adds the two close cousins:
  **cognitive biases** and **logical fallacies** — same "name it to tame it" idea, one level out.
- **What shipped** (added to `cognitive_patterns.interactive`):
  - New article section **"Beyond Distortions: Fallacies & Biases"** + a 6th key takeaway.
  - **Cognitive Biases Deck** (12 cards) — confirmation, negativity, availability, sunk cost,
    self-serving, fundamental attribution error, spotlight, anchoring, optimism/pessimism, backfire,
    Barnum, Dunning–Kruger. Each reframed for *integration/self-perception*, not debate.
  - **Logical Fallacies Deck** (10 cards) — black-or-white, slippery slope, appeal to emotion, begging
    the question, anecdotal, naturalistic, composition/division, ad hominem (turned inward), Texas
    sharpshooter, middle ground.
  - **"Spot the Bias or Fallacy" quiz** (6 scenarios) drawn from integration self-talk.
  - `estimatedTime` 11→13 min; description + sources footer updated.
- **Sourcing (in-library + open CC):** bias/fallacy content adapted from The School of Thought's
  `SchoolOfThought_BiasesPoster` / `SchoolOfThought_FallaciesPoster` (Jesse Richardson,
  **Creative Commons BY-NC-ND** — yourbias.is / yourlogicalfallacyis.com), with bias framing from
  Kahneman's *Thinking, Fast and Slow*. Selected the integration-relevant subset and rewrote each
  description in our own words for the inner-work context (we did NOT verbatim-copy poster text; CC-ND
  means redistribution must be unmodified, so paraphrase + attribution is the correct posture for
  embedding inside the app rather than reproducing the poster).
- **Harvey Norris flashcard book** (*Flash Card - Cognitive Distortion*, 2012, ISBN 9781475285680) —
  the practitioner's physical reference that prompted this layer. **Physical copy only, no digital;**
  not in `knowledge-base/`. NOT used as a source (can't cite/reproduce until digitized). If digitized
  into `cbt-act/` later, it could enrich/extend these decks. Do NOT reproduce its card text.

### S3. Interactivity not yet extended to the other three
- Per scope decision (2026-06-18), only `cognitive_patterns` got interactive widgets this pass, to
  prove the component. Natural follow-ups if wanted:
  - `building_habits` → "match the law" scenario (which of Clear's 4 laws fixes this broken habit?)
  - `contemplative_practices` → RAIN step-sequencer or a "which practice fits this state?" scenario
  - `acceptance_commitment` → defusion-vs-fusion picker, or value-vs-goal sorting flashcards

### S4. Not device-verified
- tsc clean; `education.js` parses; all 12 `relatedExercises` IDs + all `seeAlso` targets resolve.
  Flashcard flip / quiz feedback / nav not yet exercised on a real device.

## Verification done
- `npx tsc --noEmit` → exit 0
- `node` parse of `education.js`: all 4 topics present, 6–7 sections each, ~1,000–1,115 words each,
  `tryThis`/`relatedExercises`/`seeAlso`/`sources` populated; cognitive_patterns `interactive` =
  flashcards + scenario.
- Link integrity: 12/12 relatedExercise IDs exist in `exercises-comprehensive.js`; all seeAlso resolve.
