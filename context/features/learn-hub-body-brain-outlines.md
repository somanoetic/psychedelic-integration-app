# "Body, Brain & Healing" — Article Outlines (book-sourced)

**Status:** Outlines for review (drafting not started)
**Date:** 2026-06-18
**Category:** Learn hub → "Body, brain & healing"
**Source of truth:** Imported books in `knowledge-base/source-materials/extracted-text/`

## Scope & decisions

This category expands from **4 articles → 8 accessible articles**, each rebuilt/built from the
imported books, with a **Sources footer** and **tappable cross-links** between related articles.

Two content decisions were resolved by checking the actual book texts (both confirmed the
practitioner's instinct):

- **"Your Brain on Healing"** presents **both** models of emotion as complementary — evolved
  emotional circuitry (Panksepp, Damasio; amygdala is real) **and** constructed emotion (Barrett;
  why reshaping is possible). It does **not** debunk the amygdala. The Default Mode Network section
  is flagged **SOURCE PENDING** — practitioner is adding a psychedelic-neuroscience book; partial
  cover exists in *Being You* (Seth) and *Waking Up* (Harris).
- **"Attachment & Relationships"** keeps the **four standard styles** (secure / anxious / avoidant /
  disorganized), sourced from the library: Siegel's *Interpersonal Neurobiology and Clinical
  Practice* explicitly names all four + earned-secure; Sensorimotor Psychotherapy supports.
  Enriched with **Gabor Maté** (*Scattered* ch.9 "Attunement and Attachment", *Myth of Normal*)
  and the **narrative-coherence** idea drawn (patient-facing only) from the AAI documents.

**Backlog (NOT this project):**
- Adult Attachment Interview (AAI) → better as a **guided, clinician-side Huxley session**, not a
  patient-facing article. Source docs exist: `Adult_Attachment_Interview-Main.txt`,
  `Adult_Attachment_Questions_and_Goals.txt`.
- A `knowledge-base/SOURCES.md` index (title/author/topic/path/which-article-it-grounds) — to be
  built in a separate chat.

## Implementation notes (render mechanism)

- Articles live in `content/education.js` as `{ id, title, description, emoji, estimatedTime,
  content: [{title, text}], keyTakeaways: [] }`.
- Rendered by `screens/EducationScreen.js` (`renderSelectedTopic`, ~L364-422): maps `content[]`
  then `keyTakeaways[]`.
- **Sources footer** = add an optional `sources: []` field + a render block after keyTakeaways.
- **Tappable cross-links** = add an optional `seeAlso: [topicId]` field + a render block that calls
  the existing `handleTopicPress(id)` (no new navigation needed; `getTopicById` resolves any id).
- Category membership + titles also referenced in `components/ConversationalEducation.js`
  (`topicCategories` ~L78, `topicDetails` ~L116, `TOPIC_ICONS`).

---

# Tier overview

**Rebuilt (overview tier):** 1 Somatic · 2 Brain on Healing · 3 Trauma · 4 Attachment
**New (same accessible bar):** 5 Polyvagal/Safety · 6 Mind-Body & Pain · 7 Reconsolidation · 8 IPNB

Cross-link map (proposed):
- Somatic ↔ Polyvagal/Safety ↔ Trauma (window of tolerance, pendulation)
- Brain on Healing → Reconsolidation (deeper on memory updating) → IPNB (relationships shape brain)
- Trauma → Mind-Body & Pain (nervous system & symptoms) → Somatic
- Attachment ↔ IPNB (co-regulation, earned security)

---

## 1. 🫁 Somatic Awareness & the Body  *(rebuild)*

**Sources:** Ogden & Fisher, *Sensorimotor Psychotherapy*; Mischke-Reeds, *Somatic Psychotherapy
Toolbox*; *Somatic Therapy for Healing Trauma*.

### Sections
1. **Your Body Holds Your Story** — body isn't separate from mind; procedural learning (posture,
   breath, tension are adaptations) [Sensorimotor — procedural learning]; listening to signals gives
   info words can't [Toolbox].
2. **Your Nervous System's Safety Detector** — neuroception (auto safe/danger scan) [Sensorimotor /
   Porges]; window of tolerance [Sensorimotor]; faulty neuroception → old survival patterns.
