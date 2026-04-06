/**
 * Regulating Resources Mode Handler
 *
 * Adds therapeutic process intelligence to Huxley's regulating resources mode.
 * Guides users through discovering resources organized by nervous system state:
 *   - Sympathetic (fight/flight): what helps calm and connect (down-regulate)
 *   - Dorsal vagal (shutdown): what helps mobilize and connect (up-regulate)
 *   - Ventral vagal (safe/connected): what keeps you here
 *
 * Within each state, resources are ordered from most passive to most active.
 *
 * This handler does NOT:
 * - Make API calls (Huxley does that)
 * - Build prompts (Huxley does that, using getModeContext())
 * - Persist data (Huxley's therapeuticData pipeline does that)
 *
 * Phase Flow:
 *   intro → sympathetic → dorsal → ventral → summary
 */
import BaseModeHandler from './BaseModeHandler';

// Resource markers — used to detect resources from user messages
// Organized by activation level (passive → active)

const PASSIVE_MARKERS = [
  'warm', 'warmth', 'hot bath', 'shower', 'blanket', 'weighted blanket',
  'smell', 'scent', 'candle', 'incense', 'essential oil',
  'tea', 'coffee', 'chocolate', 'comfort food',
  'texture', 'soft', 'fabric',
  'sunshine', 'sunlight', 'fresh air',
  'music', 'song', 'listening', 'playlist', 'podcast',
  'reading', 'books', 'watching',
];

const COGNITIVE_MARKERS = [
  'journaling', 'writing thoughts', 'writing',
  'reframing', 'perspective', 'thinking through',
  'planning', 'organizing', 'lists', 'problem solving',
  'learning', 'studying', 'researching',
  'reflecting', 'processing', 'understanding',
  'meditation', 'meditate', 'mindfulness', 'contemplation',
  'breathwork', 'breathing', 'deep breaths',
  'prayer', 'praying', 'gratitude',
];

const CREATIVE_MARKERS = [
  'drawing', 'painting', 'art', 'sketch', 'crafting',
  'knitting', 'sewing', 'pottery', 'sculpting',
  'playing music', 'instrument', 'guitar', 'piano', 'drums',
  'singing', 'photography', 'cooking', 'baking', 'gardening',
  'poetry', 'poem', 'creative writing',
];

const MOVEMENT_MARKERS = [
  'stretch', 'stretching', 'gentle movement',
  'walk', 'walking', 'hiking',
  'yoga', 'tai chi', 'qigong',
  'dance', 'dancing', 'shaking',
  'running', 'run', 'jog', 'exercise', 'gym', 'workout',
  'swim', 'swimming', 'cycling', 'bike', 'climbing',
  'martial arts', 'body movement',
];

const CONNECTION_MARKERS = [
  'pet', 'cat', 'dog', 'animal',
  'friend', 'friends', 'partner', 'spouse', 'family',
  'mom', 'dad', 'sister', 'brother', 'parent',
  'therapist', 'counselor', 'group', 'community',
  'neighbor', 'colleague', 'mentor', 'teacher',
  'call', 'calling', 'texting', 'talking to',
  'hug', 'hugging', 'cuddle', 'cuddling', 'holding',
  'co-regulate', 'co-regulation',
  'eye contact', 'being held', 'presence',
  'support group', 'reaching out', 'opening up',
  'play', 'playing', 'game', 'games',
  'laughing', 'laughter', 'humor', 'fun',
];

// All marker lists for detection
const ALL_MARKER_GROUPS = [
  { markers: PASSIVE_MARKERS, category: 'passive' },
  { markers: COGNITIVE_MARKERS, category: 'cognitive' },
  { markers: CREATIVE_MARKERS, category: 'creative' },
  { markers: MOVEMENT_MARKERS, category: 'movement' },
  { markers: CONNECTION_MARKERS, category: 'connection' },
];

class RegulatingResourcesModeHandler extends BaseModeHandler {
  constructor() {
    super('regulating_resources');
  }

