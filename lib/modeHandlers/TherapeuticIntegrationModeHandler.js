/**
 * Therapeutic Integration Mode Handler
 *
 * Adds therapeutic process intelligence to Huxley's deep integration mode.
 * Tracks Johnson's 4-step framework (Associations, Dynamics, Integration, Ritual),
 * IFS parts that emerge, nervous system shifts, and meaning-making progress.
 *
 * This is the "deep work" mode — longer sessions with richer tracking than
 * the general conversation mode.
 *
 * Phase Flow:
 *   check_in → exploration → integration → closure → complete
 *
 * Phase Gates:
 *   check_in → exploration:     NS state assessed AND >=2 exchanges
 *   exploration → integration:  >=2 themes identified AND >=4 exchanges in phase
 *   integration → closure:      meaning-making detected AND >=3 exchanges in phase
 *   closure → complete:         >=2 exchanges in closure
 */
import BaseModeHandler from './BaseModeHandler';

// Nervous system state detection
const NS_STATE_MARKERS = {
  ventral: [
    'safe', 'calm', 'grounded', 'present', 'connected', 'open',
    'relaxed', 'settled', 'peaceful', 'clear', 'centered',
  ],
  sympathetic: [
    'anxious', 'activated', 'tense', 'racing', 'overwhelmed',
    'agitated', 'restless', 'on edge', 'stressed', 'wired',
  ],
  dorsal: [
    'numb', 'disconnected', 'foggy', 'heavy', 'flat', 'stuck',
    'exhausted', 'frozen', 'empty', 'shut down', 'spaced out',
  ],
};

// IFS parts language
const PARTS_MARKERS = [
  'part of me', 'a part', 'inner critic', 'protector', 'exile',
  'manager', 'firefighter', 'young part', 'child part',
  'voice inside', 'one side of me', 'another side',
  'something in me', 'i feel torn', 'conflicted',
];

// Theme/content categories for psychedelic integration
const THEME_MARKERS = {
  death_rebirth: [
    'death', 'dying', 'rebirth', 'reborn', 'ego death',
    'dissolving', 'letting go completely', 'nothing left',
  ],
  unity: [
    'one', 'oneness', 'unity', 'connected to everything',
    'all is one', 'no separation', 'merged', 'dissolved boundaries',
  ],
  shadow: [
    'shadow', 'dark', 'darkness', 'monster', 'demon', 'evil',
    'terrifying', 'nightmare', 'horror', 'confronted',
  ],
  love: [
    'unconditional love', 'pure love', 'love everywhere',
    'cosmic love', 'heart opening', 'compassion', 'forgiveness',
  ],
  trauma: [
    'trauma', 'childhood', 'abuse', 'neglect', 'wound',
    'memory', 'flashback', 'relived', 'body memory',
  ],
  meaning: [
    'purpose', 'meaning', 'why i\'m here', 'life purpose',
    'calling', 'mission', 'path', 'destiny', 'clarity about',
  ],
  grief: [
    'grief', 'loss', 'mourning', 'missing', 'goodbye',
    'letting go', 'deceased', 'passed away', 'death of',
  ],
  ancestors: [
    'ancestor', 'ancestors', 'lineage', 'generational',
    'grandmother', 'grandfather', 'bloodline', 'heritage',
  ],
};

// Meaning-making / integration markers
const MEANING_MARKERS = [
  'i understand now', 'it makes sense', 'i realize',
  'the message was', 'what it means', 'i see how',
  'connected to my life', 'applies to', 'i can bring this',
  'going forward', 'in my daily life', 'what i learned',
  'the lesson', 'takeaway', 'changed my perspective',
  'i want to remember', 'i need to', 'this showed me',
];

// Somatic awareness
const SOMATIC_MARKERS = [
  'body', 'chest', 'heart', 'stomach', 'gut', 'throat',
  'shoulders', 'tension', 'warmth', 'tingling', 'energy',
  'breathing', 'shaking', 'trembling', 'tears', 'crying',
  'sensation', 'felt sense', 'somatic',
];

class TherapeuticIntegrationModeHandler extends BaseModeHandler {
  constructor() {
    super('therapeutic_integration');
  }

  reset() {
    super.reset();
    this.phase = 'check_in';
    this.phaseExchangeCounts = { check_in: 0, exploration: 0, integration: 0, closure: 0 };

    // NS state tracking across the session
    this.nsStateHistory = [];         // [{ state, exchange }]
    this.currentNSState = null;

    // Parts that emerge
    this.partsIdentified = [];        // [{ name, role, context }]

    // Themes from the experience
    this.themes = new Set();
    this.themeCategories = new Set();

    // Somatic awareness
    this.somaticAwareness = [];

    // Integration / meaning-making
    this.meaningInsights = [];
    this.meaningMakingDetected = false;

    this.phaseHistory = [];
  }

