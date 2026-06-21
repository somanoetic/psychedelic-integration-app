# Handoff — "Body, Brain & Healing" learning articles: book-sourced rebuild (planning)

## Task
User asked to make the Learn hub → "Body, brain & healing" category "more organized and
thorough," then refined the goal: rebuild articles from the **imported books as source of
truth**, and expand beyond the original 4 articles to a fuller accessible set. This session was
**research + scoping + outlines only** (user chose "outlines first, then draft"). No app code
touched.

## Status: OUTLINES COMPLETE, awaiting user review. Drafting NOT started. No code changes.

## What was done
- Mapped the existing category: 4 articles defined in `content/education.js`
  (`somatic_awareness`, `brain_and_healing`, `trauma_understanding`, `attachment_styles`),
  grouped under `body_and_brain` in `components/ConversationalEducation.js` (~L78), rendered by
  `screens/EducationScreen.js` `renderSelectedTopic` (~L364-422).
- Confirmed the render mechanism for two planned additions:
  - **Sources footer** = add optional `sources: []` to each topic + a render block after
    `keyTakeaways` in EducationScreen.js.
  - **Tappable cross-links** = add optional `seeAlso: [topicId]` + a render block calling the
    existing `handleTopicPress(id)` (EducationScreen.js ~L80). No new navigation needed;
    `getTopicById` resolves any id.
- Verified ALL source books exist as extracted text in
  `knowledge-base/source-materials/extracted-text/` (no conversion needed, incl. the AAI docs).
- Fanned out subagent readers over the actual book texts to produce book-grounded outlines for
  **8 articles** (4 rebuilt + 4 new), every claim tagged with `[book — concept]`.
- Resolved two content tensions empirically by grepping the library (both confirmed user's
  instinct):
  - **Brain on Healing** presents BOTH emotion models (evolved circuits: Panksepp/Damasio,
    amygdala is real; AND constructed emotion: Barrett). Not a debunk.
  - **Attachment** keeps the four standard styles — they ARE in-library (Siegel,
    *Interpersonal Neurobiology and Clinical Practice*, names all four + earned-secure;
    Sensorimotor mirrors). Enriched with Maté (*Scattered* ch.9, *Myth of Normal*) and a
    patient-facing narrative-coherence idea drawn from the AAI docs.

## Deliverable (the important artifact)
- **`context/features/learn-hub-body-brain-outlines.md`** — the full review doc: scope &
  decisions, render/implementation notes, all 8 outlines (sections + Try-This + takeaways +
  cross-links + per-article source/nuance/pending notes), and 5 open questions for the user.

## The 8 articles (see outlines doc for detail)
1. 🫁 Somatic Awareness (rebuild) — Ogden, Somatic Toolbox, Somatic Therapy for Healing
2. 🧬 Your Brain on Healing (rebuild, BOTH models) — Barrett, Panksepp, Damasio; **DMN = SOURCE PENDING**
3. 🌿 Understanding Trauma (rebuild) — Maté, Perry, Complex PTSD Manual
4. 🤝 Attachment & Relationships (rebuild, 4 styles) — Siegel IPNB-Clinical, Sensorimotor, +Maté, +AAI coherence, Perry/Neufeld
5. 🚦 Your Nervous System & Safety (new) — Deb Dana polyvagal ×3
6. 🫀 Mind-Body Connection & Pain (new) — Gordon, Schubiner, Schechter (medical disclaimer required)
7. 🌀 How Emotional Learnings Change / reconsolidation (new) — Ecker, Unlocking the Emotional Brain
8. 🧩 Mind, Brain & Relationships / IPNB (new) — Siegel: Mindsight, Pocket Guide, Mindful Therapist

## Current state
- Branch: `master`. Nothing committed for this work.
- Only new file from this session: `context/features/learn-hub-body-brain-outlines.md` (untracked).
- Pre-existing unrelated uncommitted items remain (per `git status`): modified components from
  prior sessions, `.claude/settings.json`, `LOG.md`, earlier handoffs, untracked design PNGs.
- No `content/education.js` / `EducationScreen.js` / `ConversationalEducation.js` edits yet.

## Known issues / watch-outs / parked items
- **DMN section (§2.7)** has no in-library source. User said they'll **add a psychedelic-
  neuroscience book** (e.g. Carhart-Harris). Partial cover only in *Being You* (Seth) /
  *Waking Up* (Harris). Keep section flagged SOURCE PENDING until a book is added.
- **Mind-Body & Pain (#6)** REQUIRES a medical disclaimer (rule out structural causes first;
  never tell users to stop care/meds; don't claim all pain is psychological).
- **Attachment labels** (anxious/avoidant etc.) trace to Ainsworth/Main; in-library books cite
  them, so a light "(classic attachment research)" nod suffices — no out-of-library citation.
- **Parked (NOT this project):** AAI → a guided clinician-side Huxley session (source docs:
  `extracted-text/Adult_Attachment_Interview-Main.txt`, `..._Questions_and_Goals.txt`).
  SOURCE index (`knowledge-base/SOURCES.md`) → user will do in a separate chat.

## What's next
1. User reviews/edits `context/features/learn-hub-body-brain-outlines.md`.
2. Answer the 5 open questions at the bottom of that doc (esp. the DMN book; also ordering,
   footer style, cross-link UI, icons for the 4 new topics — TOPIC_ICONS map needs entries).
3. Draft the first full article for review — **recommended start: #2 Your Brain on Healing**
   (biggest content shift; proves the template + the trickiest editorial call first).
4. Then add `sources`/`seeAlso` render blocks to EducationScreen.js and wire all 8 in
   `content/education.js` + `ConversationalEducation.js` (category, titles, icons).

## Reference
- Outlines doc: `context/features/learn-hub-body-brain-outlines.md`
- Source texts: `knowledge-base/source-materials/extracted-text/*.txt`
- Render: `screens/EducationScreen.js`, content: `content/education.js`, category/titles/icons:
  `components/ConversationalEducation.js`
- Memory: `project_feature_education_surface.md`, `feedback_design_not_dark_theme.md`,
  `project_history_tab_routing.md`

Read handoffs/learn-hub-body-brain-rebuild.md and continue.
