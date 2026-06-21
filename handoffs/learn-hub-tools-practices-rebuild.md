# Handoff — "Tools & Daily Practices" rebuild + interactive decks

## Task
Flesh out the Learn hub → "Tools & daily practices" category (was 4 thin fly-over
articles) to the same book-sourced quality bar as the recent "Body, brain & healing"
rebuild, and add in-article interactivity (flashcards + scenario quizzes).

## Status: code-complete, tsc clean, NOT device-verified. On branch `master` (uncommitted).

## What was done
- **Rebuilt all 4 articles** in `content/education.js` (~2x length each, named-author sourcing,
  `tryThis`, `relatedExercises`, `seeAlso`, `sources`):
  - `building_habits` — Clear (*Atomic Habits*), Fogg (*Tiny Habits*)
  - `cognitive_patterns` — Grohol, *CBT Workbook for Therapists*, Robertson, Kahneman (the heavy one)
  - `contemplative_practices` — Salzberg, Yates/Culadasa, Brach (RAIN), Wright
  - `acceptance_commitment` — Steven Hayes (ACT founder; no ACT book in-library — see source note)
- **New reusable component** `components/LearnInteractive.js` — self-contained, ephemeral state,
  no backend. Two widget types: `flashcards` (tap-to-flip) and `scenario` (multiple-choice quiz with
  per-answer feedback). Renders an optional `topic.interactive[]` array.
- **Wired into** `screens/EducationScreen.js` `renderSelectedTopic` (after the `tryThis` block):
  `{topic.interactive && <LearnInteractive items={topic.interactive} />}`. Import near other components.
- **Interactive content on `cognitive_patterns`** (5 widgets total):
  - Distortion Deck (17 cards) + "Name the Distortion" quiz (9 items) — from CBT Workbook + Grohol
  - Cognitive Biases Deck (12 cards) + Logical Fallacies Deck (10 cards) + "Spot the Bias or Fallacy"
    quiz (6 items) — adapted (paraphrased, attributed) from the School of Thought CC BY-NC-ND posters
    (`SchoolOfThought_BiasesPoster` / `_FallaciesPoster` in knowledge-base) + Kahneman framing.
- **Two bug fixes:**
  - `components/FormattedText.js` only parsed `**bold**`; the new articles use `*italic*` (73 spans),
    which rendered as literal asterisks. Extended it to handle `**bold**` + `*italic*`/`_italic_` in one
    pass (bold matched first). Strict superset — existing bold behavior unchanged; also fixes stray
    italics app-wide (chat etc.).
  - See-also navigation kept the old scroll position (landed at bottom of new article). Added
    `key={selectedTopic}` to the topic `ScrollView` in `screens/EducationScreen.js` (~L383) so it
    remounts on topic change → scrolls to top AND resets flashcard/quiz state per article.

## Files touched
- `content/education.js` — 4 topic objects rewritten; cognitive_patterns has the 5 interactive widgets
- `components/LearnInteractive.js` — NEW
- `components/FormattedText.js` — italic support
- `screens/EducationScreen.js` — import + interactive render block + `key` on ScrollView
- `context/features/learn-hub-tools-practices-rebuild.md` — full writeup + source-gap notes (S1–S5)
- `LOG.md` — human note (top)

## Verification done
- `npx tsc --noEmit` → exit 0
- `education.js` parses; all 12 `relatedExercises` IDs exist; all `seeAlso` targets resolve
- Quiz integrity: every answer index in range, options unique, correct labels match intended answers
- All content lines have balanced `*` markers (no stray literal asterisks)
- FormattedText parsing unit-tested against real article strings (bold/italic/mixed/quotes/plain)

## Known issues / not done
- **No device verification.** cognitive_patterns now has 3 flip-decks + 2 quizzes — worth eyeballing
  on a phone for scroll length; if heavy, consider splitting biases/fallacies into a sibling article.
- **Not committed.** Working tree on `master` (note: session started on a feature branch but is now on
  master). Other unrelated uncommitted/untracked files also present — commit selectively.
- **ACT sourcing (S1):** no ACT book in `knowledge-base/`; attributed to Hayes by name only.
- **Harvey Norris flashcard book (S5):** practitioner owns physical copy only, no digital; NOT used.
  To extend decks from it, scan/OCR into `knowledge-base/source-materials/cbt-act/` first.

## What's next
1. Run the app, open Learn → Cognitive Patterns & Distortions, verify: italics/bold render styled,
   see-also lands at top, all 3 decks flip, both quizzes give correct feedback.
2. Spot-check the other 3 rebuilt articles render cleanly.
3. Decide on commit (selective) and whether to extend interactivity to the other 3 articles (ideas in
   the feature doc S3) or split the biases/fallacies decks out.

## Where things live
- Content + interactive specs: `content/education.js` (search `id: 'cognitive_patterns'`)
- Component: `components/LearnInteractive.js`
- Render wiring: `screens/EducationScreen.js` (`renderSelectedTopic`)
- Full feature writeup + source gaps: `context/features/learn-hub-tools-practices-rebuild.md`
- CC poster sources: `knowledge-base/source-materials/extracted-text/SchoolOfThought_*Poster_24x36.txt`

Read handoffs/learn-hub-tools-practices-rebuild.md and continue.
