/**
 * Experience Mapping Mode Handler
 *
 * Adds therapeutic process intelligence to Huxley's experience mapping mode.
 * Implements Robert Johnson's "Inner Work" 4-phase process adapted for
 * psychedelic integration: Gathering -> Dynamics -> Interpretation -> Ritual.
 *
 * This handler does NOT:
 * - Make API calls (Huxley does that)
 * - Build prompts (Huxley does that, using getModeContext())
 * - Persist data (Huxley's therapeuticData pipeline does that)
 * - Replace experienceMappingService (that's the legacy service, this is session logic)
 *
 * Phase Flow:
 *   phase1 (Gathering Elements)
 *     → phase2 (Associations/Dynamics — "what part of me is this?")
 *       → phase3 (Interpretation — synthesizing meaning)
 *         → phase4 (Ritual — physical act to honor the experience)
 *           → complete
 *
 * Dual-gate transitions: each phase requires BOTH a threshold AND readiness.
 */
import BaseModeHandler from './BaseModeHandler';

// ---------------------------------------------------------------------------
// KEYWORD DICTIONARIES (for categorizing gathered elements)
// ---------------------------------------------------------------------------

const EMOTION_KEYWORDS = [
  'peaceful', 'peace', 'scared', 'joyful', 'joy', 'anxious', 'anxiety',
  'calm', 'excited', 'awe', 'safe', 'afraid', 'fear', 'love', 'loving',
  'bliss', 'blissful', 'ecstasy', 'wonder', 'gratitude', 'grateful',
  'compassion', 'grief', 'sadness', 'sad', 'angry', 'anger', 'rage',
  'shame', 'guilt', 'relief', 'freedom', 'connection', 'connected',
  'lonely', 'loneliness', 'happy', 'happiness', 'terrified', 'terror',
  'serene', 'euphoric', 'euphoria', 'overwhelmed', 'hopeful', 'hope',
  'despair', 'surrender', 'surrendered', 'vulnerable', 'raw',
];

const SENSATION_KEYWORDS = [
  'warm', 'warmth', 'cold', 'tingling', 'vibrating', 'vibration',
  'pulsing', 'flowing', 'energy', 'tension', 'relaxation', 'expansion',
  'contraction', 'floating', 'grounded', 'heavy', 'heaviness',
  'light', 'lightness', 'buzzing', 'electricity', 'dissolving',
  'melting', 'pressure', 'opening', 'tightness', 'numbness', 'numb',
  'spinning', 'shaking', 'trembling', 'burning', 'cooling', 'sinking',
  'rising', 'prickling', 'throbbing', 'waves', 'rushing',
];

const BEING_KEYWORDS = [
  'angel', 'being', 'figure', 'entity', 'grandmother', 'grandfather',
  'mother', 'father', 'guide', 'teacher', 'healer', 'warrior',
  'child', 'elder', 'spirit', 'presence', 'ancestor', 'goddess',
  'god', 'demon', 'shadow', 'trickster', 'serpent', 'snake',
  'animal', 'bird', 'eagle', 'owl', 'wolf', 'bear', 'jaguar',
  'dolphin', 'whale', 'lion', 'deer', 'dragon', 'phoenix',
  'alien', 'creature', 'person', 'stranger', 'woman', 'man',
];

const VISUAL_KEYWORDS = [
  'purple', 'golden', 'blue', 'red', 'white', 'green', 'glowing',
  'bright', 'dark', 'darkness', 'light', 'color', 'colors',
  'silver', 'rainbow', 'crystal', 'gem', 'star', 'stars', 'sun',
  'moon', 'tree', 'flower', 'water', 'fire', 'mountain', 'ocean',
  'forest', 'cave', 'bridge', 'door', 'pathway', 'spiral', 'circle',
  'triangle', 'mandala', 'fractal', 'geometric', 'pattern', 'patterns',
  'shimmering', 'translucent', 'transparent', 'pink', 'violet',
  'orange', 'yellow', 'black', 'indigo', 'turquoise', 'sky',
  'landscape', 'garden', 'temple', 'void', 'cosmos', 'universe',
];

