# Handoff — Learn hub "Deep-dive / all topics" page cleanup & organization

## Task
Clean up and organize the Learn hub's deep-dive / "all topics" surface. The
"Deep dives & all topics" guided category had a **"Browse All 25 Topics"** button
that flipped into a legacy parallel grid hub (`renderEducationHub`). Investigation
found: wrong count (26 in data / 25 on button / 22 actually curated), four orphan
topics with no category and no icon, and the grid hub fully duplicated the guided flow.

User decisions during the session:
- Confirmed nothing unique is lost → **remove the 4 orphan topics**.
- Confirmed the legacy grid hub is fully redundant → **remove button + dead hub code**.

## Status: CLOSED — committed `ee8d79f` (2026-08-07 audit). NOT device-verified.

Shipped alongside `learn-back-and-home-support-settings.md` in the same commit.
Working tree clean. Residual: no device pass — fold into the next one.

## What was done
- **Coverage analysis** proving the 4 orphans are redundant (each a weaker/static
  copy of live content): `parts_work`→`ifs_basics` widget + `ifs_chat` mode;
  `regulation_practices`→`grounding_practices`+`regulating_resources`+`nervous_system_safety`;
  `johnson_framework`→ live **Active Imagination** AI session (`lib/modeHandlers/ActiveImaginationModeHandler.js`);
  `symbol_meaning`→ richer `lib/symbolLibrary.js` (wired into EnhancedEntityChip).
- Confirmed all 22 surviving topics are reachable through the 5 guided categories,
  so the grid hub adds zero unique reach.

## Files touched (all uncommitted on branch `fix/beta-ux-polish-batch`)
- **`content/education.js`** — deleted 4 orphan topic objects (`johnson_framework`,
  `parts_work`, `regulation_practices`, `symbol_meaning`). 26 → 22 topics. −414 lines.
- **`content/tracks.js`** — re-pointed the 2 trail markers that referenced removed topics:
  - `parts.p1` "What is IFS?" → `{ type: 'education', refId: 'ifs_basics' }` (subtitle "Learn · 7 min")
  - `integration.i5` → title "Active Imagination", `{ type: 'conversational', refId: 'ActiveImagination' }` (subtitle "Guided · 15 min")
- **`components/ConversationalEducation.js`** — removed `deep_dives` category, `renderDeepDives`
  (the "Browse All 25 Topics" button), its switch case, `onViewAllTopics` prop, `Library`/`ExternalLink`
  imports, and 5 dead styles (`allTopicsButton`, `allTopicsContent`, `allTopicsTitle`,
  `allTopicsDescription`, `popularLabel`).
- **`screens/EducationScreen.js`** — removed unreachable `renderEducationHub`, `showConversational`
  state + Guided toggle, simplified back-button label logic, dropped now-unused imports
  (`MessageCircle`, `Lightbulb`, `educationTopics`). −193 lines. Learn hub is now a single guided path.

## Verification done
- All four files babel-parse clean (`babel-preset-expo` for the JSX files).
- `educationTopics` now lists exactly 22 ids (verified by grep).
- No remaining references anywhere to `showConversational`, `renderEducationHub`,
  `onViewAllTopics`, `renderDeepDives`, `deep_dives`, or the 4 removed topic ids.
- No tests reference removed topics / `educationTopics`. (The `parts_work` hits in
  `__tests__` are the unrelated huxleyKnowledgeBase homework-template / detected-intent
  string constants — not the education topic id.)

## Navigation wiring confirmed (static, not run on device)
- `type: 'education'` marker → `navigation.navigate('Learn', { selectedTopicId })`;
  `ifs_basics` is a special-case in `EducationScreen.renderSelectedTopic` (renders
  IFSPartsEducationWidget), so it resolves even though it isn't in `education.js`.
  Trail card body text falls back to "A short reading." (acceptable).
- `type: 'conversational'` marker → `navigation.navigate('ActiveImagination')`; route
  registered in `App.js` (~L766).

## Known issues / watch-outs
- **Not device-verified.** Should walk the trail in the running app to confirm
  `parts.p1` and `integration.i5` open the right screens.
- **Dead style objects left in `screens/EducationScreen.js`** (the old hub's header/section/
  grid/card styles). Harmless and unreferenced; pruning ~40 keys was skipped to keep the
  diff focused and avoid nicking a shared style. Optional follow-up sweep.
- Pre-existing unused `renderUserOption` / `USER_OPTION_ICON_MAP` in
  `ConversationalEducation.js` left untouched (not part of this task).

## What's next
1. (Optional) Run on device: tap "What is IFS?" and "Active Imagination" on the trail,
   confirm correct destinations; open Learn → categories to confirm the deep-dives card is gone.
2. (Optional) Prune the dead styles in `screens/EducationScreen.js`.
3. Commit (branch already `fix/beta-ux-polish-batch`) and fold into the open beta-UX PR.

## Reference
- Content: `content/education.js`; trail data: `content/tracks.js`; trail nav: `components/TrailScreen.js`
- Render: `screens/EducationScreen.js`; guided categories: `components/ConversationalEducation.js`
- Active Imagination (Johnson method, live): `lib/modeHandlers/ActiveImaginationModeHandler.js`, `screens/ActiveImaginationScreen.js`
- Symbol library (live): `lib/symbolLibrary.js`

Read handoffs/learn-hub-all-topics-cleanup.md and continue.