3. **Reading Your Body's Language** — tension/posture/breath/gaze as somatic narrative; sensations to
   notice; curiosity not judgment [Toolbox — befriending].
4. **Two Anchors: Grounding & Pendulation** — grounding to support beneath you; pendulation =
   activation↔rest rhythm teaches nervous system states change [Somatic Therapy for Healing].
5. **Sensation Becomes Wisdom (Felt Sense)** — felt sense guides you; stored tension releases through
   awareness/movement/breath [Somatic Therapy for Healing].
6. **From Implicit to Explicit** — trauma stored as implicit memory; mindful awareness moves it from
   "always happening" to "happened in the past"; not fixing, befriending.

### Try this
**Body Awareness Grounding (5–10 min):** settle, feel points of contact, scan toe→head noticing
sensation without fixing, pause with curiosity at tight spots ("tight/warm/heavy?"), note an easeful
spot as a resource, close with 3 slow breaths. [Somatic Therapy for Healing; Sensorimotor]

### Key takeaways
- Your body is a source of wisdom that exists outside language.
- The nervous system's job is to detect safety; grounding/present-moment awareness help reset it.
- Somatic awareness = noticing with curiosity, not forcing change.
- Grounding, tracking, pendulation build your capacity.
- Daily body-noticing is a form of self-attunement.

### Cross-links
→ Your Nervous System & Safety (neuroception, states) · → Understanding Trauma (window/pendulation)

### Notes
Window of tolerance, neuroception, pendulation = strongly supported across all three. Keep "not
forcing / titration" emphasis. Educational, not treatment.

---

## 2. 🧬 Your Brain on Healing  *(rebuild — presents BOTH emotion models)*

**Sources:** Barrett, *How Emotions Are Made*; Panksepp, *Affective Neuroscience*; Damasio, *The
Feeling of What Happens*. **[DMN SOURCE PENDING — practitioner adding psychedelic-neuroscience book;
partial: Seth *Being You*, Harris *Waking Up*]**

### Sections
1. **Your Brain Is Built to Change** — neuroplasticity; repetition reshapes pathways; integration is
   a practice not an event [Barrett; Damasio].
2. **Emotions Have Deep Evolutionary Roots (circuits are real)** — inherited systems keep you alive;
   amygdala/limbic react FAST before thinking brain [Panksepp — SEEKING/FEAR/RAGE/PANIC/CARE;
   Damasio — emotion as bioregulation]; evolved ≠ fixed.
3. **Your Brain Also Constructs Emotions (meaning layer)** — raw body signals have no fixed meaning;
   brain predicts emotion from context + concepts; same sensation → different feeling; granularity
   [Barrett].
4. **How the Two Fit Together** — circuits = raw material; construction = meaning built on top;
   nature PLUS nurture at different levels; integration teaches new concepts atop the circuits.
5. **Your Body Is Your Emotional Compass** — interoception/body budget [Barrett]; feelings are
   body-state representations [Damasio]; granularity as a skill; body-based practices interrupt old
   signals.
6. **How Emotional Learning Changes** — activated memories become malleable; mismatch updates them;
   6–8 wk integration window. *(Light pointer → "How Emotional Learnings Change" for the deep dive.)*
7. **Default Mode Network & Sense of Self** — **[SOURCE PENDING]** DMN active in self-referential
   thought; psychedelics quiet it → ego dissolution / fresh perspective / connectedness; integration
   anchors insight before old self-patterns return. *(Partial: Seth, Harris.)*

### Try this
**Granular Noticing (5 min):** notice one sensation without naming → describe it (fast/slow,
warm/cool, where) → ask what it could mean in this context → name it *freshly* ("activation",
"longing") rather than a broad word → repeat to build granularity. [Barrett]

### Key takeaways (honor both models)
- Your brain has fast protective circuits AND constantly reshapes what they mean.
- Emotions are both real biology and constructed meaning.
- The more precisely you name a feeling, the more choice you have.
- Integration respects evolution AND plasticity — it teaches the circuits new concepts.
- Your body is the bridge; interoception is the access point.

### Cross-links
→ How Emotional Learnings Change (reconsolidation) · → Mind, Brain & Relationships (IPNB)