const SOUND_KEYWORDS = [
  'voice', 'music', 'singing', 'sound', 'whisper', 'silence',
  'echo', 'rhythm', 'frequency', 'tone', 'melody', 'harmony',
  'chanting', 'humming', 'ringing', 'buzzing', 'drumming', 'roar',
  'thunder', 'wind', 'breathing', 'heartbeat', 'laughter', 'crying',
];

const INSIGHT_KEYWORDS = [
  'realized', 'understood', 'knowing', 'insight', 'clarity',
  'connected', 'purpose', 'meaning', 'truth', 'awareness',
  'revelation', 'epiphany', 'realization', 'understood', 'saw that',
  'learned', 'discovered', 'recognized', 'felt like', 'sense of',
  'became clear', 'dawned on', 'hit me', 'knew', 'felt certain',
];

// Dynamics detection keywords (Phase 2)
const DYNAMICS_MARKERS = [
  'part of me', 'inside me', 'within me', 'my inner', 'i am',
  'i have been', 'reminds me of', 'feels like when', 'same as',
  'just like', 'represents', 'symbolizes', 'connected to',
  'pattern', 'always do', 'tendency', 'habit', 'i keep',
  'struggle with', 'conflict between', 'torn between',
];

// Interpretation markers (Phase 3)
const INTERPRETATION_MARKERS = [
  'overall', 'message', 'meaning', 'telling me', 'story',
  'synthesis', 'picture', 'theme', 'lesson', 'understand now',
  'the experience was about', 'what it means', 'central',
  'core message', 'main insight', 'big takeaway',
];

// Ritual markers (Phase 4)
const RITUAL_MARKERS = [
  'ritual', 'ceremony', 'physical act', 'going to do', 'will do',
  'plan to', 'light a candle', 'write a letter', 'walk', 'create',
  'make', 'build', 'offer', 'plant', 'burn', 'bury', 'gather',
  'honor', 'practice', 'commit to', 'i will', 'i want to',
];

class ExperienceMappingModeHandler extends BaseModeHandler {
  constructor() {
    super('experienceMapping');
  }

  reset() {
    super.reset();
    this.phase = 'phase1';
    this.phaseExchangeCounts = { phase1: 0, phase2: 0, phase3: 0, phase4: 0 };

    // Gathering state — categorized elements from user's experience (Phase 1)
    this.gatheringState = {
      elements: [],      // General experience elements
      emotions: [],      // e.g. "peaceful", "awe", "safe"
      sensations: [],    // e.g. "warm", "floating", "tingling"
      beings: [],        // e.g. "angel", "grandmother", "wolf"
      visuals: [],       // e.g. "purple colors", "golden light"
      sounds: [],        // e.g. "voice", "music", "silence"
      insights: [],      // e.g. "felt connected", "sense of purpose"
    };

    // Dynamics tracked in Phase 2
    this.dynamics = [];          // { element, dynamic, lifeExample }
    this.connectedElements = []; // Which elements have been connected to inner dynamics

    // Interpretation and ritual tracked in Phases 3 & 4
    this.interpretation = null;  // The user's synthesized interpretation
    this.ritual = null;          // The designed ritual/physical act

    // Phase summaries generated at transitions
    this.phaseSummaries = {
      phase1: null,
      phase2: null,
      phase3: null,
      phase4: null,
    };

    // State document — prevents repetitive questions
    this.stateDocument = {
      coveredTopics: [],
      askedQuestions: [],
      extractedElements: [],
      completedSubPhases: [],
      userPreferences: {},
      contextNotes: [],
    };

    this.phaseHistory = [];
  }

  // ---------------------------------------------------------------------------
  // INITIALIZE WITH CONTEXT (for returning to a session in progress)
  // ---------------------------------------------------------------------------

  initializeWithContext(context) {
    if (!context) return;

    if (context.gatheringState) {
      // Merge each category, deduplicating
      for (const category of Object.keys(this.gatheringState)) {
        if (Array.isArray(context.gatheringState[category])) {
          const existing = new Set(this.gatheringState[category]);
          for (const item of context.gatheringState[category]) {
            if (!existing.has(item)) {
              this.gatheringState[category].push(item);
            }
          }
        }
      }
    }

    if (context.dynamics && Array.isArray(context.dynamics)) {
      this.dynamics = [...context.dynamics];
    }

    if (context.connectedElements && Array.isArray(context.connectedElements)) {
      this.connectedElements = [...context.connectedElements];
    }

    if (context.interpretation) {
      this.interpretation = context.interpretation;
    }

    if (context.ritual) {
      this.ritual = context.ritual;
    }

    if (context.phase) {
      this.phase = context.phase;
    }

    if (context.phaseSummaries) {
      this.phaseSummaries = { ...this.phaseSummaries, ...context.phaseSummaries };
    }

    if (context.stateDocument) {
      this.stateDocument = { ...this.stateDocument, ...context.stateDocument };
    }

    if (context.exchangeCount) {
      this.exchangeCount = context.exchangeCount;
    }
  }

