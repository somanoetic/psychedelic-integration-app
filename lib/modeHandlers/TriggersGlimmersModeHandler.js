/**
 * Triggers & Glimmers Mode Handler
 *
 * Adds therapeutic process intelligence to Huxley's triggers/glimmers mode.
 * Tracks sympathetic triggers, dorsal triggers, and glimmers through a
 * structured conversational flow with clinical phase gates.
 *
 * This handler does NOT:
 * - Make API calls (Huxley does that)
 * - Build prompts (Huxley does that, using getModeContext())
 * - Persist data (Huxley's therapeuticData pipeline does that)
 *
 * Phase Flow:
 *   sympatheticTriggers → dorsalTriggers → glimmers → summary
 */
import BaseModeHandler from './BaseModeHandler';

// Keywords that suggest sympathetic (fight/flight) triggers
const SYMPATHETIC_TRIGGER_MARKERS = [
  'angry', 'anger', 'rage', 'furious', 'irritated',
  'anxious', 'anxiety', 'panic', 'heart racing', 'racing heart',
  'overwhelmed', 'stressed', 'tension', 'tense', 'restless',
  'loud noises', 'crowded', 'conflict', 'argument', 'yelling',
  'time pressure', 'deadline', 'rushing', 'hurry',
  'fight', 'flight', 'activated', 'hypervigilant', 'on edge',
  'startled', 'jumpy', 'agitated', 'reactive',
];

// Keywords that suggest dorsal vagal (shutdown) triggers
const DORSAL_TRIGGER_MARKERS = [
  'numb', 'frozen', 'stuck', 'shutdown', 'shut down',
  'hopeless', 'helpless', 'worthless', 'invisible',
  'rejected', 'rejection', 'abandoned', 'abandonment',
  'isolated', 'alone', 'unseen', 'unheard', 'ignored',
  'trapped', 'exhausted', 'depleted', 'drained',
  'shame', 'ashamed', 'disconnected', 'dissociated',
  'collapsed', 'flat', 'empty', 'foggy', 'spacey',
  'give up', 'can\'t move', 'heavy', 'paralyzed',
];

// Keywords that suggest glimmers (micro-moments of safety)
const GLIMMER_MARKERS = [
  'warm', 'warmth', 'sunshine', 'sunlight', 'cozy',
  'music', 'song', 'singing', 'melody',
  'nature', 'trees', 'ocean', 'garden', 'flowers',
  'soft', 'texture', 'blanket', 'comfort',
  'smell', 'scent', 'aroma', 'candle',
  'taste', 'tea', 'coffee', 'chocolate',
  'kind', 'kindness', 'smile', 'laughter', 'laugh',
  'eye contact', 'seen', 'heard', 'understood',
  'hug', 'touch', 'pet', 'cat', 'dog', 'animal',
  'safe', 'safety', 'calm', 'peace', 'peaceful',
  'beautiful', 'beauty', 'art', 'sunset', 'sunrise',
  'quiet', 'stillness', 'silence',
];

class TriggersGlimmersModeHandler extends BaseModeHandler {
  constructor() {
    super('triggers_glimmers');
  }

  reset() {
    super.reset();
    this.phase = 'sympatheticTriggers';
    this.triggers = {
      sympathetic: { external: [], internal: [] },
      dorsal: { external: [], internal: [] },
    };
    this.glimmers = {
      sensory: [],
      relational: [],
      environmental: [],
    };
    this.phaseHistory = [];
  }

  // ---------------------------------------------------------------------------
  // CONTEXT FOR PROMPT (injected by HuxleyService)
  // ---------------------------------------------------------------------------

  getModeContext() {
    return {
      sessionPhase: this.phase,
      triggersIdentified: {
        sympathetic: {
          external: this.triggers.sympathetic.external,
          internal: this.triggers.sympathetic.internal,
          total: this.triggers.sympathetic.external.length +
            this.triggers.sympathetic.internal.length,
        },
        dorsal: {
          external: this.triggers.dorsal.external,
          internal: this.triggers.dorsal.internal,
          total: this.triggers.dorsal.external.length +
            this.triggers.dorsal.internal.length,
        },
      },
      glimmersIdentified: {
        sensory: this.glimmers.sensory,
        relational: this.glimmers.relational,
        environmental: this.glimmers.environmental,
        total: this.glimmers.sensory.length +
          this.glimmers.relational.length +
          this.glimmers.environmental.length,
      },
      phaseGuidance: this._getPhaseGuidance(),
    };
  }

