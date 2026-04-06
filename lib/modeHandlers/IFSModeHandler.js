/**
 * IFS Parts Work Mode Handler
 *
 * Adds therapeutic process intelligence to Huxley's IFS mode.
 * Manages the 6 F's progression with clinical gates, tracks parts
 * discovered during the session, and detects Self energy vs blending.
 *
 * This handler does NOT:
 * - Make API calls (Huxley does that)
 * - Build prompts (Huxley does that, using getModeContext())
 * - Persist data (Huxley's therapeuticData pipeline does that)
 * - Replace ifsContextService (that's the data layer, this is session logic)
 *
 * Phase Flow:
 *   intro → find → focus → fleshOut → feelToward → befriend → fears → summary
 *                                          ↓
 *                                       unblend (if blended)
 *                                          ↓
 *                                    back to feelToward
 */
import BaseModeHandler from './BaseModeHandler';

// Self energy markers (from IFS: the 8 C's and related language)
const SELF_ENERGY_MARKERS = [
  'curious', 'curiosity', 'compassion', 'compassionate',
  'calm', 'clarity', 'clear', 'confident', 'courage',
  'creative', 'connected', 'open', 'interested',
  'caring', 'patient', 'accepting', 'gentle', 'warm',
  'understanding', 'spacious', 'present', 'grounded',
];

// Blending markers (protective parts taking over)
const BLENDING_MARKERS = [
  'annoyed', 'frustrated', 'hate', 'angry', 'furious',
  'scared', 'terrified', 'overwhelmed', 'anxious',
  'want it gone', 'get rid of', 'make it stop',
  'disgusted', 'ashamed', 'worthless', 'hopeless',
  'judgmental', 'critical', 'impatient', 'irritated',
];

// Exile emergence indicators
const EXILE_MARKERS = [
  'young', 'child', 'little', 'small', 'kid',
  'wounded', 'hurt', 'abandoned', 'alone', 'scared child',
  'crying', 'sobbing', 'helpless', 'vulnerable',
  'nobody loved', 'not good enough', 'worthless',
];

class IFSModeHandler extends BaseModeHandler {
  constructor() {
    super('ifs');
  }

  reset() {
    super.reset();
    this.phase = 'intro';
    this.parts = [];              // Parts discovered this session
    this.activePartIndex = null;   // Which part we're currently working with
    this.selfEnergyPresent = false;
    this.blendingDetected = false;
    this.exileEmergence = false;
    this.unblendAttempted = false;
    this.phaseHistory = [];        // Track phase transitions for context
    this.phaseExchangeCounts = {
      intro: 0, find: 0, focus: 0, fleshOut: 0,
      feelToward: 0, unblend: 0, befriend: 0, fears: 0, summary: 0,
    };

    // Phase summaries generated at transitions
    this.phaseSummaries = {
      intro: null, find: null, focus: null, fleshOut: null,
      feelToward: null, unblend: null, befriend: null, fears: null,
    };

    // State document — prevents repetitive questions
    this.stateDocument = {
      coveredTopics: [],
      askedQuestions: [],
      contextNotes: [],
      completedSubPhases: [],
    };
  }

  // ---------------------------------------------------------------------------
  // INITIALIZE WITH CONTEXT (for resuming a session in progress)
  // ---------------------------------------------------------------------------

  initializeWithContext(context) {
    if (!context) return;

    if (context.parts && Array.isArray(context.parts)) {
      for (const part of context.parts) {
        this._trackPart(part);
      }
    }

    if (context.activePartIndex != null && context.activePartIndex < this.parts.length) {
      this.activePartIndex = context.activePartIndex;
    }

    if (context.phase) {
      this.phase = context.phase;
    }

    if (context.selfEnergyPresent != null) {
      this.selfEnergyPresent = context.selfEnergyPresent;
    }

    if (context.blendingDetected != null) {
      this.blendingDetected = context.blendingDetected;
    }

    if (context.exileEmergence != null) {
      this.exileEmergence = context.exileEmergence;
    }

    if (context.exchangeCount) {
      this.exchangeCount = context.exchangeCount;
    }

    if (context.phaseSummaries) {
      this.phaseSummaries = { ...this.phaseSummaries, ...context.phaseSummaries };
    }

    if (context.stateDocument) {
      this.stateDocument = { ...this.stateDocument, ...context.stateDocument };
    }

    if (context.phaseHistory && Array.isArray(context.phaseHistory)) {
      this.phaseHistory = [...context.phaseHistory];
    }
  }