  // ---------------------------------------------------------------------------
  // CONTEXT FOR PROMPT (injected by HuxleyService)
  // ---------------------------------------------------------------------------

  getModeContext() {
    const totalElements = this._getTotalElementsCount();
    const connectionRatio = totalElements > 0
      ? this.connectedElements.length / totalElements
      : 0;

    return {
      currentPhase: this._phaseNumber(),
      phaseLabel: this._getPhaseLabel(),
      gatheringState: {
        elements: this.gatheringState.elements,
        emotions: this.gatheringState.emotions,
        sensations: this.gatheringState.sensations,
        beings: this.gatheringState.beings,
        visuals: this.gatheringState.visuals,
        sounds: this.gatheringState.sounds,
        insights: this.gatheringState.insights,
      },
      stateDocument: {
        coveredTopics: this.stateDocument.coveredTopics,
        askedQuestions: this.stateDocument.askedQuestions.slice(-10),
        extractedElements: this.stateDocument.extractedElements.slice(-15),
        completedSubPhases: this.stateDocument.completedSubPhases,
        userPreferences: this.stateDocument.userPreferences,
        contextNotes: this.stateDocument.contextNotes.slice(-5),
      },
      phaseSummaries: this.phaseSummaries,
      phaseGuidance: this._getPhaseGuidance(),
      progressMetrics: {
        elementsCount: totalElements,
        dynamicsCount: this.dynamics.length,
        connectedElementsCount: this.connectedElements.length,
        connectionRatio: Math.round(connectionRatio * 100) + '%',
        hasInterpretation: this.interpretation !== null,
        hasRitual: this.ritual !== null,
        exchangesInCurrentPhase: this.phaseExchangeCounts[this.phase] || 0,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // RESPONSE PROCESSING (called by HuxleyService after each exchange)
  // ---------------------------------------------------------------------------

  processResponse(userMessage, aiResponse, therapeuticData) {
    this.exchangeCount++;
    this.phaseExchangeCounts[this.phase] = (this.phaseExchangeCounts[this.phase] || 0) + 1;

    if (userMessage) {
      // 1. Update gathering state from user message (Phase 1)
      if (this.phase === 'phase1') {
        this._updateGatheringState(userMessage);
      }

      // 2. Update dynamics from user message (Phase 2)
      if (this.phase === 'phase2') {
        this._updateDynamics(userMessage, therapeuticData);
      }

      // 3. Update interpretation from user message (Phase 3)
      if (this.phase === 'phase3') {
        this._updateInterpretation(userMessage, therapeuticData);
      }

      // 4. Update ritual from user message (Phase 4)
      if (this.phase === 'phase4') {
        this._updateRitual(userMessage, therapeuticData);
      }

      // 5. Update state document (all phases)
      this._updateStateDocument(userMessage, aiResponse);
    }

    // 6. Process therapeuticData if present (structured data from AI)
    if (therapeuticData) {
      this._processTherapeuticData(therapeuticData);
    }

    // 7. Try to advance phase based on gates
    const previousPhase = this.phase;
    this._tryAdvancePhase(aiResponse);

    if (this.phase !== previousPhase) {
      // Generate summary of the completed phase
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
  // PHASE ADVANCEMENT (dual-gate: threshold + readiness)
  // ---------------------------------------------------------------------------

  _tryAdvancePhase(aiResponse) {
    const exchangesInPhase = this.phaseExchangeCounts[this.phase] || 0;
    const aiLower = (aiResponse || '').toLowerCase();

    switch (this.phase) {
      case 'phase1': {
        // Gate 1→2: >=3 elements gathered AND >=5 exchanges in phase
        const totalElements = this._getTotalElementsCount();
        const thresholdMet = totalElements >= 3 && exchangesInPhase >= 5;

        // Readiness: AI signals or user signals done
        const readiness = aiLower.includes('[phase 1 complete]') ||
          aiLower.includes('move to phase 2') ||
          aiLower.includes('ready to explore connections') ||
          aiLower.includes('captured everything') ||
          aiLower.includes('let\'s start connecting') ||
          aiLower.includes('explore what these mean');

        if (thresholdMet && readiness) {
          this.phase = 'phase2';
        }
        break;
      }

      case 'phase2': {
        // Gate 2→3: >=3 dynamics AND >=50% of elements connected
        const totalElements = this._getTotalElementsCount();
        const connectionRatio = totalElements > 0
          ? this.connectedElements.length / totalElements
          : 0;
        const thresholdMet = this.dynamics.length >= 3 && connectionRatio >= 0.5;

        // Readiness: AI signals
        const readiness = aiLower.includes('[phase 2 complete]') ||
          aiLower.includes('move to phase 3') ||
          aiLower.includes('ready for interpretation') ||
          aiLower.includes('ready to find the overall meaning') ||
          aiLower.includes('now let\'s look at the overall picture');

        // Fallback: extensive dynamics work (>=8) even without explicit signal
        const fallback = this.dynamics.length >= 8 && connectionRatio >= 0.6;

        if ((thresholdMet && readiness) || fallback) {
          this.phase = 'phase3';
        }
        break;
      }

      case 'phase3': {
        // Gate 3→4: interpretation present AND >=3 exchanges in phase
        const thresholdMet = this.interpretation !== null && exchangesInPhase >= 3;

        // Readiness: AI signals
        const readiness = aiLower.includes('[phase 3 complete]') ||
          aiLower.includes('move to phase 4') ||
          aiLower.includes('ready for ritual') ||
          aiLower.includes('ready to make this physical') ||
          aiLower.includes('now let\'s honor this');

        if (thresholdMet && readiness) {
          this.phase = 'phase4';
        }
        break;
      }

      case 'phase4': {
        // Gate 4→complete: ritual designed AND >=2 exchanges in phase
        const thresholdMet = this.ritual !== null && exchangesInPhase >= 2;

        // Readiness: AI signals completion or user commits
        const readiness = aiLower.includes('[phase 4 complete]') ||
          aiLower.includes('session complete') ||
          aiLower.includes('experience mapping complete');

        if (thresholdMet && readiness) {
          this.phase = 'complete';
        }
        break;
      }

      // complete is terminal — no further advancement
    }
  }

  // ---------------------------------------------------------------------------
  // GATHERING STATE (Phase 1 — categorize elements from user messages)
  // ---------------------------------------------------------------------------

  _updateGatheringState(userMessage) {
    const lower = userMessage.toLowerCase();
    // Split into words, keeping multi-word phrases intact for matching
    const words = userMessage.split(/\s+/).filter(w => w.length > 2);

    // Match against category keyword lists
    this._matchAndAdd(lower, EMOTION_KEYWORDS, this.gatheringState.emotions);
    this._matchAndAdd(lower, SENSATION_KEYWORDS, this.gatheringState.sensations);
    this._matchAndAdd(lower, BEING_KEYWORDS, this.gatheringState.beings);
    this._matchAndAdd(lower, VISUAL_KEYWORDS, this.gatheringState.visuals);
    this._matchAndAdd(lower, SOUND_KEYWORDS, this.gatheringState.sounds);
    this._matchAndAdd(lower, INSIGHT_KEYWORDS, this.gatheringState.insights);

    // Add significant words to general elements list
    words.forEach(word => {
      const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
      if (cleaned.length > 3 && !this.gatheringState.elements.includes(cleaned)) {
        this.gatheringState.elements.push(cleaned);
      }
    });
  }

  /**
   * Match keywords in text and add to the target array (deduplicating).
   */
  _matchAndAdd(lowerText, keywords, targetArray) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword) && !targetArray.includes(keyword)) {
        targetArray.push(keyword);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // DYNAMICS TRACKING (Phase 2)
  // ---------------------------------------------------------------------------

  _updateDynamics(userMessage, therapeuticData) {
    const lower = userMessage.toLowerCase();

    // Detect dynamics language in user message
    for (const marker of DYNAMICS_MARKERS) {
      if (lower.includes(marker)) {
        // Extract the surrounding sentence as the dynamic
        const sentences = userMessage.split(/[.!?]+/);
        const matchingSentence = sentences.find(s =>
          s.toLowerCase().includes(marker)
        );

        if (matchingSentence) {
          const dynamic = {
            content: matchingSentence.trim(),
            marker: marker,
            timestamp: new Date().toISOString(),
          };

          // Avoid duplicate dynamics (check by content similarity)
          const isDuplicate = this.dynamics.some(d =>
            d.content.toLowerCase() === dynamic.content.toLowerCase()
          );

          if (!isDuplicate) {
            this.dynamics.push(dynamic);
          }
        }
      }
    }

    // Track which elements have been connected to dynamics
    // Check if the user's message references any gathered element
    const allElements = this._getAllGatheredItems();
    for (const element of allElements) {
      if (lower.includes(element) && !this.connectedElements.includes(element)) {
        // If a dynamics marker is also present, this element is being connected
        const hasDynamicsLanguage = DYNAMICS_MARKERS.some(m => lower.includes(m));
        if (hasDynamicsLanguage) {
          this.connectedElements.push(element);
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // INTERPRETATION TRACKING (Phase 3)
  // ---------------------------------------------------------------------------

  _updateInterpretation(userMessage, therapeuticData) {
    const lower = userMessage.toLowerCase();

    // Detect interpretation language
    const hasInterpretationLanguage = INTERPRETATION_MARKERS.some(m => lower.includes(m));

    if (hasInterpretationLanguage) {
      // Use the user's message as the interpretation (or update it)
      this.interpretation = {
        content: userMessage.trim(),
        timestamp: new Date().toISOString(),
      };
    }

    // Also accept structured data from AI
    if (therapeuticData?.interpretation) {
      this.interpretation = {
        content: therapeuticData.interpretation,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ---------------------------------------------------------------------------
  // RITUAL TRACKING (Phase 4)
  // ---------------------------------------------------------------------------

  _updateRitual(userMessage, therapeuticData) {
    const lower = userMessage.toLowerCase();

    // Detect ritual language
    const hasRitualLanguage = RITUAL_MARKERS.some(m => lower.includes(m));

    if (hasRitualLanguage) {
      this.ritual = {
        content: userMessage.trim(),
        timestamp: new Date().toISOString(),
      };
    }

    // Also accept structured data from AI
    if (therapeuticData?.ritual) {
      this.ritual = {
        content: therapeuticData.ritual,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ---------------------------------------------------------------------------
  // THERAPEUTIC DATA PROCESSING (from AI's structured output)
  // ---------------------------------------------------------------------------

  _processTherapeuticData(therapeuticData) {
    // Process entities extracted by the AI
    if (therapeuticData.entities && Array.isArray(therapeuticData.entities)) {
      for (const entity of therapeuticData.entities) {
        const name = (entity.name || '').toLowerCase();
        if (!name) continue;

        switch (entity.category) {
          case 'emotional':
            if (!this.gatheringState.emotions.includes(name)) {
              this.gatheringState.emotions.push(name);
            }
            break;
          case 'somatic':
            if (!this.gatheringState.sensations.includes(name)) {
              this.gatheringState.sensations.push(name);
            }
            break;
          case 'archetypal':
            if (!this.gatheringState.beings.includes(name)) {
              this.gatheringState.beings.push(name);
            }
            break;
          case 'visual':
            if (!this.gatheringState.visuals.includes(name)) {
              this.gatheringState.visuals.push(name);
            }
            break;
          case 'auditory':
            if (!this.gatheringState.sounds.includes(name)) {
              this.gatheringState.sounds.push(name);
            }
            break;
          case 'cognitive':
            if (!this.gatheringState.insights.includes(name)) {
              this.gatheringState.insights.push(name);
            }
            break;
          default:
            if (!this.gatheringState.elements.includes(name)) {
              this.gatheringState.elements.push(name);
            }
        }
      }
    }

    // Process associations
    if (therapeuticData.associations && Array.isArray(therapeuticData.associations)) {
      for (const assoc of therapeuticData.associations) {
        if (assoc.element && assoc.association) {
          const dynamic = {
            content: `${assoc.element} → ${assoc.association}`,
            element: assoc.element,
            association: assoc.association,
            clicked: assoc.clicked || false,
            timestamp: new Date().toISOString(),
          };

          const isDuplicate = this.dynamics.some(d =>
            d.element === dynamic.element && d.association === dynamic.association
          );

          if (!isDuplicate) {
            this.dynamics.push(dynamic);
          }

          // Mark element as connected
          const elementLower = assoc.element.toLowerCase();
          if (!this.connectedElements.includes(elementLower)) {
            this.connectedElements.push(elementLower);
          }
        }
      }
    }

    // Process phase signals
    if (therapeuticData.phase_signals?.phase_complete) {
      // Phase completion is handled by _tryAdvancePhase via AI response text
      // This is an additional signal channel
    }
  }

  // ---------------------------------------------------------------------------
  // STATE DOCUMENT (prevents repetitive questions)
  // ---------------------------------------------------------------------------

  _updateStateDocument(userMessage, aiResponse) {
    const lowerMessage = userMessage.toLowerCase();

    // Extract questions from AI response
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

    // Track extracted elements from gathering state
    if (this.phase === 'phase1') {
      const allItems = [
        ...this.gatheringState.beings,
        ...this.gatheringState.visuals,
        ...this.gatheringState.sounds,
        ...this.gatheringState.emotions,
        ...this.gatheringState.sensations,
        ...this.gatheringState.insights,
      ];
      for (const element of allItems) {
        if (!this.stateDocument.extractedElements.includes(element)) {
          this.stateDocument.extractedElements.push(element);
        }
      }
    }

    // Track covered topics based on phase
    const phaseTopics = {
      phase1: ['visuals', 'sounds', 'emotions', 'beings', 'sensations', 'insights', 'body movements'],
      phase2: ['inner dynamics', 'life patterns', 'parts work', 'associations', 'connections'],
      phase3: ['interpretation', 'overall meaning', 'synthesis', 'central message'],
      phase4: ['ritual', 'physical act', 'integration practice', 'embodiment'],
    };

    const topicsForPhase = phaseTopics[this.phase] || [];
    for (const topic of topicsForPhase) {
      if (lowerMessage.includes(topic) || (aiResponse || '').toLowerCase().includes(topic)) {
        if (!this.stateDocument.coveredTopics.includes(topic)) {
          this.stateDocument.coveredTopics.push(topic);
        }
      }
    }

    // Track user preferences/constraints
    if (lowerMessage.includes("don't have") || lowerMessage.includes("can't") ||
        lowerMessage.includes("don't want") || lowerMessage.includes("prefer not")) {
      const constraint = userMessage.substring(0, 100);
      if (!this.stateDocument.userPreferences.constraints) {
        this.stateDocument.userPreferences.constraints = [];
      }
      this.stateDocument.userPreferences.constraints.push(constraint);
    }

    // Track important context notes
    const importanceMarkers = ['important', 'significant', 'powerful', 'intense', 'meaningful', 'profound'];
    if (importanceMarkers.some(m => lowerMessage.includes(m))) {
      const note = userMessage.substring(0, 150);
      if (!this.stateDocument.contextNotes.includes(note)) {
        this.stateDocument.contextNotes.push(note);
      }
    }

    // Track sub-phase completion (Phase 1 broad strokes)
    if (this.phase === 'phase1') {
      const broadStrokesComplete = this.phaseExchangeCounts.phase1 > 5 &&
        this._getTotalElementsCount() > 5;
      if (broadStrokesComplete && !this.stateDocument.completedSubPhases.includes('Phase 1: Broad Strokes')) {
        this.stateDocument.completedSubPhases.push('Phase 1: Broad Strokes');
      }
    }

    // Limit array sizes to prevent memory issues
    if (this.stateDocument.askedQuestions.length > 50) {
      this.stateDocument.askedQuestions = this.stateDocument.askedQuestions.slice(-50);
    }
    if (this.stateDocument.extractedElements.length > 100) {
      this.stateDocument.extractedElements = this.stateDocument.extractedElements.slice(-100);
    }
    if (this.stateDocument.contextNotes.length > 20) {
      this.stateDocument.contextNotes = this.stateDocument.contextNotes.slice(-20);
    }
  }

  // ---------------------------------------------------------------------------
  // PHASE SUMMARIES (generated on transition, injected into modeContext)
  // ---------------------------------------------------------------------------

  _generatePhaseSummary(completedPhase) {
    switch (completedPhase) {
      case 'phase1': {
        const gs = this.gatheringState;
        const parts = [];
        if (gs.beings.length > 0) parts.push(`Beings/Entities: ${gs.beings.join(', ')}`);
        if (gs.visuals.length > 0) parts.push(`Visual Elements: ${gs.visuals.join(', ')}`);
        if (gs.sounds.length > 0) parts.push(`Sounds: ${gs.sounds.join(', ')}`);
        if (gs.emotions.length > 0) parts.push(`Emotions: ${gs.emotions.join(', ')}`);
        if (gs.sensations.length > 0) parts.push(`Sensations: ${gs.sensations.join(', ')}`);
        if (gs.insights.length > 0) parts.push(`Insights: ${gs.insights.join(', ')}`);
        parts.push(`Total elements gathered: ${this._getTotalElementsCount()}`);

        this.phaseSummaries.phase1 = `Phase 1 Gathering Summary:\n- ${parts.join('\n- ')}`;
        break;
      }

      case 'phase2': {
        const dynamicsSummary = this.dynamics.map(d => {
          if (d.element && d.association) {
            return `${d.element} → ${d.association}${d.clicked ? ' (clicked)' : ''}`;
          }
          return d.content;
        });
        const connectedCount = this.connectedElements.length;
        const totalCount = this._getTotalElementsCount();

        this.phaseSummaries.phase2 = `Phase 2 Dynamics Summary:\n` +
          `- Dynamics identified: ${this.dynamics.length}\n` +
          `- Elements connected: ${connectedCount}/${totalCount}\n` +
          `- Connections:\n  ${dynamicsSummary.join('\n  ')}`;
        break;
      }

      case 'phase3': {
        this.phaseSummaries.phase3 = `Phase 3 Interpretation Summary:\n` +
          `- Interpretation: ${this.interpretation?.content || 'Not yet articulated'}`;
        break;
      }

      case 'phase4': {
        this.phaseSummaries.phase4 = `Phase 4 Ritual Summary:\n` +
          `- Ritual: ${this.ritual?.content || 'Not yet designed'}`;
        break;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // PHASE GUIDANCE (injected into modeContext for the AI)
  // ---------------------------------------------------------------------------

  _getPhaseGuidance() {
    const totalElements = this._getTotalElementsCount();
    const exchangesInPhase = this.phaseExchangeCounts[this.phase] || 0;

    const guidance = {
      phase1: `GATHERING ELEMENTS (Phase 1). ` +
        `Help them capture everything from their experience. ` +
        `Currently gathered: ${totalElements} elements across ${this._getCategoryCounts()}. ` +
        `${exchangesInPhase < 5
          ? 'Still in early gathering — keep prompting for broad strokes before diving into details.'
          : 'Enough exchanges for depth — check if they have more to share, then prepare to transition.'} ` +
        `Need >=3 elements and >=5 exchanges to advance.`,

      phase2: `ASSOCIATIONS/DYNAMICS (Phase 2 — "What part of me is this?"). ` +
        `Go through each gathered element and connect it to inner dynamics. ` +
        `Elements connected: ${this.connectedElements.length}/${totalElements}. ` +
        `Dynamics found: ${this.dynamics.length}. ` +
        `Need >=3 dynamics and >=50% elements connected to advance.`,

      phase3: `INTERPRETATION (Phase 3 — synthesizing meaning). ` +
        `Help them tie together all the meanings into one unified picture. ` +
        `Interpretation articulated: ${this.interpretation ? 'Yes' : 'Not yet'}. ` +
        `Exchanges in phase: ${exchangesInPhase}. ` +
        `Need interpretation statement and >=3 exchanges to advance.`,

      phase4: `RITUAL (Phase 4 — physical act to honor the experience). ` +
        `Help them design a small, physical, solitary, silent ritual. ` +
        `Ritual designed: ${this.ritual ? 'Yes' : 'Not yet'}. ` +
        `Exchanges in phase: ${exchangesInPhase}. ` +
        `Need ritual designed and >=2 exchanges to complete.`,

      complete: `Session is complete. All four phases have been processed. ` +
        `Summarize the journey and encourage them to perform their ritual.`,
    };

    return guidance[this.phase] || guidance.phase1;
  }

  // ---------------------------------------------------------------------------
  // SESSION PROGRESS (returned to screens via chat() result)
  // ---------------------------------------------------------------------------

  getSessionProgress() {
    const totalElements = this._getTotalElementsCount();

    return {
      phase: this._phaseNumber(),
      phaseLabel: this._getPhaseLabel(),
      exchangeCount: this.exchangeCount,
      gatheringState: {
        emotions: this.gatheringState.emotions.length,
        sensations: this.gatheringState.sensations.length,
        beings: this.gatheringState.beings.length,
        visuals: this.gatheringState.visuals.length,
        sounds: this.gatheringState.sounds.length,
        insights: this.gatheringState.insights.length,
      },
      elementsCount: totalElements,
      dynamicsCount: this.dynamics.length,
      connectedElementsCount: this.connectedElements.length,
      hasInterpretation: this.interpretation !== null,
      hasRitual: this.ritual !== null,
      isComplete: this.phase === 'complete',
    };
  }

  // ---------------------------------------------------------------------------
  // SESSION SUMMARY (for persistence when session ends)
  // ---------------------------------------------------------------------------

  getSessionSummary() {
    return {
      modeId: this.modeId,
      phase: this._phaseNumber(),
      phaseLabel: this._getPhaseLabel(),
      exchangeCount: this.exchangeCount,
      gatheringState: { ...this.gatheringState },
      dynamics: this.dynamics.map(d => ({
        content: d.content,
        element: d.element || null,
        association: d.association || null,
        clicked: d.clicked || false,
      })),
      connectedElements: [...this.connectedElements],
      interpretation: this.interpretation ? { ...this.interpretation } : null,
      ritual: this.ritual ? { ...this.ritual } : null,
      phaseSummaries: { ...this.phaseSummaries },
      stateDocument: {
        coveredTopics: [...this.stateDocument.coveredTopics],
        extractedElements: [...this.stateDocument.extractedElements],
        completedSubPhases: [...this.stateDocument.completedSubPhases],
        contextNotes: [...this.stateDocument.contextNotes],
      },
      phaseHistory: [...this.phaseHistory],
      isComplete: this.phase === 'complete',
    };
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  /** Returns the numeric phase (1-4) for external consumers. */
  _phaseNumber() {
    const map = { phase1: 1, phase2: 2, phase3: 3, phase4: 4, complete: 4 };
    return map[this.phase] || 1;
  }

  _getPhaseLabel() {
    const labels = {
      phase1: 'Gathering Elements',
      phase2: 'Connecting to Inner Dynamics',
      phase3: 'Interpretation',
      phase4: 'Ritual',
      complete: 'Complete',
    };
    return labels[this.phase] || 'Gathering Elements';
  }

  /** Total count of categorized items (not counting general elements to avoid double-counting). */
  _getTotalElementsCount() {
    return (
      this.gatheringState.emotions.length +
      this.gatheringState.sensations.length +
      this.gatheringState.beings.length +
      this.gatheringState.visuals.length +
      this.gatheringState.sounds.length +
      this.gatheringState.insights.length
    );
  }

  /** Returns a short string summarizing category counts. */
  _getCategoryCounts() {
    const gs = this.gatheringState;
    const counts = [];
    if (gs.emotions.length) counts.push(`${gs.emotions.length} emotions`);
    if (gs.sensations.length) counts.push(`${gs.sensations.length} sensations`);
    if (gs.beings.length) counts.push(`${gs.beings.length} beings`);
    if (gs.visuals.length) counts.push(`${gs.visuals.length} visuals`);
    if (gs.sounds.length) counts.push(`${gs.sounds.length} sounds`);
    if (gs.insights.length) counts.push(`${gs.insights.length} insights`);
    return counts.length > 0 ? counts.join(', ') : 'none yet';
  }

  /** Returns a flat array of all gathered items across categories. */
  _getAllGatheredItems() {
    return [
      ...this.gatheringState.emotions,
      ...this.gatheringState.sensations,
      ...this.gatheringState.beings,
      ...this.gatheringState.visuals,
      ...this.gatheringState.sounds,
      ...this.gatheringState.insights,
    ];
  }
}

export default ExperienceMappingModeHandler;
