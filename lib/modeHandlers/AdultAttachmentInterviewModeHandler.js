/**
 * Adult Attachment Interview Mode Handler
 *
 * A reflective adaptation of the Adult Attachment Interview (AAI), the
 * semi-structured protocol developed by George, Kaplan & Main (1985, 1996).
 *
 * IMPORTANT SCOPE NOTE:
 * The real AAI is coded by certified raters using discourse analysis (Main &
 * Goldwyn system) and yields classifications (secure-autonomous, dismissing,
 * preoccupied, unresolved/disorganized, cannot-classify). That coding requires
 * training and is not appropriate to surface to a user inside a wellness app
 * (see ADR-009: this is a non-clinical reflection tool).
 *
 * So this handler does two things:
 *   1. Drives a warm, structured, self-exploratory walk through the AAI arc.
 *      The user experiences a guided reflection — never a diagnosis.
 *   2. On the BACK END ONLY, accumulates lightweight "discourse signals" — the
 *      kinds of things AAI coders attend to (coherence, idealization vs.
 *      supported memory, lack of recall, lingering anger/preoccupation,
 *      disorganization around loss). These roll up into a *tentative* pattern
 *      note that Huxley can use to attune, and that is stored in the session
 *      summary for the practitioner. The pattern note is explicitly NOT shown
 *      to the user as a label.
 *
 * Protocol arc (phases):
 *   orientation → family_structure → caregiver_general → adjectives →
 *   adjective_evidence → specific_experiences → caregiver_motivations →
 *   loss_disruption → adult_effects → integration → complete
 *
 * Like other handlers, this one does NOT make API calls, build prompts, or
 * persist data — HuxleyService does that, using getModeContext().
 */
import BaseModeHandler from './BaseModeHandler';

// How many descriptive words we ask for per caregiver (classic AAI asks 5).
const ADJECTIVES_PER_CAREGIVER = 5;

// The specific-experience probes, in order. These map to the AAI's
// emotional-upset / hurt / ill / separation / rejection / threat questions.
const EXPERIENCE_PROBES = [
  'upset',        // What did you do when emotionally upset as a young child?
  'hurt_ill',     // When physically hurt or ill?
  'separation',   // First separations from caregivers?
  'rejection',    // Ever feel rejected as a child?
  'threat',       // Ever frightened/threatened, including discipline?
];

const EXPERIENCE_LABELS = {
  upset: 'When Emotionally Upset',
  hurt_ill: 'When Hurt or Ill',
  separation: 'Early Separations',
  rejection: 'Feeling Rejected',
  threat: 'Feeling Frightened or Threatened',
};

// ---------------------------------------------------------------------------
// DISCOURSE-SIGNAL KEYWORDS (back-end pattern noting only — never user-facing)
//
// These are coarse heuristics, NOT a validated coding scheme. They nudge a
// tentative pattern, nothing more. Treated as soft evidence, weighted lightly.
// ---------------------------------------------------------------------------
const SIGNAL_MARKERS = {
  // Dismissing-flavored: positive labels with no supporting memory, normalizing,
  // minimizing, claimed lack of recall, distancing from the question.
  idealizing: [
    'normal', 'fine', 'great', 'perfect', 'wonderful', 'good childhood',
    'happy', 'no complaints', 'nothing wrong', 'pretty standard', 'typical',
  ],
  noRecall: [
    "don't remember", 'dont remember', "can't remember", 'cant remember',
    "don't recall", 'no memory', 'no specific', 'nothing comes', 'blank',
    "can't think of", 'cant think of', 'hard to remember', 'a blur',
  ],
  minimizing: [
    "doesn't matter", 'no big deal', 'not a big deal', 'over it', 'whatever',
    'moved on', "wasn't that bad", 'plenty worse', "didn't affect me",
  ],
  // Preoccupied-flavored: still-active anger, entanglement, present-tense pull
  // into old conflict, can't-finish-the-thought run-ons.
  lingeringAnger: [
    'still angry', 'still furious', 'pisses me off', 'makes me so', 'how dare',
    "can't believe she", "can't believe he", 'and then she', 'and then he',
    'always does this', 'never lets', 'to this day',
  ],
  entangled: [
    'we still', 'i still call', 'every day', "won't let me", 'guilt trips',
    'enmeshed', 'too close', 'in my business', "can't separate",
  ],
  // Unresolved-flavored: disorientation specifically around loss/trauma.
  lossDisorientation: [
    'still feels like', "like it just happened", "as if he's still",
    "as if she's still", 'my fault', 'i caused', 'could have saved',
    'should have been there', "can't talk about", 'never got over',
  ],
  // Coherence-positive: balanced, reflective, able to hold complexity.
  coherent: [
    'on one hand', 'at the same time', 'looking back', 'i can see now',
    'i think', 'in some ways', 'it was complicated', 'both', 'mixed',
    'i understand why', 'made sense', 'i forgive', "i've come to",
  ],
};

