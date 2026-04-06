/**
 * Core Beliefs Exploration Mode Handler
 *
 * Adds therapeutic process intelligence to Huxley's core beliefs mode.
 * Tracks assessment scores across 10 belief domains, prioritizes
 * lowest-scoring domains for discussion, and manages phase progression
 * through a structured exploration process.
 *
 * This handler does NOT:
 * - Make API calls (Huxley does that)
 * - Build prompts (Huxley does that, using getModeContext())
 * - Persist data (Huxley's therapeuticData pipeline does that)
 *
 * Phase Flow:
 *   understanding → origins → questioning → alternatives → practices
 *
 * Phase Gates:
 *   understanding → origins:      at least 2 domains discussed
 *   origins → questioning:        at least 1 domain's origin explored
 *   questioning → alternatives:   at least 1 belief actively questioned
 *   alternatives → practices:     at least 1 alternative belief generated
 */
import BaseModeHandler from './BaseModeHandler';

// The 10 belief domains with their labels and core beliefs
const BELIEF_DOMAINS = {
  value:      { label: 'Value (Worthiness)',          coreBelief: 'I am worthy' },
  security:   { label: 'Security (Safety)',           coreBelief: 'I am safe' },
  performance:{ label: 'Performance (Competence)',    coreBelief: 'I am competent' },
  control:    { label: 'Control (Power)',             coreBelief: 'I am powerful' },
  love:       { label: 'Love (Nurturance)',           coreBelief: 'I am loved' },
  autonomy:   { label: 'Autonomy (Independence)',     coreBelief: 'I am autonomous' },
  justice:    { label: 'Justice (Fairness)',          coreBelief: 'I am treated justly' },
  belonging:  { label: 'Belonging (Connection)',      coreBelief: 'I belong' },
  others:     { label: 'Others (Trust)',              coreBelief: 'People are good' },
  standards:  { label: 'Standards (Self-Compassion)', coreBelief: 'My standards are reasonable' },
};

// Keywords that suggest a domain is being discussed
const DOMAIN_KEYWORDS = {
  value:       ['worth', 'worthy', 'deserv', 'enough', 'value', 'good enough'],
  security:    ['safe', 'safety', 'danger', 'threat', 'protect', 'secure', 'trust the world'],
  performance: ['competen', 'capable', 'succeed', 'fail', 'perform', 'ability', 'achieve'],
  control:     ['control', 'power', 'helpless', 'influence', 'agency', 'choice'],
  love:        ['loved', 'lovable', 'nurtur', 'care', 'affection', 'cherish', 'wanted'],
  autonomy:    ['autonom', 'independen', 'dependen', 'freedom', 'self-relian', 'on my own'],
  justice:     ['fair', 'just', 'injustice', 'unfair', 'equit', 'treated'],
  belonging:   ['belong', 'connect', 'fit in', 'outsider', 'included', 'community'],
  others:      ['trust', 'people are', 'others are', 'reliable', 'betray', 'depend on'],
  standards:   ['standard', 'perfect', 'compassion', 'self-critic', 'harsh', 'expectation', 'good enough for me'],
};

// Markers that suggest origin exploration
const ORIGIN_MARKERS = [
  'grew up', 'childhood', 'parents', 'family', 'learned',
  'remember', 'when i was', 'young', 'mother', 'father',
  'school', 'teacher', 'trauma', 'attachment', 'culture',
  'always been', 'as a kid', 'raised', 'taught me',
];

// Markers that suggest active questioning of a belief
const QUESTIONING_MARKERS = [
  'maybe not', 'not always true', 'wonder if', 'is it really',
  'evidence', 'exception', 'sometimes', 'not sure anymore',
  'starting to see', 'question', 'rethink', 'reconsider',
  'challenge', 'but what if', 'could it be', 'perhaps',
];

// Markers that suggest an alternative belief is forming
const ALTERNATIVE_MARKERS = [
  'instead i', 'what if i', 'maybe i am', 'i could believe',
  'a healthier', 'new belief', 'alternative', 'i want to believe',
  'more accurate', 'actually i', 'the truth is', 'more balanced',
  'i can', 'i deserve', 'i am enough', 'it\'s okay to',
];

class CoreBeliefsModeHandler extends BaseModeHandler {
  constructor() {
    super('core_beliefs');
  }