### Notes
SUPPORTED now: amygdala as fast emotional system (Panksepp/Damasio), neuroplasticity, reconsolidation
(Damasio), 6–8wk window. NUANCE: add the constructed layer + interoception/granularity (currently
absent). PENDING: all DMN mechanism claims — keep section but flag until source added.

---

## 3. 🌿 Understanding Trauma  *(rebuild)*

**Sources:** Maté, *The Myth of Normal* & *Scattered*; Perry & Winfrey, *What Happened to You?*;
Schwartz, *The Complex PTSD Treatment Manual*.

### Sections
1. **Trauma Is a Wound Inside You, Not the Event** — Maté: "what happens inside you in response to
   what happens to you"; trauma = wound (open or scarred); support afterward determines impact.
2. **Kinds of Trauma — Single Incident to Developmental** — big-T vs small-t/developmental; inescapable
   childhood adversity; betrayal deepens the wound [Complex PTSD; Perry].
3. **How Trauma Lives in Your Nervous System** — alert→arousal→shutdown sequence [Perry];
   hyper/hypo-arousal [Schwartz]; body remembers before thinking brain [Maté].
4. **You're Not Broken — You're Adapted** — survival patterns made sense; healing = helping the
   system learn it's safe now; many carry wounds unlabeled [Maté; Perry; Schwartz].
5. **Core Principles of Safe, Paced Healing** — safety & rhythm first; titration & pendulation; window
   of tolerance; completion/discharge [Schwartz].
6. **Grounding in the Present + When to Seek Support** — 5-4-3-2-1 grounding; co-regulation as
   medicine; choice/pacing non-negotiable; explicit "seek professional support if…" list [Schwartz].

### Try this
**Window of Tolerance Check-In (2–3 min):** notice flooded vs checked-out vs okay → anchor (feet,
hand on heart, 4-4-4 breath ×3) → notice something safe → gentle movement if needed. Not forcing
"better" — signalling *safe right now*. [Schwartz; Perry]

### Key takeaways
- Trauma is what happens inside your nervous system, not the event itself.
- Your survival adaptations were smart; healing honors them while learning new ways.
- Healing needs safety, rhythm, presence, time — paced, not fast.
- You're not broken, you're adapted; adaptation can shift when conditions change.
- Grounding in body + present is always available.

### Cross-links
→ The Mind-Body Connection & Pain · → Somatic Awareness · → Your Nervous System & Safety

### Notes
Strongly supported: safety, titration, pendulation, hyper/hypo-arousal, when-to-seek-support. Lead
with Maté's "wound inside" reframe + the "what happened to you?" shift. Position in-app tools as
complementary to professional care for complex trauma, never a replacement.

---

## 4. 🤝 Attachment & Relationships  *(rebuild — 4 styles kept, library-sourced + Maté)*

**Sources (primary, four styles + earned security):** Siegel et al., *Interpersonal Neurobiology and
Clinical Practice*; Ogden et al., *Sensorimotor Psychotherapy*.
**Enrichment (how attachment heals):** Maté, *Scattered* (ch.9 Attunement & Attachment) & *Myth of
Normal*; Perry & Szalavitz, *Born for Love* & *The Boy Who Was Raised as a Dog*; Neufeld & Maté,
*Hold On to Your Kids*. (Narrative-coherence idea drawn, patient-facing only, from AAI materials.)

### Sections
1. **What Is Attachment?** — internal working model from earliest relationships; shows up in
   relationships AND psychedelic states; not fixed — can be transformed [Siegel].
2. **The Four Attachment Styles** — Secure (flexible responder), Anxious-Preoccupied (seeking heart,
   hyperarousal), Avoidant-Dismissing (independent protector, hypoarousal), Disorganized-Fearful
   (conflicted survivor, arousal swings). Each: relationship pattern + nervous-system signature
   [Siegel — names all four + earned-secure; Sensorimotor — somatic markers].
