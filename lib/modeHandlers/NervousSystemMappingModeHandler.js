/**
 * Nervous System Mapping Mode Handler
 *
 * Implements Deb Dana's Autonomic Mapping exercise from
 * "The Polyvagal Theory in Therapy" (Norton, 2018).
 *
 * Protocol order (always end in ventral):
 *   intro → [home away from home] → [other protective state] → ventral → naming → drawing → review → complete
 *
 * The user picks whether sympathetic or dorsal is their "home away from home"
 * (most familiar protective state). That one goes first, then the other, always ending in ventral.
 *
 * Within each state:
 *   memory → dip_in → body → felt_sense → behaviors → communication →
 *   thoughts → sleep → eating → substances → core_beliefs
 *
 * For sympathetic/dorsal: "dip a toe" — just enough to get a flavor.
 * For ventral: bring the state FULLY ALIVE. Help them savor it.
 *
 * This handler does NOT:
 * - Make API calls (Huxley does that)
 * - Build prompts (Huxley does that, using getModeContext())
 * - Persist data (Huxley's therapeuticData pipeline does that)
 */
import BaseModeHandler from './BaseModeHandler';

// Default state order — but the user chooses which protective state goes first
// (their "home away from home"). Ventral ALWAYS last.
const DEFAULT_STATE_ORDER = ['sympathetic', 'dorsal', 'ventral'];

// Detection keywords for choosing home-away-from-home
const HOME_AWAY_DETECTION = {
  sympathetic: [
    'fight', 'flight', 'anxious', 'stress', 'activated', 'wired',
    'racing', 'tense', 'restless', 'on edge', 'angry', 'rushed',
    'panic', 'agitated', 'nervous', 'overwhelm', 'hyper', 'alert',
    'sympathetic', 'activated', 'fight or flight',
  ],
  dorsal: [
    'shutdown', 'freeze', 'numb', 'disconnect', 'collapse', 'foggy',
    'heavy', 'stuck', 'empty', 'flat', 'withdrawn', 'tired',
    'exhausted', 'checked out', 'spaced out', 'frozen', 'dorsal',
    'shut down', 'dissociat', 'hopeless', 'paralyz',
  ],
};

// The domains explored within each state (in order)
const MAPPING_DOMAINS = [
  'memory',        // Find a memory that brings up this state
  'dip_in',        // Dip a toe in (or fully alive for ventral)
  'body',          // Body sensations: where, temperature, HR, breathing, digestion, sweating
  'felt_sense',    // Bigger felt sense / emotions
  'behaviors',     // What are you more likely to do in this state?
  'communication', // How does communication change? Mode, difficulty, what do you say?
  'thoughts',      // What do you think? How does thinking change?
  'sleep',         // How is sleep impacted?
  'eating',        // Cravings, eating habits, relationship with food?
  'substances',    // Substance/alcohol use, compulsive behaviors?
  'core_beliefs',  // "I am..." and "The world is..."
];

// Detection keywords for each domain (used to auto-advance)
const DOMAIN_MARKERS = {
  memory: ['remember', 'time when', 'memory', 'situation', 'example', 'happened', 'recall', 'think of'],
  dip_in: ['feel', 'notice', 'sense', 'coming up', 'flavor', 'taste of', 'little bit', 'touching'],
  body: ['body', 'chest', 'stomach', 'heart', 'breathing', 'tension', 'temperature', 'sweating',
    'digestion', 'shoulders', 'jaw', 'hands', 'throat', 'gut', 'muscles', 'pulse', 'heart rate'],
  felt_sense: ['feel', 'emotion', 'sense of', 'overall', 'mood', 'energy', 'weight', 'lightness'],
  behaviors: ['do', 'behavior', 'tend to', 'likely', 'action', 'react', 'respond', 'move', 'withdraw',
    'lash out', 'hide', 'run', 'fight', 'scroll', 'pace', 'clean', 'exercise'],
  communication: ['communicate', 'talk', 'say', 'voice', 'tone', 'words', 'text', 'call',
    'avoid', 'argue', 'quiet', 'loud', 'snap', 'shut down', 'vent', 'share'],
  thoughts: ['think', 'thought', 'mind', 'racing', 'blank', 'foggy', 'clear', 'narrative',
    'story', 'worry', 'ruminate', 'catastrophize', 'plan', 'stuck'],
  sleep: ['sleep', 'insomnia', 'tired', 'exhausted', 'restless', 'wake up', 'dream',
    'can\'t sleep', 'oversleep', 'nap', 'wired', 'crash'],
  eating: ['eat', 'food', 'hungry', 'appetite', 'crave', 'craving', 'sugar', 'comfort food',
    'skip meals', 'overeat', 'not hungry', 'binge', 'restrict', 'cooking'],
  substances: ['drink', 'alcohol', 'substance', 'weed', 'cannabis', 'smoke', 'caffeine',
    'compulsive', 'scrolling', 'shopping', 'gaming', 'numbing', 'escape'],
  core_beliefs: ['i am', 'the world is', 'the world', 'belief', 'core belief', 'i\'m'],
};

