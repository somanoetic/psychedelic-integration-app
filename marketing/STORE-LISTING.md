# Multitudes — App Store & Play Store Listing

**Version:** 0.2 (2026-05-13)
**Status:** Decisions locked. Awaiting EAS production build + screenshots before submission.
**Linked:** [BRAND.md](BRAND.md) is the source of truth for voice/taglines

This document is everything you'll paste into App Store Connect and Google Play Console when submitting.

---

## 1. Apple App Store

### App name — 30 char limit
> **Multitudes** ✅ *(locked 2026-05-13)*

10 chars. Bare brand name, no descriptor. The subtitle does the descriptive work.

### Subtitle — 30 char limit
> **Every part. Your whole.**

24 chars. Locked from BRAND.md §7.

### Promotional text — 170 char limit (editable anytime, no re-review)
> *A wellness companion for the days around your journey. Set intention, reflect deeply, and integrate the multitudes you contain.*

131 chars. Use this slot for what's most current — pre-launch, this is the value prop. Post-launch, swap in new feature highlights, press quotes, or seasonal angles without going through review.

### Keywords — 100 char limit, comma-separated, no "Multitudes"
> `integration,ketamine,IFS,parts,polyvagal,journal,intention,psychedelic,reflection,somatic,meditation`

100 chars exactly. Rules: don't include your app name (auto-indexed), no spaces after commas (saves chars), don't pluralize what's already in the description (Apple stems automatically).

### Description — 4000 char limit
> **The journey is one day. The integration is the rest of the year.**
>
> Most people leave a ceremony, a clinic, or a retreat with something fragile and luminous — and within weeks, the old patterns are back. Not because the experience wasn't real. Because integration is its own practice, and almost no one teaches it.
>
> Multitudes is a wellness companion for the days around your journey.
>
> **BEFORE — Set intention**
> In the days before, Multitudes sits with you while you name what you're actually asking the experience to show you. Not a goal. A question.
>
> **DURING — Stay grounded**
> Tools for the day itself: nervous-system regulation, somatic anchors, a gentle place to capture what arises without breaking the spell.
>
> **AFTER — Make it real**
> Daily reflection, parts work, breathwork, and a living toolkit that updates with you. Insight becomes practice. Practice becomes change.
>
> ----
>
> **MEET HUXLEY**
>
> Inside Multitudes, you'll find Huxley — a companion for the work, not a guru with answers. Huxley listens. Huxley asks better questions than the ones you came in with. Huxley draws from Internal Family Systems, polyvagal theory, and somatic experiencing — without sounding like a textbook.
>
> ----
>
> **WHAT'S INSIDE**
>
> • A conversational AI guide trained on integration practice, not pop psychology
> • 160 exercises drawn from IFS, somatic experiencing, polyvagal theory, and contemplative traditions
> • Daily journal with reflection prompts that go deeper over time
> • Nervous-system mapping — name what state you're actually in
> • Intention-setting flow that takes twenty minutes, not twenty seconds
> • Learning hub — short reads on the frameworks behind the practice
>
> ----
>
> **BUILT ON REAL LINEAGE**
>
> Multitudes is informed by Internal Family Systems, Polyvagal Theory, somatic experiencing, and integration protocols developed over decades by clinicians and researchers. We don't invent frameworks. We make the existing ones easier to live with.
>
> *"I am large, I contain multitudes." — Walt Whitman*
>
> ----
>
> **HONEST ABOUT WHAT MULTITUDES IS — AND ISN'T**
>
> Multitudes is a wellness and reflection tool — a companion, not a clinician. It doesn't diagnose, treat, or replace mental health care. If you're in crisis, we'll point you to people who can help, every time.
>
> Your reflections stay yours. Export them. Delete them. We don't sell them. Ever.
>
> ----
>
> **PRIVACY & DATA**
>
> Your reflections, journal entries, and conversations stay on your device or in your private Multitudes account. We don't sell your data. You can export everything or delete your account anytime from Settings.

Character count: ~2,400. Well under 4,000 — leaves room to extend.

### Category
- **Primary:** Health & Fitness (most discoverable for wellness audiences)
- **Secondary:** Lifestyle

### Age Rating
Expect **17+** because of:
- Infrequent/Mild references to mature themes (psychedelic context)
- Mental health content
- User-generated content (journal entries)

Apple's questionnaire determines final. Don't downplay — it gets caught later and forces a re-submit.

