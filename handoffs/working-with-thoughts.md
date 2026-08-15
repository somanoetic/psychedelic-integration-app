# Handoff — "Working with Thoughts" cognitive section

## Task
Started as "the `cognitive_patterns` Learn article is a wall of text — should it be
broken into screens / a walkthrough?" Investigation showed the cause is structural,
not layout, and it grew into a five-surface restructure: give CBT/Stoic/contemplative
material a coherent presence across Learn, Practice, Journal, Inner Work and Track,
the way IFS and polyvagal already have.

## Status: SPEC ONLY — nothing built, no app code changed

Full spec: **`context/features/working-with-thoughts.md`** — read that first, it
carries all the reasoning, the evidence, the decided/open split and the file map.
This handoff is the pointer, not a copy.

Working tree: `context/features/working-with-thoughts.md` (new, untracked) +
`LOG.md` (entry added). `.claude/settings.json` was already modified before this
session — unrelated.

## Context from the previous session
`handoffs/learn-hub-tools-practices-rebuild.md` is the direct predecessor — it built
this article and `components/LearnInteractive.js` deliberately, and closed with the
note that the widgets had never been tapped on a device. This session's finding is
essentially that the interactivity outgrew its container: **all five `interactive[]`
blocks in the entire 26-topic Learn library live on this one article**, which is why
only this article reads as a wall.

## What was decided (do not re-litigate)
- **Name/umbrella:** "Working with Thoughts" — CBT + Stoic + Buddhist/ACT. Plain
  language, matches house style. Do not flatten the distinctions between them; the
  spec explains why.
- **Duplication across surfaces is intentional** (article teaches / tracker does /
  worksheet reflects). The bug was always incoherent *linking*, not duplication.
  An earlier draft of the plan got this wrong and was corrected.
- **Flashcards + quizzes are practice, not learning** → move to Practice.
- **Practice grows curated tiles** that **cut across** exercise categories and carry
  **framing** (intro + suggested order), not just a category filter.
- **Add `tags` to library exercises** as the substrate for those tiles.
- **"Quick Grounding" → "Quick Regulation"** (it will absorb breathing + grounding +
  the TR-005…008 grounding annex).

## Key finding — why the exercise categories look mis-filed
Exercise objects have **no `category` field**; category is implied by which array
they sit in and attached at load (`ExerciseLibraryScreen.js:97` filters `p.category`).
One exercise → exactly one home, structurally. That is why IFS-001…008 sit under
`polyvagal`, the ten PI-* integration exercises under `habits`, and CBT-010
*Defusion from Thoughts* (an ACT exercise) under `cbt`.

**These are not editorial mistakes — don't "clean up" the categories.** Tags are the
decided fix; they're additive and leave the existing chip filter untouched.

## What's next (suggested order — each step stands alone)
1. **Routing fix — start here.** `screens/EducationScreen.js:310-347` resolves
   `relatedExercises` only via `getExerciseById` → `GuidedExercise`, so tapping
   "Thought Record" in the article opens a dead 7-step list
   (`content/exercises-comprehensive.js:1473`) instead of the working
   `components/CognitiveDistortionTracker.js` that persists to Supabase. Teach it to
   accept entries with an explicit route; repoint the article; add the reverse link
   from tracker → article (currently one-way). Small, contained, unblocks the rest.
2. **Move the five `interactive[]` blocks** (`content/education.js:1150-1272`) to a
   new "Working with Thoughts" Practice tile. `components/LearnInteractive.js` is
   already stateless and takes `items[]` — reusable as-is. Biggest single reduction
   in the wall of text.
3. **Split the Learn article** into 3–4 prose articles (~6–8 min each).
4. **Journal worksheet** — `content/worksheets/` has 15 configs, none CBT.
5. **Tagging pass** — 160 exercises. Keep the vocabulary small and closed.

## Open — needs the user's input, don't decide unilaterally
- **The candidate tile set** (~8, table in the spec). This is a read of the
  inventory, *not* a clinical judgment — get eyes on it before building.
- **Trauma-specific exercises.** TR-013 Trauma Timeline, TR-022 Inner Child Dialogue
  shouldn't sit casually beside a breathing practice; may belong behind Inner Work
  framing instead.
- **Whether the Learn split gets its own `learnCategories` entry** — if it moves out
  of "Tools & daily practices", `building_habits` is left orphaned.

## Known issues / cautions
- Nothing is device-verified; the widgets have still never been tapped on a phone
  (carried over from the predecessor handoff).
- `content/tracks.js:181` points the curriculum trail at CBT-003 — will need
  repointing if that exercise's role changes.
- Scope grew a lot in one conversation. The order above is deliberately arranged so
  you can stop after step 1 or 2 and still be meaningfully ahead.

---

Read handoffs/working-with-thoughts.md and continue.
