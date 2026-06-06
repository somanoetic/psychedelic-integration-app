# Tier 1 Relationship Strategy — Execution Plan

**Last Updated:** 2026-06-02
**Status:** Active plan
**Parent:** `context/business/distribution.md` (this is the execution detail for Tier 1)

> Tier 1 = founder-led, high-trust relationships. This is the FASTEST path to first users and
> the SEED LIST for the B2B path. Everything here exploits the one edge a solo founder in this
> niche actually has: being a credible practitioner inside the community. Pick depth over
> breadth — a few real relationships beat a big shallow list.

---

## 0. The mindset (read first)

You are not "marketing an app." You are a practitioner telling people you respect about a
tool you built for this exact problem. That framing is your unfair advantage AND your
guardrail — stay in the practitioner voice, use wellness (not clinical) language per ADR-009,
and never let it feel like a pitch. Trust in the psychedelic space is fragile and slow to
earn; one transactional move burns it.

**Goal of Tier 1:** reach break-even (~40–60 active subs / ~650–2,000 installs per the
financial model) AND build the 5–15 practitioner/center relationships that become the B2B
pipeline.

---

## 1. The three relationship types (and what each is worth)

| Type | Who | What you want from them | What they're worth |
|---|---|---|---|
| **Peers** | Practitioners you already know | Try it, give honest feedback, recommend to clients | Multiplier: 1 → many clients, repeatedly |
| **Partners** | Retreat centers, ketamine clinics, facilitators | Hand the app to clients post-experience | Renewable install source + future B2B buyer |
| **Champions** | A few enthusiastic early users/practitioners | Testimonials, referrals, community vouching | Social proof that unlocks the next tier |

---

## 2. Build the target list (week 1)

Make a simple tracked list (spreadsheet or a `crm/` note). Columns: name, type, relationship
strength (warm/lukewarm/cold), channel to reach them, what they'd care about, status, last
touch.

Populate from:
- **Your existing network** — every practitioner, supervisor, training cohort peer, colleague
  you already know. Start warmest.
- **Local/regional** ketamine clinics and integration therapists (you likely know the scene).
- **Retreat centers** you have any connection to or credibility with.
- **People you've met** at trainings, conferences, online communities.

Target: **20–30 names** to start. Rank by warmth. You will work the warm ones first — do NOT
cold-blast the list.

---

## 3. The outreach sequence (per person)

Keep it human, short, specific. A template skeleton (adapt per person — never mass-send):

**Warm peer:**
> "Hey [name] — I built a psychedelic-integration app I've been wanting to show you. It's the
> journaling + integration support I always wished my clients had between sessions. Would love
> your honest take as someone who actually does this work — can I give you a free account?"

**Center/clinic partner:**
> "I know one of the hardest parts is what clients do for integration *after* they leave. I
> built a self-directed tool for exactly that — journaling, reflection prompts, an AI guide.
> Could I show you how it might fit what you offer participants? No cost to explore."

**The ask is always small:** "try it / take a look / give me your honest feedback." Not "buy
this." The sale comes later, from people who already see the value.

---

## 4. The practitioner loop (the multiplier engine)

This is the highest-leverage mechanic. For each practitioner who engages:
1. **Comp them a full account.** Cost to you ≈ their AI usage; value = a recommender.
2. **Make recommending frictionless.** Per ADR-009 Pattern A/B, they recommend it verbally /
   outside the app ("search Multitudes for this — good fit for you"). Give them a one-line
   way to describe it and a link.
3. **Close the loop:** ask which clients found it useful, what was missing. Their feedback
   improves the product AND deepens the relationship.
4. **Never** build a client-data back-channel into the app (ADR-009 Pattern C = HIPAA). The
   recommendation lives in their conversation with the client, not in Multitudes.

One engaged practitioner with 20 clients is worth more than 200 cold installs.

---

## 5. The center/clinic partnership play (the B2B seed)

Centers and clinics have a real unsolved problem: "what do we give people for integration
after they leave?" You are the ready answer.

**Progression:**
1. **Referral (free):** they tell departing clients about the app. Zero commitment, easy yes.
2. **Cohort codes (B2B-Lite, paid):** they buy a block of premium codes and hand one to each
   participant. This is your first real B2B revenue — needs only the premium-code system
   (FEAT-501), no HIPAA. See `context/business/b2b-path.md` §2.
3. **Program licensing (later):** the structured curriculum as their official integration
   program.

**Per partner, track:** a code prefix so you can measure which center drives activation (feeds
the web admin dashboard, ADR-010).

---

## 6. The printed-journal funnel (already exists)

Becky/Neil Hadfield's printed integration journal is a physical two-way funnel:
- **Journal → app:** QR code / insert pointing to the app (digital companion to the paper).
- **App → journal:** in-app mention of the physical journal for people who want paper.
Wire both directions. It's a warm, on-brand channel competitors can't copy.

---

## 7. Cadence & focus (solo-founder discipline)

- **Pick 2 plays, not 6.** Recommended: **practitioner loop (§4)** + **center partnerships
  (§5)**. They multiply and they seed B2B.
- **Weekly rhythm:** 3–5 personal outreaches/week + follow up on prior ones. Quality over
  volume. This is ~2–4 hrs/week, not a full-time sales job.
- **Protect dev time:** distribution competes with building. Time-box outreach so it doesn't
  eat the week, but do it CONSISTENTLY — relationships compound only with steady contact.
- **Follow up.** Most yeses come on the 2nd or 3rd touch, not the first. A polite nudge after
  ~1–2 weeks is normal and expected.

---

## 8. What to measure

- # practitioners comped → # actively recommending → installs attributed to them.
- # centers in conversation → # referring → # buying cohort codes.
- Per-relationship activation (did their referred users actually use the app?).
- Testimonials/champions collected (fuel for Tier 2 + the landing page).
- All of this lives in the web admin dashboard (ADR-010) once built; until then, the manual
  tracked list.

---

## 9. Guardrails (do not violate)

1. **ADR-009 language:** wellness/reflection, never treatment/therapy/clinical/diagnose —
   in person, in writing, everywhere.
2. **No in-app client-data workspace** for practitioners (Pattern C / HIPAA). Hold this line
   even when a center asks for it — that's the trigger for a deliberate B2B-Clinical decision,
   not an ad-hoc build.
3. **Crisis safety** stays free and prominent — practitioners will judge the tool partly on
   whether it handles distress responsibly.
4. **Honesty about what it is:** a self-directed wellness tool, not a clinical service. This
   honesty is what earns practitioner trust.

---

## 10. First 30 days (concrete starter)

- **Week 1:** Build the 20–30 person target list, ranked by warmth. Set up the tracking sheet.
- **Week 2:** Reach out to the 5 warmest peers. Comp accounts. Ask for honest feedback.
- **Week 3:** Open 2–3 center/clinic conversations (referral ask, not sale). Follow up wk-2
  peers.
- **Week 4:** Collect first feedback + 1–2 testimonials. Identify your first 1–2 champions.
  Note what's blocking activation and feed it to the product backlog.

---

## Links

- Distribution overview: `context/business/distribution.md`
- B2B path (where these relationships lead): `context/business/b2b-path.md`
- Financial model (the targets): `context/business/financial-model.md`
- HIPAA/positioning guardrail: `context/decisions/2026-05-05-hipaa-posture.md`
- Entitlement/codes (powers cohort sales): `context/features/monetization-paywall.md`
