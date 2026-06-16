# Handoff — Set Your Intention chat input behind nav bar

## Task
The chat input on the Set Your Intention screen sat partially behind the Android
bottom nav bar at rest, and used the old `behavior="height"` keyboard pattern
that the device-verified fix had removed from every other chat. Also: verify the
prompt-caching work and clean up an accidental splash-icon swap.

## Status: DONE — committed (`8777f7b`). Device-confirmed ("that's perfect").

## What was done
**Intention chat fix (3 files, committed in `8777f7b`):**
- `screens/SetIntentionScreen.js` — conversation mode now renders OUTSIDE the
  parent `KeyboardAvoidingView` (so it no longer double-adjusts on Android). The
  KAV still wraps the draft + templates modes (they have text inputs too).
- `components/intention/IntentionConversation.js` — dropped `disableKeyboardAvoiding`
  so `ChatConversation` owns keyboard avoidance (the same per-platform pattern as
  every other chat); reads `useSafeAreaInsets()` and passes
  `extraBottomInset={insets.bottom}`.
- `components/chat/ChatConversation.js` — new `extraBottomInset` prop (default 0,
  so all other chats are untouched) added to the input row's bottom padding.
  Base padding extracted to `INPUT_BASE_PADDING_BOTTOM` so style + override stay
  in sync.

**Root cause (the real one):** `ChatConversation`'s Android keyboard strategy
assumes the chat lives inside a parent `<SafeAreaView edges={['bottom']}>` that
reserves the nav-bar inset (see its own comments ~lines 97-99). Every other chat
does that. `SetIntentionScreen` wraps with `edges={['top']}` ONLY — nothing
reserved the bottom inset, so the input row's small `paddingBottom: 12` was the
only spacing and it slid behind the nav bar. Fix = supply that inset via the new
prop. (The keyboard-pattern change was also needed, but the inset was the visible
bug.)

**Caching verification:** confirmed live on device via the `[Claude Proxy] Cache
— read / created / uncached input` dev log. First turn `created: 1377, read: 0`;
every follow-up `read: 1377+` (the win). Edge function was deployed by the user.
See `handoffs/prompt-caching-impl.md` and memory `project_prompt_caching.md`.

**Splash icon:** `assets/images/splash-icon.png` had been accidentally swapped
(17KB → 2.9MB, 2000×2000). Reverted to HEAD (17547 bytes). NOT part of the commit.

## Current state
- Branch: `master`. Commit `8777f7b` "Fix Set Your Intention chat input behind nav bar".
- Working tree: only `.claude/settings.local.json` (modified) + `.claude/settings.json`
  (untracked) remain — local Claude Code config, deliberately not committed.
- All 3 edited files parse clean (`babel.parseSync` + `babel-preset-expo`).

## Known issues / watch-outs
- iOS path for the intention chat was NOT re-verified on an iPhone (logically
  unchanged — same `extraBottomInset` applies, KAV behavior="padding" on iOS).
- The earlier keyboard + caching work was already committed (`bd4b7d2`, `afc73af`)
  despite the older handoffs saying "NOT committed" — those handoffs are stale.
- Routing/triage chat caching wired same way but never eyeballed in logs (low risk).

## What's next
- Nothing required. Optional: spot-check iOS for the intention chat; glance at the
  routing chat cache log if curious.

## Reference
- Memory: `project_chat_keyboard_gap_android.md`, `project_prompt_caching.md`.
- Related handoffs: `handoffs/chat-keyboard-gap.md`, `handoffs/prompt-caching-impl.md`.

Read handoffs/set-intention-chat-input.md and continue.
