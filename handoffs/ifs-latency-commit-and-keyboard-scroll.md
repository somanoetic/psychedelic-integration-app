# Handoff: IFS delta-JSON latency (committed) + keyboard-open scroll fix

Status: **DONE and COMMITTED this session.** Chat surfaces device-verified on iPhone.
Branch: `feat/neurobiology-of-connection`.

## What was done (3 commits)

1. **`a17c915` — perf(ifs): delta-only extraction JSON + brevity + maxTokens**
   Finished the agreed-but-undone piece from the 2026-07-14 session (see
   `handoffs/ifs-chat-response-length.md`). The `---THERAPEUTIC_DATA---` block was
   re-transmitting the entire growing therapeutic state every turn (~1800c/~450
   tokens); the app already accumulates/dedups/persists state app-side, so this
   was pure redundancy holding `claude=` at ~7s.
   - Edited `_getStructuredOutputInstructions()` in `lib/huxleyService.js`
     (~line 804) → "only NEW or CHANGED this turn." JSON SHAPE unchanged; parser
     (~line 834) and name-keyed merge `_updateTherapeuticState` (~line 870)
     untouched.
   - Also folded in the two already-verified changes from last session that were
     still uncommitted: brevity rewrite + `maxTokens 500→700` in
     `lib/huxleyModeConfigs.js` (`ifsMode`).
   - Kept the temporary `[Huxley PERF]` `reply=/json=` split (dev-only,
     `lib/huxleyService.js` ~line 381) — user chose to keep it for future latency
     work.
   - **Device-verified (iPhone, ifs mode):** `json=` dropped ~1800c → 152–308c and
     no longer grows across the session; cache holds (`read=7097 created=0`);
     `total=3837ms` on a fast-RAG cached turn (was 6.5–7.6s). State still
     persisted correctly (context loaded `parts:8→9` between sessions).

2. **`6353637` — fix(chat): keyboard no longer covers the newest reply on open**
   Root cause: keyboard-open auto-scroll fired on `keyboardWillShow` after a fixed
   150ms delay — mid-animation. The keyboard-avoidance padding kept growing
   *after* that scroll, pushing the newest reply back under the keyboard.
   Fix: scroll on `keyboardDidShow` (after animation + layout settle) + a
   next-frame re-scroll.
   - `components/chat/useSmartScroll.js` (~line 48) — covers the IFS chat and ALL
     `ChatConversation`-based surfaces, incl. the Huxley modal.
   - `components/HuxleyChatScreen.js` (~line 223) — its own inline copy of the same
     handler.
   - Deliberately NOT touched: `HuxleyChatModal`'s own keyboard listener
     (`components/HuxleyChatModal.js` ~line 46) — it lifts the whole sheet and
     should stay on will-show so the lift tracks the keyboard; its scrolling goes
     through the fixed hook.
   - **Device-verified (iPhone, IFS chat).**

3. **`10a86a4` — fix(scroll): same fix on home + session-prep inputs**
   Same bug class in two non-chat surfaces: `components/ConversationalHomeScreen.js`
   (~line 45) and `screens/preparation/SessionPreparationScreen.js` (~line 79).
   **NOT device-verified** — low-risk mirror of the verified chat fix. Worth a tap
   on those two screens next time you're there.

## Current state
- All three commits on `feat/neurobiology-of-connection`. Nothing else staged.
- `handoffs/ifs-chat-response-length.md` is now COMPLETE (its "what's next"
  Option A shipped in `a17c915`) — can be considered closed.
- The pre-existing modified/untracked files in `git status` (spell-check batch,
  other handoff docs) are from prior sessions and NOT part of this work — left
  untouched.

## Known issues / follow-ups (do NOT scope-creep — filed elsewhere)
- **RAG speed + quality** — surfaced with hard data in this session's logs but
  NOT worked. Fully written up in `handoffs/rag-speed-and-quality.md` (see the
  2026-07-22 section): embed cache always MISSes (cold 1249ms spike trips the
  2000ms timeout) + 0 results at threshold 0.3 on plain-language queries. Next
  step there: build the Level-2 query harness first.
- **Home + session-prep keyboard fix unverified** (commit `10a86a4`) — tap-test
  when convenient.
- **Parts roster not capped** in `_buildSharedContext` (input-cost scaling for
  heavy long-term users) — noted in `handoffs/ifs-chat-response-length.md`; file
  as a bug/feature when real user files get big.

## What's next
Most likely the RAG session (has the most concrete, data-backed next step). See
`handoffs/rag-speed-and-quality.md`.

Read handoffs/ifs-latency-commit-and-keyboard-scroll.md and continue.
