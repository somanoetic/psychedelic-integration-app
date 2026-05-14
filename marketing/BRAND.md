# Multitudes — Brand Bible

**Version:** 0.2 (2026-05-13)
**Status:** Locked — logo, typography, and tagline allocations resolved 2026-05-13. Photography sourcing still open.
**Owner:** Hadfi

This document is the single source of truth for how Multitudes looks, sounds, and feels. Every downstream asset (landing page, store listing, social posts, future hires) references this file.

---

## 1. Positioning Statement

**Multitudes is a wellness companion for the days around your journey — helping you set intention, stay present in the experience, and turn insight into integrated change.**

### Three pillars

| Pillar | Promise | Proof |
|---|---|---|
| **Integration that sticks** | Insights become behavior, not just memories | 160-exercise library, daily journal, return-visit toolkit |
| **Calm, not clinical** | A warm space, not a med-tech dashboard | Cream/blue aesthetic, conversational UI, no jargon |
| **Built on lineage** | Grounded in real frameworks (IFS, polyvagal, somatic) | RAG-backed AI guide, 21k+ chunks of curated protocols |

### The name itself
"Multitudes" carries three intentional layers, each mapping to a real feature in the app:
1. **Whitman** — *"I am large, I contain multitudes"* — literary/cultural anchor
2. **IFS parts work** — the self contains many parts (manager, firefighter, exile, Self) — feature: Parts check-in
3. **Polyvagal** — the nervous system contains many states (ventral, sympathetic, dorsal) — feature: Nervous System mapping

The brand name *is* the product philosophy.

### Who it's for
**Primary persona — "The Intentional Explorer"** — 30–55, college-educated, has done 1–3 journeys (KAP, retreat, ceremony) or is preparing for one. Reads Pollan, listens to Ferriss/Huberman/Sam Harris. Already journals or meditates. Pain: "I had a profound experience and three weeks later I'm back to my old patterns."

**Secondary — "The Practitioner-Referrer"** — KAP therapists, retreat facilitators, integration coaches. Doesn't pay for seats; *recommends* to clients.

---

## 2. Voice & Tone

**Multitudes sounds like a thoughtful friend who's done the work.** Warm, literate, grounded. Never woo-woo, never clinical, never bro-science.

### Comparable brands (in voice)
- **Calm** — warmth, gentleness
- **Day One** — craft, restraint
- **How We Feel** — clinical-adjacent without being clinical
- **The Marginalian** (Brain Pickings) — literary register, big ideas in plain English

### Vibes to avoid
- BetterHelp / Talkspace — too clinical
- Headspace — too cartoony
- Anything "biohack" or "optimize" — too utilitarian
- Anything chakra/mandala/sage-smoke — too woo

### Words to use ✅
*wellness, reflection, integration, journey, experience, practice, companion, support, parts, nervous system, intention, glimmer, presence, inner work, the work, multitudes, return, settle, tend*

### Words to avoid 🚫
*treatment, therapy, therapeutic, diagnosis, cure, patient, clinical, medical, prescription, dose, trip (too casual), session (too clinical — context-dependent), psychedelic-as-medicine (legal risk), optimize, biohack, unlock, hack, level up*

### Sentence-level rules
- Write short. Long sentences only when the rhythm earns them.
- Use the second person ("you," "your") — direct, intimate.
- Avoid imperatives at the start of UI copy ("Do X" → "Let's X" or "X with us").
- Never use exclamation points except in genuinely celebratory moments.
- Em dashes are fine — they match the conversational rhythm.
- One emoji per page maximum. Usually zero.

---

## 3. Naming Conventions