  // ---------------------------------------------------------------------------
  // CONTEXT FOR PROMPT (injected by HuxleyService)
  // ---------------------------------------------------------------------------

  getModeContext() {
    const activePart = this._getActivePart();

    return {
      sessionPhase: this.phase,
      partsDiscovered: this.parts.map(p => ({
        name: p.name,
        role: p.role,
        location: p.location,
        feelings: p.feelings,
        fears: p.fears,
        isActive: this.parts.indexOf(p) === this.activePartIndex,
      })),
      activePart: activePart ? {
        name: activePart.name,
        knownSoFar: this._summarizePartKnowledge(activePart),
      } : null,
      selfEnergyStatus: this.selfEnergyPresent
        ? 'Self energy detected — user appears to have curiosity/compassion toward the part'
        : 'Self energy not yet confirmed — check before proceeding past feelToward',
      blendingStatus: this.blendingDetected
        ? 'BLENDING DETECTED — a protective part may be activated. Help unblend before continuing.'
        : null,
      exileEmergence: this.exileEmergence
        ? 'An exile may be emerging — proceed with care, check protector permissions'
        : null,
      phaseGuidance: this._getPhaseGuidance(),
      phaseSummaries: this.phaseSummaries,
      stateDocument: {
        coveredTopics: this.stateDocument.coveredTopics,
        askedQuestions: this.stateDocument.askedQuestions.slice(-10),
        contextNotes: this.stateDocument.contextNotes.slice(-5),
        completedSubPhases: this.stateDocument.completedSubPhases,
      },
      progressMetrics: {
        exchangesInCurrentPhase: this.phaseExchangeCounts[this.phase] || 0,
        totalExchanges: this.exchangeCount,
        partsCount: this.parts.length,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // RESPONSE PROCESSING (called by HuxleyService after each exchange)
  // ---------------------------------------------------------------------------

  processResponse(userMessage, aiResponse, therapeuticData) {
    this.exchangeCount++;
    this.phaseExchangeCounts[this.phase] = (this.phaseExchangeCounts[this.phase] || 0) + 1;

    // 1. Extract part info from therapeuticData (Huxley already parses this)
    if (therapeuticData?.parts) {
      for (const part of therapeuticData.parts) {
        this._trackPart(part);
      }
    }

    // 2. Detect Self energy and blending from user's words
    if (userMessage) {
      this.selfEnergyPresent = this._detectSelfEnergy(userMessage);
      this.blendingDetected = this._detectBlending(userMessage);
      this.exileEmergence = this._detectExileEmergence(userMessage);

      // Also scan AI response for blending detection cues
      if (aiResponse) {
        const aiDetectsBlending = this._aiDetectsBlending(aiResponse);
        if (aiDetectsBlending) this.blendingDetected = true;
      }
    }

    // 3. Update state document (prevents repetitive questions)
    this._updateStateDocument(userMessage, aiResponse);

    // 4. Try to advance phase
    const previousPhase = this.phase;
    this._tryAdvancePhase();

    if (this.phase !== previousPhase) {
      this._generatePhaseSummary(previousPhase);

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
    const part = this._getActivePart();

    switch (this.phase) {
      case 'intro':
        // Advance when we have at least a name or description for a part
        if (part?.name) {
          this.phase = 'find';
        }
        break;

      case 'find':
        // Advance when we know where the part lives in the body
        if (part?.location) {
          this.phase = 'focus';
        }
        break;

      case 'focus':
        // Advance when we have some description (appearance, sensations, etc.)
        if (part?.appearance || part?.description) {
          this.phase = 'fleshOut';
        }
        break;

      case 'fleshOut':
        // Advance when we understand the part's role/function
        if (part?.role || part?.strategy) {
          this.phase = 'feelToward';
        }
        break;

      case 'feelToward':
        // CRITICAL CLINICAL GATE
        // If blended → redirect to unblend
        // If Self energy present → proceed to befriend
        // Otherwise → stay here (do NOT skip this step)
        if (this.blendingDetected && !this.unblendAttempted) {
          this.phase = 'unblend';
          this.unblendAttempted = true;
        } else if (this.selfEnergyPresent) {
          this.phase = 'befriend';
        }
        // If neither: stay in feelToward — the AI prompt guidance
        // will keep working on accessing Self energy
        break;

      case 'unblend':
        // Return to feelToward once blending resolves
        if (!this.blendingDetected || this.selfEnergyPresent) {
          this.phase = 'feelToward';
          // Reset so feelToward can now check for Self energy
          this.blendingDetected = false;
        }
        break;

      case 'befriend':
        // Advance when fears are expressed
        if (part?.fears) {
          this.phase = 'fears';
        }
        break;

      case 'fears':
        // Advance to summary after a few exchanges in fears phase
        // (allow space for the part to express and be heard)
        const exchangesInFears = this.exchangeCount -
          (this.phaseHistory.find(h => h.to === 'fears')?.atExchange || 0);
        if (exchangesInFears >= 3 && part?.fears) {
          this.phase = 'summary';
        }
        break;

      // summary is terminal — no further advancement
    }
  }

  // ---------------------------------------------------------------------------
  // PART TRACKING
  // ---------------------------------------------------------------------------

  _trackPart(partData) {
    if (!partData?.name) return;

    const existingIdx = this.parts.findIndex(
      p => p.name?.toLowerCase() === partData.name?.toLowerCase()
    );

    if (existingIdx >= 0) {
      // Merge new info into existing part (don't overwrite with nulls)
      const existing = this.parts[existingIdx];
      this.parts[existingIdx] = {
        ...existing,
        ...Object.fromEntries(
          Object.entries(partData).filter(([_, v]) => v != null && v !== '')
        ),
      };
    } else {
      this.parts.push({ ...partData });
      this.activePartIndex = this.parts.length - 1;
    }
  }

  _getActivePart() {
    if (this.activePartIndex === null || this.activePartIndex >= this.parts.length) {
      return null;
    }
    return this.parts[this.activePartIndex];
  }

  // ---------------------------------------------------------------------------
  // DETECTION (Self energy, blending, exile emergence)
  // ---------------------------------------------------------------------------

  _detectSelfEnergy(text) {
    const lower = text.toLowerCase();
    const matches = SELF_ENERGY_MARKERS.filter(m => lower.includes(m));
    // Require at least 1 marker, but also check no strong blending
    if (matches.length >= 1) {
      const blendMatches = BLENDING_MARKERS.filter(m => lower.includes(m));
      return blendMatches.length === 0;
    }
    return false;
  }

  _detectBlending(text) {
    const lower = text.toLowerCase();
    const matches = BLENDING_MARKERS.filter(m => lower.includes(m));
    return matches.length >= 1;
  }

  _detectExileEmergence(text) {
    const lower = text.toLowerCase();
    const matches = EXILE_MARKERS.filter(m => lower.includes(m));
    return matches.length >= 2; // Need stronger signal for exile detection
  }

  _aiDetectsBlending(aiResponse) {
    const lower = aiResponse.toLowerCase();
    return lower.includes('blended') ||
      lower.includes('step back') ||
      lower.includes('another part') ||
      (lower.includes('toward') && lower.includes('part') && lower.includes('feel'));
  }

  // ---------------------------------------------------------------------------
  // PHASE GUIDANCE (injected into modeContext for the AI)
  // ---------------------------------------------------------------------------

  _getPhaseGuidance() {
    const part = this._getActivePart();
    const partName = part?.name || 'the part';
    const exchangesInPhase = this.phaseExchangeCounts[this.phase] || 0;

    const guidance = {
      intro: `Help the user identify which part wants attention. Listen for parts language naturally. Exchanges in phase: ${exchangesInPhase}.`,
      find: `"${partName}" has been identified. Help the user locate where this part lives in or around the body. Exchanges in phase: ${exchangesInPhase}.`,
      focus: `"${partName}" is located at ${part?.location || 'their body'}. Help them describe what they notice — sensations, images, colors, temperature, shape. Exchanges in phase: ${exchangesInPhase}.`,
      fleshOut: `Getting to know "${partName}". Ask about its role, function, what it does for the user. What is this part trying to protect them from? Exchanges in phase: ${exchangesInPhase}.`,
      feelToward: `CRITICAL CHECKPOINT: Ask "How do you feel TOWARD this part right now?" This checks for Self energy. If they say curious, compassionate, open — Self is present. If they say annoyed, frustrated, scared — another part is blended and needs attention first. Exchanges in phase: ${exchangesInPhase}.`,
      unblend: `A protective part is blended. Acknowledge it warmly. Ask if this protective part would be willing to step back just a little, so the user can get to know "${partName}" with curiosity. Do NOT rush past this. Exchanges in phase: ${exchangesInPhase}.`,
      befriend: `Self energy is present. Help the user extend appreciation and understanding to "${partName}". Build the relationship. Then ask: what is this part afraid would happen if it stopped doing its job? Exchanges in phase: ${exchangesInPhase}.`,
      fears: `"${partName}" is sharing its fears. Listen fully. Validate. These fears make sense given the part's history. Allow space for the part to feel heard. Exchanges in phase: ${exchangesInPhase}.`,
      summary: `Session is winding down. Summarize what was learned about "${partName}". Acknowledge the user's courage. Suggest they might check in with this part again soon.`,
    };

    return guidance[this.phase] || guidance.intro;
  }

  // ---------------------------------------------------------------------------
  // PART KNOWLEDGE SUMMARY (for context injection)
  // ---------------------------------------------------------------------------

  _summarizePartKnowledge(part) {
    const known = [];
    if (part.name) known.push(`Name: "${part.name}"`);
    if (part.role) known.push(`Role: ${part.role}`);
    if (part.location) known.push(`Body location: ${part.location}`);
    if (part.appearance || part.description) {
      known.push(`Appearance: ${part.appearance || part.description}`);
    }
    if (part.strategy) known.push(`Strategy: ${part.strategy}`);
    if (part.feelings) known.push(`Part's feelings: ${part.feelings}`);
    if (part.fears) known.push(`Part's fears: ${part.fears}`);
    if (part.wants) known.push(`Part wants: ${part.wants}`);

    return known.length > 0
      ? known.join('. ') + '.'
      : 'Nothing known yet — still getting acquainted.';
  }

  // ---------------------------------------------------------------------------
  // STATE DOCUMENT (prevents repetitive questions)
  // ---------------------------------------------------------------------------

  _updateStateDocument(userMessage, aiResponse) {
    if (!userMessage) return;
    const lowerMessage = userMessage.toLowerCase();

    // Extract questions from AI response to avoid re-asking
    if (aiResponse) {
      const questions = aiResponse.match(/[^.!?]*\?/g);
      if (questions) {
        for (const q of questions) {
          const question = q.trim();
          if (question.length > 10 && !this.stateDocument.askedQuestions.includes(question)) {
            this.stateDocument.askedQuestions.push(question);
          }
        }
      }
    }

    // Track IFS-relevant topics covered
    const topicsByPhase = {
      intro: ['parts', 'what part', 'inner world', 'protector', 'exile'],
      find: ['body', 'location', 'where do you feel', 'notice in your body'],
      focus: ['sensations', 'image', 'color', 'temperature', 'shape', 'appearance'],
      fleshOut: ['role', 'function', 'job', 'protect', 'strategy', 'purpose'],
      feelToward: ['feel toward', 'self energy', 'curious', 'compassion', 'blending'],
      unblend: ['step back', 'another part', 'willing to', 'protector'],
      befriend: ['appreciate', 'understand', 'relationship', 'trust', 'thank'],
      fears: ['afraid', 'fear', 'worried', 'what if', 'stopped doing'],
    };

    const topicsForPhase = topicsByPhase[this.phase] || [];
    for (const topic of topicsForPhase) {
      if (lowerMessage.includes(topic) || (aiResponse || '').toLowerCase().includes(topic)) {
        if (!this.stateDocument.coveredTopics.includes(topic)) {
          this.stateDocument.coveredTopics.push(topic);
        }
      }
    }

    // Track important context notes (strong emotional statements)
    const importanceMarkers = ['important', 'significant', 'powerful', 'intense', 'always', 'never', 'terrified', 'overwhelming'];
    if (importanceMarkers.some(m => lowerMessage.includes(m))) {
      const note = userMessage.substring(0, 150);
      if (!this.stateDocument.contextNotes.includes(note)) {
        this.stateDocument.contextNotes.push(note);
      }
    }

    // Limit array sizes
    if (this.stateDocument.askedQuestions.length > 50) {
      this.stateDocument.askedQuestions = this.stateDocument.askedQuestions.slice(-50);
    }
    if (this.stateDocument.contextNotes.length > 20) {
      this.stateDocument.contextNotes = this.stateDocument.contextNotes.slice(-20);
    }
  }

  // ---------------------------------------------------------------------------
  // PHASE SUMMARIES (generated on transition, injected into modeContext)
  // ---------------------------------------------------------------------------

  _generatePhaseSummary(completedPhase) {
    const part = this._getActivePart();
    const partName = part?.name || 'the part';

    switch (completedPhase) {
      case 'intro':
        this.phaseSummaries.intro = `Intro complete. Part identified: "${partName}".`;
        break;

      case 'find':
        this.phaseSummaries.find = `Find complete. "${partName}" located at: ${part?.location || 'not yet identified'}.`;
        break;

      case 'focus':
        this.phaseSummaries.focus = `Focus complete. "${partName}" described as: ${part?.appearance || part?.description || 'explored in session'}.`;
        break;

      case 'fleshOut':
        this.phaseSummaries.fleshOut = `Flesh Out complete. "${partName}" role: ${part?.role || 'explored'}. Strategy: ${part?.strategy || 'explored'}.`;
        break;

      case 'feelToward': {
        const status = this.selfEnergyPresent ? 'Self energy confirmed' : 'Self energy not yet clear';
        this.phaseSummaries.feelToward = `Feel Toward complete. ${status}. Blending occurred: ${this.phaseHistory.some(h => h.to === 'unblend') ? 'yes' : 'no'}.`;
        break;
      }

      case 'unblend':
        this.phaseSummaries.unblend = `Unblend complete. Protective part acknowledged. Returning to feel-toward check.`;
        break;

      case 'befriend':
        this.phaseSummaries.befriend = `Befriend complete. Relationship established with "${partName}". Moving to fears exploration.`;
        break;

      case 'fears':
        this.phaseSummaries.fears = `Fears explored. "${partName}" fears: ${part?.fears || 'expressed in session'}.`;
        break;
    }
  }

  // ---------------------------------------------------------------------------
  // SESSION PROGRESS (returned to screens via chat() result)
  // ---------------------------------------------------------------------------

  getSessionProgress() {
    const activePart = this._getActivePart();
    const phaseLabels = {
      intro: 'Getting Started',
      find: 'Finding a Part',
      focus: 'Focusing',
      fleshOut: 'Getting to Know',
      feelToward: 'Checking Self Energy',
      unblend: 'Unblending',
      befriend: 'Befriending',
      fears: 'Listening to Fears',
      summary: 'Wrapping Up',
    };

    return {
      phase: this.phase,
      phaseLabel: phaseLabels[this.phase] || this.phase,
      exchangeCount: this.exchangeCount,
      activePart: activePart ? {
        name: activePart.name,
        role: activePart.role,
        location: activePart.location,
      } : null,
      partsCount: this.parts.length,
      selfEnergyPresent: this.selfEnergyPresent,
      blendingDetected: this.blendingDetected,
      exileEmergence: this.exileEmergence,
      isComplete: this.phase === 'summary',
    };
  }

  // ---------------------------------------------------------------------------
  // SESSION SUMMARY (for persistence when session ends)
  // ---------------------------------------------------------------------------

  getSessionSummary() {
    const activePart = this._getActivePart();

    return {
      modeId: this.modeId,
      phase: this.phase,
      exchangeCount: this.exchangeCount,
      activePartIndex: this.activePartIndex,
      partsDiscovered: this.parts.map(p => ({
        name: p.name,
        role: p.role || null,
        location: p.location || null,
        appearance: p.appearance || p.description || null,
        strategy: p.strategy || null,
        feelings: p.feelings || null,
        fears: p.fears || null,
        wants: p.wants || null,
        isExile: this.exileEmergence && p === activePart,
      })),
      selfEnergyAchieved: this.selfEnergyPresent,
      blendingOccurred: this.phaseHistory.some(h => h.to === 'unblend'),
      exileEmergence: this.exileEmergence,
      phaseHistory: this.phaseHistory,
      completedPhases: [...new Set(this.phaseHistory.map(h => h.from))],
      phaseSummaries: { ...this.phaseSummaries },
      stateDocument: {
        coveredTopics: [...this.stateDocument.coveredTopics],
        contextNotes: [...this.stateDocument.contextNotes],
        completedSubPhases: [...this.stateDocument.completedSubPhases],
      },
    };
  }
}

export default IFSModeHandler;