  reset() {
    super.reset();
    this.phase = 'understanding';
    this.assessmentScores = null;         // { domain: score } from setAssessmentScores()
    this.domainsDiscussed = new Set();    // Domain keys that have come up
    this.domainDepth = {};                // { domain: number } how many exchanges per domain
    this.originsExplored = new Set();     // Domains whose origins have been discussed
    this.beliefsQuestioned = new Set();   // Domains where belief has been questioned
    this.alternativeBeliefs = {};         // { domain: string[] } new beliefs generated
    this.practicesSuggested = [];         // Practices recommended during session
    this.phaseHistory = [];               // Track phase transitions
  }

  // ---------------------------------------------------------------------------
  // ASSESSMENT SCORES (called by screen before starting conversation)
  // ---------------------------------------------------------------------------

  /**
   * Set initial assessment scores from the Core Beliefs Inventory.
   * @param {object} scores - e.g. { value: 3.2, security: 4.1, ... }
   */
  setAssessmentScores(scores) {
    if (!scores || typeof scores !== 'object') return;
    this.assessmentScores = { ...scores };
  }

  // ---------------------------------------------------------------------------
  // CONTEXT FOR PROMPT (injected by HuxleyService)
  // ---------------------------------------------------------------------------

  getModeContext() {
    const lowestDomains = this._getLowestDomains(3);
    const highestDomains = this._getHighestDomains(3);

    return {
      sessionPhase: this.phase,
      assessmentScores: this.assessmentScores,
      domainsDiscussed: [...this.domainsDiscussed].map(d => ({
        key: d,
        label: BELIEF_DOMAINS[d]?.label || d,
        score: this.assessmentScores?.[d] ?? null,
        depth: this.domainDepth[d] || 0,
        originExplored: this.originsExplored.has(d),
        beliefQuestioned: this.beliefsQuestioned.has(d),
        alternativeBeliefs: this.alternativeBeliefs[d] || [],
      })),
      lowestDomains: lowestDomains.map(d => ({
        key: d.key,
        label: BELIEF_DOMAINS[d.key]?.label || d.key,
        score: d.score,
        coreBelief: BELIEF_DOMAINS[d.key]?.coreBelief || '',
      })),
      highestDomains: highestDomains.map(d => ({
        key: d.key,
        label: BELIEF_DOMAINS[d.key]?.label || d.key,
        score: d.score,
      })),
      prioritizeDomains: lowestDomains
        .filter(d => !this.domainsDiscussed.has(d.key))
        .map(d => BELIEF_DOMAINS[d.key]?.label || d.key),
      phaseGuidance: this._getPhaseGuidance(),
    };
  }

  // ---------------------------------------------------------------------------
  // RESPONSE PROCESSING (called by HuxleyService after each exchange)
  // ---------------------------------------------------------------------------

  processResponse(userMessage, aiResponse, therapeuticData) {
    this.exchangeCount++;

    // 1. Detect which domains are being discussed
    if (userMessage) {
      this._detectDomainsDiscussed(userMessage);
      this._detectOriginExploration(userMessage);
      this._detectQuestioning(userMessage);
      this._detectAlternativeBeliefs(userMessage);
    }

    // Also scan AI response for domain references and alternatives
    if (aiResponse) {
      this._detectDomainsDiscussed(aiResponse);
      this._detectAlternativeBeliefs(aiResponse);
      this._detectPractices(aiResponse);
    }

    // 2. Extract from therapeuticData if available
    if (therapeuticData) {
      if (therapeuticData.domain) {
        this._markDomainDiscussed(therapeuticData.domain);
      }
      if (therapeuticData.originDomain) {
        this.originsExplored.add(therapeuticData.originDomain);
      }
      if (therapeuticData.questionedDomain) {
        this.beliefsQuestioned.add(therapeuticData.questionedDomain);
      }
      if (therapeuticData.alternativeBelief && therapeuticData.domain) {
        this._addAlternativeBelief(therapeuticData.domain, therapeuticData.alternativeBelief);
      }
      if (therapeuticData.practice) {
        this.practicesSuggested.push(therapeuticData.practice);
      }
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
      case 'understanding':
        // Gate: at least 2 domains discussed
        if (this.domainsDiscussed.size >= 2) {
          this.phase = 'origins';
        }
        break;

      case 'origins':
        // Gate: at least 1 domain's origin explored
        if (this.originsExplored.size >= 1) {
          this.phase = 'questioning';
        }
        break;

      case 'questioning':
        // Gate: at least 1 belief actively questioned
        if (this.beliefsQuestioned.size >= 1) {
          this.phase = 'alternatives';
        }
        break;

      case 'alternatives':
        // Gate: at least 1 alternative belief generated
        if (Object.keys(this.alternativeBeliefs).length >= 1) {
          this.phase = 'practices';
        }
        break;

      // practices is terminal — no further advancement
    }
  }