### URLs (required at submit)
- **Marketing URL:** `https://multitudesapp.io` ✅ live
- **Support URL:** `mailto:hello@multitudesapp.io` ✅ working (formal support page can come later)
- **Privacy Policy URL:** `https://multitudesapp.io/privacy.html` ✅ live (legal review still owed per BUG-308)
- **Terms of Service URL:** `https://multitudesapp.io/terms.html` ✅ live

---

## 2. Google Play Store

### App name — 50 char limit
> **Multitudes** ✅ *(locked 2026-05-13 — same as iOS for brand consistency)*

### Short description — 80 char limit
> **Every part. Your whole. A wellness companion for the work after the journey.**

76 chars. Uses the locked logo tagline + functional summary. Distinct from anything else in the wellness category.

### Full description — 4000 char limit
Use the same body as the iOS description above. Play allows light HTML (`<b>`, `<i>`, `<br>`) but plain text reads cleaner — paste as-is.

### Category
- **Primary:** Health & Fitness
- (Play has no formal secondary category for most apps)

### Content Rating
Use Google's IARC questionnaire. Expect rating equivalent to **Teen/Mature** depending on how you answer the mental health and psychedelic-reference questions. Match what you put for Apple.

### Tags (optional, up to 5)
Choose from Google's preset list — pick: `Health`, `Lifestyle`, `Mindfulness`, `Journaling`, `Mental Health`

---

## 3. Screenshots — 6-frame shot list

**Capture path:** iOS Simulator (Cmd+S to save) for App Store, Android Emulator (toolbar screenshot button) for Play Store. Physical device is messier — status bar clutter, resolution drift. iOS simulator is currently blocked by BUG-306 (stale build); capture Android first, do iOS after the rebuild.

**Per-frame plan** — each row tells you which screen to navigate to, what the screen should be showing when you capture, and the headline to overlay later in Figma / App Store Connect's editor.

### Frame 1 — Hero (most important; sells the install)
- **Navigate to:** Huxley conversation screen, actively in a session
- **Screen state:** Mid-conversation. Huxley has asked something deep (e.g., *"What part of you is asking that question?"*), and there's a user response visible above. Two or three messages on screen, not the welcome blank state.
- **What to ensure in frame:** Huxley avatar visible, conversation reading like real inner work, no error states, no empty placeholders
- **Headline overlay:** **The companion for the work after the journey.**
- **Save as:** `screenshot-1-hero.png`

### Frame 2 — Set intention
- **Navigate to:** Set Intention conversational flow
- **Screen state:** Mid-flow, with a thoughtful intention being shaped through conversation (not the empty start screen)
- **What to ensure:** Clear that this is conversation, not a form. A user message showing real reflection.
- **Headline:** **Set intention through conversation, not a checkbox.**
- **Save as:** `screenshot-2-intention.png`

### Frame 3 — Daily journal
- **Navigate to:** Daily journal entry view
- **Screen state:** An entry with substantive text (a few lines of reflection, not a one-liner), with the AI prompt visible at the bottom or in a callout
- **What to ensure:** Reads like real reflection, not lorem ipsum. Use a sample entry along the lines of *"Today I noticed the part of me that needs control showed up in the meeting..."*
- **Headline:** **Reflection that deepens with you.**
- **Save as:** `screenshot-3-journal.png`

### Frame 4 — Exercise library
- **Navigate to:** Exercise Library grid
- **Screen state:** Scrolled to show 6–8 exercise tiles with variety — somatic, IFS, breathwork, contemplative. Don't show only one category.
- **What to ensure:** Variety visible, tiles show real exercise names (not generic placeholders)
- **Headline:** **160 exercises drawn from real lineage.**
- **Save as:** `screenshot-4-library.png`

### Frame 5 — Nervous system mapping
- **Navigate to:** Nervous System Check-In / polyvagal state indicator
- **Screen state:** Showing the polyvagal state map with a state highlighted (ventral / sympathetic / dorsal). Pick the *ventral safe* state for the screenshot — most aspirational and visually warm.
- **What to ensure:** The three-state model is visible, current state is clearly marked
- **Headline:** **Name where you are. Find your way back.**
- **Save as:** `screenshot-5-nervoussystem.png`

### Frame 6 — Privacy / data ownership
- **Navigate to:** Settings → Export My Data
- **Screen state:** Settings screen showing the Export option + a brief note about data ownership. Or the export confirmation modal.
- **What to ensure:** "Export My Data" clearly visible. The privacy promise should be readable on the screenshot.
- **Headline:** **Your inner work stays yours.**
- **Save as:** `screenshot-6-privacy.png`

