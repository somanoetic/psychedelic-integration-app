/**
 * TRACKS — branching curriculum, v1 draft.
 *
 * 5 themed tracks that curate ACROSS the existing mechanism-categories
 * in exercises-comprehensive.js + topics in education.js + built-in
 * conversational flows / tools. No new content authoring required —
 * tracks are pure curation pointers into existing surfaces.
 *
 * Visual: cairn metaphor.
 *   - assets/images/icons/rubble.png  → marker not started
 *   - assets/images/icons/balance.png → marker engaged
 *
 * Marker shape:
 *   {
 *     id: string,                          // unique within track
 *     title: string,                       // marker-label on trail
 *     subtitle: string,                    // type · duration
 *     payload: {
 *       type: 'exercise' | 'education' | 'conversational' | 'tool',
 *       refId: string,                     // exercise id, education id, route name, etc.
 *     },
 *     relatedMarkers?: string[],           // 'trackId.markerId' pairs — concept links across branches
 *     // v2 schemas-as-priors scaffolding — ignored by v1:
 *     layer?: 'cognitive' | 'emotional' | 'somatic-autonomic' | 'procedural-behavioral' | 'perceptual-prior',
 *     origin?: 'manager' | 'firefighter' | 'exile' | 'self',
 *     domain?: string,                     // McKay/Young schema domain
 *   }
 *
 * Order is a SUGGESTION, not a gate. Skip-ahead is permitted with a soft nudge.
 *
 * TRUNK: the first 3 markers of the Regulating track form the shared foundational
 * trunk shown at the base of the mandala overview. They are NOT duplicated — they
 * just happen to be the first three Regulating markers, and the lotus visual treats
 * them as the trunk before the 5 branches fan upward.
 */

export const TRUNK_TRACK_ID = 'regulating';
export const TRUNK_MARKER_IDS = ['r1', 'r2', 'r3'];

