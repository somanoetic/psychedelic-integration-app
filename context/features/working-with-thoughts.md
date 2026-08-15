# Feature: "Working with Thoughts" — a coherent cognitive section

**Status:** planned
**Created:** 2026-08-07
**Surfaces touched:** Learn, Practice, Journal, Inner Work, Track

## Problem

The `cognitive_patterns` Learn article is a wall of text. It carries ~1,900 words
across 7 prose sections, **39 flashcards** (3 decks) and **15 quiz items** (2
scenario sets) in one unbroken `ScrollView`. Labelled "13 minutes"; realistically
far more.

The root cause is structural, not editorial. Compare the footprint that the
mature modalities have across the app:

| Surface | IFS | ANS / Polyvagal | CBT (today) |
|---|---|---|---|
| Inner Work | IFS Parts Work → `IFSChat` | Triggers & Glimmers, Nervous System Map, Regulating Resources | Core Beliefs ✓ |
| Track | Parts Check-in | Nervous System Check-in, Glimmer, Trigger | Thought Record ✓ |
| Learn | `parts_work`, `ifs_chat` | `nervous_system`, `polyvagal_mapping`, `nervous_system_safety`, `triggers_glimmers`, `regulating_resources` | **`cognitive_patterns` — one article doing four articles' work** |
| Practice | — | grounding category | **`cbt:` + `stoic:` categories exist, surfaced nowhere** |
| Journal | — | — | **no CBT worksheet** |

ANS gets five Learn articles for its material. CBT gets one. That is the entire
wall-of-text problem: the content has nowhere else to go, so it is crammed into a
single article inside "Tools & daily practices" — a grab-bag category (habits +
CBT + contemplative + ACT) that isn't about any of them.

Two supporting findings:

1. **Every `interactive[]` block in the whole Learn library lives on this one
   article** (`education.js` 1150–1272). No other topic of 26 uses the feature.
   The mechanism exists *only* here, which is why only this article reads as a wall.
