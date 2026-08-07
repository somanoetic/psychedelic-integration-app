# Handoff: Trapped screens — Nervous System Basics (no safe-area/back), Inner Atlas, Daily Journal

## Status: CLOSED — committed (2026-08-07 audit). NOT device-verified.

Shipped in two commits: `bebc3ee` (EducationScreen mojibake repair + `wrapWithChrome`
on the six bare widget topics) and `4053256` (Inner Atlas + Daily Journal back
affordance). Verified present in code: `wrapWithChrome` used 8× in
`screens/EducationScreen.js`; `ArrowLeft`/`goBack()` header in
`screens/InnerAtlasScreen.js:276`; `navigation?.goBack()` in
`components/DailyJournal.js:610`. Working tree clean.

Residual: never confirmed on a physical device. Fold into the next device pass —
not worth a dedicated session.

## Task
Beta tester (the user) reported three screens with no way back:
1. "Nervous System Basics" lesson — content cut off at the top by the status bar/notch AND no back button ("only nervous system basics with nothing above it").
2. Inner Atlas — no back button.
3. Daily Journal — no back button on the opening screen.

## Root cause (the important one — #1)
Reached via **Learn → "Teach me the basics" → Nervous System Basics**.
`screens/EducationScreen.js` → `renderSelectedTopic()` special-cases several topic IDs and
returns their standalone widget **bare** — no `SafeAreaView`, no header, no back chrome.
`nervous_system` returns `<PolyvagalEducationWidget>` directly; the widget
(`enhanced-components/PolyvagalEducationWidget.js`) has no safe-area inset and only an
internal "skip" button, so it rendered under the status bar with no way back.
Same defect applied to the other bare special-cases: `ifs_basics`, `grounding_practices`,
`polyvagal_mapping`, `triggers_glimmers`, `regulating_resources`, `ifs_chat`.
NOTE: the generic (non-special-cased) article path was already correct — it wraps content
in a `SafeAreaView` + `topicHeader` back button. So this only ever bit the special-cased
widgets. The other full "nervous system" screens (NervousSystemSummary, NervousSystemMapping,
NervousSystemCheckin) were ALREADY fine and were NOT touched.

## What was done
- **`screens/EducationScreen.js`** — added a `wrapWithChrome(child)` helper inside
  `renderSelectedTopic()` that wraps a widget in the SAME `SafeAreaView edges={['top','bottom']}`
  + `topicHeader` back button the generic article path uses (back calls
  `handleEducationComplete`, which returns to the category list, honoring `returnTo`).
  Applied it to all six special-cased returns. Added a `topicWidgetBody: { flex: 1 }` style.
  (The "← Back" strings show as `â†` mojibake in-file — pre-existing UTF-8 artifact copied
  verbatim from the existing generic path for consistency; renders correctly as an arrow.)
- **`screens/InnerAtlasScreen.js`** — it's a pushed screen (Home grid → `navigate('Atlas')`,
  `headerShown:false`) but had no back button. Imported `ArrowLeft`, added a header `View` +
  `backButton` (→ `navigation.goBack()`) at the top of the scroll content, plus matching
  `header`/`backButton` styles. Copied the exact pattern from `NervousSystemSummaryScreen.js`.
- **`components/DailyJournal.js`** — the back arrow was gated behind
  `(phase !== 'choosing' || showPastEntries)` so it was HIDDEN on the initial "choosing"
  screen, and `handleBack()` only reset internal state (never left the screen). Rewrote the
  header `TouchableOpacity` to ALWAYS render and route by context: past-entries →
  `setShowPastEntries(false)`; a sub-phase → `handleBack()`; the choosing screen →
  `navigation?.goBack()`.

## Current state
- Branch: `feat/neurobiology-of-connection`
- Files touched this session (uncommitted): `screens/EducationScreen.js`,
  `screens/InnerAtlasScreen.js`, `components/DailyJournal.js`, `LOG.md` (this wrap).
- Pre-existing uncommitted changes left untouched (were dirty at session start):
  `.claude/settings.json`, `.vscode/settings.json`, several other `LOG.md`/handoffs/
  intention files per the start-of-session git status.
- NOT device-verified. NOT committed.

## What's next
- Build/run the app and verify on device:
  - Learn → Teach me the basics → Nervous System Basics now has a top inset + back arrow
    that returns to the category list. Spot-check the other wrapped widgets (grounding,
    IFS basics, polyvagal mapping, triggers & glimmers, regulating resources, IFS chat) —
    especially the keyboard-input conversational ones, that the thin header doesn't crowd them.
  - Inner Atlas back arrow returns to Home.
  - Daily Journal: back arrow visible on the opening "choosing" screen and exits to where
    you came from; sub-views still step back internally.
- Then commit. Suggested msg:
  `fix(nav): add safe-area + back chrome to Learn widgets, Inner Atlas, Daily Journal`

## Resume
Read handoffs/learn-widget-back-nav-and-trapped-screens.md and continue.