  reset() {
    super.reset();
    this.phase = 'intro';
    this.isReturningUser = false;
    this.priorResources = null; // populated from context service for returning users
    this.resources = {
      sympathetic: {  // what helps when activated (fight/flight)
        passive: [],
        cognitive: [],
        creative: [],
        movement: [],
        connection: [],
      },
      dorsal: {  // what helps when shut down
        passive: [],
        cognitive: [],
        creative: [],
        movement: [],
        connection: [],
      },
      ventral: {  // what keeps you in safe/connected state
        passive: [],
        cognitive: [],
        creative: [],
        movement: [],
        connection: [],
      },
    };
    this.phaseHistory = [];
  }

  // ---------------------------------------------------------------------------
  // CONTEXT FOR PROMPT (injected by HuxleyService)
  // ---------------------------------------------------------------------------

  getModeContext() {
    const sympatheticCount = this._getStateCount('sympathetic');
    const dorsalCount = this._getStateCount('dorsal');
    const ventralCount = this._getStateCount('ventral');

    return {
      sessionPhase: this.phase,
      resourcesDiscovered: {
        sympathetic: {
          ...this.resources.sympathetic,
          total: sympatheticCount,
        },
        dorsal: {
          ...this.resources.dorsal,
          total: dorsalCount,
        },
        ventral: {
          ...this.resources.ventral,
          total: ventralCount,
        },
        totalResources: sympatheticCount + dorsalCount + ventralCount,
      },
      phaseGuidance: this._getPhaseGuidance(),
    };
  }

  // ---------------------------------------------------------------------------
  // RESPONSE PROCESSING (called by HuxleyService after each exchange)
  // ---------------------------------------------------------------------------

  processResponse(userMessage, aiResponse, therapeuticData) {
    this.exchangeCount++;

    // 1. Extract resources from therapeuticData if available
    if (therapeuticData) {
      this._extractFromTherapeuticData(therapeuticData);
    }

    // 2. Detect resources from user message — assign to current state phase
    if (userMessage) {
      this._detectFromUserMessage(userMessage);
    }

    // 3. Try to advance phase
    const previousPhase = this.phase;
    this._tryAdvancePhase();

    if (this.phase !== previousPhase) {
      this.phaseHistory.push({
        from: previousPhase,
        to: this.phase,
        atExchange: this.exchangeCount,
      });
    }

    return this.getSessionProgress();
  }

  // ---------------------------------------------------------------------------
  // PHASE ADVANCEMENT (the therapeutic gates)
  // ---------------------------------------------------------------------------

  _tryAdvancePhase() {
    switch (this.phase) {
      case 'intro':
        if (this.exchangeCount >= 1) {
          // Returning users go to update phase; new users start discovery
          this.phase = this.isReturningUser ? 'update' : 'sympathetic';
        }
        break;

      case 'update': {
        // Update phase for returning users — advances after at least 3 exchanges
        const updateStart = this.phaseHistory.find(h => h.to === 'update')?.atExchange || 0;
        if (this.exchangeCount - updateStart >= 3) {
          this.phase = 'review';
        }
        break;
      }

      case 'sympathetic': {
        const count = this._getStateCount('sympathetic');
        if (count >= 3) {
          this.phase = 'dorsal';
        }
        break;
      }

      case 'dorsal': {
        const count = this._getStateCount('dorsal');
        if (count >= 3) {
          this.phase = 'ventral';
        }
        break;
      }

      case 'ventral': {
        const count = this._getStateCount('ventral');
        if (count >= 2) {
          this.phase = 'review';
        }
        break;
      }

      case 'review': {
        // Review advances after at least 2 exchanges of discussion
        const reviewStart = this.phaseHistory.find(h => h.to === 'review')?.atExchange || this.exchangeCount;
        if (this.exchangeCount - reviewStart >= 2) {
          this.phase = 'summary';
        }
        break;
      }

      // summary is terminal
    }
  }

  // ---------------------------------------------------------------------------
  // ITEM EXTRACTION FROM THERAPEUTIC DATA
  // ---------------------------------------------------------------------------

