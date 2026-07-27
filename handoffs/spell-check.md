# Handoff — Spell check across app inputs

## Task
User asked to add spell check to the chats and journal. Scope was then widened
(via a question) to **all free-text inputs app-wide**. Follow-up: user noticed
autocorrect fixed obvious typos but nothing flagged others → we explained the
platform reality and chose **Option A** (native per-platform behavior, no library)
**plus journal autocorrect off**.

## Status: CLOSED — committed `72b0c04` (2026-07-26).

Committed the batch (26 files staged this pass; a few of the original ~30
belonged to other threads and were committed separately). One residual,
non-blocking follow-up left open: a quick on-device eyeball (iOS underline +
no silent autocorrect in journals; Android suggestion strip + no crashes).
Not a blocker — the feature is native and low-risk. Original notes below.

---

## (original) Status: DONE (code changes only) — NOT device-verified, NOT committed.

## What was done
Spell check in React Native is a native OS feature (no library). We enabled it by
adding three props to each free-text `TextInput`:
```
spellCheck={true}
autoCorrect={true}
autoCapitalize="sentences"
```
- **47 free-text inputs across 30 files** got the props. Done via three parallel
  sub-agents that classified each `<TextInput>` as free-text (enable) vs structured
  (skip). See the git diff for the full file list.
- **Deliberately skipped** (structured — autocorrect harmful): AuthScreen email/
  password, numeric fields (sleep hours, years of experience, duration), dates
  (Journey Date, DOB), search bars, short-token fields (medicine, dosage, habit
  name, keyword tags).
- Skipped `lib/archive/*` (dead) and the 4 dead chat screens (EnhancedConversation,
  SimpleEnhancedConversation, DualModeConversation, EnhancedExperienceMapping).

Then, per the Option-A + journals decision, flipped **journals to `autoCorrect={false}`**
(kept `spellCheck={true}`) so entries aren't silently rewritten:
- `components/DailyJournal.js` — 1 input
- `components/PostSessionIntegrationJournal.js` — 2 inputs (both prose textareas)

## Current state
- Branch: `feat/neurobiology-of-connection` (unchanged from session start).
- All spell-check edits are **uncommitted** in the working tree.
- Verify counts anytime with:
  `grep -rn "spellCheck={true}"` (expect 47) and
  `grep -rn "autoCorrect={false}"` in the two journal files (expect 3).
- Pre-existing / ambient uncommitted changes NOT part of this task:
  `.claude/settings.json`, `LOG.md`, `components/ConversationalTriggeredSupport.js`
  (a navigation back-step feature — has NO TextInputs, untouched by this work),
  and other in-flight work from parallel sessions.

## Known issues / watch-outs
- **Android has no red-underline**: RN's `TextInput` does not expose Android's
  system spell-check underline — `spellCheck` only drives the iOS underline. On
  Android users get only the keyboard suggestion strip. This is the accepted
  Option-A tradeoff. If the tap-to-fix underline on Android becomes a hard
  requirement later, that's Option B (custom overlay + a JS dictionary like
  `nspell`) or Option C (native module bridging Android SpellCheckerSession) —
  both are real features, not tweaks.
- Not run on a device. Worth a quick eyeball on both iOS and Android.

## What's NEXT
- Device-test on iOS (confirm journal underline + no silent autocorrect) and
  Android (confirm suggestion strip; no crashes).
- Commit when satisfied (e.g. `feat(inputs): enable spell check on free-text; disable autocorrect in journals`).

## Reference
- Full file list + exact inputs: `git diff` on the working tree.
- Env: React Native 0.81.5, Expo ~54 (managed).

Read handoffs/spell-check.md and continue.
