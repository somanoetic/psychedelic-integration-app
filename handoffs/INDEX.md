# Handoffs index

Audited 2026-08-07. Working tree was clean at audit time, so **every doc claiming
"NOT committed" was stale by definition** — each was traced to a real commit and its
status banner corrected. Nothing was deleted; closed docs stay as reference.

If you add a handoff, add a line here. If you close one, move it down.

> **Start here after a break:** [WHERE-WE-ARE](WHERE-WE-ARE.md) — snapshot of the tree as
> of 2026-08-16, while an OTA/push hold is in force. Records which work is staged vs
> committed, which migrations are actually live, and the traps in the current tree.

## Open

| Doc | What's left |
|---|---|
| [attachment-reflection-resume](attachment-reflection-resume.md) | **Committed + device-verified 2026-08-17.** Migration applied. Nothing left but a push. |
| [huxley-cross-session-memory](huxley-cross-session-memory.md) | READ side committed `a83aa29`; WRITE side (main chat) was missing, found + fixed + device-verified 2026-08-17, now committed too. **Unpushed.** Event bar still untuned. |
| [tracker-keyboard-scroll](tracker-keyboard-scroll.md) | iOS **fixed + user-verified** (`6341b43`, OTA'd). Only the **Android** pass is left. Commits unpushed. |
| [intention-draft-keyboard-gap](intention-draft-keyboard-gap.md) | BLOCKED — needs an Android phone. Two separate checks. |
| [beta-builds-testflight](beta-builds-testflight.md) | Android APK beta build never started (iOS is live). |

## Needs a device pass (code shipped, never run on a phone)

**→ Batched into [device-sweep-checklist](device-sweep-checklist.md) (2026-08-07).
Work from that, not from the individual docs below.**

| Doc | Check |
|---|---|
| [attachment-reflection-aai](attachment-reflection-aai.md) | **Highest value.** Full conversational AAI mode — give it a real multi-turn session. |
| [learn-hub-tools-practices-rebuild](learn-hub-tools-practices-rebuild.md) | Flashcard + quiz widgets have never been tapped. |
| [learn-widget-back-nav-and-trapped-screens](learn-widget-back-nav-and-trapped-screens.md) | Back chrome on the six wrapped Learn widgets; Inner Atlas; Daily Journal. |
| [cognitive-distortion-and-craving-trackers](cognitive-distortion-and-craving-trackers.md) | Both trackers end to end. |
| [session-checklist-restyle](session-checklist-restyle.md) | Restyled checklist. |
| [fab-double-tap-hide](fab-double-tap-hide.md) | FAB radial menu dimming. |
| [learn-back-and-home-support-settings](learn-back-and-home-support-settings.md) | Hardware-back unwind, home support/settings. |
| [learn-hub-all-topics-cleanup](learn-hub-all-topics-cleanup.md) | All-topics list. |
| [tracker-confirmations-and-learn-hub-padding](tracker-confirmations-and-learn-hub-padding.md) | Learn hub bottom padding only (batch 1 already confirmed). |
| [ifs-chat-latency-and-intro](ifs-chat-latency-and-intro.md) | Never verified across a full multi-turn session. |
| [track-block-home-screen](track-block-home-screen.md) | Track block + 5-tile grid on Home. |
| [home-nav-restructure](home-nav-restructure.md) | Committed + pushed (`86e2876`), never device-verified. |

## Closed

IFS chat: [channels-of-noticing](ifs-channels-of-noticing.md) ·
[intro-and-6fs](ifs-chat-intro-and-6fs.md) ·
[response-length](ifs-chat-response-length.md) ·
[streaming-and-rag-prefetch](ifs-chat-streaming-and-rag-prefetch.md) ·
[rag-prefetch-reuse](ifs-rag-prefetch-reuse.md) ·
[latency-commit-and-keyboard-scroll](ifs-latency-commit-and-keyboard-scroll.md) ·
[chat-response-latency](chat-response-latency.md) ·
[chat-keyboard-gap](chat-keyboard-gap.md)

RAG: [speed-and-quality](rag-speed-and-quality.md) ·
[query-expansion](rag-query-expansion.md) ·
[reingest-and-search-cli](rag-reingest-and-search-cli.md)

Learn hub: [body-brain-rebuild](learn-hub-body-brain-rebuild.md) ·
[body-brain-articles](learn-hub-body-brain-articles.md) ·
[neurobiology-of-connection](neurobiology-of-connection.md)

Ship / infra: [testflight-ota-channel-fix](testflight-ota-channel-fix.md) ·
[bundle-id-rename](bundle-id-rename.md) ·
[prompt-caching-impl](prompt-caching-impl.md) ·
[prompt-cache-audit](prompt-cache-audit.md)

UX / nav: [triggered-support-back-nav](triggered-support-back-nav.md) ·
[urge-icon-home-tile](urge-icon-home-tile.md) ·
[spell-check](spell-check.md) ·
[home-tile-icon-sizes](home-tile-icon-sizes.md) ·
[set-intention-chat-input](set-intention-chat-input.md) ·
[beta-ux-polish-batch](beta-ux-polish-batch.md)

Other: [session-closeout-and-experience-tier](session-closeout-and-experience-tier.md) ·
[legal-review-and-multitudes-rebrand](legal-review-and-multitudes-rebrand.md) ·
[backlog-audit](backlog-audit.md)
