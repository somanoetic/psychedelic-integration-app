/**
 * Active Imagination Mode Handler
 *
 * Adds therapeutic process intelligence to Huxley's Active Imagination mode
 * based on Robert Johnson's methodology from "Inner Work."
 *
 * Tracks inner figures, dialogue exchanges, grounding status, and the
 * 4-step Johnson process: Invitation → Dialogue → Values → Ritual.
 *
 * SAFETY is paramount — this handler tracks grounding checks and flags
 * when the user may need to pause or ground.
 *
 * Phase Flow:
 *   safety_check → invitation → dialogue → values → ritual → complete
 *
 * Phase Gates:
 *   safety_check → invitation:  user confirms they're grounded (>=1 exchange)
 *   invitation → dialogue:      at least 1 inner figure has appeared
 *   dialogue → values:          >=5 dialogue exchanges AND natural pause or resolution
 *   values → ritual:            values reflection completed (>=2 exchanges)
 *   ritual → complete:          ritual designed (>=1 exchange after ritual named)
 */
import BaseModeHandler from './BaseModeHandler';

// Inner figure detection
const FIGURE_MARKERS = [
  'i see', 'appeared', 'there is', 'i notice', 'standing',
  'sitting', 'figure', 'being', 'presence', 'shape', 'form',
  'animal', 'creature', 'person', 'woman', 'man', 'child',
  'old', 'young', 'shadow', 'light', 'dark', 'glowing',
  'voice', 'speaking', 'saying', 'looking at me', 'watching',
  'approaching', 'waiting', 'guide', 'teacher', 'warrior',
  'mother', 'father', 'grandmother', 'grandfather',
  'serpent', 'snake', 'bird', 'wolf', 'bear', 'eagle',
];

// Dialogue markers (user reporting what the figure says/does)
const DIALOGUE_MARKERS = [
  'it says', 'they say', 'he says', 'she says', 'it told me',
  'they told me', 'it asked', 'they asked', 'it wants',
  'it showed me', 'they showed', 'it feels like', 'it responds',
  'the figure', 'it looked', 'they looked', 'nodded', 'smiled',
  'turned away', 'reached out', 'pointed', 'gestured',
  'i asked', 'i said', 'i told', 'i asked it', 'i asked them',
];

// Grounding indicators (user is present and okay)
const GROUNDED_MARKERS = [
  'grounded', 'present', 'okay', 'i\'m okay', 'i\'m fine',
  'i feel safe', 'calm', 'centered', 'stable', 'i\'m good',
  'i can continue', 'yes', 'ready', 'clear', 'focused',
];

// Distress indicators (may need to pause)
const DISTRESS_MARKERS = [
  'overwhelmed', 'too much', 'scared', 'terrified', 'can\'t',
  'need to stop', 'want to stop', 'losing', 'spinning',
  'dizzy', 'panicking', 'panic', 'dissociating', 'floating away',
  'not in my body', 'can\'t feel', 'going dark', 'drowning',
  'suffocating', 'trapped', 'help', 'frightened',
];

// Resolution/pause markers (dialogue reaching a natural break)
const RESOLUTION_MARKERS = [
  'feel complete', 'enough', 'ready to move on', 'i understand',
  'it faded', 'it left', 'they left', 'disappeared', 'dissolved',
  'silence', 'stillness', 'nothing more', 'that\'s all',
  'i feel different', 'shift', 'something changed', 'lighter',
  'peace', 'resolution', 'resolved', 'clear now', 'quiet',
];

// Values reflection markers
const VALUES_MARKERS = [
  'fair', 'right', 'wrong', 'obligation', 'responsibility',
  'balance', 'extreme', 'too much', 'taking over', 'boundaries',
  'human', 'ethical', 'relationship', 'commitment', 'values',
  'kindness', 'integrity', 'respect', 'honoring',
];

// Ritual markers
const RITUAL_MARKERS = [
  'candle', 'stone', 'walk', 'write', 'draw', 'light',
  'water', 'touch', 'place', 'hold', 'burn', 'bury',
  'plant', 'create', 'build', 'sing', 'hum', 'offer',
  'ritual', 'physical', 'act', 'honor', 'i will', 'i\'ll',
  'going to', 'plan to', 'tomorrow', 'tonight', 'today',
];