  _extractFromTherapeuticData(data) {
    if (data.resources) {
      const resources = Array.isArray(data.resources) ? data.resources : [data.resources];
      for (const resource of resources) {
        const state = resource.state || this._currentStateFromPhase();
        const category = resource.category || 'passive';
        const description = resource.description || resource.name;
        if (description) {
          this._addResource(state, category, description);
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // DETECTION FROM USER MESSAGES
  // ---------------------------------------------------------------------------

  _detectFromUserMessage(text) {
    const lower = text.toLowerCase();
    const state = this._currentStateFromPhase();

    for (const { markers, category } of ALL_MARKER_GROUPS) {
      const matches = markers.filter(m => lower.includes(m));
      for (const match of matches) {
        this._addResource(state, category, match);
      }
    }
  }

  _currentStateFromPhase() {
    if (this.phase === 'sympathetic') return 'sympathetic';
    if (this.phase === 'dorsal') return 'dorsal';
    if (this.phase === 'ventral') return 'ventral';
    // During update/review/summary, detect from message content (fallback to sympathetic)
    return 'sympathetic';
  }

  // ---------------------------------------------------------------------------
  // RESOURCE TRACKING (deduplication)
  // ---------------------------------------------------------------------------

  _addResource(state, category, description) {
    if (!description) return;
    const normalised = description.toLowerCase().trim();

    const stateGroup = this.resources[state];
    if (!stateGroup) return;
    const list = stateGroup[category];
    if (!list) return;

    if (!list.some(r => r.toLowerCase() === normalised)) {
      list.push(description.trim());
    }
  }

  // ---------------------------------------------------------------------------
  // COUNT HELPERS
  // ---------------------------------------------------------------------------

  _getStateCount(state) {
    const s = this.resources[state];
    if (!s) return 0;
    return s.passive.length + s.cognitive.length + s.creative.length +
      s.movement.length + s.connection.length;
  }

  // ---------------------------------------------------------------------------
  // PHASE GUIDANCE (injected into modeContext for the AI)
  // ---------------------------------------------------------------------------

  _getPhaseGuidance() {
    const sympatheticCount = this._getStateCount('sympathetic');
    const dorsalCount = this._getStateCount('dorsal');
    const ventralCount = this._getStateCount('ventral');

    const totalCount = sympatheticCount + dorsalCount + ventralCount;

    const priorContext = this.isReturningUser && this.priorResources
      ? `\n\nPRIOR TOOLKIT (from last session):\n${JSON.stringify(this.priorResources, null, 2)}`
      : '';

    const guidance = {
      intro: this.isReturningUser
        ? `This is a RETURNING user. They have an existing regulation toolkit.${priorContext}
Welcome them back warmly. Ask what's changed since last time:
- Have they tried anything new? Did it help?
- Has anything stopped working?
- Any new resources they've discovered?
- Any resources they want to drop or change?
Frame it as updating their living document.`
        : `Introduce the concept of regulating resources organized by nervous system state. Explain that we're going to get a full snapshot of what they're ALREADY doing — no judgment, just noticing. Everything counts.
Then we'll look at what could be added or adjusted.
Ask which state they'd like to start with, or suggest starting with what happens when they're stressed/activated.`,

      update: `UPDATE PHASE — Returning user is reporting on changes to their toolkit.${priorContext}
Listen for:
- New resources they've tried: "I tried body scanning and it helped when activated" → add to toolkit
- Resources that stopped working or they want to drop → note for review
- Resources they want to modify → note for review
- Shifts in which state they struggle with most
Keep it conversational and curious. "That's great that body scanning helped — what state were you in when you tried it?"
After gathering updates, move to review to discuss the changes.`,

      sympathetic: `SYMPATHETIC STATE (Fight/Flight) — DISCOVERY PHASE. ${sympatheticCount} resources found, need at least 3 to progress.
Get a full picture of what they ACTUALLY do when activated — anxious, stressed, wired, fight-or-flight.
NO JUDGMENT. If they say alcohol, scrolling, binge eating — write it down. These are real things they do. Don't evaluate, moralize, or redirect. Just notice and record.
Assume they already know their states from NS mapping. Do NOT ask "what does that feel like in your body" or "where do you feel it" — that's a different exercise.
Simply ask: "What do you actually do when you're in this state? What do you reach for?"
Keep it moving. Brief acknowledgment, then ask for the next one. We want the FULL list.`,

      dorsal: `DORSAL VAGAL STATE (Shutdown/Freeze) — DISCOVERY PHASE. ${dorsalCount} resources found, need at least 3 to progress.
Get a full picture of what they ACTUALLY do when shut down — numb, checked out, collapsed, frozen.
NO JUDGMENT. Whatever they do — dissociate, sleep all day, isolate — write it down. This is what's real.
Do NOT dive into body sensations or state exploration. Just: "When you're shut down, what do you actually do? What helps, even a little?"
Keep it moving. We're building the snapshot.`,

      ventral: `VENTRAL VAGAL STATE (Safe & Connected) — DISCOVERY PHASE. ${ventralCount} resources found, need at least 2 to progress.
Get a full picture of what keeps them in their safe, connected state.
What daily practices, relationships, routines, environments sustain their wellbeing?
Same approach: no judgment, just gather. "What does a good day look like? What are you doing when you feel most like yourself?"`,

      review: `REVIEW PHASE — All ${totalCount} resources are on the table. Now step back and look at the full picture together.
This is where the therapeutic conversation happens. Go through the resources and gently explore:
1. What's working well? Celebrate the healthy resources.
2. Are there resources that might be serving double duty — sometimes helpful, sometimes harmful? (e.g., alcohol calms but disconnects; scrolling numbs but avoids; reading can connect or escape — intention matters)
3. Are there gaps? States where they don't have many options? What could be added?
4. Are there resources they'd like to change or develop alternatives for?
${this.isReturningUser ? '5. How have the changes they reported played out? What did they learn from experimenting?' : ''}
Be curious, not prescriptive. "I notice alcohol showed up as something you reach for when activated. What's your relationship with that? Does it help you connect or does it take you further away?"
The goal is awareness, not a to-do list. Help them see the full picture and make their own choices about what to keep, what to add, what to shift.`,

      summary: `Session is winding down. Summarize the current state of their regulation toolkit, organized BY STATE and within each state from most PASSIVE to most ACTIVE:

WHEN ACTIVATED (Sympathetic) — Resources that calm and connect:
  [passive → cognitive → creative → movement → connection]

WHEN SHUT DOWN (Dorsal) — Resources that mobilize and connect:
  [passive → cognitive → creative → movement → connection]

STAYING CONNECTED (Ventral) — Resources that maintain:
  [passive → cognitive → creative → movement → connection]

If any resources were flagged during review as worth examining, note them gently.
If gaps were identified, mention them as areas to explore.
${this.isReturningUser ? 'Highlight what changed since last time — new additions, removals, shifts.' : ''}
Celebrate the honesty and richness of their toolkit.

IMPORTANT: End by recommending they come back to revisit this toolkit as things change. Suggest specific experiments:
- "Try one new resource this week and see how it lands"
- "Notice if any of your current resources shift — what works today might change"
- "Come back anytime to update your toolkit — it's a living document that grows with you"
This is not a finished product. It's a snapshot that evolves.`,
    };

    return guidance[this.phase] || guidance.intro;
  }

  // ---------------------------------------------------------------------------
  // SESSION PROGRESS (returned to screens via chat() result)
  // ---------------------------------------------------------------------------

  getSessionProgress() {
    const sympatheticCount = this._getStateCount('sympathetic');
    const dorsalCount = this._getStateCount('dorsal');
    const ventralCount = this._getStateCount('ventral');

    const phaseLabels = {
      intro: 'Getting Started',
      update: 'Updating Your Toolkit',
      sympathetic: 'When Activated (Fight/Flight)',
      dorsal: 'When Shut Down (Freeze)',
      ventral: 'Staying Connected (Safe)',
      review: 'Reviewing Your Toolkit',
      summary: 'Your Toolkit',
    };

    return {
      phase: this.phase,
      phaseLabel: phaseLabels[this.phase] || this.phase,
      exchangeCount: this.exchangeCount,
      sympatheticCount,
      dorsalCount,
      ventralCount,
      totalResources: sympatheticCount + dorsalCount + ventralCount,
      isComplete: this.phase === 'summary',
    };
  }

  // ---------------------------------------------------------------------------
  // SESSION SUMMARY (for persistence when session ends)
  // ---------------------------------------------------------------------------

  getSessionSummary() {
    return {
      modeId: this.modeId,
      phase: this.phase,
      exchangeCount: this.exchangeCount,
      resources: {
        sympathetic: { ...this.resources.sympathetic },
        dorsal: { ...this.resources.dorsal },
        ventral: { ...this.resources.ventral },
      },
      phaseHistory: this.phaseHistory,
      completedPhases: [...new Set(this.phaseHistory.map(h => h.from))],
    };
  }
}

export default RegulatingResourcesModeHandler;
