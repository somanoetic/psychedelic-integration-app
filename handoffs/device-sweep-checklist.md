# Device sweep checklist (2026-08-07)

Ten handoffs' worth of shipped-but-never-run-on-a-phone work, ordered so you walk each
part of the app once instead of bouncing around. Tap through, note anything wrong, report
back at the end — I won't touch code until you do.

**Before you start:** force-quit and reopen the app so it pulls the OTA published today
(update group `f0ae706d`). Everything below is live on `production` / runtime 1.2.0.

Mark each: OK / BROKEN (+ what happened).

---

## A. Inner Work — Attachment Reflection  ← highest value, do this first

Inner Work hub → **Attachment Reflection**.

This is a full conversational mode that has never been run once. Give it a genuine
multi-turn session, not a glance — 8-10 exchanges, answer as you actually would.

- [ ] It opens and greets you appropriately (doesn't dump you into a bare chat)
- [ ] Questions follow AAI structure — early relationships, specific memories, how it
      shaped you — rather than generic therapy prompts
- [ ] **No diagnosis or attachment label is ever shown to you.** Per the design, the
      pattern is noted for the practitioner only and must stay invisible user-side.
      If you see a label surfaced, that's a P0 — stop and note it.
- [ ] Reflective, non-clinical voice (wellness framing, not "treatment")
- [ ] Back arrow exits cleanly; reopening doesn't lose or duplicate the session
- [ ] Keyboard doesn't cover the latest reply

## B. Learn hub → Cognitive Patterns — flashcards & quizzes  ← never tapped

Learn → Tools & daily practices → **Cognitive Patterns**. Scroll past "Try this".
5 widgets: Distortion Deck (17 cards), Name the Distortion (9 Qs), Cognitive Biases
Deck (12), Logical Fallacies Deck (10), Spot the Bias or Fallacy (6 Qs).

- [ ] Flashcards flip on tap and you can reach the last card in each deck
- [ ] Quiz answers give per-answer feedback; right/wrong both read correctly
- [ ] Text isn't clipped mid-card on your screen width
- [ ] Scrolling the article doesn't fight the card taps
- [ ] Leaving and re-entering resets cleanly (state is ephemeral by design)

## C. Learn hub — back chrome on the 7 wrapped widgets

Each should now have a top inset + back arrow returning to the category list, and
nothing hidden under the notch. The conversational ones matter most — check the thin
header doesn't crowd the input.

- [ ] Nervous System Basics ← the original bug: was jammed under the status bar
- [ ] IFS / Parts Work basics
- [ ] Grounding practices
- [ ] Polyvagal mapping *(conversational — watch the keyboard)*
- [ ] Triggers & glimmers *(conversational)*
- [ ] Regulating resources *(conversational)*
- [ ] IFS chat *(conversational)*
- [ ] Learn hub bottom padding — last item not flush against the screen edge

## D. Navigation — trapped screens & home

- [ ] **Inner Atlas** (Home grid → Atlas): back arrow returns to Home
- [ ] **Daily Journal**: back arrow is visible on the *opening* screen and exits;
      inside a sub-view it steps back one level instead of dumping you out
- [ ] **Home grid** shows 5 tiles (Prepare, Process, Inner Work, Practice, Philosophy)
      — no Track tile, no 3-widget dashboard row
- [ ] Track block shows real data for all 5 indicators (incl. last trigger, last parts)
- [ ] Android hardware back unwinds one level at a time across these

## E. Trackers

- [ ] **Cognitive Distortion Tracker** — opens, saves, confirmation appears
- [ ] **Craving Tracker** — opens, saves, confirmation appears
- [ ] "Log saved" confirmations are themed and return you Home
- [ ] Urge icon on the Track tile looks right

## F. Visual / smaller

- [ ] **Session Checklist** — soft gradient backdrop, dark serif title, white
      "Preparation Progress" card (no heavy gradient slabs, no white-on-gradient text)
- [ ] **FAB radial menu** — backdrop dims so labels are readable over busy screens
- [ ] Home support/settings entry points work

## G. IFS chat — the fix you just published

You already liked this in testing; this is a regression check on the OTA build.

- [ ] Parts work explores non-somatic channels (behavior, inner voice, memory, image,
      colour, age, urge) rather than looping on "where do you feel it in your body?"
- [ ] Full multi-turn session holds up — intro flow, pacing, no repeated angles
      *(never verified end-to-end across a long session)*

---

## Known-blocked — skip unless you're on an Android phone

- Set Intention keyboard white gap (Android only). See
  `handoffs/intention-draft-keyboard-gap.md` — needs two separate checks.

## Report back

Fastest useful format: section letter + item + what happened. Anything you don't get
to is fine — partial results still let me fix the real ones.