| Element | Convention |
|---|---|
| **The app/brand** | "Multitudes" — always capitalized, never "the Multitudes app" in body copy |
| **The AI guide character** | "Huxley" — the *character* inside Multitudes (Apple : Siri :: Multitudes : Huxley). The brand is Multitudes; Huxley remains as the in-app companion. |
| **The user** | "you" in copy; "members" or "people" when referring in third person. **Never** "users" (cold), "patients" (clinical), or "clients" (transactional). |
| **The experience** | "Your journey" or "your experience." Avoid "your trip" (too casual), "your session" (too clinical) — unless context is specifically a guided session in the app. |
| **The work** | "Integration," "inner work," "the work," "tending to yourself" — interchangeable. |
| **Features** | Sentence case, not title case: *Daily journal*, *Set intention*, *Parts check-in*. |

---

## 4. Color

### Palette (from `theme/colors.js` — locked in code)

| Role | Hex | Use |
|---|---|---|
| **Primary — Calm Blue** | `#5d86d6` | Buttons, links, highlights, primary CTAs |
| **Cream background** | `#F5F5F5` | App background, page background |
| **Charcoal text** | `#3A3A3A` | All body text |
| **White surface** | `#FFFFFF` | Cards, modals, elevated surfaces |
| **Sage** | `#8B9D83` | Calming accents, success states |
| **Golden** | `#E6B17E` | Highlights, warmth, "golden hour" moments |
| **Dusty rose** | `#D4A5A5` | Nurturing, gentle accents |
| **Deep earth** | `#7A5C4D` | Grounding, depth (sparingly) |

### Signature gradient
**`#fbffdf → #7794b6`** (warm pale yellow → soft blue)
Direction: top-right to bottom-left.
Used on hero sections, splash, key brand moments. **Do not invent new gradients** — this one is the brand.

### What to avoid
- Deep indigo or near-black backgrounds (the old aesthetic; rejected)
- Pure black `#000000` (use `#3A3A3A` instead)
- Neon, fluorescent, or saturated brand colors
- Generic corporate blue (`#0066CC`-style)
- High-saturation purples (the old psychedelic-cliché palette)

---

## 5. Typography

### Type pairing
- **Wordmark / logo:** **Sans-serif** (rounded, modern — see `design/Multitudes/` for canonical wordmark file). The logo is **not** in Fraunces. The wordmark and the hero display copy are deliberately different typefaces.
- **Hero / display copy:** **Fraunces 700 Bold** (serif) — Google Fonts. Used for landing page hero, section openers, About-page headlines — *not* the wordmark.
- **Body / UI:** **System** — San Francisco (iOS), Roboto (Android), **Inter** (web)

The pairing logic: sans wordmark + serif display headlines + sans body. Matches the modern wellness-app convention (Calm, Headspace, Notion) — sans-led brand identity with serif accents where literary weight is earned.

### Hierarchy (web/marketing)

| Level | Font | Size | Weight | Use |
|---|---|---|---|---|
| Hero | Fraunces | 56–72px | 700 | Landing hero, only one per page |
| H1 | Fraunces | 40–48px | 700 | Major section headings |
| H2 | Fraunces | 28–32px | 700 | Subsection headings |
| H3 | Inter | 20–22px | 600 | Card titles, minor headings |
| Body | Inter | 17–18px | 400 | Paragraphs |
| Caption | Inter | 13–14px | 400 | Metadata, footnotes |

### Rules
- One hero serif per page. After that, switch to sans.
- Line-height: 1.5 body, 1.2 headings.
- Letter-spacing: 0 for body, slightly tight (-0.01em) for large serif headings.
- Never use all-caps in body. Sparingly in eyebrow labels (`OUR APPROACH`).
- Never use italics for emphasis in UI — use weight.

---

## 6. Imagery & Iconography

### Photography — USE
- Natural light, slightly desaturated
- Off-center compositions
- Hands: journaling, holding a mug, on a chest, in a garden
- Plants, candles, hearths, open books, soft textiles
- Interior spaces: cozy chairs, windows, warm wood
- Skies: dawn, dusk, soft cloud
- Abstract organic shapes (smoke, water, light)

### Photography — AVOID
- Stock-photo "person on a mountain at sunset with arms raised"
- Lab coats, clipboards, stethoscopes, brain scans
- Syringes, pills, IV bags (legal-risk + tone)
- Mandalas, sacred geometry, fractals, "psychedelic visuals" — overused and woo-coded
- High-contrast portrait close-ups with intense eye contact
- Anything that could appear in a pharmaceutical ad