3. **Attunement: Maté's Lens** — attachment vs. authenticity; we may suppress the self to preserve
   connection; attunement is the relational nutrient [Maté, *Scattered*/*Myth of Normal*].
4. **How Your Style Shows Up — in Relationships & Psychedelic Experiences** — somatic markers; how
   each style meets the medicine/guide/silence; you're adaptive, not broken [Sensorimotor; Perry].
5. **Co-Regulation & Why Connection Heals** — caregiver's calm regulated your stress response; same
   mechanism lifelong; you heal attachment with/through others [Perry/*Born for Love*].
6. **Earned Security — You Can Change at Any Age** — earned-secure transformation [Siegel]; *making
   coherent sense of your story* is itself the marker of security (AAI coherence idea, patient-facing);
   repeated safe attunement rewires implicit memory [Perry/Neufeld].
7. **What This Means for Your Integration** — know your pattern; ask for what you need (anxious→check-
   ins, avoidant→space then process, disorganized→slow+grounding); guide/container as co-regulator.

### Try this
**Three-Breath Attunement:** Breath 1 arrival ("what does my nervous system need?"), Breath 2
connection (breathe with a trusted other, or hand on heart), Breath 3 intention ("I'm learning that
closeness / independence / safety is possible for me"). [Perry; Sensorimotor]

### Key takeaways
- Your attachment style is a learned pattern, not your destiny — changeable at any age.
- Psychedelic experiences are relational events; the container shapes integration.
- Co-regulation isn't weakness; it's how brains heal.
- Anxious/avoidant/disorganized patterns all carry wisdom — you build flexibility, not erasure.
- Being able to tell a coherent story of your life is a sign (and a builder) of earned security.

### Cross-links
→ Mind, Brain & Relationships (IPNB) · → Understanding Trauma · → Your Nervous System & Safety

### Notes
CONFIRMED in-library: Siegel IPNB-Clinical explicitly describes secure/anxious-ambivalent/avoidant/
disorganized + earned-secure ("transform … into an earned-secure attachment"). Sensorimotor mirrors
(insecure-avoidant / insecure-ambivalent / disorganized-disoriented) + somatic markers. The specific
*labels* trace to Ainsworth/Main — both books cite them, so a light "(classic attachment research)"
nod is enough; no out-of-library citation required. Keep four styles as patterns, not boxes.

---

## 5. 🚦 Your Nervous System & Safety (Polyvagal-informed)  *(new)*

**Sources:** Deb Dana, *The Polyvagal Theory in Therapy*; *Polyvagal Exercises for Safety and
Connection*; *Polyvagal Perspectives*. (Founding science: Porges.)

### Sections
1. **You're Wired for Connection** — nervous system as safety surveillance; not broken when you
   freeze; protection via three pathways [Dana — neuroception, autonomic hierarchy].
2. **The Story of Three States (Autonomic Ladder)** — Ventral vagal (safe & connected), Sympathetic
   (mobilized/alert), Dorsal vagal (collapse/shutdown) — what each *feels* like [Dana].
3. **Neuroception: Your Nervous System's Intuition** — reads body/environment/people below awareness;
   "story follows state"; feeling unsafe isn't a choice [Dana].
4. **Triggers & Glimmers** — triggers light protective states; glimmers = micro-moments of ventral
   safety; mapping both reveals your patterns [Dana]. *(Ties to the in-app mapping exercise.)*
5. **Co-Regulation & Connection** — nervous system is relational; reaching for a regulated other is
   biology, not weakness [Dana].
6. **Anchors & Ventral-Vagal Practices** — anchors (phrase/place/sensation/person) help the system
   remember safety; practice visiting ventral in small moments [Dana].
7. **Befriend Your Nervous System** — curiosity over judgment; this article is the *reading*, the
   mapping exercise is the *doing*.

### Try this
**Five Senses + Ground (2–3 min):** find your feet → name one thing per sense → hand on heart →
gentle anchor phrase ("I'm here / I'm safe right now"). [Dana]

### Key takeaways
- Your nervous system isn't your enemy; it's trying to keep you safe.
- Three states — connected/calm, mobilized/alert, shut down — and knowing which is step one.
- Your gut knows before your brain (neuroception); listen, don't fight.
- Glimmers are real and countable; noticing them teaches safety is possible.
- You're wired to heal in relationship.

### Cross-links
→ Somatic Awareness · → Understanding Trauma · (in-app) Nervous System Mapping exercise

### Notes
Keep terms accessible: pair "neuroception" with "your body's safety-sensing system"; "autonomic
ladder" as a friendly metaphor. This READING complements the existing interactive mapping exercise —
end by pointing to it ("now it's your turn to map your own states").

---

## 6. 🫀 The Mind-Body Connection & Chronic Pain  *(new)*

**Sources:** Gordon, *The Way Out*; Schubiner, *Unlearn Your Pain*; Schechter, *Think Away Your Pain*.

> **Required medical framing:** educational only; not medical advice. **Rule out structural/medical
> causes with a doctor first.** Do NOT claim all pain is psychological or tell anyone to stop care or
> medication. Frame: *some* chronic pain is driven by learned brain pathways, and mind-body
> approaches can help — *after* medical evaluation.

### Sections
1. **Is Your Pain Real? (Yes.)** — neuroplastic pain is 100% real, not "in your head"; structural vs
   neuroplastic (a stuck "false alarm") [Gordon; Schubiner; Schechter].
2. **How Your Brain Learned to Hurt** — brain as prediction machine; alarm can stay on after healing;
   stress/fear/personality keep the signal stuck [Gordon; Schubiner; Schechter].
3. **The Fear-Pain Cycle (and Breaking It)** — pain→fear→more signal loop; responding without fear
   sends "messages of safety" [Gordon].
4. **First Step: Medical Evaluation (Not Optional)** — see a doctor; persistent pain despite
   treatment / no clear cause may point to neuroplastic mechanisms alongside or instead of structural.
5. **Somatic Tracking** — mindful attention to sensation without trying to change it + curiosity +
   safety reappraisal → corrective experiences rewire the response [Gordon].
6. **Emotional Roots** — anger, perfectionism, people-pleasing, stress activate the system;
   journaling/naming helps recalibrate [Schubiner; Schechter].
7. **From "Fix My Body" to "Calm My Brain"** — after ruling out medical causes, build safety, break
   the fear loop; setbacks are normal corrective-experience opportunities.

### Try this
**Somatic Tracking with Safety Reappraisal (5–10 min):** notice the sensation without fixing,
describe it with curiosity → send safety messages ("uncomfortable but not dangerous; my brain is
overprotecting") → observe shifts without demanding relief. Not positive thinking — testing that the
alarm is false. [Gordon]

### Key takeaways
- Neuroplastic pain is real even though the brain generates it.
- Fear and avoidance feed chronic pain; curiosity + safety break the cycle.
- The brain can be retrained through repeated fear-free experiences.
- Emotions and stress are legitimate contributors, not "faking."
- Always start with a doctor; then shift strategy to calming the brain.

### Cross-links
→ Understanding Trauma · → Your Nervous System & Safety · → Somatic Awareness

### Notes
Disclaimer is mandatory (see top). Avoid: "all pain is psychological", "stop your meds", "this will
definitely cure you", "if it didn't work you didn't believe hard enough." Keep expectations realistic.

---

## 7. 🌀 How Emotional Learnings Change (Memory Reconsolidation)  *(new)*

**Source:** Ecker, Ticic & Hulley, *Unlocking the Emotional Brain* (Coherence Therapy /
reconsolidation).

### Sections
1. **Your Emotions Aren't Broken — They're Coherent** — symptoms come from coherent emotional
   learnings ("the emotional truth of the symptom"); they live in implicit memory [Ecker].
2. **Insight Is Not Enough (and why)** — counteractive change (managing/overriding) vs
   transformational change (updating/erasing); insight leaves the emotional circuits intact [Ecker].
3. **The Brain's Three-Step Process** — reactivation → mismatch (felt, contradicting experience /
   prediction error) → repetition/new learning, within the reconsolidation window [Ecker].
4. **Why a Psychedelic Experience Can Catalyze This** — a vivid, full-body contradicting experience
   is exactly the mismatch the emotional brain needs; **but integration afterward is what makes it
   stick** before the old learning reasserts.
5. **Holding the Emotional Truth Beneath Your Symptom** — coherence empathy: understand *why* the
   learning was built (it was protective) before it can update; why "toxic positivity" fails.
6. **(Practice section)** — Surface → Recall a lived contradiction → Hold both (juxtaposition).
7. **Markers of Real Change** — no cascade from triggers; no willpower required; stable under stress
   (erasure, not suppression) [Ecker].

### Try this
**Meeting Your Learning (10–15 min):** vividly recall *feeling* the pattern (reactivation) → ask what
it protects you from (emotional truth) → recall a real moment of the opposite (safe/worthy/okay) →
hold both side by side without arguing → repeat daily for a week, ideally right after integration
work. [Ecker, steps A–C]

### Key takeaways
- Symptoms aren't your fault — they're learned, and what's learned can be unlearned.
- Insight alone doesn't rewire the emotional brain; a felt, contradicting experience does.
- A psychedelic session opens the door; integration closes the deal.
- Real change feels effortless — no willpower, no suppression.
- Your emotional brain is coherent, not broken.

### Cross-links
→ Your Brain on Healing (the broader landscape) — this is the deep dive on the *mechanism*.

### Notes
Complement, don't duplicate, "Your Brain on Healing" (which mentions reconsolidation lightly). Keep
Ecker's precise terms (reactivation, mismatch, transformational vs counteractive). Cautions: not a
guarantee; works *with* support, not instead of; not for crisis/severe trauma alone.

---

## 8. 🧩 Mind, Brain & Relationships (Interpersonal Neurobiology)  *(new)*

**Sources:** Siegel, *Mindsight*; *Pocket Guide to Interpersonal Neurobiology*; *The Mindful Therapist*.

### Sections
1. **The Triangle of Well-Being** — mind, brain, relationships as one integrated whole sharing energy
   & information flow; relationships literally shape the brain [Mindsight].
2. **What Is the Mind? Embodied AND Relational** — mind = an embodied and relational process
   regulating energy/information flow; it extends through the body and between people [Pocket Guide].
3. **Integration as Health (the River)** — linking differentiated parts = harmony; FACES flow
   (Flexible, Adaptive, Coherent, Energized, Stable); banks of chaos and rigidity [Mindsight].
4. **Mindsight** — capacity to see your own mind (insight) and others' (empathy); learnable; noticing
   without being swept away [Mindsight; Pocket Guide].
5. **The Window of Tolerance** — your resilience zone; outside it → chaos (hyper) or rigidity (hypo);
   integration & psychedelic work widen it; attuned relationship widens it too [Mindsight].
6. **How Relationships Shape You** — attuned caregiving shaped your prefrontal regulation; continues
   lifelong; connection is wired-in, not a luxury [Mindsight].
7. **Name It to Tame It** — naming experience engages the cortex, down-regulates reactive subcortical
   alarm; integrates raw sensation into narrative; naming the psychedelic experience weaves it into
   self [Mindsight; Mindful Therapist].

### Try this
**Wheel of Awareness (brief, 5–7 min):** rest in the hub of awareness → notice body sensations →
notice emotions/thoughts (incl. anything still "hot" from a session) → hold it all from the hub
without collapsing in → name one most-alive thread simply. [adapted from Siegel, Mindsight]

### Key takeaways
- Mind, brain, and relationships are one system — shift one, shift all three.
- Integration is health: linking differentiated parts into coherent flow.
- Mindsight is a skill that grows with practice and rewires the brain.
- Attuned connection widens your window of tolerance.
- Relationships literally shape your brain — integration without relationship is incomplete.

### Cross-links
→ Your Brain on Healing · → Attachment & Relationships

### Notes
Complements (doesn't duplicate): "Your Brain on Healing" = mechanics of change; this = the relational/
subjective context (integration as coherence, mindsight). vs "Attachment" = early patterns; this = the
neurobiology of *why* relationship is vital + the practice frame. "Integration" in Siegel's sense maps
directly onto psychedelic integration — make that explicit.

---

## Open questions for the practitioner

1. **DMN source** — which psychedelic-neuroscience book are you adding for §2.7? (Carhart-Harris papers,
   Pollan, etc.) Until then the section stays flagged.
2. **Article ordering** in the category list — overview 4 first, then new 4? Or interleave by theme?
3. **Sources footer style** — full citations (author, title, year) or short ("Drawn from: …")?
4. **Cross-link UI** — confirm tappable "See also" chips at the end of each article (reuses
   `handleTopicPress`); any visual preference?
5. **Icons** for the 4 new topics (TOPIC_ICONS map needs entries): polyvagal→? mind-body→? 
   reconsolidation→? IPNB→?