  // ---------------------------------------------------------------------------
  // CONTEXT FOR PROMPT
  // ---------------------------------------------------------------------------

  getModeContext() {
    return {
      sessionPhase: this.phase,
      currentNSState: this.currentNSState
        ? { state: this.currentNSState, label: this._nsLabel(this.currentNSState) }
        : null,
      nsStateHistory: this.nsStateHistory.slice(-5),
      partsIdentified: this.partsIdentified.map(p => ({
        name: p.name,
        role: p.role,
        context: p.context,
      })),
      themes: [...this.themeCategories],
      specificThemes: [...this.themes].slice(-8),
      somaticAwareness: this.somaticAwareness.slice(-5),
      meaningInsights: this.meaningInsights.slice(-3),
      phaseGuidance: this._getPhaseGuidance(),
      progressMetrics: {
        exchangesInPhase: this.phaseExchangeCounts[this.phase] || 0,
        themesCount: this.themeCategories.size,
        partsCount: this.partsIdentified.length,
        hasMeaningMaking: this.meaningMakingDetected,
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

      // Detect NS state
      this._detectNSState(lower);

      // Detect parts language
      this._detectParts(lower);

      // Detect themes
      this._detectThemes(lower);

      // Detect somatic awareness
      this._detectSomatic(lower);

      // Detect meaning-making
      this._detectMeaning(lower);
    }

    // Merge therapeuticData
    if (therapeuticData) {
      if (therapeuticData.nervousSystemState) {
        const state = therapeuticData.nervousSystemState.toLowerCase();
        if (NS_STATE_MARKERS[state]) {
          this.currentNSState = state;
          this.nsStateHistory.push({ state, exchange: this.exchangeCount });
        }
      }
      if (therapeuticData.parts) {
        for (const part of therapeuticData.parts) {
          this._addPart(part);
        }
      }
      if (therapeuticData.themes) {
        for (const theme of therapeuticData.themes) {
          this.themes.add(theme);
        }
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
    const exchangesInPhase = this.phaseExchangeCounts[this.phase] || 0;

    switch (this.phase) {
      case 'check_in':
        // Advance when NS state assessed and enough check-in
        if (this.currentNSState && exchangesInPhase >= 2) {
          this.phase = 'exploration';
        }
        break;

      case 'exploration':
        // Advance when themes are emerging and sufficient exploration
        if (this.themeCategories.size >= 2 && exchangesInPhase >= 4) {
          this.phase = 'integration';
        }
        break;

      case 'integration':
        // Advance when meaning-making is happening
        if (this.meaningMakingDetected && exchangesInPhase >= 3) {
          this.phase = 'closure';
        }
        break;

      case 'closure':
        // Advance after enough closure exchanges
        if (exchangesInPhase >= 2) {
          this.phase = 'complete';
        }
        break;

      // complete is terminal
    }
  }

  // ---------------------------------------------------------------------------
  // DETECTION
  // ---------------------------------------------------------------------------

  _detectNSState(lower) {
    const scores = {};
    for (const [state, markers] of Object.entries(NS_STATE_MARKERS)) {
      scores[state] = markers.filter(m => lower.includes(m)).length;
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
      // Track shift if state changed
      if (this.currentNSState && this.currentNSState !== best) {
        this.nsStateHistory.push({ state: best, exchange: this.exchangeCount, shift: true });
      } else if (!this.currentNSState) {
        this.nsStateHistory.push({ state: best, exchange: this.exchangeCount });
      }
      this.currentNSState = best;
    }
  }

  _detectParts(lower) {
    for (const marker of PARTS_MARKERS) {
      if (lower.includes(marker)) {
        // Extract surrounding context
        const sentences = lower.split(/[.!?]+/);
        const match = sentences.find(s => s.includes(marker));
        if (match) {
          this._addPart({
            name: marker,
            role: this._guessPartRole(lower),
            context: match.trim().substring(0, 100),
          });
        }
        break; // One part detection per message is enough
      }
    }
  }

  _guessPartRole(lower) {
    if (lower.includes('protect') || lower.includes('guard') || lower.includes('control')) return 'protector';
    if (lower.includes('young') || lower.includes('child') || lower.includes('vulnerable')) return 'exile';
    if (lower.includes('critic') || lower.includes('judge') || lower.includes('should')) return 'manager';
    if (lower.includes('numb') || lower.includes('escape') || lower.includes('distract')) return 'firefighter';
    return 'unknown';
  }

  _addPart(part) {
    if (!part?.name) return;
    const existingIdx = this.partsIdentified.findIndex(
      p => p.name.toLowerCase() === part.name.toLowerCase()
    );
    if (existingIdx >= 0) {
      this.partsIdentified[existingIdx] = {
        ...this.partsIdentified[existingIdx],
        ...Object.fromEntries(
          Object.entries(part).filter(([_, v]) => v != null && v !== '')
        ),
      };
    } else {
      this.partsIdentified.push({ ...part });
    }
  }

  _detectThemes(lower) {
    for (const [category, markers] of Object.entries(THEME_MARKERS)) {
      for (const marker of markers) {
        if (lower.includes(marker)) {
          this.themeCategories.add(category);
          this.themes.add(marker);
        }
      }
    }
  }

  _detectSomatic(lower) {
    for (const marker of SOMATIC_MARKERS) {
      if (lower.includes(marker) && !this.somaticAwareness.includes(marker)) {
        this.somaticAwareness.push(marker);
      }
    }
  }

  _detectMeaning(lower) {
    for (const marker of MEANING_MARKERS) {
      if (lower.includes(marker)) {
        this.meaningMakingDetected = true;
        if (!this.meaningInsights.includes(marker)) {
          this.meaningInsights.push(marker);
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  _nsLabel(state) {
    const labels = {
      ventral: 'Ventral Vagal (Safe & Social)',
      sympathetic: 'Sympathetic (Fight/Flight)',
      dorsal: 'Dorsal Vagal (Shutdown/Freeze)',
    };
    return labels[state] || state;
  }

  _getPhaseGuidance() {
    const exchangesInPhase = this.phaseExchangeCounts[this.phase] || 0;
    const themesList = [...this.themeCategories].join(', ') || 'none yet';

    const guidance = {
      check_in: `Start by attuning to their nervous system state. "How are you arriving today?" or "What's present in your body right now?" Track their state before diving into content. ${this.currentNSState ? `Detected: ${this._nsLabel(this.currentNSState)}. Acknowledge this before moving on.` : 'No state detected yet — keep exploring.'}`,

      exploration: `Explore the experience and its themes. Follow their lead. Ask about specific moments, images, feelings, beings encountered. Use multiple lenses: IFS parts, polyvagal state, Johnson's associations, somatic awareness. Themes so far: ${themesList}. Parts identified: ${this.partsIdentified.map(p => p.name).join(', ') || 'none yet'}. ${exchangesInPhase < 4 ? 'Still in early exploration — don\'t rush.' : 'Good depth — begin connecting themes when ready.'}`,

      integration: `Help them make meaning. Connect experience themes to daily life. "How does this relate to what you're going through?" "What did your system learn?" Themes: ${themesList}. ${this.meaningMakingDetected ? 'User is making meaning — support and deepen it.' : 'Help them see the connections between experience and life.'} ${this.partsIdentified.length > 0 ? `Parts to reference: ${this.partsIdentified.map(p => p.name).join(', ')}.` : ''}`,

      closure: `Session is winding down. Summarize what was explored and integrated. Acknowledge their nervous system state now vs start. ${this.nsStateHistory.length > 1 ? 'Note any NS state shifts during the session.' : ''} Offer one practice or way to continue integrating. Thank them for their courage. Keep it warm and contained.`,

      complete: 'Session complete.',
    };
    return guidance[this.phase] || guidance.check_in;
  }

  // ---------------------------------------------------------------------------
  // SESSION PROGRESS
  // ---------------------------------------------------------------------------

  getSessionProgress() {
    const phaseLabels = {
      check_in: 'Checking In',
      exploration: 'Exploring the Experience',
      integration: 'Making Meaning',
      closure: 'Closing',
      complete: 'Complete',
    };

    return {
      phase: this.phase,
      phaseLabel: phaseLabels[this.phase] || this.phase,
      exchangeCount: this.exchangeCount,
      currentNSState: this.currentNSState,
      themesCount: this.themeCategories.size,
      partsCount: this.partsIdentified.length,
      meaningMakingDetected: this.meaningMakingDetected,
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
      nsStateHistory: [...this.nsStateHistory],
      finalNSState: this.currentNSState,
      partsIdentified: this.partsIdentified.map(p => ({ ...p })),
      themes: [...this.themes],
      themeCategories: [...this.themeCategories],
      somaticAwareness: [...this.somaticAwareness],
      meaningInsights: [...this.meaningInsights],
      phaseHistory: this.phaseHistory,
      completedPhases: [...new Set(this.phaseHistory.map(h => h.from))],
    };
  }
}

export default TherapeuticIntegrationModeHandler;
