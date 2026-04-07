/**
 * Philosophical Talkthrough Mode Handler
 *
 * Adds Socratic process intelligence to Huxley's Philosophical Talkthrough mode.
 * Guides users through contemplative exploration of 5 philosophical topics
 * with phase-gated progression toward journaling.
 *
 * Phase Flow:
 *   opening_inquiry → deepening → contemplation → journaling → complete
 *
 * Phase Gates:
 *   opening_inquiry → deepening:    3+ exchanges (user is engaged)
 *   deepening → contemplation:      5+ exchanges AND depth markers detected
 *   contemplation → journaling:     3+ exchanges in contemplation OR readiness signals
 *   journaling → complete:          2+ journal responses
 */
import BaseModeHandler from './BaseModeHandler';

// Depth markers — user engaging with existential/philosophical depth
const DEPTH_MARKERS = [
  'paradox', 'i don\'t know', 'awareness', 'beyond', 'nothing',
  'everything', 'who is asking', 'witness', 'dissolve', 'dissolving',
  'emptiness', 'silence', 'stillness', 'infinite', 'both',
  'neither', 'no words', 'can\'t explain', 'ineffable', 'mystery',
  'disappear', 'boundary', 'boundless', 'space', 'presence',
  'absence', 'observer', 'observing', 'illusion', 'real',
  'consciousness', 'aware', 'what am i', 'who am i',
];

// Readiness signals — user ready to transition to journaling
const READINESS_MARKERS = [
  'feel complete', 'enough', 'ready', 'want to write',
  'let me sit with', 'need to process', 'want to journal',
  'that\'s it', 'something shifted', 'landing', 'settling',
  'integrating', 'want to reflect', 'capture this',
];

// Journal engagement markers — user is actively journaling
const JOURNAL_MARKERS = [
  'i wrote', 'writing', 'what comes', 'i notice', 'i feel',
  'i remember', 'i see', 'i sense', 'in my body', 'the image',
  'what remains', 'what stays', 'i realize', 'i understand',
];

class PhilosophicalTalkthroughModeHandler extends BaseModeHandler {
  constructor() {
    super('philosophical_talkthrough');
  }

  reset() {
    super.reset();
    this.phase = 'opening_inquiry';
    this.phaseExchangeCounts = {
      opening_inquiry: 0, deepening: 0, contemplation: 0, journaling: 0,
    };

    this.selectedTopic = null;
    this.depthDetected = false;
    this.readinessDetected = false;
    this.journalResponseCount = 0;
    this.phaseHistory = [];
  }

  // ---------------------------------------------------------------------------
  // CONTEXT FOR PROMPT
  // ---------------------------------------------------------------------------

  getModeContext() {
    const ctx = {
      sessionPhase: this.phase,
      phaseGuidance: this._getPhaseGuidance(),
      depthDetected: this.depthDetected,
      progressMetrics: {
        exchangesInPhase: this.phaseExchangeCounts[this.phase] || 0,
        journalResponseCount: this.journalResponseCount,
        totalExchanges: this.exchangeCount,
      },
    };
    // Only include selectedTopic when set, so screen-provided value isn't overridden with null
    if (this.selectedTopic) {
      ctx.selectedTopic = this.selectedTopic;
    }
    return ctx;
  }

  // ---------------------------------------------------------------------------
  // RESPONSE PROCESSING
  // ---------------------------------------------------------------------------