class AdultAttachmentInterviewModeHandler extends BaseModeHandler {
  constructor() {
    super('adult_attachment_interview');
  }

  reset() {
    super.reset();
    this.phase = 'orientation';

    // Caregivers the user names (e.g. "mother", "father", "grandmother").
    // Order is the order they're introduced; we work through them one at a time.
    this.caregivers = [];        // [{ key, label, generalDescription, adjectives:[], evidence:{adj:memory} }]
    this.currentCaregiverIndex = -1;

    // While in the adjective_evidence phase, which adjective we're probing.
    this.currentAdjectiveIndex = 0;

    // Specific-experience probes
    this.currentExperienceIndex = 0;
    this.experiences = {};       // { upset: text, hurt_ill: text, ... }

    // Free-form captures for later phases
    this.caregiverMotivations = null;
    this.lossDisclosed = null;   // null = not asked, false = none, true = disclosed
    this.lossNotes = null;
    this.adultEffects = null;
    this.integrationTakeaway = null;

    // Phase bookkeeping
    this.phaseExchangeCounts = {};
    this.phaseOnlyCounts = {};
    this.phaseHistory = [];

    // State document — prevents repetitive questions
    this.stateDocument = {
      askedQuestions: [],
      coveredTopics: [],
      contextNotes: [],
    };

    // ---- BACK-END pattern signals (never shown to user) ----
    this._patternSignals = {
      idealizing: 0,
      noRecall: 0,
      minimizing: 0,
      lingeringAnger: 0,
      entangled: 0,
      lossDisorientation: 0,
      coherent: 0,
      // How often an adjective had NO supporting memory (key AAI tell)
      unsupportedAdjectives: 0,
      supportedAdjectives: 0,
    };
  }

  // ---------------------------------------------------------------------------
  // RESUME SUPPORT
  // ---------------------------------------------------------------------------

  initializeWithContext(context) {
    if (!context) return;
    if (context.phase) this.phase = context.phase;
    if (context.caregivers) this.caregivers = context.caregivers;
    if (context.currentCaregiverIndex != null) this.currentCaregiverIndex = context.currentCaregiverIndex;
    if (context.currentAdjectiveIndex != null) this.currentAdjectiveIndex = context.currentAdjectiveIndex;
    if (context.currentExperienceIndex != null) this.currentExperienceIndex = context.currentExperienceIndex;
    if (context.experiences) this.experiences = { ...this.experiences, ...context.experiences };
    if (context.exchangeCount) this.exchangeCount = context.exchangeCount;
    if (context._patternSignals) this._patternSignals = { ...this._patternSignals, ...context._patternSignals };
    if (context.stateDocument) this.stateDocument = { ...this.stateDocument, ...context.stateDocument };
    if (context.phaseHistory) this.phaseHistory = [...context.phaseHistory];

    // Free-form captures from the later phases. Without these a resume that
    // lands past loss_disruption immediately re-advances (the gates read these
    // fields), skipping the user straight to 'complete'.
    if (context.caregiverMotivations) this.caregiverMotivations = context.caregiverMotivations;
    if (context.lossDisclosed != null) this.lossDisclosed = context.lossDisclosed;
    if (context.lossNotes) this.lossNotes = context.lossNotes;
    if (context.adultEffects) this.adultEffects = context.adultEffects;
    if (context.integrationTakeaway) this.integrationTakeaway = context.integrationTakeaway;

    // Per-phase counters — the gates that read "how long have we been here"
    // (loss_disruption, integration, family_structure) depend on these.
    if (context.phaseOnlyCounts) this.phaseOnlyCounts = { ...context.phaseOnlyCounts };
    if (context.phaseExchangeCounts) this.phaseExchangeCounts = { ...context.phaseExchangeCounts };
  }