### Logo
- **Canonical files:** `design/Multitudes/` directory (logo-primary, app-icon-1024, wordmark variants)
- **Visual concept:** translucent watercolor circles overlapping — literal visual metaphor for *parts becoming a whole*. Each circle = a part of self; together they form one composition. Maps directly to IFS / polyvagal / Whitman.
- **Color direction:** **blue-forward composition** matching the in-app primary (`#5d86d6`), with warm accents (gold, sage, dusty rose, cream).
- **Sparkle stars:** used sparingly. One more than the current count tips into "woo." Trust the discipline.
- **Don't:** add gradients to the logo (the watercolor is doing that work); don't outline; don't drop-shadow.

### Iconography
- Style: simple line drawings or soft filled illustrations (matches existing icon library)
- Existing assets in `design/Icon/final_pack/` and `design/app_assets_export/` are the canonical reference
- New icons follow the same rounded, gentle, hand-drawn quality
- Avoid: sharp geometric vector icons, "material design" style, anything resembling fintech UI

---

## 7. Taglines — by surface

Each surface gets a deliberate tagline. Don't mix them.

| Surface | Tagline |
|---|---|
| **Logo lockup** (under wordmark) | **"Every part. Your whole."** |
| **Landing page hero** | **"You contain multitudes."** *(line 1)*  /  **"A companion for the work of tending them."** *(line 2)* |
| **About / Our Story** (section opener) | **"Integrating the multitudes you contain."** |
| **App Store subtitle** (30-char iOS limit) | **"Every part. Your whole."** *(fits in 24)* |
| **Meta description / Google snippet** | *"A wellness companion for setting intention, reflecting deeply, and integrating insight from non-ordinary states."* |

### Whitman attribution
The line *"I am large, I contain multitudes."* — attributed to Walt Whitman — appears on **About / Our Story** as a pull quote. It's the etymology, not the slogan. Don't use it as a tagline elsewhere.

---

## 8. Legal & Positioning Guardrails

From ADR-009 (2026-05-05) — non-HIPAA wellness positioning:

- Multitudes is a **wellness and reflection tool**, never a **medical / therapeutic / clinical** product
- Never imply Multitudes diagnoses, treats, or replaces mental health care
- Never imply psychedelics are safe, legal where they aren't, or that the app substitutes for professional support
- Crisis disclosure: every relevant surface (landing page footer, in-app onboarding, support pages) links to crisis resources
- Legal entity: **Alleviation Therapeutics** (per [project_brand_domain_somanoetic]) — used in policies, ToS, contact addresses. The brand-facing name is Multitudes; the legal name stays Alleviation Therapeutics.
- Brand email: `hello@multitudesapp.io` (or similar) — never use personal email for brand-facing communication

---

## Decisions Log

| Date | Decision |
|---|---|
| 2026-05-13 | App brand renamed: Huxley → Multitudes (see [project_rebrand_multitudes]) |
| 2026-05-13 | Primary domain: `multitudesapp.io` acquired |
| 2026-05-13 | Brand handle: `@withmultitudes` across all social platforms |
| 2026-05-13 | Wordmark typography: **sans-serif** (not Fraunces) — Fraunces reserved for hero / section headlines |
| 2026-05-13 | Logo color direction: **blue-forward composition** matching in-app primary `#5d86d6`, warm accents |
| 2026-05-13 | Tagline allocations locked across four surfaces (see §7) |
| 2026-05-13 | Huxley character stays as in-app AI guide name; Multitudes is the brand |
| 2026-05-13 | Canonical logo files live in `design/Multitudes/` |

## Still open

- **Photography sourcing:** custom shoot, curated stock (Stocksy, Unsplash+), or illustration-led. Defer until Step 3 (landing page) — decision becomes concrete when we're actually placing imagery.