  // ---------------------------------------------------------------------------
  // DOMAIN DETECTION
  // ---------------------------------------------------------------------------

  _detectDomainsDiscussed(text) {
    const lower = text.toLowerCase();
    for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
      if (keywords.some(k => lower.includes(k))) {
        this._markDomainDiscussed(domain);
      }
    }
  }

  _markDomainDiscussed(domain) {
    if (!BELIEF_DOMAINS[domain]) return;
    this.domainsDiscussed.add(domain);
    this.domainDepth[domain] = (this.domainDepth[domain] || 0) + 1;
  }

  _detectOriginExploration(text) {
    const lower = text.toLowerCase();
    const hasOriginLanguage = ORIGIN_MARKERS.some(m => lower.includes(m));
    if (!hasOriginLanguage) return;

    // Associate with whichever discussed domain appears in the text
    for (const domain of this.domainsDiscussed) {
      const keywords = DOMAIN_KEYWORDS[domain] || [];
      if (keywords.some(k => lower.includes(k))) {
        this.originsExplored.add(domain);
      }
    }

    // If origin language present but no specific domain detected,
    // attribute to the most recently discussed domain
    if (this.originsExplored.size === 0 && this.domainsDiscussed.size > 0) {
      const lastDomain = [...this.domainsDiscussed].pop();
      this.originsExplored.add(lastDomain);
    }
  }

  _detectQuestioning(text) {
    const lower = text.toLowerCase();
    const hasQuestioningLanguage = QUESTIONING_MARKERS.some(m => lower.includes(m));
    if (!hasQuestioningLanguage) return;

    // Associate with whichever discussed domain appears in the text
    for (const domain of this.domainsDiscussed) {
      const keywords = DOMAIN_KEYWORDS[domain] || [];
      if (keywords.some(k => lower.includes(k))) {
        this.beliefsQuestioned.add(domain);
      }
    }

    // Fallback to most recently discussed domain
    if (this.beliefsQuestioned.size === 0 && this.domainsDiscussed.size > 0) {
      const lastDomain = [...this.domainsDiscussed].pop();
      this.beliefsQuestioned.add(lastDomain);
    }
  }

  _detectAlternativeBeliefs(text) {
    const lower = text.toLowerCase();
    const hasAlternativeLanguage = ALTERNATIVE_MARKERS.some(m => lower.includes(m));
    if (!hasAlternativeLanguage) return;

    // Find which domain is referenced and store the alternative
    for (const domain of this.domainsDiscussed) {
      const keywords = DOMAIN_KEYWORDS[domain] || [];
      if (keywords.some(k => lower.includes(k))) {
        // Extract a rough alternative belief (the sentence containing the marker)
        const sentences = text.split(/[.!?]+/).filter(s => s.trim());
        for (const sentence of sentences) {
          const sentLower = sentence.toLowerCase();
          if (ALTERNATIVE_MARKERS.some(m => sentLower.includes(m))) {
            this._addAlternativeBelief(domain, sentence.trim());
            break;
          }
        }
      }
    }
  }

  _addAlternativeBelief(domain, belief) {
    if (!belief || !domain) return;
    if (!this.alternativeBeliefs[domain]) {
      this.alternativeBeliefs[domain] = [];
    }
    // Avoid duplicates
    if (!this.alternativeBeliefs[domain].includes(belief)) {
      this.alternativeBeliefs[domain].push(belief);
    }
  }

  _detectPractices(text) {
    const lower = text.toLowerCase();
    const practiceKeywords = [
      'try this', 'practice', 'exercise', 'experiment',
      'notice when', 'each time you', 'between sessions',
    ];
    if (practiceKeywords.some(k => lower.includes(k))) {
      // Extract the sentence as a practice suggestion
      const sentences = text.split(/[.!?]+/).filter(s => s.trim());
      for (const sentence of sentences) {
        const sentLower = sentence.toLowerCase();
        if (practiceKeywords.some(k => sentLower.includes(k))) {
          this.practicesSuggested.push(sentence.trim());
          break;
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // DOMAIN SCORING HELPERS
  // ---------------------------------------------------------------------------

  _getLowestDomains(count) {
    if (!this.assessmentScores) return [];
    return Object.entries(this.assessmentScores)
      .map(([key, score]) => ({ key, score }))
      .sort((a, b) => a.score - b.score)
      .slice(0, count);
  }

  _getHighestDomains(count) {
    if (!this.assessmentScores) return [];
    return Object.entries(this.assessmentScores)
      .map(([key, score]) => ({ key, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }

  // ---------------------------------------------------------------------------
  // PHASE GUIDANCE (injected into modeContext for the AI)
  // ---------------------------------------------------------------------------

  _getPhaseGuidance() {
    const lowestDomains = this._getLowestDomains(3);
    const lowestLabels = lowestDomains
      .map(d => BELIEF_DOMAINS[d.key]?.label || d.key)
      .join(', ');
    const undiscussedLow = lowestDomains
      .filter(d => !this.domainsDiscussed.has(d.key))
      .map(d => BELIEF_DOMAINS[d.key]?.label || d.key)
      .join(', ');

    const guidance = {
      understanding: `Help the user understand their assessment results. Focus on lowest-scoring domains first: ${lowestLabels || 'not yet available'}. Normalize: low scores are protective adaptations, not failures. High scores are strengths to build on.${undiscussedLow ? ` Prioritize discussing: ${undiscussedLow}.` : ' At least 2 domains have been touched on — ready to explore origins soon.'}`,

      origins: `Explore where these beliefs came from. Ask about family, culture, early experiences, attachment patterns. Be curious: "Do you have a sense of where this belief started?" Focus on domains already discussed: ${[...this.domainsDiscussed].map(d => BELIEF_DOMAINS[d]?.label || d).join(', ') || 'none yet'}.`,

      questioning: `Use Socratic questioning to gently challenge limiting beliefs. "Is this belief always true?" "Can you think of exceptions?" "Who taught you this — do you still agree with them?" Be gentle — do not invalidate their experience, question the belief's current accuracy.`,

      alternatives: `Help craft alternative, more balanced beliefs. NOT toxic positivity ("I'm amazing!") but realistic reframes ("I have worth even when I make mistakes"). The new belief should feel achievable, not forced. Connect to their strengths (high-scoring domains) as evidence.`,

      practices: `Suggest concrete integration practices: awareness exercises, evidence-gathering journals, compassionate self-talk, behavioral experiments, somatic awareness, parts work with the believing part, psychedelic integration reflection. Tailor to domains explored this session.`,
    };

    return guidance[this.phase] || guidance.understanding;
  }

  // ---------------------------------------------------------------------------
  // SESSION PROGRESS (returned to screens via chat() result)
  // ---------------------------------------------------------------------------

  getSessionProgress() {
    const lowestDomains = this._getLowestDomains(3);
    const phaseLabels = {
      understanding: 'Understanding Scores',
      origins: 'Exploring Origins',
      questioning: 'Questioning Beliefs',
      alternatives: 'Finding Alternatives',
      practices: 'Integration Practices',
    };

    return {
      phase: this.phase,
      phaseLabel: phaseLabels[this.phase] || this.phase,
      exchangeCount: this.exchangeCount,
      domainsExplored: this.domainsDiscussed.size,
      alternativeBeliefs: Object.keys(this.alternativeBeliefs).length,
      lowestDomains: lowestDomains.map(d => ({
        key: d.key,
        label: BELIEF_DOMAINS[d.key]?.label || d.key,
        score: d.score,
      })),
      isComplete: this.phase === 'practices' && this.practicesSuggested.length > 0,
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
      assessmentScores: this.assessmentScores,
      domainsExplored: [...this.domainsDiscussed].map(d => ({
        key: d,
        label: BELIEF_DOMAINS[d]?.label || d,
        score: this.assessmentScores?.[d] ?? null,
        depth: this.domainDepth[d] || 0,
        originExplored: this.originsExplored.has(d),
        beliefQuestioned: this.beliefsQuestioned.has(d),
        alternativeBeliefs: this.alternativeBeliefs[d] || [],
      })),
      alternativeBeliefs: { ...this.alternativeBeliefs },
      practicesSuggested: [...this.practicesSuggested],
      phaseHistory: this.phaseHistory,
      completedPhases: [...new Set(this.phaseHistory.map(h => h.from))],
    };
  }
}

export default CoreBeliefsModeHandler;
