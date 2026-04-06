/**
 * Nervous System Exploration Mode Handler
 *
 * A freeform somatic check-in that lets users meander through their
 * nervous system states. No fixed order, no rigid domains — just
 * warm exploration of polyvagal states with gentle tracking.
 *
 * This is distinct from the structured Mapping handler which follows
 * Deb Dana's formal autonomic mapping protocol.
 *
 * This handler does NOT:
 * - Make API calls (Huxley does that)
 * - Build prompts (Huxley does that, using getModeContext())
 * - Persist data (Huxley's therapeuticData pipeline does that)
 *
 * Phase Flow:
 *   intro -> (any state, user-led) -> complete
 *
 * The user chooses which state to explore; the handler does not force an order.
 */
import BaseModeHandler from './BaseModeHandler';

// Keywords used to detect which polyvagal state the user is describing
const STATE_DETECTION = {
  ventral: [
    'safe', 'calm', 'connected', 'relaxed', 'warm', 'open',
    'social', 'engaged', 'grounded', 'peaceful', 'at ease',
    'content', 'joyful', 'playful', 'present', 'settled',
  ],
  sympathetic: [
    'fight', 'flight', 'anxious', 'stressed', 'activated',
    'racing', 'tense', 'alert', 'on edge', 'restless',
    'panicked', 'angry', 'agitated', 'wired', 'hyper',
    'adrenaline', 'nervous', 'overwhelmed', 'rushed',
  ],
  dorsal: [
    'shutdown', 'freeze', 'numb', 'disconnected', 'collapsed',
    'foggy', 'heavy', 'stuck', 'empty', 'flat',
    'dissociated', 'frozen', 'hopeless', 'withdrawn', 'tired',
    'exhausted', 'checked out', 'spaced out', 'paralyzed',
  ],
};

// Keywords that hint at each data category
const CATEGORY_MARKERS = {
  bodySensations: [
    'body', 'chest', 'stomach', 'throat', 'shoulders', 'jaw',
    'hands', 'legs', 'head', 'heart', 'belly', 'back', 'neck',
    'tense', 'tight', 'warm', 'cold', 'tingling', 'heavy',
    'light', 'pressure', 'knot', 'constrict', 'open', 'relax',
    'sensation', 'feel in my', 'feels like', 'temperature',
  ],
  thoughts: [
    'think', 'thought', 'mind', 'voice', 'saying', 'telling',
    'belief', 'story', 'narrative', 'inner critic', 'self-talk',
    'ruminate', 'worry about', 'imagine', 'fantasize',
  ],
  emotions: [
    'feel', 'feeling', 'emotion', 'sad', 'happy', 'angry',
    'scared', 'afraid', 'anxious', 'peaceful', 'joy', 'grief',
    'shame', 'guilt', 'love', 'fear', 'rage', 'despair',
    'content', 'grateful', 'hopeful', 'lonely', 'irritated',
  ],
  triggers: [
    'trigger', 'when', 'situation', 'happen', 'cause',
    'person', 'place', 'event', 'remind', 'response',
    'react', 'pattern', 'always', 'every time', 'whenever',
    'at work', 'at home', 'with my', 'around', 'during',
  ],
};

const POLYVAGAL_STATES = ['ventral', 'sympathetic', 'dorsal'];
const DATA_CATEGORIES = ['bodySensations', 'thoughts', 'emotions', 'triggers'];
const MIN_CATEGORIES_TO_ADVANCE = 2;

class NervousSystemExplorationModeHandler extends BaseModeHandler {
  constructor() {
    super('nervous_system_exploration');
  }

  reset() {
    super.reset();
    this.phase = 'intro';
    this.currentState = null;          // Which polyvagal state we're currently exploring
    this.stateOrder = [];              // Order in which states were explored
    this.mappedStates = {
      ventral: { bodySensations: null, thoughts: null, emotions: null, triggers: null },
      sympathetic: { bodySensations: null, thoughts: null, emotions: null, triggers: null },
      dorsal: { bodySensations: null, thoughts: null, emotions: null, triggers: null },
    };
    this.phaseHistory = [];
  }

  // ---------------------------------------------------------------------------
  // CONTEXT FOR PROMPT (injected by HuxleyService)
  // ---------------------------------------------------------------------------

  getModeContext() {
    const mapped = this._getMappedStateNames();
    const remaining = POLYVAGAL_STATES.filter(s => !mapped.includes(s));

    return {
      sessionPhase: this.phase,
      currentState: this.currentState,
      statesMapped: mapped.map(s => ({
        state: s,
        label: this._stateLabel(s),
        data: this._summarizeStateData(s),
      })),
      statesRemaining: remaining.map(s => ({
        state: s,
        label: this._stateLabel(s),
      })),
      alreadyMappedSummary: mapped.length > 0
        ? `The user has already explored: ${mapped.map(s => this._stateLabel(s)).join(', ')}. Do NOT re-ask about these states.`
        : null,
      phaseGuidance: this._getPhaseGuidance(),
    };
  }

