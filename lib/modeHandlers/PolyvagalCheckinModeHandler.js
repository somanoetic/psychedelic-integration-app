/**
 * Polyvagal Check-in Mode Handler
 *
 * Adds therapeutic process intelligence to Huxley's polyvagal check-in mode.
 * Tracks nervous system state assessment through memory recall, body awareness,
 * and thought patterns. Lighter-weight than NervousSystemMappingModeHandler —
 * this is a quick check-in, not a full mapping session.
 *
 * Phase Flow:
 *   memory → body → thoughts → summary
 */
import BaseModeHandler from './BaseModeHandler';

// State detection keywords
const STATE_INDICATORS = {
  ventral: [
    'safe', 'calm', 'connected', 'relaxed', 'warm', 'open',
    'grounded', 'peaceful', 'at ease', 'content', 'present',
    'settled', 'engaged', 'playful', 'joyful', 'curious',
  ],
  sympathetic: [
    'anxious', 'stressed', 'tense', 'racing', 'on edge',
    'restless', 'activated', 'wired', 'alert', 'panicked',
    'angry', 'agitated', 'nervous', 'overwhelmed', 'rushed',
    'fight', 'flight', 'hypervigilant', 'jumpy',
  ],
  dorsal: [
    'numb', 'frozen', 'stuck', 'shutdown', 'disconnected',
    'foggy', 'heavy', 'empty', 'flat', 'exhausted',
    'collapsed', 'withdrawn', 'hopeless', 'tired', 'spaced out',
    'checked out', 'paralyzed', 'dissociated',
  ],
};

// Body location keywords
const BODY_MARKERS = [
  'chest', 'stomach', 'throat', 'shoulders', 'jaw', 'hands',
  'legs', 'head', 'heart', 'belly', 'back', 'neck', 'face',
  'arms', 'feet', 'gut', 'forehead', 'eyes', 'temples',
];

// Thought pattern keywords
const THOUGHT_MARKERS = [
  'thinking', 'thought', 'mind', 'voice', 'telling myself',
  'worry', 'ruminating', 'planning', 'replaying', 'imagining',
  'story', 'narrative', 'belief', 'self-talk', 'inner critic',
  'should', 'what if', 'can\'t stop thinking',
];

class PolyvagalCheckinModeHandler extends BaseModeHandler {
  constructor() {
    super('polyvagal_checkin');
  }

  reset() {
    super.reset();
    this.phase = 'memory';
    this.detectedState = null;        // ventral | sympathetic | dorsal
    this.stateConfidence = 0;         // How many markers matched
    this.bodyAwareness = [];          // Body locations/sensations mentioned
    this.thoughtPatterns = [];        // Thought patterns identified
    this.memoryShared = false;        // Whether user shared a memory/situation
    this.phaseHistory = [];
  }

  // ---------------------------------------------------------------------------
  // CONTEXT FOR PROMPT
  // ---------------------------------------------------------------------------

  getModeContext() {
    return {
      sessionPhase: this.phase,
      detectedState: this.detectedState
        ? {
            state: this.detectedState,
            label: this._stateLabel(this.detectedState),
            confidence: this.stateConfidence,
          }
        : null,
      bodyAwareness: this.bodyAwareness,
      thoughtPatterns: this.thoughtPatterns,
      phaseGuidance: this._getPhaseGuidance(),
    };
  }

  // ---------------------------------------------------------------------------
  // RESPONSE PROCESSING
  // ---------------------------------------------------------------------------

