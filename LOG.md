# Project Log

## 2026-06-17 — Prettier log confirmations and fixed a cut-off learning page

Two fixes today. First, when you log a moment in any of the trackers (nervous system, glimmer, trigger, parts), the little "saved" pop-up now has a softer, on-brand look with a green check, and tapping its button takes you back to the home screen instead of just sitting on the form. Second, the Learning Hub sub-pages (Self-Discovery Tools, Body/Brain & Healing, and the rest) were cutting off the bottom tile on the device — added proper spacing at the bottom so the last tile clears the screen edge. The first batch was confirmed working on your device; the learning-page fix is in but worth a final glance.

## 2026-06-16 — Sharpened the AI library and reworked the home screen

Two things. First, the quick win from the audit: the research library's search index was under-sized for how much got loaded, so we rebuilt it on the real data and widened how much it scans per question — Huxley should now surface more of its best matches. That's live in the database and committed. Second, the home screen: there were five tiles, which left an awkward gap, so we restructured the whole thing. The bottom menu bar is now down to three (Home, Journal, Inner Atlas), and Learn and History moved up to become tiles. The grid now reads cleanly — two tiles, a full-width History band, then two more rows — with a new History icon. It's committed and pushed but hasn't been checked on a real device yet, so the tile taps (especially Learn and History) are worth a look.

## 2026-06-16 — Audited the backlog; found the knowledge base is actually live

You suspected a lot of the open to-do items were already finished, and you were right. We went through everything the tracker still listed as "open" and checked it against the real code. Three items were already done and just never closed out, and several others were finished in the code with only account or app-store steps left for you. The big one: the AI knowledge base (the research library Huxley draws on) was marked as "not deployed yet," but it's fully live — over 21,000 passages from 281 books and documents are loaded and searchable, and a test question pulled back exactly the right material. The one real caveat is that its search index looks under-sized for how much got loaded, so it may be missing some of its best matches; a quick 30-second fix in the database dashboard would sharpen it. We updated the tracker to reflect all of this.

## 2026-06-16 — Merged the trackers into one "Track" block on the home screen

Reworked the top of the home screen. The three status widgets (nervous system, habits, glimmers) and the separate "Track" tile were doing overlapping jobs, so we combined them into a single Track block: a header with the Track icon and title, plus a row of five small status readouts underneath — one for each tracker (nervous system, glimmer, trigger, parts, habits) — that shows when you last logged each. Tapping anywhere on the block opens the same Track menu as before, and the main tile grid is now five consistent sections. Then we spent a while tuning the look: stacked the header, sized the icons so the faint glimmer and trigger ones match the others, lightened the box, and stripped the border/shadow that the side icons were bumping into. It's built but not yet checked on a real device.

## 2026-06-16 — Restyled the session checklist to match the rest of the app

The session checklist screen had two heavy yellow-to-blue gradient blocks — the top bar and the progress card — that clashed with the calmer, softer look the rest of the app moved to. Restyled both to match the Sessions hub: a soft full-screen background, a clean dark title, a white progress card, and category headers that now read as distinct white rows. It's a visual-only change and hasn't been run on a device yet, so it's worth a quick look before committing.

## 2026-06-16 — Verified caching, fixed the Set Your Intention chat input

Confirmed on a real device that the money-saving prompt caching is genuinely working — the dev logs showed Huxley reusing its long instructions on every follow-up message instead of being re-billed. Then fixed the one chat that still looked wrong: on the Set Your Intention screen, the text box sat partly behind the bottom navigation bar and used the old keyboard handling the other chats had already moved off of. It now sits above the nav bar and clears the keyboard cleanly, matching every other chat. Also reverted an accidentally-swapped splash icon. The chat fix is committed; the earlier keyboard and caching work turned out to have already been committed.

## 2026-06-06 — Finished the chat keyboard fix + confirmed caching saves money

Closed out two things that were waiting on a real-device check. First, the keyboard fix: the main Huxley chat screen had its own copy of the old keyboard handling, so we ported the same fix the conversation screens already had. On the device, the text box was getting partly hidden behind the keyboard, so we corrected how much it lifts — it now sits fully above the keyboard on both the main chat and the conversation screens, and there's no leftover gap when the keyboard closes. Second, while testing we watched the dev logs confirm the prompt caching from earlier is genuinely working — Huxley's long instructions are being reused from cache on every follow-up message instead of being re-billed. Both fixes are tested on a real Android device but not yet committed.

We did the work the earlier audit pointed to: turning on prompt caching so Huxley's long, repeated instructions aren't re-billed on every message. The trick was to split each prompt into a stable part (cached and reused) and a per-message part (the fresh research snippets and safety checks), and move the changing part into the user's message instead of the instructions. This now covers both Huxley's main chat and the routing/triage chat, and the proxy and server function were wired up to support it and to log how often the cache is hitting. Tests pass; the one piece still outstanding is confirming on a real device that the cache is actually saving money (you'll see it in the dev logs after two quick back-to-back messages).

## 2026-06-05 — Fixed the chat keyboard gap

Fixed the long-standing bug where, on the conversation screens, a blank space was left below the text box after you closed the keyboard (and the box sometimes floated or got covered). The root cause was the keyboard-handling code fighting with Android's own screen-resizing, leaving leftover padding. We rewrote it so the text box now sits correctly at rest, clears the keyboard when typing, and snaps back with no gap when the keyboard closes. The change is in one shared component, so it covers all the conversation screens at once — but it still needs a real-device check, and the main Huxley chat screen uses its own separate keyboard code that may need the same fix.

## 2026-06-05 — Checked which AI prompts can be cached

We looked at whether Huxley's behind-the-scenes instructions stay the same enough between messages to safely turn on prompt caching (a cost-saver). The short answer: not yet, for the two parts of the app that matter. Huxley's main chat and the routing/triage chat both mix in stuff that changes with every message — the freshly-pulled research snippets and the message-specific safety checks — right in the middle of the instructions, which defeats caching. To make caching pay off, that changing material needs to move into the user's message instead. No code was changed; this was an audit only, with a clear list of what to fix.