class NervousSystemMappingModeHandler extends BaseModeHandler {
  constructor() {
    super('nervous_system_mapping');
  }

  reset() {
    super.reset();
    this.phase = 'intro';
    this.currentStateIndex = -1;     // Index into stateOrder (-1 = not started)
    this.currentDomainIndex = -1;    // Index into MAPPING_DOMAINS (-1 = not started)

    // Dynamic order: user picks their "home away from home" first
    // Default: sympathetic → dorsal → ventral. Updated when user chooses.
    this.stateOrder = [...DEFAULT_STATE_ORDER];
    this.homeAwayFromHome = null;    // 'sympathetic' or 'dorsal'

    this.phaseExchangeCounts = {};
    this.phaseHistory = [];

    // Data gathered per state per domain
    this.stateData = {
      sympathetic: { gathered: {}, stateName: null, coreBeliefs: { iAm: null, worldIs: null } },
      dorsal: { gathered: {}, stateName: null, coreBeliefs: { iAm: null, worldIs: null } },
      ventral: { gathered: {}, stateName: null, coreBeliefs: { iAm: null, worldIs: null } },
    };

    // State document — prevents repetitive questions
    this.stateDocument = {
      askedQuestions: [],
      coveredTopics: [],
      contextNotes: [],
    };

    // Phase summaries generated at state completion
    this.stateSummaries = {
      sympathetic: null,
      dorsal: null,
      ventral: null,
    };
  }

  // ---------------------------------------------------------------------------
  // INITIALIZE WITH CONTEXT (for resuming a session in progress)
  // ---------------------------------------------------------------------------

  initializeWithContext(context) {
    if (!context) return;

    if (context.phase) this.phase = context.phase;
    if (context.currentStateIndex != null) this.currentStateIndex = context.currentStateIndex;
    if (context.currentDomainIndex != null) this.currentDomainIndex = context.currentDomainIndex;
    if (context.exchangeCount) this.exchangeCount = context.exchangeCount;
    if (context.stateOrder) this.stateOrder = [...context.stateOrder];
    if (context.homeAwayFromHome) this.homeAwayFromHome = context.homeAwayFromHome;
    if (context.stateData) this.stateData = { ...this.stateData, ...context.stateData };
    if (context.stateSummaries) this.stateSummaries = { ...this.stateSummaries, ...context.stateSummaries };
    if (context.stateDocument) this.stateDocument = { ...this.stateDocument, ...context.stateDocument };
    if (context.phaseHistory) this.phaseHistory = [...context.phaseHistory];
  }

  // ---------------------------------------------------------------------------
  // CONTEXT FOR PROMPT (injected by HuxleyService)
  // ---------------------------------------------------------------------------

