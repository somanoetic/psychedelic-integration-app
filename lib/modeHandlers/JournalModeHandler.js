/**
 * Journal Mode Handler
 *
 * Adds therapeutic process intelligence to Huxley's daily journal mode.
 * Tracks themes, emotional tone, therapeutic skills used by the AI,
 * and manages the journaling → discussion → suggestions flow.
 *
 * Phase Flow:
 *   journaling → discussion → suggestions → complete
 *
 * Phase Gates:
 *   journaling → discussion:   >=3 exchanges AND user signals readiness or depth reached
 *   discussion → suggestions:  >=2 exchanges in discussion AND insights emerging
 *   suggestions → complete:    >=1 suggestion offered
 */
import BaseModeHandler from './BaseModeHandler';

// Emotional tone detection
const POSITIVE_MARKERS = [
  'grateful', 'gratitude', 'happy', 'joy', 'joyful', 'proud',
  'peaceful', 'calm', 'hopeful', 'excited', 'content', 'love',
  'accomplished', 'connected', 'inspired', 'relieved', 'free',
  'clarity', 'clear', 'growth', 'progress', 'better', 'stronger',
];

const DIFFICULT_MARKERS = [
  'sad', 'angry', 'frustrated', 'anxious', 'scared', 'lonely',
  'overwhelmed', 'stuck', 'lost', 'confused', 'hurt', 'shame',
  'guilt', 'grief', 'hopeless', 'exhausted', 'numb', 'empty',
  'worried', 'stressed', 'disappointed', 'struggling', 'pain',
  'afraid', 'trapped', 'helpless', 'broken', 'defeated',
];

// Theme detection keywords
const THEME_CATEGORIES = {
  relationships: [
    'partner', 'spouse', 'friend', 'family', 'parent', 'child',
    'mother', 'father', 'sister', 'brother', 'relationship',
    'connection', 'conflict', 'boundary', 'boundaries', 'trust',
  ],
  selfIdentity: [
    'who i am', 'identity', 'self', 'worth', 'value', 'enough',
    'purpose', 'meaning', 'role', 'authentic', 'mask', 'persona',
  ],
  work: [
    'work', 'job', 'career', 'boss', 'colleague', 'deadline',
    'burnout', 'promotion', 'fired', 'quit', 'passion', 'calling',
  ],
  health: [
    'body', 'health', 'sleep', 'energy', 'exercise', 'eating',
    'medication', 'pain', 'chronic', 'diagnosis', 'recovery',
  ],
  spirituality: [
    'spiritual', 'soul', 'divine', 'universe', 'meditation',
    'prayer', 'sacred', 'ceremony', 'journey', 'awakening',
    'psychedelic', 'experience', 'integration', 'transcendent',
  ],
  trauma: [
    'trauma', 'ptsd', 'flashback', 'trigger', 'abuse', 'neglect',
    'wound', 'healing', 'survivor', 'childhood', 'memory',
  ],
  growth: [
    'learning', 'growing', 'change', 'transform', 'evolving',
    'insight', 'realization', 'awareness', 'breakthrough', 'shift',
    'letting go', 'acceptance', 'forgiveness', 'compassion',
  ],
};

// Readiness to shift from journaling to discussion
const DISCUSSION_READINESS_MARKERS = [
  'what do you think', 'any thoughts', 'help me understand',
  'i notice a pattern', 'i keep coming back to', 'i\'m not sure what',
  'does that make sense', 'what does this mean', 'i wonder',
  'can you help', 'i\'d like to explore', 'tell me more about',
  'i think i\'m done', 'that\'s all', 'that\'s what\'s on my mind',
];

// Insight markers (user having realizations)
const INSIGHT_MARKERS = [
  'i realize', 'i see now', 'it makes sense', 'i never thought',
  'that\'s interesting', 'i hadn\'t considered', 'oh', 'aha',
  'i think the pattern is', 'it\'s connected to', 'i understand',
  'that resonates', 'you\'re right', 'exactly', 'yes that\'s it',
];

class JournalModeHandler extends BaseModeHandler {
  constructor() {
    super('journal');
  }

  reset() {
    super.reset();
    this.phase = 'journaling';
    this.emotionalTone = { positive: 0, difficult: 0 };
    this.themes = new Set();
    this.themeCategories = new Set();
    this.insights = [];
    this.wordCount = 0;           // Approximate user word count
    this.discussionReadiness = false;
    this.suggestionOffered = false;
    this.phaseHistory = [];
  }

  // ---------------------------------------------------------------------------
  // CONTEXT FOR PROMPT
  // ---------------------------------------------------------------------------

