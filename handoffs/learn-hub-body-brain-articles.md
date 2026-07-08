# Handoff — "Body, Brain & Healing" 8-article rebuild (with exercises), merged to master

## Task
Rebuild the Learn hub → "Body, brain & healing" category from 4 to 8 book-sourced
articles, each with an inline practice and links to the existing exercise library.
Drafting followed the outlines/backlog created in a prior planning session.

## Status: DONE + committed + merged to `master` + pushed. Only article #2 device-verified.

## What was done
- Wrote all 8 articles into `content/education.js`:
  - Rebuilt: `somatic_awareness`, `brain_and_healing`, `trauma_understanding`, `attachment_styles`
  - New: `nervous_system_safety`, `mind_body_pain`, `emotional_learning_change`, `mind_brain_relationships`
- Each article source-grounded by a dedicated reader against the actual book texts in
  `knowledge-base/source-materials/extracted-text/`. Real overclaims in the old drafts were
  corrected (see backlog doc). Highest-risk item — the pain article — leads with mandatory
  "see a doctor first" framing.
- Added reusable, data-driven fields per article + render blocks in `screens/EducationScreen.js`:
  - `tryThis: {title, duration, intro, steps[]}` — inline practice (Sparkles card)
  - `relatedExercises: [ids]` — resolved via `getExerciseById` from `content/exercises-comprehensive.js`;
    tapping launches `GuidedExercise` with `returnTo: 'Learn'`. All 18 referenced ids verified to exist.
  - `seeAlso: [topicIds]` — tappable cross-link chips; all targets verified to resolve.
  - `sources: ['Drawn from: …']` — short footer line.
- Wired all 8 into `components/ConversationalEducation.js`: the Body/Brain section is a HARDCODED
  list of `renderTopicCard(...)` calls (NOT the `category.topics` array — that array is effectively
  dead config there), plus `topicDetails` entries and the `TOPIC_ICONS` map. Also updated the matching
  `TOPIC_ICONS` map in `screens/EducationScreen.js`. Bumped the "Browse All 21 → 25 Topics" label.
- All three files pass Babel parse. The full-library browse (`educationTopics.map` in EducationScreen)
  is dynamic, so it picked up the 4 new topics automatically.

## Git state
- Education work committed as `2646aaf` on branch `feat/learn-hub-body-brain-articles` (pushed).
- Merged into `master` and pushed (`589e776..2646aaf`). The fast-forward also carried these
  earlier commits onto master (they were stacked beneath in branch history):
  - `d0414a7` legal corrections, `22d2e33` Multitudes rebrand (both previously approved + pushed)
  - `dc5eaf3` **Attachment Reflection mode** — came along UNINTENTIONALLY; user chose to keep it.
- Current branch when wrapped: `master`.

## Known issues / watch-outs
- **Device verification:** only article #2 ("Your Brain on Healing") has been seen on a device.
  The other 7 articles + the `tryThis`/`relatedExercises`/`seeAlso`/`sources` render blocks need a pass.
- **Attachment Reflection (`dc5eaf3`) is now on master but NOT device-verified.** Test guide:
  `docs/attachment-reflection-test-guide.md`.
- **DMN section (article #2 §7 / "sense of self")** written from Seth/Harris only, no brain-mechanism
  claim — still SOURCE PENDING a psychedelic-neuroscience book. Tracked in the backlog.
- **Article ordering** currently interleaves rebuilt + new by theme; can be regrouped (4 originals first)
  by reordering the hardcoded `renderTopicCard(...)` calls in `ConversationalEducation.js`.
- Pre-existing unrelated uncommitted items remain in the tree (scripts/*.py, .claude/settings.json,
  other handoffs) — deliberately left out of the commit.

## What's next
1. Device walk-through of all 8 articles (Learn → Body, brain & healing) — check prose, the "Try this"
   box, "Practice these" exercise launch + return, "See also" chips, and Sources footer.
2. Device-verify Attachment Reflection (now on master) using its test guide.
3. When a psychedelic-neuroscience source is imported, resolve the DMN backlog item.
4. Optional: regroup article ordering if desired.

## Reference
- Articles/content: `content/education.js`
- Render: `screens/EducationScreen.js` (renderSelectedTopic + the two TOPIC_ICONS maps)
- Category/titles/icons: `components/ConversationalEducation.js`
- Exercise library: `content/exercises-comprehensive.js` (`getExerciseById`)
- Plan + decisions: `context/features/learn-hub-body-brain-outlines.md`
- Open gaps/tensions: `context/features/learn-hub-body-brain-backlog.md`
- Prior handoff (planning phase): `handoffs/learn-hub-body-brain-rebuild.md`

Read handoffs/learn-hub-body-brain-articles.md and continue.