  getModeContext() {
    const currentState = this._getCurrentState();
    const currentDomain = this._getCurrentDomain();

    return {
      sessionPhase: this.phase,
      protocolOrder: this.homeAwayFromHome
        ? `${this._stateLabel(this.stateOrder[0])} → ${this._stateLabel(this.stateOrder[1])} → Ventral (always end in ventral)`
        : 'User chooses home away from home first, then other protective state, always end in ventral',
      homeAwayFromHome: this.homeAwayFromHome
        ? `User identified ${this._stateLabel(this.homeAwayFromHome)} as their home away from home`
        : 'Not yet identified — ask during intro',
      currentState: currentState ? {
        name: currentState,
        label: this._stateLabel(currentState),
        isVentral: currentState === 'ventral',
        domainProgress: this._getDomainProgress(currentState),
      } : null,
      currentDomain: currentDomain ? {
        name: currentDomain,
        label: this._domainLabel(currentDomain),
        index: this.currentDomainIndex + 1,
        total: MAPPING_DOMAINS.length,
      } : null,
      statesCompleted: this.stateOrder.filter(s => this._isStateComplete(s)).map(s => ({
        state: s,
        label: this._stateLabel(s),
        name: this.stateData[s].stateName,
        summary: this.stateSummaries[s],
      })),
      statesRemaining: this.stateOrder.filter(s => !this._isStateComplete(s)).map(s => this._stateLabel(s)),
      phaseGuidance: this._getPhaseGuidance(),
      stateDocument: {
        askedQuestions: this.stateDocument.askedQuestions.slice(-10),
        coveredTopics: this.stateDocument.coveredTopics,
        contextNotes: this.stateDocument.contextNotes.slice(-5),
      },
      progressMetrics: {
        exchangeCount: this.exchangeCount,
        statesComplete: this.stateOrder.filter(s => this._isStateComplete(s)).length,
        totalStates: 3,
        domainsComplete: currentState ? Object.keys(this.stateData[currentState].gathered).length : 0,
        totalDomains: MAPPING_DOMAINS.length,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // RESPONSE PROCESSING (called by HuxleyService after each exchange)
  // ---------------------------------------------------------------------------

  processResponse(userMessage, aiResponse, therapeuticData) {
    this.exchangeCount++;
    const phaseKey = `${this.phase}_${this._getCurrentState() || 'none'}_${this._getCurrentDomain() || 'none'}`;
    this.phaseExchangeCounts[phaseKey] = (this.phaseExchangeCounts[phaseKey] || 0) + 1;

    // 1. Detect domain data from user message
    if (userMessage) {
      this._detectAndTrack(userMessage);
    }

    // 2. Update state document
    this._updateStateDocument(userMessage, aiResponse);

    // 3. Process therapeutic data if present
    if (therapeuticData) {
      this._mergeTherapeuticData(therapeuticData);
    }

    // 4. Try to advance
    const previousPhase = this.phase;
    const previousDomain = this.currentDomainIndex;
    this._tryAdvance();

    if (this.phase !== previousPhase || this.currentDomainIndex !== previousDomain) {
      this.phaseHistory.push({
        from: previousPhase,
        to: this.phase,
        fromDomain: previousDomain >= 0 ? MAPPING_DOMAINS[previousDomain] : null,
        toDomain: this.currentDomainIndex >= 0 ? MAPPING_DOMAINS[this.currentDomainIndex] : null,
        atExchange: this.exchangeCount,
      });
    }

    return this.getSessionProgress();
  }

  // ---------------------------------------------------------------------------
  // ADVANCEMENT LOGIC
  // ---------------------------------------------------------------------------

  _tryAdvance() {
    switch (this.phase) {
      case 'intro':
        // Advance once the user has indicated their home away from home
        if (this.homeAwayFromHome) {
          this.phase = 'mapping_state';
          this.currentStateIndex = 0;
          this.currentDomainIndex = 0;
        }
        break;

      case 'mapping_state': {
        const currentState = this._getCurrentState();
        if (!currentState) break;

        const currentDomain = this._getCurrentDomain();
        if (!currentDomain) break;

        // Check if current domain has data
        if (this.stateData[currentState].gathered[currentDomain]) {
          // Advance to next domain
          if (this.currentDomainIndex < MAPPING_DOMAINS.length - 1) {
            this.currentDomainIndex++;
          } else {
            // All domains complete for this state — generate summary
            this._generateStateSummary(currentState);

            // Move to next state or naming phase
            if (this.currentStateIndex < this.stateOrder.length - 1) {
              this.currentStateIndex++;
              this.currentDomainIndex = 0;
            } else {
              // All three states mapped
              this.phase = 'naming';
            }
          }
        }
        break;
      }

      case 'naming': {
        // Check if all states have names
        const allNamed = this.stateOrder.every(s => this.stateData[s].stateName);
        if (allNamed) {
          this.phase = 'drawing';
        }
        break;
      }

      case 'drawing': {
        // Stay in drawing phase for a few exchanges (choosing colors, drawing)
        const drawingExchanges = this.phaseHistory.filter(h => h.to === 'drawing').length > 0
          ? this.exchangeCount - (this.phaseHistory.find(h => h.to === 'drawing')?.atExchange || 0)
          : 0;
        if (drawingExchanges >= 3) {
          this.phase = 'review';
        }
        break;
      }

      case 'review': {
        // Stay in review for a few exchanges to anchor in ventral
        const reviewExchanges = this.phaseHistory.filter(h => h.to === 'review').length > 0
          ? this.exchangeCount - (this.phaseHistory.find(h => h.to === 'review')?.atExchange || 0)
          : 0;
        if (reviewExchanges >= 3) {
          this.phase = 'complete';
        }
        break;
      }

      // complete is terminal
    }
  }

  // ---------------------------------------------------------------------------
  // DETECTION & TRACKING
  // ---------------------------------------------------------------------------

  _detectAndTrack(text) {
    const lower = text.toLowerCase();

    // During intro: detect which protective state is their "home away from home"
    if (this.phase === 'intro' && !this.homeAwayFromHome) {
      const sympatheticScore = HOME_AWAY_DETECTION.sympathetic.filter(m => lower.includes(m)).length;
      const dorsalScore = HOME_AWAY_DETECTION.dorsal.filter(m => lower.includes(m)).length;

      if (sympatheticScore > 0 || dorsalScore > 0) {
        if (sympatheticScore >= dorsalScore) {
          this.homeAwayFromHome = 'sympathetic';
          this.stateOrder = ['sympathetic', 'dorsal', 'ventral'];
        } else {
          this.homeAwayFromHome = 'dorsal';
          this.stateOrder = ['dorsal', 'sympathetic', 'ventral'];
        }
      }
      return;
    }

    const currentState = this._getCurrentState();
    const currentDomain = this._getCurrentDomain();

    if (!currentState || !currentDomain) return;

    // Check if user's message has markers for the current domain
    const markers = DOMAIN_MARKERS[currentDomain] || [];
    const matches = markers.filter(m => lower.includes(m));

    if (matches.length >= 1) {
      this.stateData[currentState].gathered[currentDomain] = true;
    }

    // Special handling for core_beliefs: detect "I am" and "The world is" sentences
    if (currentDomain === 'core_beliefs') {
      const iAmMatch = text.match(/[Ii]\s+am\s+(.+?)(?:\.|$)/);
      const worldMatch = text.match(/[Tt]he\s+world\s+is\s+(.+?)(?:\.|$)/);

      if (iAmMatch) {
        this.stateData[currentState].coreBeliefs.iAm = iAmMatch[0].trim();
        this.stateData[currentState].gathered.core_beliefs = true;
      }
      if (worldMatch) {
        this.stateData[currentState].coreBeliefs.worldIs = worldMatch[0].trim();
        this.stateData[currentState].gathered.core_beliefs = true;
      }

      // Only mark complete when both sentences are provided
      if (this.stateData[currentState].coreBeliefs.iAm && this.stateData[currentState].coreBeliefs.worldIs) {
        this.stateData[currentState].gathered.core_beliefs = true;
      } else {
        // Don't auto-advance until both are gathered
        this.stateData[currentState].gathered.core_beliefs = false;
      }
    }

    // Detect state naming (in naming phase)
    if (this.phase === 'naming') {
      // Look for naming patterns in response to "give this state a name"
      for (const state of this.stateOrder) {
        if (!this.stateData[state].stateName) {
          // The AI should prompt for naming one at a time, so we track the first unnamed
          // Simple heuristic: if user provides a short phrase, use it as the name
          if (lower.length < 60 && lower.length > 1) {
            this.stateData[state].stateName = text.trim();
            break; // Only name one at a time
          }
        }
      }
    }
  }

  _mergeTherapeuticData(therapeuticData) {
    const currentState = this._getCurrentState();
    if (!currentState) return;

    // Accept structured data about the current state
    if (therapeuticData.polyvagalState) {
      const pd = therapeuticData.polyvagalState;
      if (pd.bodySensations) this.stateData[currentState].gathered.body = true;
      if (pd.thoughts) this.stateData[currentState].gathered.thoughts = true;
      if (pd.emotions) this.stateData[currentState].gathered.felt_sense = true;
      if (pd.behaviors) this.stateData[currentState].gathered.behaviors = true;
    }

    // Accept state names
    if (therapeuticData.stateNames) {
      for (const state of this.stateOrder) {
        if (therapeuticData.stateNames[state]) {
          this.stateData[state].stateName = therapeuticData.stateNames[state];
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // STATE DOCUMENT (prevents repetitive questions)
  // ---------------------------------------------------------------------------

  _updateStateDocument(userMessage, aiResponse) {
    if (!userMessage) return;

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

    // Track covered topics
    const currentDomain = this._getCurrentDomain();
    if (currentDomain && !this.stateDocument.coveredTopics.includes(`${this._getCurrentState()}_${currentDomain}`)) {
      const lower = userMessage.toLowerCase();
      const markers = DOMAIN_MARKERS[currentDomain] || [];
      if (markers.some(m => lower.includes(m))) {
        this.stateDocument.coveredTopics.push(`${this._getCurrentState()}_${currentDomain}`);
      }
    }

    // Track important context notes
    const importanceMarkers = ['important', 'always', 'never', 'intense', 'powerful', 'terrified'];
    const lower = userMessage.toLowerCase();
    if (importanceMarkers.some(m => lower.includes(m))) {
      const note = userMessage.substring(0, 150);
      if (!this.stateDocument.contextNotes.includes(note)) {
        this.stateDocument.contextNotes.push(note);
      }
    }

    // Limit sizes
    if (this.stateDocument.askedQuestions.length > 50) {
      this.stateDocument.askedQuestions = this.stateDocument.askedQuestions.slice(-50);
    }
    if (this.stateDocument.contextNotes.length > 20) {
      this.stateDocument.contextNotes = this.stateDocument.contextNotes.slice(-20);
    }
  }

  // ---------------------------------------------------------------------------
  // PHASE GUIDANCE (injected into modeContext for the AI)
  // ---------------------------------------------------------------------------

  _getPhaseGuidance() {
    const currentState = this._getCurrentState();
    const currentDomain = this._getCurrentDomain();
    const isVentral = currentState === 'ventral';

    switch (this.phase) {
      case 'intro':
        return `Welcome them warmly. Explain that you'll map three nervous system states together, ` +
          `and you'll always end with their ventral (safe & social) state so they leave grounded. ` +
          `Ask: "When you leave your safe, connected state, where do you tend to go? ` +
          `Do you tend to go more toward activation — fight or flight, anxiety, stress, being wired? ` +
          `Or do you tend to go more toward shutdown — numbness, collapse, checking out, feeling stuck?" ` +
          `This is their "home away from home" — the protective state they know best. ` +
          `We'll start there because it's the most accessible. ` +
          `Once they indicate their answer, the handler will set the order automatically.`;

      case 'mapping_state': {
        if (!currentState || !currentDomain) return 'Continue mapping.';

        const stateLabel = this._stateLabel(currentState);
        const domainLabel = this._domainLabel(currentDomain);
        const domainIndex = this.currentDomainIndex + 1;
        const progress = this._getDomainProgress(currentState);
        const dipInstruction = isVentral
          ? 'Help them bring this state FULLY ALIVE. Savor it. If they struggle, look for micro-moments: a pet, nature, a moment of connection.'
          : `Help them "dip a toe" — just enough to get a FLAVOR of ${stateLabel}. Not a deep dive. Just enough to sense it.`;

        const domainInstructions = {
          memory: `Ask them to think of a time or situation that brings up a sense of ${stateLabel}. ` +
            `A specific memory that reliably activates this state. For example, getting stuck in traffic (sympathetic) or being alone and ignored (dorsal).`,
          dip_in: `They have the memory. ${dipInstruction} ` +
            `Ask: "Can you let just a little bit of that into your mind and body? Just enough to get the flavor of it?"`,
          body: `Now explore body sensations in ${stateLabel}: Where do they feel it? Temperature? Heart rate? Breathing? ` +
            `Muscle tension? Digestion? Sweating? What happens in their body in this state?`,
          felt_sense: `What's the bigger felt sense? The overall emotional tone? ` +
            `What do they FEEL (as an overall sense, not just individual emotions) when in ${stateLabel}?`,
          behaviors: `What do they DO in this state? What behaviors are they more likely to engage in? ` +
            `What actions feel natural or automatic? What do they reach for?`,
          communication: `How does communication change in ${stateLabel}? ` +
            `What mode of communication is preferred/more natural? What becomes harder to access? ` +
            `What kind of things do they say? How does their tone or volume change?`,
          thoughts: `What do they think in this state? How does thinking itself change? ` +
            `Racing thoughts? Foggy? Stuck on repeat? Clear? What narratives show up?`,
          sleep: `How is sleep impacted in ${stateLabel}? ` +
            `Hard to fall asleep? Restless? Oversleeping? Insomnia? Vivid dreams? Crash and sleep?`,
          eating: `How does eating change? Any cravings for certain foods? ` +
            `Skip meals? Overeat? Comfort food? No appetite? Changes in how they eat?`,
          substances: `How does substance or alcohol use change in this state? ` +
            `Any compulsive behaviors? Scrolling, shopping, gaming, anything they reach for to cope or numb?`,
          core_beliefs: `To close out ${stateLabel}, ask them to complete two sentences: ` +
            `"When I'm in this state... I am ____" and "When I'm in this state... The world is ____". ` +
            `These reveal the core beliefs active in this state. Make sure you get BOTH sentences before moving on.`,
        };

        return `MAPPING ${stateLabel.toUpperCase()} — Domain ${domainIndex}/${MAPPING_DOMAINS.length}: ${domainLabel}\n` +
          `${domainInstructions[currentDomain] || 'Continue exploring this domain.'}\n` +
          `Progress: ${progress}`;
      }

      case 'naming':
        return `All three states have been mapped. Now ask them to give each state a personal NAME — ` +
          `a word or short phrase that captures their experience of it. ` +
          `Go through each: "${this._stateLabel('sympathetic')}", then "${this._stateLabel('dorsal')}", then "${this._stateLabel('ventral')}". ` +
          `Unnamed states: ${this.stateOrder.filter(s => !this.stateData[s].stateName).map(s => this._stateLabel(s)).join(', ') || 'all named!'}.`;

      case 'drawing':
        return `VISUAL MAP: Now it's time to draw their autonomic map. ` +
          `Ask them to grab paper and colored pencils/markers/crayons. ` +
          `Draw THREE CIRCLES — one for each state. ` +
          `First, choose a COLOR for each state — whatever color feels right for sympathetic, dorsal, and ventral. ` +
          `Then, inside each circle, draw or write the key elements from that state: ` +
          `body sensations, feelings, behaviors, what they think, what they say. ` +
          `Use their state names as labels: ${this.stateOrder.map(s => this.stateData[s].stateName ? `"${this.stateData[s].stateName}"` : this._stateLabel(s)).join(', ')}. ` +
          `There is added benefit to working with color — it engages different processing than words alone. ` +
          `Encourage them to take their time and make it personal. There's no wrong way to do this.`;

      case 'review':
        return `Review the complete map together. Explore what they notice looking at all three circles. ` +
          `Listen to their sympathetic and dorsal experiences. ` +
          `Then ANCHOR in ventral — finish by dwelling in their ventral vagal experiences and savoring that state. ` +
          `Celebrate their self-awareness and courage. This map is a resource they can return to.`;

      case 'complete':
        return `Session complete. Their autonomic map is built. Suggest they keep it somewhere visible — ` +
          `on the fridge, by their desk, in their journal. ` +
          `End warmly, anchored in ventral.`;

      default:
        return 'Continue the mapping process.';
    }
  }

  // ---------------------------------------------------------------------------
  // STATE SUMMARIES
  // ---------------------------------------------------------------------------

  _generateStateSummary(state) {
    const data = this.stateData[state];
    const gathered = Object.keys(data.gathered).filter(k => data.gathered[k]);
    const beliefs = data.coreBeliefs;

    this.stateSummaries[state] = `${this._stateLabel(state)} mapped. ` +
      `Domains covered: ${gathered.map(d => this._domainLabel(d)).join(', ')}. ` +
      (beliefs.iAm ? `Core belief: "${beliefs.iAm}"` : '') +
      (beliefs.worldIs ? ` / "${beliefs.worldIs}"` : '') +
      (data.stateName ? `. Named: "${data.stateName}"` : '');
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  _getCurrentState() {
    if (this.currentStateIndex < 0 || this.currentStateIndex >= this.stateOrder.length) return null;
    return this.stateOrder[this.currentStateIndex];
  }

  _getCurrentDomain() {
    if (this.currentDomainIndex < 0 || this.currentDomainIndex >= MAPPING_DOMAINS.length) return null;
    return MAPPING_DOMAINS[this.currentDomainIndex];
  }

  _isStateComplete(state) {
    // A state is complete when core_beliefs (the last domain) has been gathered
    // OR when enough domains are gathered (at least 8 out of 11)
    const gathered = Object.keys(this.stateData[state].gathered).filter(k => this.stateData[state].gathered[k]);
    return gathered.includes('core_beliefs') || gathered.length >= 8;
  }

  _getDomainProgress(state) {
    const gathered = Object.keys(this.stateData[state].gathered).filter(k => this.stateData[state].gathered[k]);
    const domainNames = gathered.map(d => this._domainLabel(d));
    const remaining = MAPPING_DOMAINS.filter(d => !gathered.includes(d));
    return `Gathered: ${domainNames.join(', ') || 'none yet'}. ` +
      `Remaining: ${remaining.map(d => this._domainLabel(d)).join(', ') || 'all done!'}.`;
  }

  _stateLabel(state) {
    const labels = {
      ventral: 'Ventral Vagal (Safe & Social)',
      sympathetic: 'Sympathetic (Fight/Flight)',
      dorsal: 'Dorsal Vagal (Shutdown/Freeze)',
    };
    return labels[state] || state;
  }

  _domainLabel(domain) {
    const labels = {
      memory: 'Finding a Memory',
      dip_in: 'Dipping In',
      body: 'Body Sensations',
      felt_sense: 'Felt Sense / Emotions',
      behaviors: 'Behaviors',
      communication: 'Communication',
      thoughts: 'Thoughts',
      sleep: 'Sleep',
      eating: 'Eating',
      substances: 'Substances / Compulsive Behaviors',
      core_beliefs: '"I am..." / "The world is..."',
    };
    return labels[domain] || domain;
  }

  // ---------------------------------------------------------------------------
  // SESSION PROGRESS (returned to screens via chat() result)
  // ---------------------------------------------------------------------------

  getSessionProgress() {
    const currentState = this._getCurrentState();
    const completedStates = this.stateOrder.filter(s => this._isStateComplete(s));

    return {
      phase: this.phase,
      phaseLabel: this._getPhaseLabel(),
      exchangeCount: this.exchangeCount,
      currentState: currentState,
      currentStateLabel: currentState ? this._stateLabel(currentState) : null,
      currentDomain: this._getCurrentDomain(),
      currentDomainLabel: this._getCurrentDomain() ? this._domainLabel(this._getCurrentDomain()) : null,
      domainIndex: this.currentDomainIndex,
      totalDomains: MAPPING_DOMAINS.length,
      statesComplete: completedStates.length,
      totalStates: 3,
      stateProgress: Object.fromEntries(
        this.stateOrder.map(s => [s, {
          label: this._stateLabel(s),
          isComplete: this._isStateComplete(s),
          domainsGathered: Object.keys(this.stateData[s].gathered).filter(k => this.stateData[s].gathered[k]).length,
          stateName: this.stateData[s].stateName,
          coreBeliefs: this.stateData[s].coreBeliefs,
        }])
      ),
      isComplete: this.phase === 'complete',
    };
  }

  _getPhaseLabel() {
    const currentState = this._getCurrentState();
    const labels = {
      intro: 'Getting Started',
      mapping_state: currentState ? `Mapping ${this._stateLabel(currentState)}` : 'Mapping',
      naming: 'Naming Your States',
      drawing: 'Drawing Your Map',
      review: 'Reviewing Your Map',
      complete: 'Complete',
    };
    return labels[this.phase] || this.phase;
  }

  // ---------------------------------------------------------------------------
  // SESSION SUMMARY (for persistence when session ends)
  // ---------------------------------------------------------------------------

  getSessionSummary() {
    return {
      modeId: this.modeId,
      phase: this.phase,
      exchangeCount: this.exchangeCount,
      stateData: Object.fromEntries(
        this.stateOrder.map(s => [s, {
          label: this._stateLabel(s),
          stateName: this.stateData[s].stateName,
          coreBeliefs: { ...this.stateData[s].coreBeliefs },
          domainsGathered: Object.keys(this.stateData[s].gathered).filter(k => this.stateData[s].gathered[k]),
          isComplete: this._isStateComplete(s),
        }])
      ),
      stateSummaries: { ...this.stateSummaries },
      stateDocument: {
        coveredTopics: [...this.stateDocument.coveredTopics],
        contextNotes: [...this.stateDocument.contextNotes],
      },
      phaseHistory: [...this.phaseHistory],
      stateOrder: [...this.stateOrder],
      homeAwayFromHome: this.homeAwayFromHome,
      completedAllStates: this.stateOrder.every(s => this._isStateComplete(s)),
      anchoredInVentral: this.phase === 'complete' || this.phase === 'review',
    };
  }
}

export default NervousSystemMappingModeHandler;