2. **The article's "Practice these" links mis-route.** `relatedExercises:
   ['CBT-003', 'CBT-001', 'CBT-002']` resolves through `getExerciseById` →
   `GuidedExercise`, so tapping "Thought Record" opens a static 7-step list
   (`exercises-comprehensive.js:1473`) instead of the working
   `CognitiveDistortionTracker` that persists to Supabase.

## Framing decision: "Working with Thoughts", not "CBT"

The umbrella is a **family of approaches to a thought that has you** — CBT,
Stoicism, Buddhist-contemplative, and ACT. This is a better organizing idea than
CBT alone, and it avoids jargon (house style is plain language: "Triggers &
Glimmers", "Nervous System Map").

The lineage is already written into the content:
- `education.js:1030` opens with Epictetus; `:1130` makes the Stoic → Beck/Ellis
  lineage a key takeaway.
- `stoic:` exercise category exists (ST-001 negative visualization, ST-002 view
  from above) at `exercises-comprehensive.js:2107` — currently surfaced nowhere.
- `contemplative_practices` covers defusion via Wright's *Why Buddhism Is True*
  (`education.js:2207`).

**Do not let the umbrella flatten the distinctions.** CBT disputes a thought's
*accuracy*; ACT and contemplative practice change your *relationship* to it
without arguing; Stoicism sorts by *control*. `education.js:2478` already draws
the CBT/ACT contrast well — preserve that. Keeping these distinct is what makes
the section useful rather than mush.

## Principle: duplication across surfaces is intended

Explicitly decided, and it overrides an earlier draft of this plan. The article
teaching what a thought record *is*, the tracker letting you *do* one, and a
journal worksheet for sitting with one are **different jobs for different states**.
Someone reading Learn at 11pm isn't ready to fill in a form; someone opening the
tracker mid-spiral doesn't want a Kahneman preamble.

Each surface keeps enough standalone content to work on its own terms. The
problem was never duplication — it was **incoherent linking** between the copies.

## Plan

### 1. Learn — split into right-sized prose articles

Split `cognitive_patterns` into 3–4 articles of ~6–8 min each, matching the rest
of the library. Prose only; the widgets move to Practice (see §2), which by
itself removes 39 cards + 15 quiz items from the scroll.

- **Distortions** — the named traps. Trim the 11-item prose list
  (`education.js:1037-1061`) to ~4 exemplars now that the deck lives in Practice.
- **Biases & fallacies** — section 7 (`:1115`) is already written as a
  self-contained mini-article ("Beyond Distortions"); it separates along a seam
  that already exists.
- **The lineage & restructuring** — Stoics → Beck/Ellis, ABCDE, the thought
  record. Where Stoic material lands.

`core_beliefs`, `acceptance_commitment` and `contemplative_practices` stay where
they are and cross-link in via `seeAlso`.

Open: whether these get a new `learnCategories` entry or stay in "Tools & daily
practices". If they move out, `building_habits` is left with only
`contemplative_practices` — may want its own rethink.

### 2. Practice — curated tiles (generalized pattern)

**Decided: Practice grows a real category concept**, not just another
`params: { category }` deep link. The tile hosts widgets *and* exercises
together — that is what makes this read as a section rather than scattered pieces.

**"Working with Thoughts" is the first instance of a repeatable pattern, not a
one-off.** 160 exercises across 11 categories currently sit behind a single tile.
`ExerciseLibrary` is a flat chip-filter + search screen; ten of eleven categories
have no curated entry point anywhere in the app. Practice has exactly one curated
tile today ("Quick Grounding", `PracticeScreen.js:47-55`) — the pattern already
exists, it was just built once and never extended.

Division of labour:
- **Index** = `ExerciseLibrary`, unchanged. Search everything, filter by chip.
  For when you know what you want.
- **Curated tiles** = Practice. Framed entry points with "why this, when."
  For when you don't.

#### Decided: tiles cut ACROSS categories, and carry framing

Both confirmed 2026-08-07. Cut-across was checked against the full inventory
before committing, and the check surfaced that **the stored categories are
actively mis-filed in places** — category-as-tile would inherit those mis-files
and present them to users as intentional:

- `polyvagal` is a bucket holding three modalities: PV-001…016 (polyvagal),
  **IFS-001…008 (parts work)**, SC-001…008 (self-compassion).
- `habits` contains all ten **PI-\* integration exercises** (Integration
  Journaling, Insight-to-Action Bridge, Symbol & Theme Mapping) — core
  integration work hidden under "habits".
- `trauma` has absorbed a **grounding annex** — TR-005…008 (foot grounding,
  categories game, numbers, crown technique) are plain grounding.
- `cbt` already spans the umbrella: **CBT-007** is the ABCDE model, **CBT-010 is
  *Defusion from Thoughts* — that's ACT, not CBT.**

Cutting across fixes these at the presentation layer with **no data migration**:
the `category` field stays as-is for `ExerciseLibrary`'s chips, and tiles select
by explicit exercise-ID list.

Framing is a requirement, not a filter: each tile carries a short intro and
(where useful) a suggested order. That is what makes it guidance rather than a
shortcut.

#### Candidate tile set (~8, for review)

| Tile | Draws from | Rough n |
|---|---|---|
| Working with Thoughts | `cbt` + `stoic` + CBT-010 defusion | ~18 |
| Parts Work | IFS-001…008 (stored under `polyvagal`) | 9 |
| Nervous System & State | PV-001…016 | ~18 |
| Quick Regulation | `breathing` + `grounding` + TR-005…008 | ~20 |
| In the Body | `somatic` + `yoga` | 22 |
| Self-Compassion | SC-001…008 + TR-019…021 gratitude | ~11 |
| Stillness & Awareness | `meditation` | ~11 |
| Shadow & Symbol | `jungian` + PI-006 | ~9 |
| Integration Practices | PI-001…010 (stored under `habits`) | 10 |

~128 of 160 get clean homes. Remainder (`habits` proper, trauma-specific TR-\*)
either get a further tile or stay index-only.

**Decided:** "Quick Grounding" is replaced by **"Quick Regulation"**. Once
breathing + grounding + the TR-005…008 grounding annex sit together, "grounding"
only ever described a third of it.

Open / needs care:
- **Trauma-specific exercises need care.** TR-013 Trauma Timeline, TR-022 Inner
  Child Dialogue should not sit casually beside a breathing practice; they may
  belong behind Inner Work framing rather than a Practice tile.

#### Tags — the substrate for cut-across tiles

**Decided:** add a `tags` field to library exercises.

Current shape is uniform and minimal — all 160 exercises carry exactly `id`,
`title`, `steps`, `source`, `instructions`, `duration` (plus `variationOf` on 12).
**There is no `tags` field, and no `category` field on the exercise objects
themselves** — category is implied by which array an exercise sits in, and is
attached during load (`ExerciseLibraryScreen.js:97` filters on `p.category`).

That single-home constraint *is* the root cause of the mis-files above: CBT-010
cannot be both `cbt` and ACT, and IFS-001 cannot be both parts-work and
polyvagal, because the model permits exactly one.

Tags fix this properly:
- A tile becomes "everything tagged `working-with-thoughts`" rather than a
  hand-maintained ID list.
- An exercise can legitimately belong to two tiles — which the ID-list approach
  fakes and the `category` field forbids.
- Additive and non-destructive: `category` and the existing chip filter are
  untouched.

Tradeoff, stated honestly: 160 exercises is a real tagging pass, and tags drift
without discipline. **Keep the vocabulary small and closed** — roughly the tile
set, plus a few cross-cutting ones (`quick` for <5 min, `trauma-sensitive`,
`needs-privacy`). Not freeform.

#### For the Working with Thoughts tile specifically

- Move all five `interactive[]` blocks out of `education.js` into this surface.
  `LearnInteractive` (`components/LearnInteractive.js`) is already stateless and
  takes `items[]`, so it can be reused as-is — no rewrite.
- Surface `cbt:` and `stoic:` here. This also gives CBT-001 / CBT-003 a
  legitimate home, resolving the dead-content question without deleting anything.
- Follow the existing tile shape in `PracticeScreen.js:22-56`.

Rationale for treating the widgets as practice: flipping 12 cards and testing
yourself on 6 scenarios is repeatable, self-testing, and has no fixed endpoint.
Reading *about* confirmation bias is learning. Different jobs.

### 3. Journal — add a thought-record worksheet

The real gap. All 15 configs in `content/worksheets/` are baseline / daily /
education / post-session; none are CBT. Add one per the §"duplication" principle —
the tracker is for catching a thought in the moment, the worksheet is for sitting
with one.

### 4. Routing — let Learn articles link to real tools ✅ DONE 2026-08-07

`EducationScreen.js` resolved `relatedExercises` only through `getExerciseById` →
`GuidedExercise`. It now accepts entries carrying an explicit route, so articles
can point at `CognitiveDistortionTracker` and other real tools. **This was the
enabling change and it benefits every article, not just these.**

Shipped:
- `resolveRelatedExercise()` helper in `EducationScreen.js` accepts either a
  plain exercise-ID string (unchanged behaviour) or
  `{ key?, title, route, params?, meta? }` for an explicit route.
- `cognitive_patterns`' "Thought Record" link repointed from the dead CBT-001
  step list to `CognitiveDistortionTracker`, labelled
  "Guided tool · saves to your history".
- Reverse link added: a quiet "What are distortions?" affordance under the
  distortion multi-select in `CognitiveDistortionTracker`, deep-linking to
  `Learn` with `selectedTopicId: 'cognitive_patterns'`.

Verified by transpiling the content modules and running the resolver over the
whole library: 26 topics load, all 38 `relatedExercises` entries across every
article resolve, 0 unresolved, exactly 1 routed to the new tool path.

`content/tracks.js:181` (curriculum trail → CBT-003) needed **no** change —
CBT-003 is still a plain string entry and its role is unchanged.

Not device-verified.

### 5. Already done — no work needed

- Inner Work: Core Beliefs → `CoreBeliefs` (`InnerWorkScreen.js:43-49`)
- Track: Thought Record → `CognitiveDistortionTracker` (`TrackHubScreen.js:49`)

## Suggested order

1. ~~Routing change (§4)~~ — ✅ done 2026-08-07
2. Practice tile + widget move (§2) — biggest single reduction in the wall of text
3. Learn split (§1)
4. Journal worksheet (§3)
5. Tagging pass (§2, `tags`) — 160 exercises

## Key files

- `content/education.js:1014-1322` — the `cognitive_patterns` article
- `components/LearnInteractive.js` — widget renderer, reusable as-is
- `screens/EducationScreen.js:243-347` — article scroll + `relatedExercises`
- `screens/PracticeScreen.js:22-56` — tile list
- `content/exercises-comprehensive.js:1471` (`cbt:`), `:2107` (`stoic:`)
- `components/CognitiveDistortionTracker.js` — the working thought record
- `content/worksheets/` — journal worksheet configs
