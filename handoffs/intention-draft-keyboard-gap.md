# Handoff — Set Intention keyboard white gap (Android)

## Status: BLOCKED on Android device verification (tabled 2026-07-26).

Branch: `feat/neurobiology-of-connection`.

### Where this stands (2026-07-26)
Two separate pieces, needing two separate phone checks — both BLOCKED because
no Android device was available:

- **Screen A — session-prep intention** (`SessionPreparationScreen.js`,
  `renderIntentionSetting`): the ORIGINAL reported bug. Fix is **committed**
  (`18a1eb4`). Never confirmed on-device.
- **Screen B — AI-guided draft editor** (`components/intention/IntentionDraftEditor.js`
  + `screens/SetIntentionScreen.js`, `draft` mode): a real, self-consistent
  keyboard-avoidance rewrite of the *other* look-alike screen — removed manual
  JS keyboard-height listeners + `paddingBottom: 24 + keyboardHeight`, replaced
  with platform-native avoidance (Android `adjustResize`; iOS
  `automaticallyAdjustKeyboardInsets`). These edits are **UNCOMMITTED** in the
  working tree, deliberately held back until verified. (The "wrong screen" note
  in Loose Ends below was mid-session confusion; the surviving edits are wanted
  and coherent.)

### To resume (needs an Android phone)
1. **Screen A:** session flow → "Set Your Intention" step → tap the
   "write it yourself" box. Pass = keyboard rises, box sits directly above it,
   NO white strip; dismiss = clean snap-back, no lingering gap.
2. **Screen B:** tap "AI-Guided Intention ✨" → draft → "Write Your Intention"
   editor → tap the draft box. Pass = input scrolls above keyboard, NO gap, and
   the Save button stays reachable (not trapped under keyboard); dismiss = clean.
3. Both pass → commit Screen B (`IntentionDraftEditor.js` + `SetIntentionScreen.js`)
   as its own commit. B fails → fix or revert those two files. A fails → separate
   issue on the already-committed `18a1eb4`.

## The screen (important — there are TWO look-alike intention screens)
The reported bug is on **`screens/preparation/SessionPreparationScreen.js`**, the
`renderIntentionSetting` step. Identify it by its UI: hero "Set Your Intention",
an "AI-Guided Intention ✨" button, "or write it yourself:", a "Write your
intention here..." box, and a "Save Intention" button.

Do NOT confuse it with the OTHER intention flow reached by tapping that blue
button: `screens/SetIntentionScreen.js` + `components/intention/IntentionDraftEditor.js`
("Write Your Intention", "Save & Sync"/"Save Locally"). Early in the session I
edited that wrong pair before realizing — see "Loose ends".

## Symptom
Android: tapping the custom-intention box raised the keyboard with a white gap
above it that lingered/grew on dismiss; in some intermediate attempts the box was
covered by the keyboard instead.

## Root cause (the real one, after several wrong turns)
Layering. Each section renderer wrapped its content in its OWN `LinearGradient`,
rendered INSIDE the screen's `KeyboardAvoidingView`. On Android with
`windowSoftInputMode="adjustResize"` + `behavior="height"`, the KAV shrinks its
child when the keyboard opens — shrinking that inner gradient and exposing the
`SafeAreaView`'s white background as a strip above the keyboard. (A later attempt
that added a SECOND outer gradient produced a visible seam — two slightly
misaligned gradients stacked.)

## Fix (committed in `18a1eb4`, file: SessionPreparationScreen.js)
Mirrors the device-verified `components/DailyJournal.js` pattern:
- ONE `LinearGradient` hoisted to the OUTERMOST wrapper (gradient → SafeAreaView
  → KeyboardAvoidingView). All 8 section renderers changed from their own
  `<LinearGradient style={gradientFill}>` to plain `<View style={gradientFill}>`,
  so only the single outer gradient shows (no seam, no exposed white).
- `styles.container` (SafeAreaView) set `backgroundColor: 'transparent'`.
- KAV kept on BOTH platforms (`behavior` ios:padding / android:height,
  `keyboardVerticalOffset` ios:0 / android:20).
- Added a `keyboardWillShow`/`keyboardDidShow` listener (scoped to
  `currentSection === 'intention_setting'`) that `scrollToEnd` on
  `intentionScrollRef`, so the low box + Save button clear the keyboard.
- Imported `Keyboard`; added `intentionScrollRef`; added `keyboardDismissMode="interactive"`
  to the intention ScrollView.

Verified only by `babel.parseSync` (parses clean). NOT run on a device.

## What's next
1. Device-test on Android: no white gap, no seam, box+Save scroll above keyboard.
2. Spot-check iPhone (logically unchanged — same KAV padding path).
3. Decide on the loose-end files (below).

## Loose ends
- `components/intention/IntentionDraftEditor.js` and `screens/SetIntentionScreen.js`
  are MODIFIED but UNCOMMITTED — edits from when the wrong screen was open. They
  target the separate AI-guided draft editor (pulled draft mode out of its KAV,
  swapped to `automaticallyAdjustKeyboardInsets` on iOS, stripped its custom
  keyboard listeners). Plausible improvements but UNVERIFIED and unrelated to the
  committed fix. Either `git checkout -- <both files>` to discard, or verify+commit
  separately.
- Many other files show as modified in the tree (spell-check work, trackers, etc.)
  — pre-existing from earlier sessions, NOT part of this task.

## Reference
- Pattern source: `components/DailyJournal.js` (~lines 62-75 keyboard listener,
  ~588-599 gradient→SafeAreaView→KAV order). This is the canonical working example.
- Memory: `project_chat_keyboard_gap_android.md` (Android keyboard fix — pad by
  FULL keyboard height, don't subtract insets.bottom).
- Related handoff: `handoffs/set-intention-chat-input.md` (the CONVERSATION mode
  fix on the OTHER intention screen).

Read handoffs/intention-draft-keyboard-gap.md and continue.