// Real external person markers (safety: redirect needed)
const EXTERNAL_PERSON_MARKERS = [
  'my mother', 'my father', 'my partner', 'my ex', 'my boss',
  'my friend', 'my sister', 'my brother', 'my therapist',
  'my wife', 'my husband', 'my girlfriend', 'my boyfriend',
];

class ActiveImaginationModeHandler extends BaseModeHandler {
  constructor() {
    super('active_imagination');
  }

  reset() {
    super.reset();
    this.phase = 'safety_check';
    this.phaseExchangeCounts = {
      safety_check: 0, invitation: 0, dialogue: 0, values: 0, ritual: 0,
    };

    // Figures encountered
    this.figures = [];                  // [{ description, firstAppeared, dialogueCount }]
    this.activeFigureIndex = null;

    // Safety tracking
    this.groundedConfirmed = false;
    this.distressDetected = false;
    this.groundingChecksDone = 0;
    this.lastGroundingCheck = 0;        // Exchange count of last check

    // Dialogue tracking
    this.dialogueExchanges = 0;         // Number of dialogue-phase exchanges
    this.resolutionDetected = false;

    // Values and ritual
    this.valuesReflected = false;
    this.externalPersonDetected = false;
    this.ritualDesigned = false;
    this.ritualDescription = null;

    this.phaseHistory = [];
  }

  // ---------------------------------------------------------------------------
  // CONTEXT FOR PROMPT
  // ---------------------------------------------------------------------------