  // ---------------------------------------------------------------------------
  // RESPONSE PROCESSING (called by HuxleyService after each exchange)
  // ---------------------------------------------------------------------------

  processResponse(userMessage, aiResponse, therapeuticData) {
    this.exchangeCount++;

    // 1. If therapeuticData has polyvagal/state info, merge it in
    if (therapeuticData?.polyvagalState) {
      this._mergeTherapeuticData(therapeuticData);
    }

    // 2. Detect state and category data from user message
    if (userMessage) {
      this._detectAndTrack(userMessage);
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
  // PHASE ADVANCEMENT
  // ---------------------------------------------------------------------------

  _tryAdvancePhase() {
    switch (this.phase) {
      case 'intro':
        // Advance once we detect a state the user wants to explore
        if (this.currentState) {
          this.phase = this.currentState;
        }
        break;

      case 'ventral':
      case 'sympathetic':
      case 'dorsal':
        // Advance when at least MIN_CATEGORIES_TO_ADVANCE categories are gathered
        if (this._categoriesGatheredCount(this.phase) >= MIN_CATEGORIES_TO_ADVANCE) {
          const mapped = this._getMappedStateNames();
          const remaining = POLYVAGAL_STATES.filter(s => !mapped.includes(s));

          if (remaining.length === 0) {
            // All three states explored
            this.phase = 'complete';
            this.currentState = null;
          }
          // Otherwise stay in current state — the user or AI will choose the next state
          // We transition when currentState changes (see _detectAndTrack)
        }
        break;

      // complete is terminal
    }
  }

  // ---------------------------------------------------------------------------
  // DETECTION & TRACKING
  // ---------------------------------------------------------------------------

  _detectAndTrack(text) {
    const lower = text.toLowerCase();

    // Detect which polyvagal state the user is talking about
    const detectedState = this._detectState(lower);

    // If we're in intro or a completed state, and user picks a new state, switch
    if (detectedState) {
      const currentComplete = this.currentState &&
        this._categoriesGatheredCount(this.currentState) >= MIN_CATEGORIES_TO_ADVANCE;

      if (this.phase === 'intro' || currentComplete) {
        // Only switch if we haven't fully explored this state yet
        if (!this._getMappedStateNames().includes(detectedState)) {
          this.currentState = detectedState;
          // If we're past intro and current state is done, jump to the new state
          if (this.phase !== 'intro' && currentComplete) {
            this.phase = detectedState;
          }
        }
      }
    }

    // Track data categories for the current state
    if (this.currentState && POLYVAGAL_STATES.includes(this.phase)) {
      this._detectCategories(lower, this.currentState);
    }
  }

  _detectState(lowerText) {
    const scores = {};
    for (const state of POLYVAGAL_STATES) {
      scores[state] = STATE_DETECTION[state].filter(m => lowerText.includes(m)).length;
    }

    // Find highest-scoring state (must have at least 1 match)
    let best = null;
    let bestScore = 0;
    for (const state of POLYVAGAL_STATES) {
      if (scores[state] > bestScore) {
        bestScore = scores[state];
        best = state;
      }
    }
    return best;
  }

  _detectCategories(lowerText, state) {
    for (const category of DATA_CATEGORIES) {
      if (this.mappedStates[state][category]) continue; // already have data

      const markers = CATEGORY_MARKERS[category];
      const matches = markers.filter(m => lowerText.includes(m));

      if (matches.length >= 1) {
        this.mappedStates[state][category] = true;
      }
    }
  }

  _mergeTherapeuticData(therapeuticData) {
    const pd = therapeuticData.polyvagalState;
    if (!pd) return;

    const state = pd.state?.toLowerCase();
    if (!state || !this.mappedStates[state]) return;

    if (pd.bodySensations) this.mappedStates[state].bodySensations = pd.bodySensations;
    if (pd.thoughts) this.mappedStates[state].thoughts = pd.thoughts;
    if (pd.emotions) this.mappedStates[state].emotions = pd.emotions;
    if (pd.triggers) this.mappedStates[state].triggers = pd.triggers;
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  _categoriesGatheredCount(state) {
    if (!this.mappedStates[state]) return 0;
    return DATA_CATEGORIES.filter(c => this.mappedStates[state][c]).length;
  }

  _getMappedStateNames() {
    return POLYVAGAL_STATES.filter(
      s => this._categoriesGatheredCount(s) >= MIN_CATEGORIES_TO_ADVANCE
    );
  }

  _stateLabel(state) {
    const labels = {
      ventral: 'Ventral Vagal (Safe & Social)',
      sympathetic: 'Sympathetic (Fight/Flight)',
      dorsal: 'Dorsal Vagal (Shutdown/Freeze)',
    };
    return labels[state] || state;
  }

  _summarizeStateData(state) {
    const data = this.mappedStates[state];
    const parts = [];
    if (data.bodySensations) parts.push(`Body sensations: ${typeof data.bodySensations === 'string' ? data.bodySensations : 'gathered'}`);
    if (data.thoughts) parts.push(`Thoughts: ${typeof data.thoughts === 'string' ? data.thoughts : 'gathered'}`);
    if (data.emotions) parts.push(`Emotions: ${typeof data.emotions === 'string' ? data.emotions : 'gathered'}`);
    if (data.triggers) parts.push(`Triggers: ${typeof data.triggers === 'string' ? data.triggers : 'gathered'}`);
    return parts.length > 0 ? parts.join('. ') + '.' : 'No data yet.';
  }

  // ---------------------------------------------------------------------------
  // PHASE GUIDANCE (injected into modeContext for the AI)
  // ---------------------------------------------------------------------------

  _getPhaseGuidance() {
    const mapped = this._getMappedStateNames();
    const remaining = POLYVAGAL_STATES.filter(s => !mapped.includes(s));

    const guidance = {
      intro: `Help the user choose which nervous system state to explore first. This is a freeform exploration — ` +
        `no fixed order. Let them follow their curiosity. Suggest starting with whichever feels easiest to access.`,

      complete: `Session is complete. Summarize the states they explored and what they discovered. ` +
        `Acknowledge their self-awareness and suggest they might revisit this exploration over time.`,
    };

    // If we're in a specific state phase, generate state-specific guidance
    if (POLYVAGAL_STATES.includes(this.phase) && this.currentState) {
      const stateData = this.mappedStates[this.currentState];
      const missing = DATA_CATEGORIES.filter(c => !stateData[c]);
      const gathered = DATA_CATEGORIES.filter(c => stateData[c]);
      const stateLabel = this._stateLabel(this.currentState);

      let stateGuidance = `Currently exploring ${stateLabel}. `;

      if (gathered.length > 0) {
        stateGuidance += `Already gathered: ${gathered.map(c => this._categoryLabel(c)).join(', ')}. `;
      }

      if (missing.length > 0) {
        stateGuidance += `Could also explore: ${missing.map(c => this._categoryLabel(c)).join(', ')}. `;
        stateGuidance += `Follow the user's lead — no need to cover everything. `;
      }

      if (gathered.length >= MIN_CATEGORIES_TO_ADVANCE && remaining.length > 0) {
        stateGuidance += `This state has enough to move on whenever they're ready. ` +
          `Remaining states: ${remaining.map(s => this._stateLabel(s)).join(', ')}.`;
      }

      return stateGuidance;
    }

    return guidance[this.phase] || guidance.intro;
  }

  _categoryLabel(category) {
    const labels = {
      bodySensations: 'body sensations',
      thoughts: 'thoughts',
      emotions: 'emotions',
      triggers: 'triggers/situations',
    };
    return labels[category] || category;
  }

  // ---------------------------------------------------------------------------
  // SESSION PROGRESS (returned to screens via chat() result)
  // ---------------------------------------------------------------------------

  getSessionProgress() {
    const mapped = this._getMappedStateNames();
    const phaseLabels = {
      intro: 'Getting Started',
      ventral: 'Exploring Ventral Vagal',
      sympathetic: 'Exploring Sympathetic',
      dorsal: 'Exploring Dorsal Vagal',
      complete: 'Complete',
    };

    return {
      phase: this.phase,
      phaseLabel: phaseLabels[this.phase] || this.phase,
      exchangeCount: this.exchangeCount,
      statesExplored: mapped.length,
      currentState: this.currentState,
      mappedStates: Object.fromEntries(
        POLYVAGAL_STATES.map(s => [s, {
          label: this._stateLabel(s),
          categoriesGathered: this._categoriesGatheredCount(s),
          isExplored: mapped.includes(s),
          data: {
            bodySensations: !!this.mappedStates[s].bodySensations,
            thoughts: !!this.mappedStates[s].thoughts,
            emotions: !!this.mappedStates[s].emotions,
            triggers: !!this.mappedStates[s].triggers,
          },
        }])
      ),
      isComplete: this.phase === 'complete',
    };
  }

  // ---------------------------------------------------------------------------
  // SESSION SUMMARY (for persistence when session ends)
  // ---------------------------------------------------------------------------

  getSessionSummary() {
    const mapped = this._getMappedStateNames();

    return {
      modeId: this.modeId,
      phase: this.phase,
      exchangeCount: this.exchangeCount,
      statesExplored: mapped.map(s => ({
        state: s,
        label: this._stateLabel(s),
        bodySensations: this.mappedStates[s].bodySensations || null,
        thoughts: this.mappedStates[s].thoughts || null,
        emotions: this.mappedStates[s].emotions || null,
        triggers: this.mappedStates[s].triggers || null,
      })),
      stateOrder: this.stateOrder,
      phaseHistory: this.phaseHistory,
      completedAllStates: mapped.length === 3,
    };
  }
}

export default NervousSystemExplorationModeHandler;
