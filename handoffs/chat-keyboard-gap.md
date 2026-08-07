# Handoff — Chat keyboard gap (Android)

## Task
Fix: on the conversation screens AND the main Huxley chat, tapping the input
opened the keyboard with a gap below the text box; after dismissing, the gap
(≈ nav-bar height) stayed. A later device test also showed the input being
partially COVERED by the keyboard while open.

## Status: CLOSED — device-verified on Android (2026-06-06) and committed (`bd4b7d2`). No open items.

## What was done
Two surfaces now share the same per-platform keyboard-avoidance pattern:
- `components/chat/ChatConversation.js` — shared surface for ~10 conversation screens.
- `components/HuxleyChatScreen.js` — the main Huxley chat (has its OWN inline
  layout; does not use ChatConversation). The pattern was ported into it.

Final pattern (no new dependency), in both files:
- iOS: `KeyboardAvoidingView behavior="padding"`, `keyboardVerticalOffset: 0`.
- Android: NO KeyboardAvoidingView. Wrapper is an `Animated.View`. Keyboard
  show/hide listeners set its `paddingBottom = endCoordinates.height` (the FULL
  keyboard height) on show, and 0 on hide.
- ChatConversation's `disableKeyboardAvoiding` path (IntentionConversation,
  parent owns the KAV) still renders a plain View.

### The key correction (this session)
Earlier the Android padding subtracted `insets.bottom` from the keyboard height,
on the theory that the wrapping `SafeAreaView edges={['bottom']}` keeps reserving
that inset while the keyboard is open. On a real device it does NOT — when the
keyboard opens, Android's soft nav-bar inset collapses (the keyboard occupies
that space). Subtracting it under-padded and let the keyboard cover the input.
Fix: pad by the FULL keyboard height. Verified correct on device for both
screens. The `insets.bottom` dependency was removed from both effects.

## Why the earlier attempts failed (don't repeat)
1. Dropping the KAV on Android entirely → keyboard COVERED the input.
2. KAV `behavior="padding"`/`"height"` both platforms → residual gap on dismiss.
3. Subtracting `insets.bottom` from keyboard height → input partially covered.
4. `react-native-keyboard-controller` → BLOCKED: needs reanimated 4.x / RN 0.83+;
   project is on RN 0.81.5. Abandoned.

## Current state
- Branch: `master` (NOT committed).
- Files touched: `components/chat/ChatConversation.js`,
  `components/HuxleyChatScreen.js` only.
- Both babel-parse clean with `babel-preset-expo`.
- Device-verified on Android: input sits fully above keyboard, no gap on dismiss,
  on both the main chat and conversation screens.

## Known issues / watch-outs
- iOS path is logically unchanged but was NOT re-verified this session — confirm
  it still behaves on an iPhone.
- `insets` is now referenced only in a comment in HuxleyChatScreen.js (the
  `useSafeAreaInsets()` call at the top is otherwise unused there). Left in place
  to avoid touching unrelated lines; harmless.
- If a future device DOES partially reserve the inset (gap appears ABOVE the
  keyboard), switch to reading the keyboard frame top directly:
  `screenHeight - endCoordinates.screenY` — sidesteps the inset question entirely.

## What's next
1. Commit the two files (keyboard fix). Suggested message:
   "Fix chat keyboard gap on Android: pad by full keyboard height; port fix to HuxleyChatScreen".
2. Optionally re-verify on iOS.
3. Update memory `project_chat_keyboard_gap_android.md` to mark device-verified
   and record that the `insets.bottom` subtraction was wrong.

## Related (also confirmed this session)
While device-testing, the dev logs confirmed the prompt-caching work
(`handoffs/prompt-caching-impl.md`) is genuinely hitting cache: first message
`created: 5641`, follow-ups `read: 5641`. That outstanding verification item is
now satisfied. The repeated `[MasterContext] Cleared cache` per call is a
SEPARATE internal cache, not the Anthropic prompt cache — worth a glance later
but unrelated to the caching wins.

## Reference
Memory: `project_chat_keyboard_gap_android.md` has the full attempt history.

Read handoffs/chat-keyboard-gap.md and continue.