  processResponse(userMessage, aiResponse, therapeuticData) {
    this.exchangeCount++;
    this.phaseExchangeCounts[this.phase] = (this.phaseExchangeCounts[this.phase] || 0) + 1;

    // Capture selected topic from modeContext on first exchange
    // (HuxleyService merges screen-provided modeContext before calling us)

    if (userMessage) {
      const lower = userMessage.toLowerCase();

      if (this.phase === 'deepening' || this.phase === 'opening_inquiry') {
        this._detectDepth(lower);
      }

      if (this.phase === 'contemplation') {
        this._detectDepth(lower);
        this._detectReadiness(lower);
      }

      if (this.phase === 'journaling') {
        this._trackJournalResponse(lower);
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

  /**
   * Called by HuxleyService to inject topic from screen's modeContext.
   * The screen passes { selectedTopic: topicData } on every chat() call;
   * we store it once.
   */
  setTopicFromContext(topic) {
    if (topic && !this.selectedTopic) {
      this.selectedTopic = topic;
    }
  }

  // ---------------------------------------------------------------------------
  // PHASE ADVANCEMENT
  // ---------------------------------------------------------------------------

  _tryAdvancePhase() {
    const exchangesInPhase = this.phaseExchangeCounts[this.phase] || 0;

    switch (this.phase) {
      case 'opening_inquiry':
        if (exchangesInPhase >= 3) {
          this.phase = 'deepening';
        }
        break;

      case 'deepening':
        if (exchangesInPhase >= 5 && this.depthDetected) {
          this.phase = 'contemplation';
        }
        // Fallback: advance after 8 exchanges even without explicit depth markers
        if (exchangesInPhase >= 8) {
          this.phase = 'contemplation';
        }
        break;

      case 'contemplation':
        if ((exchangesInPhase >= 3 && this.readinessDetected) || exchangesInPhase >= 6) {
          this.phase = 'journaling';
        }
        break;

      case 'journaling':
        if (this.journalResponseCount >= 2) {
          this.phase = 'complete';
        }
        break;

      // complete is terminal
    }
  }

  // ---------------------------------------------------------------------------
  // DETECTION
  // ---------------------------------------------------------------------------

  _detectDepth(lower) {
    if (DEPTH_MARKERS.some(m => lower.includes(m))) {
      this.depthDetected = true;
    }
  }

  _detectReadiness(lower) {
    if (READINESS_MARKERS.some(m => lower.includes(m))) {
      this.readinessDetected = true;
    }
  }

  _trackJournalResponse(lower) {
    // Count substantive journal responses (more than a few words)
    if (lower.length > 20 || JOURNAL_MARKERS.some(m => lower.includes(m))) {
      this.journalResponseCount++;
    }
  }

  // ---------------------------------------------------------------------------
  // PHASE GUIDANCE
  // ---------------------------------------------------------------------------

  _getPhaseGuidance() {
    const exchangesInPhase = this.phaseExchangeCounts[this.phase] || 0;
    const topicTitle = this.selectedTopic?.title || 'the chosen topic';
    const themes = this.selectedTopic?.guidingThemes?.join(', ') || '';

    const guidance = {
      opening_inquiry: `OPENING INQUIRY phase for "${topicTitle}". Your role is Socratic companion — ask questions, don't lecture. Begin with the topic's central question. Let the user's first responses guide the direction. Guiding themes: ${themes}. Keep responses to 2-3 sentences, ending with a question. Meet them where they are — if they share a psychedelic experience that connects, follow that thread.`,

      deepening: `DEEPENING phase. The user is engaged. Now go deeper — follow the threads they've opened. Use paradox, gentle challenges, and open questions to help them move beyond surface answers. If they give a conceptual answer, ask what it feels like in their body. If they speak from feeling, ask what it means. Guiding themes: ${themes}. ${this.depthDetected ? 'Depth is emerging — follow it.' : 'Still building depth — keep asking questions that resist easy answers.'}`,

      contemplation: `CONTEMPLATION phase. The inquiry has reached depth. Slow down. Fewer words. Hold space for silence and not-knowing. Ask questions that invite stillness rather than more thinking. "What happens if you just sit with that?" "What's here when you stop trying to figure it out?" ${exchangesInPhase} exchanges so far. ${this.readinessDetected ? 'User seems ready to move to journaling.' : 'Continue holding contemplative space.'}`,

      journaling: `JOURNALING phase. Transition to reflective writing. Offer one journal prompt at a time from the topic's prompts. After the user responds, acknowledge what they wrote with warmth (1 sentence), then offer the next prompt or ask if they'd like to close. ${this.journalResponseCount} journal responses so far. Don't analyze their writing — just receive it.`,

      complete: 'Session is complete. Offer a brief, warm closing that honors the exploration without summarizing or reducing it. Something like: "Thank you for sitting with these questions. They don\'t need answers — just your attention."',
    };

    return guidance[this.phase] || guidance.opening_inquiry;
  }

  // ---------------------------------------------------------------------------
  // SESSION PROGRESS
  // ---------------------------------------------------------------------------

  getSessionProgress() {
    const phaseLabels = {
      opening_inquiry: 'Opening Inquiry',
      deepening: 'Deepening',
      contemplation: 'Contemplation',
      journaling: 'Journaling',
      complete: 'Complete',
    };

    return {
      phase: this.phase,
      phaseLabel: phaseLabels[this.phase] || this.phase,
      exchangeCount: this.exchangeCount,
      depthDetected: this.depthDetected,
      journalResponseCount: this.journalResponseCount,
      isComplete: this.phase === 'complete',
      selectedTopicId: this.selectedTopic?.id || null,
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
      selectedTopic: this.selectedTopic ? {
        id: this.selectedTopic.id,
        title: this.selectedTopic.title,
      } : null,
      depthDetected: this.depthDetected,
      journalResponseCount: this.journalResponseCount,
      phaseHistory: this.phaseHistory,
      completedPhases: [...new Set(this.phaseHistory.map(h => h.from))],
    };
  }
}

export default PhilosophicalTalkthroughModeHandler;
