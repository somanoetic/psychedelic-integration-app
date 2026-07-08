# Handoff — Set Intention keyboard white gap (Android)

## ⚠️ CORRECTION — the actual bug was in a DIFFERENT file
The screen the user reported (screenshots: "AI-Guided Intention ✨" button + "or
write it yourself:" + "Write your intention here..." + "Save Intention") is
**`screens/preparation/SessionPreparationScreen.js`** — the `renderIntentionSetting`
step, wrapped by a whole-screen `KeyboardAvoidingView`.

**Root cause & fix (line ~1338):** that KAV used `behavior="height"` on Android.
With `windowSoftInputMode="adjustResize"` + edge-to-edge, Android already shrinks
the window, so the KAV double-compensated → white gap that lingered/grew on
dismiss. Fixed: iOS keeps `KeyboardAvoidingView behavior="padding"`; **Android
renders `renderCurrentSection()` directly (no KAV)** and trusts `adjustResize`.
File parses clean. **NOT device-verified yet** — user should tap the box on Android.

The edits below (IntentionDraftEditor / SetIntentionScreen) were made BEFORE
realizing the wrong file was open. They target the SEPARATE AI-guided flow
(`SetIntentionScreen` "Write Your Intention" draft editor, reached via the blue
button). They're plausible improvements but UNVERIFIED and unrelated to the
reported bug. Decide whether to keep or `git checkout` them.

---

# (superseded) Handoff — "Write Your Intention" draft editor keyboard gap

## Task
On the Set Your Intention screen, the **draft editor** (the "Write It Myself" /
rephrase-your-own-words mode, NOT the Huxley conversation mode) had keyboard bugs:
- iPhone: tapping the text box hid the entire input behind the keyboard.
- Android: the Save button stayed partly under the keyboard; then a white gap
  appeared between the top of the keyboard and the content, and it persisted /
  grew after the keyboard was dismissed.

## Status: PARTIAL — iOS/button improved, but Android white gap STILL PRESENT per user. NOT committed. NOT device-verified.

## Files touched this session (uncommitted, on branch `feat/neurobiology-of-connection`)
- `screens/SetIntentionScreen.js` — `draft` mode now renders OUTSIDE the parent
  `KeyboardAvoidingView` (same treatment conversation mode already had), so the
  editor owns keyboard avoidance alone. Templates + welcome still inside the KAV.
- `components/intention/IntentionDraftEditor.js` — reworked the editor's own
  ScrollView keyboard handling (see below).
- (`components/IntentionSetting.js` is also modified but that's from a PRIOR
  session's spell-check work — unrelated to this task.)

## What was tried (in order)
1. Pulled draft mode out of the KAV so only the editor's ScrollView handles the
   keyboard (it already tracks `keyboardHeight` + scrolls the focused input in).
2. Editor: re-trigger scroll-into-view when `keyboardHeight` becomes known (iOS
   keyboard animates in AFTER onFocus, so focus-only scroll raced the resize).
   Added `onBlur` to reset an `inputFocusedRef`.
3. iOS: enabled `automaticallyAdjustKeyboardInsets`, `keyboardDismissMode="interactive"`,
   `contentInsetAdjustmentBehavior="never"`; dropped manual `paddingBottom:keyboardHeight`
   on iOS (was double-compensating → white gap).
4. Android: user then reported the gap was on ANDROID. Confirmed app uses
   `windowSoftInputMode="adjustResize"` (AndroidManifest.xml:20) +
   `softwareKeyboardLayoutMode: "resize"` (app.config.js:47) — window already
   shrinks for the keyboard. So the editor's manual `paddingBottom: 24 + keyboardHeight`
   was reserving a SECOND keyboard-height of empty space → the white gap.
   **Removed the manual keyboardHeight padding entirely** (now static
   `paddingBottom: 24` via `styles.scrollContent`).

5. (After user re-reported gap STILL on Android) **Stripped the editor's custom
   keyboard machinery entirely** — removed the `keyboardHeight` state, both
   `Keyboard` listeners, `onBlur`, and unused imports (`useState`, `useEffect`,
   `Keyboard`). The ScrollView now has NO manual padding tied to the keyboard.
   Android relies purely on `adjustResize`; iOS on `automaticallyAdjustKeyboardInsets`.
   Only a plain `onFocus` scroll-to-nudge remains. File parses clean. NOT yet
   device-tested — this is the current tip.

## IF STILL BROKEN after step 5
The gap is then NOT from the editor's JS at all — it's the parent layout / edge-to-edge
resize. Next: add a debug `backgroundColor:'red'` to `styles.container` (ScrollView)
in the editor and a `'blue'` to `modeContainer` in SetIntentionScreen — whichever
color the gap shows tells you which view owns it. If blue (parent), the fix is in
`SetIntentionScreen`'s wrapper (SafeAreaView edges / modeContainer), NOT the editor.

## Prior STILL-BROKEN note (pre-step-5)
User reports (after step 4) the Android white gap was **still showing**. So
removing the manual padding was NOT the (whole) cause. Current suspects to chase:
- The `keyboardHeight` state + its `keyboardDidShow` listener still fire on
  Android; even though padding no longer uses it, verify nothing else (a re-render,
  the scroll) is opening space. Consider removing the Android branch of the
  keyboard listener entirely and relying purely on `adjustResize`.
- Check the PARENT chain for leftover height reservation: `SetIntentionScreen`
  wraps draft mode in `<View style={styles.modeContainer}>` (flex:1, has
  `paddingBottom: spacing.sm`) inside `<SafeAreaView edges={['top']}>` inside a
  `LinearGradient`. With `adjustResize` the gradient/root may not be resizing the
  way the ScrollView expects — the gap could be BELOW the ScrollView, not inside it.
- The ScrollView `style={styles.container}` is `{flex:1}` with no background, so
  white must be coming from a child (inputContainer is `colors.surface` = #FFFFFF)
  OR from the gradient not filling. Figure out WHICH view is painting the gap:
  temporarily give the ScrollView a bright debug background to see if the gap is
  inside it (scroll content) or outside it (parent layout).
- Compare against how the sibling Huxley conversation mode avoids this — it uses
  `ChatConversation`'s device-verified Android pattern (see
  `handoffs/set-intention-chat-input.md` and `components/chat/ChatConversation.js`
  ~lines 97-101). The draft editor may need the same SafeAreaView bottom-inset
  reservation rather than its own ad-hoc ScrollView approach.

## What's next
1. Reproduce on Android, add a debug background color to isolate whether the gap
   is inside the ScrollView or in the parent layout.
2. Most likely fix: simplify the editor to trust `adjustResize` fully — remove the
   custom keyboard listeners/scroll and mirror the ChatConversation inset pattern.
3. Device-verify on BOTH Android and iPhone before committing.
4. Commit (nothing from this task is committed yet).

## Reference
- Related: `handoffs/set-intention-chat-input.md` (the CONVERSATION mode fix for
  the same screen — solved a near-identical Android nav-bar/keyboard issue via
  ChatConversation's pattern + `extraBottomInset`).
- Memory: `project_chat_keyboard_gap_android.md` (the canonical Android keyboard
  fix — final fix pads by FULL keyboard height, do NOT subtract insets.bottom).
- Key files: `components/intention/IntentionDraftEditor.js`,
  `screens/SetIntentionScreen.js`, `components/chat/ChatConversation.js`.

Read handoffs/intention-draft-keyboard-gap.md and continue.