  // ---------------------------------------------------------------------------
  // RESPONSE PROCESSING (called by HuxleyService after each exchange)
  // ---------------------------------------------------------------------------

  processResponse(userMessage, aiResponse, therapeuticData) {
    this.exchangeCount++;

    // 1. Extract items from therapeuticData if available
    if (therapeuticData) {
      this._extractFromTherapeuticData(therapeuticData);
    }

    // 2. Detect items from user message
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
      case 'sympatheticTriggers': {
        // Advance when at least 2 sympathetic triggers identified
        const count = this.triggers.sympathetic.external.length +
          this.triggers.sympathetic.internal.length;
        if (count >= 2) {
          this.phase = 'dorsalTriggers';
        }
        break;
      }

      case 'dorsalTriggers': {
        // Advance when at least 2 dorsal triggers identified
        const count = this.triggers.dorsal.external.length +
          this.triggers.dorsal.internal.length;
        if (count >= 2) {
          this.phase = 'glimmers';
        }
        break;
      }

      case 'glimmers': {
        // Advance when at least 2 glimmers identified
        const count = this.glimmers.sensory.length +
          this.glimmers.relational.length +
          this.glimmers.environmental.length;
        if (count >= 2) {
          this.phase = 'summary';
        }
        break;
      }

      // summary is terminal — no further advancement
    }
  }

  // ---------------------------------------------------------------------------
  // ITEM EXTRACTION FROM THERAPEUTIC DATA
  // ---------------------------------------------------------------------------

  _extractFromTherapeuticData(data) {
    // Handle triggers from structured therapeutic data
    if (data.triggers) {
      for (const trigger of Array.isArray(data.triggers) ? data.triggers : [data.triggers]) {
        if (trigger.type === 'sympathetic' || trigger.type === 'fight_flight') {
          this._addTrigger('sympathetic', trigger.category || 'external', trigger.description || trigger.name);
        } else if (trigger.type === 'dorsal' || trigger.type === 'shutdown') {
          this._addTrigger('dorsal', trigger.category || 'external', trigger.description || trigger.name);
        }
      }
    }

    // Handle glimmers from structured therapeutic data
    if (data.glimmers) {
      for (const glimmer of Array.isArray(data.glimmers) ? data.glimmers : [data.glimmers]) {
        this._addGlimmer(glimmer.category || 'sensory', glimmer.description || glimmer.name);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // DETECTION FROM USER MESSAGES
  // ---------------------------------------------------------------------------

  _detectFromUserMessage(text) {
    const lower = text.toLowerCase();

    // Detect based on current phase focus
    if (this.phase === 'sympatheticTriggers') {
      this._detectTriggerItems(lower, 'sympathetic');
    } else if (this.phase === 'dorsalTriggers') {
      this._detectTriggerItems(lower, 'dorsal');
    } else if (this.phase === 'glimmers') {
      this._detectGlimmerItems(lower);
    }
  }

  _detectTriggerItems(lower, type) {
    const markers = type === 'sympathetic' ? SYMPATHETIC_TRIGGER_MARKERS : DORSAL_TRIGGER_MARKERS;
    const matches = markers.filter(m => lower.includes(m));

    if (matches.length > 0) {
      // Determine if external or internal based on content
      const isInternal = lower.includes('thought') || lower.includes('feeling') ||
        lower.includes('memory') || lower.includes('memories') ||
        lower.includes('inside') || lower.includes('internal') ||
        lower.includes('body') || lower.includes('sensation');

      const category = isInternal ? 'internal' : 'external';

      // Extract a concise description — use the matched terms as basis
      for (const match of matches) {
        this._addTrigger(type, category, match);
      }
    }
  }

  _detectGlimmerItems(lower) {
    const matches = GLIMMER_MARKERS.filter(m => lower.includes(m));

    if (matches.length > 0) {
      for (const match of matches) {
        // Categorize the glimmer
        const category = this._categorizeGlimmer(match);
        this._addGlimmer(category, match);
      }
    }
  }

  _categorizeGlimmer(item) {
    const relational = [
      'kind', 'kindness', 'smile', 'laughter', 'laugh',
      'eye contact', 'seen', 'heard', 'understood',
      'hug', 'touch', 'pet', 'cat', 'dog', 'animal',
    ];
    const environmental = [
      'nature', 'trees', 'ocean', 'garden', 'flowers',
      'quiet', 'stillness', 'silence', 'beautiful', 'beauty',
      'sunset', 'sunrise', 'safe', 'safety',
    ];

    if (relational.includes(item)) return 'relational';
    if (environmental.includes(item)) return 'environmental';
    return 'sensory';
  }

  // ---------------------------------------------------------------------------
  // ITEM TRACKING (deduplication)
  // ---------------------------------------------------------------------------

  _addTrigger(type, category, description) {
    if (!description || !type) return;
    const normalised = description.toLowerCase().trim();
    const list = this.triggers[type]?.[category];
    if (!list) return;
    if (!list.some(t => t.toLowerCase() === normalised)) {
      list.push(description.trim());
    }
  }

  _addGlimmer(category, description) {
    if (!description) return;
    const normalised = description.toLowerCase().trim();
    const validCategories = ['sensory', 'relational', 'environmental'];
    const cat = validCategories.includes(category) ? category : 'sensory';
    if (!this.glimmers[cat].some(g => g.toLowerCase() === normalised)) {
      this.glimmers[cat].push(description.trim());
    }
  }

  // ---------------------------------------------------------------------------
  // PHASE GUIDANCE (injected into modeContext for the AI)
  // ---------------------------------------------------------------------------

  _getPhaseGuidance() {
    const sympCount = this.triggers.sympathetic.external.length +
      this.triggers.sympathetic.internal.length;
    const dorsalCount = this.triggers.dorsal.external.length +
      this.triggers.dorsal.internal.length;
    const glimmerCount = this.glimmers.sensory.length +
      this.glimmers.relational.length +
      this.glimmers.environmental.length;

    const guidance = {
      sympatheticTriggers: `Explore fight/flight triggers. Help the user identify what activates their sympathetic nervous system — both external cues (situations, environments, people) and internal cues (thoughts, memories, sensations). ${sympCount} identified so far, need at least 2 to progress. Ask about specific situations where they feel their heart racing, tension, or urge to fight/flee.`,
      dorsalTriggers: `Now explore shutdown/freeze triggers. Help the user identify what pushes them into dorsal vagal — disconnection, numbness, collapse. ${dorsalCount} identified so far, need at least 2 to progress. Ask about situations where they feel numb, frozen, or want to disappear.`,
      glimmers: `Now shift to glimmers — micro-moments of safety and connection. These are the opposite of triggers. Help the user identify sensory glimmers (warmth, music, textures), relational glimmers (kind words, eye contact, being seen), and environmental glimmers (nature, comfortable spaces). ${glimmerCount} identified so far, need at least 2 to progress. Celebrate each one they share.`,
      summary: 'Session is winding down. Summarize all triggers and glimmers identified. Frame triggers with compassion (they make sense given their history). Frame glimmers as powerful resources they can intentionally seek out. Acknowledge their courage in exploring this.',
    };

    return guidance[this.phase] || guidance.sympatheticTriggers;
  }

  // ---------------------------------------------------------------------------
  // SESSION PROGRESS (returned to screens via chat() result)
  // ---------------------------------------------------------------------------

  getSessionProgress() {
    const sympCount = this.triggers.sympathetic.external.length +
      this.triggers.sympathetic.internal.length;
    const dorsalCount = this.triggers.dorsal.external.length +
      this.triggers.dorsal.internal.length;
    const glimmerCount = this.glimmers.sensory.length +
      this.glimmers.relational.length +
      this.glimmers.environmental.length;

    const phaseLabels = {
      sympatheticTriggers: 'Fight/Flight Triggers',
      dorsalTriggers: 'Shutdown Triggers',
      glimmers: 'Glimmers of Safety',
      summary: 'Wrapping Up',
    };

    return {
      phase: this.phase,
      phaseLabel: phaseLabels[this.phase] || this.phase,
      exchangeCount: this.exchangeCount,
      triggerCounts: {
        sympathetic: sympCount,
        dorsal: dorsalCount,
        total: sympCount + dorsalCount,
      },
      glimmerCount,
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
      triggers: {
        sympathetic: {
          external: this.triggers.sympathetic.external,
          internal: this.triggers.sympathetic.internal,
        },
        dorsal: {
          external: this.triggers.dorsal.external,
          internal: this.triggers.dorsal.internal,
        },
      },
      glimmers: {
        sensory: this.glimmers.sensory,
        relational: this.glimmers.relational,
        environmental: this.glimmers.environmental,
      },
      phaseHistory: this.phaseHistory,
      completedPhases: [...new Set(this.phaseHistory.map(h => h.from))],
    };
  }
}

export default TriggersGlimmersModeHandler;