### After capture — adding headlines
The screenshots come out as raw screen captures (no headline overlay). To add the headlines:

1. **Figma** (recommended) — drag screenshot in, add device frame from any community kit (e.g., "Apple Device Mockups" by Apple), place headline above in Fraunces 700 charcoal `#3A3A3A` on cream `#F5F5F5` background. Export at 1290×2796.
2. **App Store Connect's built-in editor** — limited but works for plain text overlays
3. **previewed.app** — drag, frame, label, export. Simplest path if Figma feels heavy.

### Required sizes

**iOS:**
- 6.7" (iPhone 14 Pro Max / 15 Pro Max): **1290 × 2796**
- 6.5" (older Pro Max): 1284 × 2778
- 5.5" (legacy, only if supporting old iPhones): 1242 × 2208
- (Optional) iPad: 2048 × 2732

Apple lets you upload one set (6.7") and auto-scales. Start there.

**Play Store:**
- Phone: minimum 320px, 16:9 or 9:16 aspect. Same 1290 × 2796 works.
- (Optional) Tablet: 1600 × 2560

### Design notes for the screenshot frames
- Use the brand-bible cream background (`#F5F5F5`) behind the device frame
- Headline in Fraunces 700, charcoal `#3A3A3A`
- Add the device mockup frame (use [previewed.app](https://previewed.app/) or Figma device frames)
- The first screenshot is the most important — most users scroll only 1–2 before deciding

---

## 4. App icon

Already in `design/Multitudes/`:
- `app-icon.png` — verify resolution. Apple needs **1024 × 1024** PNG (no transparency, no rounded corners — iOS adds those).
- `icon-512x512.png` — Play Store wants 512×512.

The watercolor symbol from the logo (without the wordmark) is the right input. If the existing `app-icon.png` includes the wordmark, render a wordless variant at both sizes.

---

## 5. App preview video — DEFERRED (post-launch addition)

**Status:** TODO — not in first submission. Add after launch when there's real usage to draw from.

Notes for when you're ready (15–30 seconds total):
1. Hands typing a journal entry
2. Huxley avatar appearing
3. Quick montage of 2–3 key screens
4. Text overlay: *"The journey is one day. The integration is the rest."*
5. End card: Multitudes wordmark

iOS allows up to 3 app preview videos. Play allows one. Same video works for both.

---

## 6. Submit-readiness checklist

Before you can hit "Submit for Review":

- [ ] Apple Developer account active ($99/year)
- [ ] Google Play Console account active ($25 one-time)
- [ ] App icon 1024×1024 (no transparency)
- [ ] At least 3 screenshots per platform (6 recommended)
- [ ] Privacy Policy live at a real URL (currently dead — needs `/privacy.html` built)
- [ ] Support URL or email live (`hello@multitudesapp.io` works)
- [ ] Marketing URL live (`multitudesapp.io` ✅ once DNS finishes)
- [ ] App Store privacy questionnaire filled out
- [ ] Play Store data safety section filled out
- [ ] Age rating questionnaires completed both platforms
- [ ] EAS production build uploaded (per FEAT-401)

---

## Decisions Log

| Date | Decision |
|---|---|
| 2026-05-13 | App name: bare `Multitudes` (iOS + Play, both 10 chars) |
| 2026-05-13 | Subtitle / short description: `Every part. Your whole.` (locked from BRAND.md §7) |
| 2026-05-13 | Privacy + Terms: static HTML at `/privacy.html` and `/terms.html` (drafted from in-app screens, BUG-308 legal review still owed) |
| 2026-05-13 | Preview video: DEFERRED to post-launch — added to TODO |
| 2026-05-13 | Screenshot capture: Android emulator first (iOS blocked by BUG-306), 6-frame shot list above |
| 2026-05-13 | Marketing/Support/Privacy/Terms URLs all live ✅ |

## Still pending (not blocking the listing — blocking submission)

- **EAS production build** (FEAT-401) — must exist before you can upload to App Store Connect / Play Console
- **Screenshots captured** — 6 frames per the shot list above (Android first; iOS after BUG-306)
- **App icon at correct sizes** — verify `design/Multitudes/app-icon.png` is 1024×1024, no transparency, no rounded corners
- **App Store privacy questionnaire** — fill out in App Store Connect (the "App Privacy" section, separate from the policy URL)
- **Play Store data safety section** — fill out in Play Console
- **Age rating questionnaires** — both platforms; expect 17+ result
- **BUG-308 legal review** — get Privacy + Terms reviewed before serious launch traffic