  // ---------------------------------------------------------------------------
  // CONTEXT FOR PROMPT (injected by HuxleyService)
  // ---------------------------------------------------------------------------

  getModeContext() {
    const caregiver = this._getCurrentCaregiver();

    return {
      sessionPhase: this.phase,
      phaseGuidance: this._getPhaseGuidance(),
      caregiversNamed: this.caregivers.map(c => c.label),
      currentCaregiver: caregiver ? {
        label: caregiver.label,
        adjectivesGathered: caregiver.adjectives.length,
        adjectivesTarget: ADJECTIVES_PER_CAREGIVER,
        adjectives: caregiver.adjectives,
        currentAdjective: this.phase === 'adjective_evidence'
          ? caregiver.adjectives[this.currentAdjectiveIndex] || null
          : null,
      } : null,
      experiencesProgress: {
        current: EXPERIENCE_LABELS[EXPERIENCE_PROBES[this.currentExperienceIndex]] || null,
        index: this.currentExperienceIndex + 1,
        total: EXPERIENCE_PROBES.length,
        covered: Object.keys(this.experiences).map(k => EXPERIENCE_LABELS[k]),
      },
      stateDocument: {
        askedQuestions: this.stateDocument.askedQuestions.slice(-10),
        coveredTopics: this.stateDocument.coveredTopics,
        contextNotes: this.stateDocument.contextNotes.slice(-5),
      },
      progressMetrics: {
        exchangeCount: this.exchangeCount,
        caregiversComplete: this.caregivers.filter(c => this._isCaregiverComplete(c)).length,
        caregiversTotal: this.caregivers.length || 1,
        experiencesComplete: Object.keys(this.experiences).length,
        experiencesTotal: EXPERIENCE_PROBES.length,
      },
      // NOTE: pattern signals are intentionally NOT placed here — they must never
      // reach the model in a way that could leak a "diagnosis" into user-facing
      // text. They live only in getSessionSummary() for the practitioner.
    };
  }

  // ---------------------------------------------------------------------------
  // RESPONSE PROCESSING (called by HuxleyService after each exchange)
  // ---------------------------------------------------------------------------

  processResponse(userMessage, aiResponse, therapeuticData) {
    this.exchangeCount++;
    const phaseKey = `${this.phase}_${this._getCurrentCaregiver()?.key || 'none'}`;
    this.phaseExchangeCounts[phaseKey] = (this.phaseExchangeCounts[phaseKey] || 0) + 1;
    // Caregiver-independent per-phase counter (used by phases that gate on
    // "how many exchanges have we spent in THIS phase", regardless of which
    // caregiver is current).
    this.phaseOnlyCounts[this.phase] = (this.phaseOnlyCounts[this.phase] || 0) + 1;

    if (userMessage) {
      this._captureForPhase(userMessage);
      this._scoreSignals(userMessage);
    }
    this._updateStateDocument(userMessage, aiResponse);
    if (therapeuticData) this._mergeTherapeuticData(therapeuticData);

    const previousPhase = this.phase;
    this._tryAdvance();
    if (this.phase !== previousPhase) {
      this.phaseHistory.push({ from: previousPhase, to: this.phase, atExchange: this.exchangeCount });
    }

    return this.getSessionProgress();
  }

  // ---------------------------------------------------------------------------
  // PHASE-SPECIFIC CAPTURE
  // ---------------------------------------------------------------------------