  getModeContext() {
    const activeFigure = this._getActiveFigure();
    const needsGroundingCheck = this.phase === 'dialogue' &&
      (this.exchangeCount - this.lastGroundingCheck) >= 5;

    return {
      sessionPhase: this.phase,
      figures: this.figures.map((f, i) => ({
        description: f.description,
        dialogueCount: f.dialogueCount,
        isActive: i === this.activeFigureIndex,
      })),
      activeFigure: activeFigure ? {
        description: activeFigure.description,
        dialogueCount: activeFigure.dialogueCount,
      } : null,
      safety: {
        groundedConfirmed: this.groundedConfirmed,
        distressDetected: this.distressDetected,
        groundingChecksDone: this.groundingChecksDone,
        needsGroundingCheck,
        externalPersonDetected: this.externalPersonDetected,
      },
      dialogueExchanges: this.dialogueExchanges,
      resolutionDetected: this.resolutionDetected,
      phaseGuidance: this._getPhaseGuidance(),
      progressMetrics: {
        exchangesInPhase: this.phaseExchangeCounts[this.phase] || 0,
        figuresCount: this.figures.length,
        valuesReflected: this.valuesReflected,
        ritualDesigned: this.ritualDesigned,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // RESPONSE PROCESSING
  // ---------------------------------------------------------------------------

  processResponse(userMessage, aiResponse, therapeuticData) {
    this.exchangeCount++;
    this.phaseExchangeCounts[this.phase] = (this.phaseExchangeCounts[this.phase] || 0) + 1;

    if (userMessage) {
      const lower = userMessage.toLowerCase();

      // Safety checks (always active, all phases)
      this._checkGrounding(lower);
      this._checkDistress(lower);
      this._checkExternalPerson(lower);

      // Phase-specific detection
      if (this.phase === 'safety_check') {
        // Just checking if grounded
      } else if (this.phase === 'invitation') {
        this._detectFigures(lower);
      } else if (this.phase === 'dialogue') {
        this._trackDialogue(lower);
        this._detectFigures(lower); // New figures can appear in dialogue
        this._detectResolution(lower);
      } else if (this.phase === 'values') {
        this._detectValues(lower);
      } else if (this.phase === 'ritual') {
        this._detectRitual(lower, userMessage);
      }
    }

    // Track AI grounding checks
    if (aiResponse) {
      const aiLower = aiResponse.toLowerCase();
      if (aiLower.includes('how are you doing') || aiLower.includes('still grounded') ||
          aiLower.includes('feeling okay') || aiLower.includes('check in with')) {
        this.groundingChecksDone++;
        this.lastGroundingCheck = this.exchangeCount;
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
    // Safety override: if distress detected, don't advance
    if (this.distressDetected) return;

    const exchangesInPhase = this.phaseExchangeCounts[this.phase] || 0;

    switch (this.phase) {
      case 'safety_check':
        if (this.groundedConfirmed && exchangesInPhase >= 1) {
          this.phase = 'invitation';
        }
        break;

      case 'invitation':
        if (this.figures.length >= 1) {
          this.phase = 'dialogue';
        }
        break;

      case 'dialogue':
        // Need sufficient dialogue AND resolution/pause signal
        if (this.dialogueExchanges >= 5 && this.resolutionDetected) {
          this.phase = 'values';
        }
        break;

      case 'values':
        if (this.valuesReflected && exchangesInPhase >= 2) {
          this.phase = 'ritual';
        }
        break;

      case 'ritual':
        if (this.ritualDesigned) {
          this.phase = 'complete';
        }
        break;

      // complete is terminal
    }
  }

  // ---------------------------------------------------------------------------
  // SAFETY DETECTION
  // ---------------------------------------------------------------------------

  _checkGrounding(lower) {
    if (GROUNDED_MARKERS.some(m => lower.includes(m))) {
      this.groundedConfirmed = true;
      this.distressDetected = false; // Reset distress if they confirm grounded
    }
  }

  _checkDistress(lower) {
    if (DISTRESS_MARKERS.some(m => lower.includes(m))) {
      this.distressDetected = true;
    }
  }

  _checkExternalPerson(lower) {
    if (EXTERNAL_PERSON_MARKERS.some(m => lower.includes(m))) {
      this.externalPersonDetected = true;
    }
  }

  // ---------------------------------------------------------------------------
  // FIGURE DETECTION
  // ---------------------------------------------------------------------------

  _detectFigures(lower) {
    const figureMatches = FIGURE_MARKERS.filter(m => lower.includes(m));
    if (figureMatches.length >= 2) {
      // Likely describing a figure — extract description
      const sentences = lower.split(/[.!?]+/).filter(s => s.trim());
      const figureSentence = sentences.find(s =>
        figureMatches.some(m => s.includes(m))
      );

      if (figureSentence) {
        const description = figureSentence.trim().substring(0, 150);

        // Check if this is a new figure or the same one
        const isNew = !this.figures.some(f =>
          f.description.includes(description.substring(0, 30))
        );

        if (isNew) {
          this.figures.push({
            description,
            firstAppeared: this.exchangeCount,
            dialogueCount: 0,
          });
          this.activeFigureIndex = this.figures.length - 1;
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // DIALOGUE TRACKING
  // ---------------------------------------------------------------------------

  _trackDialogue(lower) {
    if (DIALOGUE_MARKERS.some(m => lower.includes(m))) {
      this.dialogueExchanges++;
      const active = this._getActiveFigure();
      if (active) {
        active.dialogueCount++;
      }
    }
  }

  _detectResolution(lower) {
    if (RESOLUTION_MARKERS.some(m => lower.includes(m))) {
      this.resolutionDetected = true;
    }
  }

  // ---------------------------------------------------------------------------
  // VALUES & RITUAL DETECTION
  // ---------------------------------------------------------------------------

  _detectValues(lower) {
    if (VALUES_MARKERS.some(m => lower.includes(m))) {
      this.valuesReflected = true;
    }
    // Also advance if user simply engages with the values question
    if ((this.phaseExchangeCounts.values || 0) >= 2) {
      this.valuesReflected = true;
    }
  }

  _detectRitual(lower, originalText) {
    if (RITUAL_MARKERS.some(m => lower.includes(m))) {
      this.ritualDesigned = true;
      this.ritualDescription = originalText.trim().substring(0, 200);
    }
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  _getActiveFigure() {
    if (this.activeFigureIndex === null || this.activeFigureIndex >= this.figures.length) {
      return null;
    }
    return this.figures[this.activeFigureIndex];
  }

  _getPhaseGuidance() {
    const exchangesInPhase = this.phaseExchangeCounts[this.phase] || 0;
    const activeFigure = this._getActiveFigure();
    const needsGroundingCheck = this.phase === 'dialogue' &&
      (this.exchangeCount - this.lastGroundingCheck) >= 5;

    // Distress override
    if (this.distressDetected) {
      return 'SAFETY PRIORITY: User may be in distress. Pause the exercise immediately. Guide them through grounding: feet on the floor, deep breaths, name 5 things they can see. Remind them they can always stop and come back later. The figures will wait.';
    }

    // External person override
    if (this.externalPersonDetected && this.phase === 'dialogue') {
      return 'SAFETY: User is dialoguing with a real external person. Redirect: "For this practice to work safely, we need to dialogue with the inner quality this person represents, not the external person. Can you ask this figure to show its true form — the part of YOU it represents?"';
    }

    const guidance = {
      safety_check: 'Check if the user is grounded and ready. Active Imagination is powerful work — they should be relatively calm and present. Ask: "Are you feeling grounded and present right now?" If they seem activated or fragile, suggest doing a check-in or grounding practice first.',

      invitation: `Help the user invite inner figures to appear. Offer entry techniques: empty mind, following a mood/feeling, visiting an inner place, or inviting a known figure back. Accept whatever comes — even if it seems trivial. If nothing comes, suggest a body scan or focusing on a feeling. Don't rush. ${this.figures.length > 0 ? `A figure has appeared: "${activeFigure?.description}". Ready to begin dialogue.` : 'No figure yet — keep the invitation open.'}`,

      dialogue: `CORE DIALOGUE PHASE. User is dialoguing with "${activeFigure?.description || 'an inner figure'}". Dialogue exchanges: ${this.dialogueExchanges}. ${needsGroundingCheck ? 'TIME FOR A GROUNDING CHECK — ask "How are you doing right now? Still feeling grounded?"' : ''} RULES: Stick with one image. Prompt for feelings ("What do you FEEL as they say that?"). Give the figure equal time ("What does the figure say in response?"). NEVER suggest what the figure should say. Don't analyze during dialogue. ${this.dialogueExchanges >= 5 ? 'Sufficient dialogue depth — watch for natural resolution.' : 'Still building depth — keep prompting the conversation.'}`,

      values: `Dialogue has reached a pause. Time for values reflection. Ask: "Did any figure demand something extreme?" "Are there human values — fairness, kindness, commitment — that need to be honored?" If a figure demanded total control, help the user reclaim balance without dismissing the figure. ${exchangesInPhase} exchanges so far.`,

      ritual: `Design a ritual to incarnate the meaning. Guide: small, physical, solitary, silent. Connected to the interpretation. NOT grandiose. Examples: lighting a candle, placing a stone, writing a single word, touching water. The physical act registers with the unconscious. ${this.ritualDesigned ? 'Ritual has been designed. Close the session warmly with a grounding exercise.' : 'Help them find a ritual that feels right.'}`,

      complete: 'Session is complete. End with a brief grounding exercise before they return to daily life.',
    };

    return guidance[this.phase] || guidance.safety_check;
  }

  // ---------------------------------------------------------------------------
  // SESSION PROGRESS
  // ---------------------------------------------------------------------------

  getSessionProgress() {
    const phaseLabels = {
      safety_check: 'Grounding Check',
      invitation: 'Inviting Figures',
      dialogue: 'Active Dialogue',
      values: 'Values Reflection',
      ritual: 'Designing Ritual',
      complete: 'Complete',
    };

    return {
      phase: this.phase,
      phaseLabel: phaseLabels[this.phase] || this.phase,
      exchangeCount: this.exchangeCount,
      figuresCount: this.figures.length,
      dialogueExchanges: this.dialogueExchanges,
      groundedConfirmed: this.groundedConfirmed,
      distressDetected: this.distressDetected,
      groundingChecksDone: this.groundingChecksDone,
      ritualDesigned: this.ritualDesigned,
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
      figures: this.figures.map(f => ({
        description: f.description,
        dialogueCount: f.dialogueCount,
      })),
      dialogueExchanges: this.dialogueExchanges,
      valuesReflected: this.valuesReflected,
      ritualDescription: this.ritualDescription,
      safety: {
        groundingChecksDone: this.groundingChecksDone,
        distressOccurred: this.phaseHistory.some(() => this.distressDetected),
        externalPersonRedirected: this.externalPersonDetected,
      },
      phaseHistory: this.phaseHistory,
      completedPhases: [...new Set(this.phaseHistory.map(h => h.from))],
    };
  }
}

export default ActiveImaginationModeHandler;