  getModeContext() {
    const toneLabel = this._getToneLabel();
    const themesList = [...this.themeCategories];

    return {
      sessionPhase: this.phase,
      emotionalTone: toneLabel,
      emotionalBalance: { ...this.emotionalTone },
      themesIdentified: themesList,
      specificThemes: [...this.themes].slice(-10),
      insightsCount: this.insights.length,
      userWordCount: this.wordCount,
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

      // Track word count
      this.wordCount += userMessage.split(/\s+/).length;

      // Detect emotional tone
      this._detectEmotionalTone(lower);

      // Detect themes
      this._detectThemes(lower);

      // Detect discussion readiness
      this._detectDiscussionReadiness(lower);

      // Detect insights
      this._detectInsights(lower);
    }

    // Process AI response for insights and suggestions
    if (aiResponse) {
      const aiLower = aiResponse.toLowerCase();
      if (aiLower.includes('try this') || aiLower.includes('you might') ||
          aiLower.includes('one practice') || aiLower.includes('suggestion') ||
          aiLower.includes('exercise')) {
        this.suggestionOffered = true;
      }
    }

    // Merge therapeuticData
    if (therapeuticData?.themes) {
      for (const theme of therapeuticData.themes) {
        this.themes.add(theme);
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
      case 'journaling':
        // Advance when enough exchanges AND user signals readiness or depth
        if (this.exchangeCount >= 3 && (this.discussionReadiness || this.wordCount >= 200)) {
          this.phase = 'discussion';
        }
        break;

      case 'discussion': {
        // Advance when insights are emerging and enough discussion happened
        const exchangesInDiscussion = this.exchangeCount -
          (this.phaseHistory.find(h => h.to === 'discussion')?.atExchange || 0);
        if (exchangesInDiscussion >= 2 && this.insights.length >= 1) {
          this.phase = 'suggestions';
        }
        break;
      }

      case 'suggestions':
        // Advance when at least one suggestion has been offered
        if (this.suggestionOffered) {
          this.phase = 'complete';
        }
        break;

      // complete is terminal
    }
  }

  // ---------------------------------------------------------------------------
  // DETECTION
  // ---------------------------------------------------------------------------

  _detectEmotionalTone(lower) {
    const posMatches = POSITIVE_MARKERS.filter(m => lower.includes(m)).length;
    const diffMatches = DIFFICULT_MARKERS.filter(m => lower.includes(m)).length;
    this.emotionalTone.positive += posMatches;
    this.emotionalTone.difficult += diffMatches;
  }

  _detectThemes(lower) {
    for (const [category, keywords] of Object.entries(THEME_CATEGORIES)) {
      for (const keyword of keywords) {
        if (lower.includes(keyword)) {
          this.themeCategories.add(category);
          this.themes.add(keyword);
        }
      }
    }
  }

  _detectDiscussionReadiness(lower) {
    if (DISCUSSION_READINESS_MARKERS.some(m => lower.includes(m))) {
      this.discussionReadiness = true;
    }
  }

  _detectInsights(lower) {
    for (const marker of INSIGHT_MARKERS) {
      if (lower.includes(marker) && !this.insights.includes(marker)) {
        this.insights.push(marker);
      }
    }
  }

  _getToneLabel() {
    const { positive, difficult } = this.emotionalTone;
    if (positive === 0 && difficult === 0) return 'neutral';
    if (positive > difficult * 2) return 'positive';
    if (difficult > positive * 2) return 'heavy';
    if (positive > difficult) return 'mostly positive';
    if (difficult > positive) return 'mostly difficult';
    return 'mixed';
  }

  // ---------------------------------------------------------------------------
  // PHASE GUIDANCE
  // ---------------------------------------------------------------------------

  _getPhaseGuidance() {
    const tone = this._getToneLabel();
    const themesList = [...this.themeCategories].join(', ') || 'none yet';

    const guidance = {
      journaling: `User is journaling freely. Emotional tone: ${tone}. Themes: ${themesList}. Word count: ${this.wordCount}. Keep responses brief (1-2 sentences). Reflect back, ask gentle follow-ups. Let THEM lead. Don't analyze yet. ${this.exchangeCount < 3 ? 'Still early — give them space to express.' : this.discussionReadiness ? 'User seems ready for discussion — you can begin reflecting patterns.' : 'They\'ve written a good amount. When they seem ready, gently offer to reflect on what you\'re noticing.'}`,
      discussion: `Shift to compassionate reflection. Tone: ${tone}. Themes: ${themesList}. Offer observations about patterns you notice. Help them see connections. Use their specific words and details. ${this.insights.length > 0 ? 'User is having insights — build on them.' : 'Help them see what might be underneath the surface.'}`,
      suggestions: `Offer practical, tailored suggestions based on what emerged. Tone: ${tone}. Themes: ${themesList}. Match the suggestions to their specific situation — not generic advice. One or two specific practices. ${tone === 'heavy' || tone === 'mostly difficult' ? 'They\'re processing something hard — suggest gentle, self-compassion practices.' : 'Build on their positive energy with growth-oriented practices.'}`,
      complete: `Journal session is wrapping up. Acknowledge their reflective work. Keep the closing brief and warm.`,
    };
    return guidance[this.phase] || guidance.journaling;
  }

  // ---------------------------------------------------------------------------
  // SESSION PROGRESS
  // ---------------------------------------------------------------------------

  getSessionProgress() {
    const phaseLabels = {
      journaling: 'Journaling',
      discussion: 'Reflecting Together',
      suggestions: 'Practices & Next Steps',
      complete: 'Complete',
    };

    return {
      phase: this.phase,
      phaseLabel: phaseLabels[this.phase] || this.phase,
      exchangeCount: this.exchangeCount,
      emotionalTone: this._getToneLabel(),
      themesCount: this.themeCategories.size,
      wordCount: this.wordCount,
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
      emotionalTone: this._getToneLabel(),
      emotionalBalance: { ...this.emotionalTone },
      themes: [...this.themes],
      themeCategories: [...this.themeCategories],
      insights: [...this.insights],
      wordCount: this.wordCount,
      phaseHistory: this.phaseHistory,
    };
  }
}

export default JournalModeHandler;