  _captureForPhase(text) {
    const trimmed = text.trim();

    switch (this.phase) {
      case 'orientation':
      case 'family_structure':
        // Try to identify named caregivers from the family description.
        this._detectCaregivers(text);
        break;

      case 'caregiver_general': {
        const cg = this._getCurrentCaregiver();
        if (cg && !cg.generalDescription) cg.generalDescription = trimmed;
        break;
      }

      case 'adjectives': {
        const cg = this._getCurrentCaregiver();
        if (!cg) break;
        // Pull words/short phrases out of the message. Users may give them
        // comma-separated, line-separated, or one per turn.
        const candidates = this._extractAdjectives(text);
        for (const word of candidates) {
          if (cg.adjectives.length < ADJECTIVES_PER_CAREGIVER && !cg.adjectives.includes(word)) {
            cg.adjectives.push(word);
          }
        }
        break;
      }

      case 'adjective_evidence': {
        const cg = this._getCurrentCaregiver();
        if (!cg) break;
        const adj = cg.adjectives[this.currentAdjectiveIndex];
        if (adj) {
          const lower = trimmed.toLowerCase();
          const hasNoRecall = SIGNAL_MARKERS.noRecall.some(m => lower.includes(m));
          if (hasNoRecall || trimmed.length < 8) {
            cg.evidence[adj] = '(no specific memory offered)';
            this._patternSignals.unsupportedAdjectives++;
          } else {
            cg.evidence[adj] = trimmed.slice(0, 400);
            this._patternSignals.supportedAdjectives++;
          }
        }
        break;
      }

      case 'specific_experiences': {
        const probe = EXPERIENCE_PROBES[this.currentExperienceIndex];
        if (probe && !this.experiences[probe]) {
          this.experiences[probe] = trimmed.slice(0, 500);
        }
        break;
      }

      case 'caregiver_motivations':
        if (!this.caregiverMotivations) this.caregiverMotivations = trimmed.slice(0, 600);
        break;

      case 'loss_disruption': {
        const lower = trimmed.toLowerCase();
        // "No" answers: a leading negation, or an explicit "no/none + loss"
        // phrasing anywhere (e.g. "No, there were no major losses when I was young").
        const leadingNo = /^(no|none|nope|nobody|no one|not really|skip)\b/.test(lower);
        const negatedLoss = /\b(no|never|wasn'?t any|weren'?t any|didn'?t have any)\b.*\b(loss|losses|death|died|separation|nobody)\b/.test(lower)
          || /\b(no|never)\b.*\bmajor\b/.test(lower);
        const wantsSkip = lower.includes('rather not') || lower.includes('skip');
        const declined = leadingNo || negatedLoss || wantsSkip;
        if (this.lossDisclosed === null) {
          this.lossDisclosed = !declined;
        }
        if (this.lossDisclosed) this.lossNotes = (this.lossNotes ? this.lossNotes + ' | ' : '') + trimmed.slice(0, 400);
        break;
      }

      case 'adult_effects':
        if (!this.adultEffects) this.adultEffects = trimmed.slice(0, 700);
        break;

      case 'integration':
        if (!this.integrationTakeaway) this.integrationTakeaway = trimmed.slice(0, 500);
        break;
    }
  }

  // ---------------------------------------------------------------------------
  // ADVANCEMENT LOGIC
  // ---------------------------------------------------------------------------

  _tryAdvance() {
    switch (this.phase) {
      case 'orientation':
        // Move on once we have at least one named caregiver to anchor on.
        if (this.caregivers.length >= 1) {
          this.phase = 'family_structure';
        }
        break;

      case 'family_structure':
        // After the family-shape exchange, begin per-caregiver work.
        if (this.phaseOnlyCounts['family_structure'] >= 1) {
          this.phase = 'caregiver_general';
          this.currentCaregiverIndex = 0;
        }
        break;

      case 'caregiver_general': {
        const cg = this._getCurrentCaregiver();
        if (cg && cg.generalDescription) {
          this.phase = 'adjectives';
          this.currentAdjectiveIndex = 0;
        }
        break;
      }

      case 'adjectives': {
        const cg = this._getCurrentCaregiver();
        if (cg && cg.adjectives.length >= ADJECTIVES_PER_CAREGIVER) {
          this.phase = 'adjective_evidence';
          this.currentAdjectiveIndex = 0;
        }
        break;
      }

      case 'adjective_evidence': {
        const cg = this._getCurrentCaregiver();
        if (!cg) break;
        const adj = cg.adjectives[this.currentAdjectiveIndex];
        // Advance once the current adjective has an evidence entry.
        if (adj && cg.evidence[adj]) {
          if (this.currentAdjectiveIndex < cg.adjectives.length - 1) {
            this.currentAdjectiveIndex++;
          } else {
            // Done with this caregiver. Next caregiver, or move to experiences.
            if (this.currentCaregiverIndex < this.caregivers.length - 1) {
              this.currentCaregiverIndex++;
              this.currentAdjectiveIndex = 0;
              this.phase = 'caregiver_general';
            } else {
              this.phase = 'specific_experiences';
              this.currentExperienceIndex = 0;
            }
          }
        }
        break;
      }

      case 'specific_experiences': {
        const probe = EXPERIENCE_PROBES[this.currentExperienceIndex];
        if (probe && this.experiences[probe]) {
          if (this.currentExperienceIndex < EXPERIENCE_PROBES.length - 1) {
            this.currentExperienceIndex++;
          } else {
            this.phase = 'caregiver_motivations';
          }
        }
        break;
      }

      case 'caregiver_motivations':
        if (this.caregiverMotivations) this.phase = 'loss_disruption';
        break;

      case 'loss_disruption':
        // Move on once we've recorded a yes/no. If disclosed, give it a couple
        // of exchanges before advancing.
        if (this.lossDisclosed === false) {
          this.phase = 'adult_effects';
        } else if (this.lossDisclosed === true) {
          const lossExchanges = this.phaseOnlyCounts['loss_disruption'] || 0;
          if (lossExchanges >= 2) this.phase = 'adult_effects';
        }
        break;

      case 'adult_effects':
        if (this.adultEffects) this.phase = 'integration';
        break;

      case 'integration': {
        const integrationExchanges = this.phaseOnlyCounts['integration'] || 0;
        if (this.integrationTakeaway && integrationExchanges >= 1) this.phase = 'complete';
        break;
      }

      // complete is terminal
    }
  }

  // ---------------------------------------------------------------------------
  // DETECTION HELPERS
  // ---------------------------------------------------------------------------

  _detectCaregivers(text) {
    const lower = text.toLowerCase();
    const ROLES = [
      { key: 'mother', label: 'mother', markers: ['mother', 'mom', 'mum', 'mommy', 'mama'] },
      { key: 'father', label: 'father', markers: ['father', 'dad', 'daddy', 'papa', 'pop'] },
      { key: 'grandmother', label: 'grandmother', markers: ['grandmother', 'grandma', 'granny', 'nana', 'gran'] },
      { key: 'grandfather', label: 'grandfather', markers: ['grandfather', 'grandpa', 'papa', 'pop pop'] },
      { key: 'stepmother', label: 'stepmother', markers: ['stepmother', 'stepmom', 'step-mom'] },
      { key: 'stepfather', label: 'stepfather', markers: ['stepfather', 'stepdad', 'step-dad'] },
      { key: 'aunt', label: 'aunt', markers: ['aunt', 'auntie'] },
      { key: 'uncle', label: 'uncle', markers: ['uncle'] },
      { key: 'foster', label: 'foster parent', markers: ['foster'] },
      { key: 'guardian', label: 'guardian', markers: ['guardian'] },
    ];
    for (const role of ROLES) {
      if (role.markers.some(m => lower.includes(m)) && !this.caregivers.find(c => c.key === role.key)) {
        this.caregivers.push({
          key: role.key,
          label: role.label,
          generalDescription: null,
          adjectives: [],
          evidence: {},
        });
      }
    }
  }

  _extractAdjectives(text) {
    // Split on commas, newlines, semicolons, "and", numbered list markers.
    return text
      .replace(/^\s*\d+[\.\)]\s*/gm, '') // strip "1." / "1)" list markers
      .split(/[,;\n]|\band\b/i)
      .map(s => s.trim().replace(/^["'\-•\s]+|["'\.\s]+$/g, ''))
      .filter(s => s.length >= 2 && s.length <= 40 && !/^(um+|uh+|hmm+|i guess|maybe)$/i.test(s));
  }

  _scoreSignals(text) {
    const lower = text.toLowerCase();
    for (const [signal, markers] of Object.entries(SIGNAL_MARKERS)) {
      if (this._patternSignals[signal] === undefined) continue;
      if (markers.some(m => lower.includes(m))) this._patternSignals[signal]++;
    }
  }

  _mergeTherapeuticData(therapeuticData) {
    // The general extraction pipeline may surface themes/parts; nothing
    // AAI-specific is required, but accept a coherence hint if provided.
    if (therapeuticData?.attachment?.coherence === 'high') this._patternSignals.coherent++;
  }

  // ---------------------------------------------------------------------------
  // STATE DOCUMENT (prevents repetitive questions)
  // ---------------------------------------------------------------------------

  _updateStateDocument(userMessage, aiResponse) {
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
    if (!userMessage) return;
    const lower = userMessage.toLowerCase();
    const importanceMarkers = ['always', 'never', 'the first time', 'i remember', 'terrified', 'i hated', 'i loved'];
    if (importanceMarkers.some(m => lower.includes(m))) {
      const note = userMessage.substring(0, 150);
      if (!this.stateDocument.contextNotes.includes(note)) this.stateDocument.contextNotes.push(note);
    }
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
    const cg = this._getCurrentCaregiver();
    const cgLabel = cg ? cg.label : 'this caregiver';

    switch (this.phase) {
      case 'orientation':
        return `Set a warm, unhurried frame. Remind them there are no right answers, this is reflection not assessment, ` +
          `and they can pause or skip anything. Then ask, simply: who raised them? Who was around when they were small? ` +
          `Once they name their caregivers, the handler will note them and move on.`;

      case 'family_structure':
        return `Get a light sketch of the family situation in childhood — who was in the home, where they lived, ` +
          `the overall shape of it. Keep it brief; this just orients you. One question.`;

      case 'caregiver_general':
        return `Begin focused work on the relationship with their ${cgLabel} during CHILDHOOD (not now). ` +
          `Ask how they'd describe that relationship when they were a child. Let them speak generally first. One question.`;

      case 'adjectives':
        return `This is the signature AAI move. Ask them for FIVE words or short phrases that capture their childhood ` +
          `relationship with their ${cgLabel}. They have ${cg ? cg.adjectives.length : 0} of ${ADJECTIVES_PER_CAREGIVER} so far. ` +
          `Collect all five before asking for any memories. If they give them slowly, gently gather one or two at a time. ` +
          `Do NOT ask for supporting memories yet — that comes next.`;

      case 'adjective_evidence': {
        const adj = cg ? cg.adjectives[this.currentAdjectiveIndex] : null;
        return `Now go back through the words for their ${cgLabel}, ONE AT A TIME. ` +
          `Current word to explore: "${adj || ''}" (${this.currentAdjectiveIndex + 1} of ${cg ? cg.adjectives.length : 0}). ` +
          `Ask for a specific memory or concrete moment from childhood that shows that word. ` +
          `Stay with this one word until they offer a memory (or clearly can't). If they can't think of one, ` +
          `normalize it gently ("sometimes the word is hard to pin to a moment — that's okay") and move on. ` +
          `Do NOT interpret or evaluate the gap between word and memory out loud. Just witness.`;
      }

      case 'specific_experiences': {
        const probe = EXPERIENCE_PROBES[this.currentExperienceIndex];
        const probeGuidance = {
          upset: `Ask what they did when they were emotionally upset as a young child, and what would happen — ` +
            `who they'd go to, how their caregivers responded.`,
          hurt_ill: `Ask what happened when they were physically hurt or ill as a child — who cared for them, how.`,
          separation: `Ask about the first times they were separated from their caregivers — how that went, how it felt.`,
          rejection: `Gently ask whether they ever felt rejected as a child — and if so, what they did. ` +
            `Offer full permission to keep it light or skip.`,
          threat: `Gently ask whether they ever felt frightened, threatened, or unsafe as a child — including around ` +
            `discipline. This is sensitive: offer to skip, go slow, watch for activation, and never push.`,
        };
        return `Specific-experiences phase, probe ${this.currentExperienceIndex + 1}/${EXPERIENCE_PROBES.length}: ` +
          `${EXPERIENCE_LABELS[probe]}. ${probeGuidance[probe]} One question. Witness, don't interpret.`;
      }

      case 'caregiver_motivations':
        return `Ask the AAI reflective question: looking back now with adult eyes, why do they think their caregivers ` +
          `behaved the way they did during their childhood? This invites perspective-taking. One question.`;

      case 'loss_disruption':
        return `Gently open the topic of loss or major disruption in childhood (a death, a significant separation). ` +
          `Lead with permission to skip. If they disclose a loss, hold it with care, ask one gentle follow-up about ` +
          `how they understood it then and now, and watch closely for activation or disorientation — slow down and ` +
          `offer grounding if needed. If they say there was none, warmly move on.`;

      case 'adult_effects':
        return `Ask how they feel these early experiences have shaped who they are as an adult — their personality, ` +
          `their relationships. You may also gently ask whether there were setbacks to their development. One question.`;

      case 'integration':
        return `Begin closing. Acknowledge the courage it took. Ask what they're noticing or taking with them from ` +
          `this reflection. You may gently invite them to consider what they want their close relationships ` +
          `(or their own parenting, if relevant) to look like going forward. Do NOT label their attachment style. ` +
          `If they ask "so what am I," redirect to what THEY noticed. End warm and grounded.`;

      case 'complete':
        return `The reflection is complete. Offer a warm, grounded close. Remind them this is a living reflection they ` +
          `can return to, and that what they noticed about themselves matters more than any category.`;

      default:
        return 'Continue the reflection warmly, one question at a time.';
    }
  }

  // ---------------------------------------------------------------------------
  // BACK-END TENTATIVE PATTERN (practitioner-only, NOT user-facing)
  // ---------------------------------------------------------------------------

  /**
   * Roll the accumulated discourse signals into a tentative, heavily-hedged
   * pattern note. This is NOT a diagnosis and is intentionally kept out of the
   * model's user-facing context (see getModeContext()). It exists so a
   * practitioner reviewing the session has a starting hunch.
   */
  _computeTentativePattern() {
    const s = this._patternSignals;

    // Dismissing-leaning: high idealizing + no-recall + minimizing, and many
    // adjectives that lacked supporting memories.
    const dismissingScore =
      s.idealizing + s.noRecall + s.minimizing +
      (s.unsupportedAdjectives * 1.5);

    // Preoccupied-leaning: lingering anger + entanglement.
    const preoccupiedScore = (s.lingeringAnger * 1.5) + (s.entangled * 1.5);

    // Unresolved-leaning: disorientation around loss (only meaningful if loss
    // was disclosed).
    const unresolvedScore = this.lossDisclosed ? s.lossDisorientation * 2 : 0;

    // Secure/autonomous-leaning: coherence + adjectives backed by real memories.
    const secureScore = (s.coherent * 1.5) + (s.supportedAdjectives * 1.2);

    const scored = [
      { pattern: 'secure-leaning (coherent, balanced, memories support descriptions)', score: secureScore },
      { pattern: 'dismissing-leaning (positive labels with thin supporting memory, normalizing, low recall)', score: dismissingScore },
      { pattern: 'preoccupied-leaning (still-active anger or entanglement with caregivers)', score: preoccupiedScore },
      { pattern: 'unresolved-leaning (disorientation around a loss or trauma)', score: unresolvedScore },
    ].sort((a, b) => b.score - a.score);

    const top = scored[0];
    const total = scored.reduce((sum, x) => sum + x.score, 0);

    let confidence = 'very low';
    if (total >= 6 && top.score >= total * 0.5) confidence = 'low-moderate';
    else if (total >= 3) confidence = 'low';

    return {
      tentativePattern: total < 2 ? 'insufficient signal' : top.pattern,
      confidence,
      disclaimer:
        'NOT a diagnosis or AAI classification. The real AAI is coded by trained raters via discourse analysis. ' +
        'This is a coarse, heuristic hunch from keyword signals only, for practitioner orientation. Never shown to the user.',
      signals: { ...s },
      ranked: scored,
      lossDisclosed: this.lossDisclosed,
    };
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  _getCurrentCaregiver() {
    if (this.currentCaregiverIndex < 0 || this.currentCaregiverIndex >= this.caregivers.length) return null;
    return this.caregivers[this.currentCaregiverIndex];
  }

  _isCaregiverComplete(cg) {
    return cg.adjectives.length >= ADJECTIVES_PER_CAREGIVER &&
      Object.keys(cg.evidence).length >= cg.adjectives.length;
  }

  // ---------------------------------------------------------------------------
  // SESSION PROGRESS (returned to screens via chat() result)
  // ---------------------------------------------------------------------------

  getSessionProgress() {
    return {
      phase: this.phase,
      phaseLabel: this._getPhaseLabel(),
      exchangeCount: this.exchangeCount,
      caregiversNamed: this.caregivers.map(c => c.label),
      currentCaregiver: this._getCurrentCaregiver()?.label || null,
      caregiversComplete: this.caregivers.filter(c => this._isCaregiverComplete(c)).length,
      caregiversTotal: this.caregivers.length,
      experiencesComplete: Object.keys(this.experiences).length,
      experiencesTotal: EXPERIENCE_PROBES.length,
      isComplete: this.phase === 'complete',
    };
  }

  _getPhaseLabel() {
    const cg = this._getCurrentCaregiver();
    const labels = {
      orientation: 'Getting Started',
      family_structure: 'Your Family',
      caregiver_general: cg ? `Your ${this._title(cg.label)}` : 'Your Caregivers',
      adjectives: cg ? `Describing Your ${this._title(cg.label)}` : 'Describing',
      adjective_evidence: cg ? `Memories of Your ${this._title(cg.label)}` : 'Memories',
      specific_experiences: 'Specific Moments',
      caregiver_motivations: 'Looking Back',
      loss_disruption: 'Loss & Change',
      adult_effects: 'Who You Are Now',
      integration: 'Reflecting',
      complete: 'Complete',
    };
    return labels[this.phase] || this.phase;
  }

  _title(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  // ---------------------------------------------------------------------------
  // SESSION SUMMARY (for persistence when session ends)
  // ---------------------------------------------------------------------------

  getSessionSummary() {
    return {
      modeId: this.modeId,
      phase: this.phase,
      exchangeCount: this.exchangeCount,
      caregivers: this.caregivers.map(c => ({
        label: c.label,
        generalDescription: c.generalDescription,
        adjectives: c.adjectives,
        evidence: { ...c.evidence },
        complete: this._isCaregiverComplete(c),
      })),
      experiences: { ...this.experiences },
      caregiverMotivations: this.caregiverMotivations,
      lossDisclosed: this.lossDisclosed,
      lossNotes: this.lossNotes,
      adultEffects: this.adultEffects,
      integrationTakeaway: this.integrationTakeaway,
      // Practitioner-only tentative pattern. NOT for user display.
      backendPattern: this._computeTentativePattern(),
      // Raw signal tallies behind backendPattern. Persisted so a resumed
      // session keeps accumulating rather than recomputing the hunch from
      // only the post-resume half of the reflection.
      _patternSignals: { ...this._patternSignals },
      // Cursors + counters. Without these a resumed session restores WHAT was
      // said but not WHERE we were, so _tryAdvance() re-runs phases from the
      // top (re-asking adjectives, replaying experience probes).
      currentCaregiverIndex: this.currentCaregiverIndex,
      currentAdjectiveIndex: this.currentAdjectiveIndex,
      currentExperienceIndex: this.currentExperienceIndex,
      phaseOnlyCounts: { ...this.phaseOnlyCounts },
      phaseExchangeCounts: { ...this.phaseExchangeCounts },
      stateDocument: {
        askedQuestions: [...this.stateDocument.askedQuestions],
        coveredTopics: [...this.stateDocument.coveredTopics],
        contextNotes: [...this.stateDocument.contextNotes],
      },
      phaseHistory: [...this.phaseHistory],
      completed: this.phase === 'complete',
    };
  }
}

export default AdultAttachmentInterviewModeHandler;
