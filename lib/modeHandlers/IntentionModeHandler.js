/**
 * Intention Setting Mode Handler
 *
 * Adds therapeutic process intelligence to Huxley's intention-setting mode.
 * Tracks the intention as it emerges and sharpens across 4 stages:
 * welcome → direction → deepen → confirm.
 *
 * This is a deliberately LIGHTWEIGHT handler. The intention mode is short
 * (4 exchanges max) and the AI prompt is strict about brevity. The handler's
 * job is to track the evolving intention text and know when to confirm.
 *
 * Phase Flow:
 *   welcome → direction → deepen → confirm → complete
 *
 * Phase Gates:
 *   welcome → direction:   user shared what's calling them (>=1 exchange)
 *   direction → deepen:    user confirmed or refined the direction
 *   deepen → confirm:      user expressed meaning/depth
 *   confirm → complete:    AI named the intention cleanly
 */
import BaseModeHandler from './BaseModeHandler';

// Direction markers — user expressing what's calling them
const DIRECTION_MARKERS = [
  'i want', 'i need', 'i\'m feeling', 'calling me', 'drawn to',
  'i\'ve been thinking', 'what\'s present', 'on my mind',
  'i\'m hoping', 'i\'d like', 'my intention', 'i want to explore',
  'i want to understand', 'i want to heal', 'i want to connect',
  'i want to let go', 'i want to find', 'i want to release',
];

// Confirmation markers — user agrees with the reflected direction
const CONFIRMATION_MARKERS = [
  'yes', 'yeah', 'exactly', 'that\'s it', 'that feels right',
  'that resonates', 'spot on', 'perfect', 'nailed it',
  'that\'s what i mean', 'right', 'correct', 'absolutely',
  'mm-hmm', 'mhm', 'for sure', 'definitely',
];

// Deepening markers — user expressing meaning or going deeper
const DEEPENING_MARKERS = [
  'means', 'because', 'it would feel', 'i\'d be able to',
  'underneath', 'at the core', 'what i really', 'deeper',
  'the truth is', 'what i\'m afraid of', 'what i hope',
  'if i could', 'it matters because', 'i\'ve always',
  'i never got to', 'this is about', 'freedom', 'peace',
  'connection', 'healing', 'letting go', 'forgiveness',
  'acceptance', 'trust', 'courage', 'love', 'wholeness',
];

class IntentionModeHandler extends BaseModeHandler {
  constructor() {
    super('intention');
  }

  reset() {
    super.reset();
    this.phase = 'welcome';
    this.intentionDrafts = [];        // Each refinement of the intention
    this.directionExpressed = false;
    this.directionConfirmed = false;
    this.deepeningExpressed = false;
    this.finalIntention = null;       // The confirmed intention text
    this.phaseHistory = [];
  }

  // ---------------------------------------------------------------------------
  // CONTEXT FOR PROMPT
  // ---------------------------------------------------------------------------

  getModeContext() {
    return {
      sessionPhase: this.phase,
      intentionDrafts: this.intentionDrafts,
      latestDraft: this.intentionDrafts.length > 0
        ? this.intentionDrafts[this.intentionDrafts.length - 1]
        : null,
      finalIntention: this.finalIntention,
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

      // Track intention evolution
      this._trackIntentionDraft(userMessage);

      // Detect direction expression
      if (DIRECTION_MARKERS.some(m => lower.includes(m))) {
        this.directionExpressed = true;
      }

      // Detect confirmation
      if (CONFIRMATION_MARKERS.some(m => lower.includes(m))) {
        this.directionConfirmed = true;
      }

      // Detect deepening
      if (DEEPENING_MARKERS.some(m => lower.includes(m))) {
        this.deepeningExpressed = true;
      }
    }

    // Extract intention from AI response in confirm phase
    if (aiResponse && this.phase === 'confirm') {
      this._extractFinalIntention(aiResponse);
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
      case 'welcome':
        // Advance once user shares what's calling them
        if (this.directionExpressed || this.exchangeCount >= 1) {
          this.phase = 'direction';
        }
        break;

      case 'direction':
        // Advance once user confirms or refines the direction
        if (this.directionConfirmed || this.exchangeCount >= 2) {
          this.phase = 'deepen';
        }
        break;

      case 'deepen':
        // Advance once deepening is expressed
        if (this.deepeningExpressed || this.exchangeCount >= 3) {
          this.phase = 'confirm';
        }
        break;

      case 'confirm':
        // Advance once we have a final intention
        if (this.finalIntention) {
          this.phase = 'complete';
        }
        break;

      // complete is terminal
    }
  }

  // ---------------------------------------------------------------------------
  // INTENTION TRACKING
  // ---------------------------------------------------------------------------

  _trackIntentionDraft(userMessage) {
    // Only track substantive messages (not just "yes" or "yeah")
    if (userMessage.split(/\s+/).length >= 3) {
      this.intentionDrafts.push({
        text: userMessage.trim(),
        phase: this.phase,
        exchange: this.exchangeCount,
      });
    }
  }

  _extractFinalIntention(aiResponse) {
    // The AI in confirm phase should name the intention in 1 sentence.
    // Take the first sentence as the likely intention statement.
    const sentences = aiResponse.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length > 0) {
      this.finalIntention = sentences[0].trim();
    }
  }

  // ---------------------------------------------------------------------------
  // PHASE GUIDANCE
  // ---------------------------------------------------------------------------

  _getPhaseGuidance() {
    const latest = this.intentionDrafts.length > 0
      ? this.intentionDrafts[this.intentionDrafts.length - 1].text
      : null;

    const guidance = {
      welcome: 'Warm check-in. Ask one simple question: what\'s calling them today? 2-3 sentences max. Don\'t over-explain the process.',
      direction: `User shared: "${latest || '(listening)'}". Reflect back in their words. "So it sounds like you\'re moving toward [X] — does that feel right?" 2-3 sentences. One question only.`,
      deepen: `Direction confirmed. Go a little deeper. What does this intention mean to them? Reflect and sharpen. Do NOT rush to confirm. ${latest ? `Working with: "${latest}"` : ''} 2-3 sentences. One question.`,
      confirm: `Ready to name the intention. Distill to one clean sentence. Close warmly. No more questions. ${latest ? `Drawing from: "${latest}"` : ''}`,
      complete: 'Intention is set. Session complete.',
    };
    return guidance[this.phase] || guidance.welcome;
  }

  // ---------------------------------------------------------------------------
  // SESSION PROGRESS
  // ---------------------------------------------------------------------------

  getSessionProgress() {
    const phaseLabels = {
      welcome: 'Welcome',
      direction: 'Finding Direction',
      deepen: 'Going Deeper',
      confirm: 'Setting Intention',
      complete: 'Intention Set',
    };

    return {
      phase: this.phase,
      phaseLabel: phaseLabels[this.phase] || this.phase,
      exchangeCount: this.exchangeCount,
      intentionDrafts: this.intentionDrafts.length,
      finalIntention: this.finalIntention,
      isComplete: this.phase === 'complete',
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
      intentionDrafts: this.intentionDrafts.map(d => ({
        text: d.text,
        phase: d.phase,
      })),
      finalIntention: this.finalIntention,
      phaseHistory: this.phaseHistory,
    };
  }
}

export default IntentionModeHandler;