export const tracks = [

  // ═══════════════════════════════════════════════════════════════
  // 1. REGULATING — start here. Building the floor of safety in the
  //    nervous system. Everything else depends on this.
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'regulating',
    name: 'Regulating',
    color: '#5d86d6',
    description: "Building the floor — noticing your state, breath, and the felt sense of safety.",
    intro: "Before integration, regulation. The nervous system needs a floor it trusts.",
    markers: [
      {
        id: 'r1', title: 'Notice your state', subtitle: 'Tool · 2 min',
        payload: { type: 'tool', refId: 'NervousSystemCheckin' },
        relatedMarkers: ['parts.p2', 'somatic.s3'],
      },
      {
        id: 'r2', title: 'The three states', subtitle: 'Learn · 5 min',
        payload: { type: 'education', refId: 'nervous_system' },
        relatedMarkers: ['parts.p1'],
      },
      {
        id: 'r3', title: 'Extended exhale', subtitle: 'Breath · 3 min',
        payload: { type: 'exercise', refId: 'BR-001.1' },
        relatedMarkers: ['somatic.s2', 'somatic.s6'],
      },
      {
        id: 'r4', title: 'Notice and name', subtitle: 'Polyvagal · 3 min',
        payload: { type: 'exercise', refId: 'PV-001' },
        relatedMarkers: ['somatic.s3', 'belief.b4'],
      },
      {
        id: 'r5', title: 'Map your states', subtitle: 'Conversational · 10 min',
        payload: { type: 'conversational', refId: 'NervousSystemMapping' },
        relatedMarkers: ['parts.p2'],
      },
      {
        id: 'r6', title: 'Ventral vagal anchors', subtitle: 'Grounding · 5 min',
        payload: { type: 'exercise', refId: 'GR-003' },
        relatedMarkers: ['somatic.s6'],
      },
      {
        id: 'r7', title: 'Glimmers', subtitle: 'Learn · 4 min',
        payload: { type: 'education', refId: 'triggers_glimmers' },
        relatedMarkers: ['somatic.s8'],
      },
      {
        id: 'r8', title: 'Your regulating toolkit', subtitle: 'Tool · open-ended',
        payload: { type: 'tool', refId: 'RegulatingResources' },
        relatedMarkers: ['integration.i8'],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 2. PARTS (IFS) — getting to know the inner system. Manager,
  //    firefighter, exile, Self. Relationship before unburdening.
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'parts',
    name: 'Parts',
    color: '#c97394',
    description: "Meeting the inner system — managers, firefighters, exiles, and the Self.",
    intro: "Many of you. All with reasons. We start by listening.",
    markers: [
      {
        id: 'p1', title: 'What is IFS?', subtitle: 'Learn · 8 min',
        payload: { type: 'education', refId: 'parts_work' },
        relatedMarkers: ['belief.b1'],
      },
      {
        id: 'p2', title: 'Parts check-in', subtitle: 'IFS · 5 min',
        payload: { type: 'exercise', refId: 'IFS-001' },
        relatedMarkers: ['integration.i2'],
      },
      {
        id: 'p3', title: 'Your parts inventory', subtitle: 'Tool · 15 min',
        payload: { type: 'tool', refId: 'IFSPartsInventory' },
        relatedMarkers: ['belief.b2'],
      },
      {
        id: 'p4', title: 'The Six F\'s', subtitle: 'IFS · 15 min',
        payload: { type: 'exercise', refId: 'IFS-003' },
        origin: 'manager',
        relatedMarkers: ['belief.b5', 'integration.i4', 'somatic.s4'],
      },
      {
        id: 'p5', title: 'Guided parts work session', subtitle: 'Conversational · 15–20 min',
        payload: { type: 'education', refId: 'ifs_chat' },
        relatedMarkers: ['integration.i4'],
      },
      {
        id: 'p6', title: 'Protector appreciation', subtitle: 'IFS · 8 min',
        payload: { type: 'exercise', refId: 'IFS-002' },
        origin: 'manager',
        relatedMarkers: ['somatic.s5'],
      },
      {
        id: 'p7', title: 'Unblending', subtitle: 'IFS · 7 min',
        payload: { type: 'exercise', refId: 'IFS-005' },
        relatedMarkers: ['belief.b6'],
      },
      {
        id: 'p8', title: 'Daily parts meditation', subtitle: 'IFS · 10 min',
        payload: { type: 'exercise', refId: 'IFS-004' },
        relatedMarkers: ['somatic.s2', 'integration.i8'],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 3. BELIEF — v1 stub. Cognitive-level work for now.
  //    Marker shape carries optional layer/origin/domain fields
  //    that v2 (schemas-as-priors / UtEB / juxtaposition) will use
  //    without restructuring.
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'belief',
    name: 'Belief',
    color: '#d9a14a',
    description: "Looking at the rules you've been living by — and which ones still serve.",
    intro: "Some of what feels like truth is an old prediction. Worth checking.",
    markers: [
      {
        id: 'b1', title: 'Core beliefs & deep patterns', subtitle: 'Learn · 9 min',
        payload: { type: 'education', refId: 'core_beliefs' },
      },
      {
        id: 'b2', title: 'Core beliefs inventory', subtitle: 'Tool · 20 min',
        payload: { type: 'tool', refId: 'CoreBeliefs' },
        layer: 'cognitive',
      },
      {
        id: 'b3', title: 'Cognitive patterns & distortions', subtitle: 'Learn · 8 min',
        payload: { type: 'education', refId: 'cognitive_patterns' },
        relatedMarkers: ['integration.i5'],
      },
      {
        id: 'b4', title: 'Spotting distortions', subtitle: 'Cognitive · 7 min',
        payload: { type: 'exercise', refId: 'CBT-003' },
        layer: 'cognitive',
        relatedMarkers: ['integration.i6'],
      },
      {
        id: 'b5', title: 'Downward arrow', subtitle: 'Cognitive · 12 min',
        payload: { type: 'exercise', refId: 'CBT-006' },
        layer: 'cognitive',
      },
      {
        id: 'b6', title: 'Defusion from thoughts', subtitle: 'Cognitive · 8 min',
        payload: { type: 'exercise', refId: 'CBT-010' },
        layer: 'cognitive',
        relatedMarkers: ['integration.i6'],
      },
      {
        id: 'b7', title: 'Belief testing experiment', subtitle: 'Cognitive · open-ended',
        payload: { type: 'exercise', refId: 'CBT-008' },
        layer: 'procedural-behavioral',
        relatedMarkers: ['integration.i7', 'integration.i8'],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 4. SOMATIC — body as the territory. Sensation before story.
  //    Distinct from Regulating: less autonomic-state-shifting, more
  //    body-awareness, release, and the embodied layer of memory.
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'somatic',
    name: 'Somatic',
    color: '#c98a5b',
    description: "The body as the first place anything is known.",
    intro: "Before the words, the sensation. Stay with that.",
    markers: [
      {
        id: 's1', title: 'Somatic awareness & the body', subtitle: 'Learn · 7 min',
        payload: { type: 'education', refId: 'somatic_awareness' },
        relatedMarkers: ['parts.p1'],
      },
      {
        id: 's2', title: 'Integration body scan', subtitle: 'Somatic · 10 min',
        payload: { type: 'exercise', refId: 'SO-001' },
        relatedMarkers: ['integration.i3'],
      },
      {
        id: 's3', title: 'Body language awareness', subtitle: 'Somatic · 8 min',
        payload: { type: 'exercise', refId: 'SO-003' },
        relatedMarkers: ['integration.i3'],
      },
      {
        id: 's4', title: 'Pendulation', subtitle: 'Somatic · 10 min',
        payload: { type: 'exercise', refId: 'SO-004' },
        relatedMarkers: ['parts.p7'],
      },
      {
        id: 's5', title: 'Self-havening touch', subtitle: 'Somatic · 5 min',
        payload: { type: 'exercise', refId: 'SO-007' },
      },
      {
        id: 's6', title: 'Constructive rest', subtitle: 'Yoga · 10 min',
        payload: { type: 'exercise', refId: 'YO-008' },
      },
      {
        id: 's7', title: 'Somatic discharge', subtitle: 'Somatic · 8 min',
        payload: { type: 'exercise', refId: 'SO-008' },
        relatedMarkers: ['integration.i7'],
      },
      {
        id: 's8', title: 'Sensory language', subtitle: 'Somatic · 6 min',
        payload: { type: 'exercise', refId: 'SO-010' },
        relatedMarkers: ['belief.b6'],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 5. INTEGRATION — the post-session arc. Has the most natural
  //    sequence of any track: prep → during → after → forward.
  //    Use this when there's an actual session to integrate.
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'integration',
    name: 'Integration',
    color: '#8b80b8',
    description: "The arc around a session — from preparation to insight to action.",
    intro: "An experience isn't integrated by remembering it. It's integrated by becoming it.",
    markers: [
      {
        id: 'i1', title: 'What is integration?', subtitle: 'Learn · 7 min',
        payload: { type: 'education', refId: 'integration_basics' },
        relatedMarkers: ['parts.p1', 'belief.b1', 'somatic.s1'],
      },
      {
        id: 'i2', title: 'Set an intention', subtitle: 'Conversational · 10 min',
        payload: { type: 'conversational', refId: 'SetIntention' },
        relatedMarkers: ['parts.p2', 'somatic.s3'],
      },
      {
        id: 'i3', title: 'Post-experience body check-in', subtitle: 'Integration · 8 min',
        payload: { type: 'exercise', refId: 'PI-003' },
        relatedMarkers: ['somatic.s2', 'somatic.s3'],
      },
      {
        id: 'i4', title: 'Integration journaling', subtitle: 'Integration · 15 min',
        payload: { type: 'exercise', refId: 'PI-001' },
        relatedMarkers: ['belief.b5'],
      },
      {
        id: 'i5', title: 'Johnson\'s 4-step process', subtitle: 'Learn · 10 min',
        payload: { type: 'education', refId: 'johnson_framework' },
        relatedMarkers: ['belief.b3'],
      },
      {
        id: 'i6', title: 'Symbol and theme mapping', subtitle: 'Integration · 12 min',
        payload: { type: 'exercise', refId: 'PI-006' },
        relatedMarkers: ['parts.p8'],
      },
      {
        id: 'i7', title: 'Insight-to-action bridge', subtitle: 'Integration · 10 min',
        payload: { type: 'exercise', refId: 'PI-004' },
        relatedMarkers: ['belief.b7'],
      },
      {
        id: 'i8', title: 'Daily practice commitment', subtitle: 'Integration · 8 min',
        payload: { type: 'exercise', refId: 'PI-010' },
        relatedMarkers: ['parts.p8', 'belief.b7'],
      },
    ],
  },

];

export const getTrack = (trackId) => tracks.find(t => t.id === trackId);
export const getAllMarkers = (trackId) => getTrack(trackId)?.markers ?? [];