  processResponse(userMessage, aiResponse, therapeuticData) {
    this.exchangeCount++;

    if (userMessage) {
      const lower = userMessage.toLowerCase();

      // Detect NS state from user message
      this._detectState(lower);

      // Track body awareness
      this._detectBodyAwareness(lower);

      // Track thought patterns
      this._detectThoughtPatterns(lower);

      // Mark memory as shared if user describes a situation
      if (!this.memoryShared && lower.length > 30) {
        this.memoryShared = true;
      }
    }

    // Merge therapeuticData if present
    if (therapeuticData?.nervousSystemState) {
      const state = therapeuticData.nervousSystemState.toLowerCase();
      if (STATE_INDICATORS[state]) {
        this.detectedState = state;
      }
    }

    // Try to advance phase
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
      case 'memory':
        // Advance when user has shared something and a state is detected
        if (this.memoryShared && this.detectedState) {
          this.phase = 'body';
        }
        break;

      case 'body':
        // Advance when at least 1 body location noted
        if (this.bodyAwareness.length >= 1) {
          this.phase = 'thoughts';
        }
        break;

      case 'thoughts':
        // Advance when at least 1 thought pattern noted or 2+ exchanges in phase
        const exchangesInThoughts = this.exchangeCount -
          (this.phaseHistory.find(h => h.to === 'thoughts')?.atExchange || 0);
        if (this.thoughtPatterns.length >= 1 || exchangesInThoughts >= 2) {
          this.phase = 'summary';
        }
        break;

      // summary is terminal
    }
  }

  // ---------------------------------------------------------------------------
  // DETECTION
  // ---------------------------------------------------------------------------

  _detectState(lower) {
    const scores = {};
    for (const [state, keywords] of Object.entries(STATE_INDICATORS)) {
      scores[state] = keywords.filter(k => lower.includes(k)).length;
    }

    let best = null;
    let bestScore = 0;
    for (const [state, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        best = state;
      }
    }

    if (best && bestScore > 0) {
      this.detectedState = best;
      this.stateConfidence = bestScore;
    }
  }

  _detectBodyAwareness(lower) {
    for (const marker of BODY_MARKERS) {
      if (lower.includes(marker) && !this.bodyAwareness.includes(marker)) {
        this.bodyAwareness.push(marker);
      }
    }
  }

  _detectThoughtPatterns(lower) {
    for (const marker of THOUGHT_MARKERS) {
      if (lower.includes(marker) && !this.thoughtPatterns.includes(marker)) {
        this.thoughtPatterns.push(marker);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  _stateLabel(state) {
    const labels = {
      ventral: 'Ventral Vagal (Safe & Social)',
      sympathetic: 'Sympathetic (Fight/Flight)',
      dorsal: 'Dorsal Vagal (Shutdown/Freeze)',
    };
    return labels[state] || state;
  }

  _getPhaseGuidance() {
    const guidance = {
      memory: `Start the check-in. Ask the user to recall a recent moment or describe how they're feeling right now. Listen for nervous system state cues. ${this.detectedState ? `Detected state so far: ${this._stateLabel(this.detectedState)}.` : 'No state detected yet.'}`,
      body: `State detected: ${this._stateLabel(this.detectedState || 'unknown')}. Now explore body sensations. "Where do you notice that in your body?" "What sensations are present?" Help them get specific — location, temperature, tension, movement.`,
      thoughts: `Body awareness gathered: ${this.bodyAwareness.join(', ') || 'none yet'}. Now explore thought patterns. "What kind of thoughts are present?" "Is there an inner voice or story running?" Keep it brief — this is a check-in, not deep processing.`,
      summary: `Check-in complete. Reflect back what you noticed: their state (${this._stateLabel(this.detectedState || 'unknown')}), body sensations (${this.bodyAwareness.join(', ') || 'none noted'}), and thought patterns. Validate with compassion. If activated or shut down, offer one brief regulation suggestion. Keep the summary warm and short.`,
    };
    return guidance[this.phase] || guidance.memory;
  }

  // ---------------------------------------------------------------------------
  // SESSION PROGRESS
  // ---------------------------------------------------------------------------

  getSessionProgress() {
    const phaseLabels = {
      memory: 'Checking In',
      body: 'Body Awareness',
      thoughts: 'Thought Patterns',
      summary: 'Wrapping Up',
    };

    return {
      phase: this.phase,
      phaseLabel: phaseLabels[this.phase] || this.phase,
      exchangeCount: this.exchangeCount,
      detectedState: this.detectedState,
      bodyAwareness: this.bodyAwareness.length,
      thoughtPatterns: this.thoughtPatterns.length,
      isComplete: this.phase === 'summary',
    };
  }

  // ---------------------------------------------------------------------------
  // SESSION SUMMARY
  // ---------------------------------------------------------------------------

  getSessionSummary() {
    return {
      modeId: this.modeId,
      phase: this.phase,
      exchangeCount: this.exchangeCount,
      detectedState: this.detectedState,
      stateLabel: this._stateLabel(this.detectedState || 'unknown'),
      bodyAwareness: [...this.bodyAwareness],
      thoughtPatterns: [...this.thoughtPatterns],
      phaseHistory: this.phaseHistory,
    };
  }
}

export default PolyvagalCheckinModeHandler;
