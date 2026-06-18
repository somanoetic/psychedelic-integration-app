/**
 * Unified Huxley Service
 *
 * THE SINGLE AI SERVICE for the entire app. All screens call huxleyService.chat().
 * Replaces: ifsAIService, nervousSystemMappingAIService, polyvagalAIService,
 *           coreBeliefsAIService, dailyJournalAIService, triggersGlimmersAIService,
 *           regulatingResourcesAIService, intentionGuidanceAIService,
 *           enhancedClaudeService, claudeService, therapeuticIntegrationService.
 *
 * Architecture:
 * - Layered prompt: Huxley identity → shared context → exercise catalog → mode prompt → history
 * - Shared conversation history with mode annotations
 * - Structured output (---THERAPEUTIC_DATA---) on every response
 * - masterContextService for cross-domain context
 * - therapeutic_context table for cross-session persistence
 * - All API calls through claudeProxyService (server-side keys)
 * - Mode handlers: optional plugins that add therapeutic process logic
 *   (phase gates, state tracking, detection) per mode
 */

import claudeProxyService from './claudeProxyService';
import masterContextService from './masterContextService';
import metricsService from './metricsService';
import ragService from './ragService';
import huxleyKnowledgeBase from './huxleyKnowledgeBase';
import { MODELS } from './aiModels';
import { supabase } from './supabase';
import { getAllExercises, getExerciseById } from '../content/exercises-comprehensive';
import { HUXLEY_IDENTITY, ALL_MODES } from './huxleyModeConfigs';
// Transient error patterns worth retrying (network blips, transient API errors,
// rate limit windows). Non-transient errors (auth required, bad request) fail
// fast. See BUG-312.
const TRANSIENT_ERROR_RE = /fetch failed|network|ECONNRESET|ETIMEDOUT|ENOTFOUND|socket hang up|abort|529|overload|rate.?limit|429|502|503|504/i;
const PROXY_RETRY_ATTEMPTS = 3;
const PROXY_RETRY_BASE_DELAY_MS = 1500;

function _sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function _callProxyWithRetry(proxy, messages, options) {
  let lastError;
  for (let attempt = 1; attempt <= PROXY_RETRY_ATTEMPTS; attempt++) {
    try {
      return await proxy.sendMessage(messages, options);
    } catch (err) {
      lastError = err;
      const msg = err?.message || '';
      const transient = TRANSIENT_ERROR_RE.test(msg);
      if (!transient || attempt === PROXY_RETRY_ATTEMPTS) throw err;
      const delay = PROXY_RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.warn(`[Huxley] Proxy attempt ${attempt}/${PROXY_RETRY_ATTEMPTS} failed: ${msg}. Retrying in ${delay}ms.`);
      await _sleep(delay);
    }
  }
  throw lastError;
}

import IFSModeHandler from './modeHandlers/IFSModeHandler';
import NervousSystemMappingModeHandler from './modeHandlers/NervousSystemMappingModeHandler';
import NervousSystemExplorationModeHandler from './modeHandlers/NervousSystemExplorationModeHandler';
import CoreBeliefsModeHandler from './modeHandlers/CoreBeliefsModeHandler';
import TriggersGlimmersModeHandler from './modeHandlers/TriggersGlimmersModeHandler';
import RegulatingResourcesModeHandler from './modeHandlers/RegulatingResourcesModeHandler';
import ExperienceMappingModeHandler from './modeHandlers/ExperienceMappingModeHandler';
import PolyvagalCheckinModeHandler from './modeHandlers/PolyvagalCheckinModeHandler';
import JournalModeHandler from './modeHandlers/JournalModeHandler';
import IntentionModeHandler from './modeHandlers/IntentionModeHandler';
import TherapeuticIntegrationModeHandler from './modeHandlers/TherapeuticIntegrationModeHandler';
import ActiveImaginationModeHandler from './modeHandlers/ActiveImaginationModeHandler';
import PhilosophicalTalkthroughModeHandler from './modeHandlers/PhilosophicalTalkthroughModeHandler';
import AdultAttachmentInterviewModeHandler from './modeHandlers/AdultAttachmentInterviewModeHandler';

class HuxleyService {
  constructor() {
    this.conversationHistory = [];
    this.currentMode = 'general';
    this.currentPhase = null;
    this.userId = null;
    this.masterContext = null;
    this.isOnline = true;

    // BUG-313: Crisis latch — once a user discloses suicidal ideation, self-harm,
    // or other critical-priority scenarios in a session, this stays true for the
    // rest of the session. Subsequent prompts always include the crisis protocol
    // and explicitly override mode-specific frameworks until safety is established.
    this.crisisDetected = false;
    this.crisisDetectedAtTurn = null;
    this.crisisTriggers = []; // Which triggers fired

    // One-shot handoff context from a previous service (e.g. the routing chat).
    // Consumed and cleared on the next chat() call so the new mode starts with
    // awareness of what the user just said in triage. Not persisted.
    this.pendingHandoff = null;

    // Cross-session persistence
    this.persistedContextId = null;
    this.therapeuticState = {
      themes: [],
      parts: [],
      completedExercises: [],
      recommendedExercises: [],
      nervousSystemState: null,
    };

    // Exercise catalog (built once, included in prompts)
    this._exerciseCatalog = null;

    // Mode handlers: optional plugins that add session-level process logic.
    // Modes without a handler work exactly as before (prompt + phase label only).
    this.modeHandlers = {
      ifs: new IFSModeHandler(),
      nervous_system_mapping: new NervousSystemMappingModeHandler(),
      nervous_system_exploration: new NervousSystemExplorationModeHandler(),
      polyvagal_checkin: new PolyvagalCheckinModeHandler(),
      core_beliefs: new CoreBeliefsModeHandler(),
      triggers_glimmers: new TriggersGlimmersModeHandler(),
      regulating_resources: new RegulatingResourcesModeHandler(),
      experience_mapping: new ExperienceMappingModeHandler(),
      journal: new JournalModeHandler(),
      intention: new IntentionModeHandler(),
      therapeutic_integration: new TherapeuticIntegrationModeHandler(),
      active_imagination: new ActiveImaginationModeHandler(),
      philosophical_talkthrough: new PhilosophicalTalkthroughModeHandler(),
      adult_attachment_interview: new AdultAttachmentInterviewModeHandler(),
    };
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  /**
   * Initialize Huxley with user context. Call once at app start or login.
   */
  async initialize(userId) {
    this.userId = userId;

    // Load master context + persisted therapeutic context in parallel
    const [masterCtx] = await Promise.all([
      this._loadMasterContext(userId),
      this._loadPersistedContext(userId),
    ]);

    this.masterContext = masterCtx;
    console.log('[Huxley] Initialized for user', userId);
  }

  /**
   * Switch conversation mode. Optionally preserves history.
   */
  /**
   * Accept a recent-context handoff from another service (e.g. the routing chat).
   *
   * The provided text is injected as a one-shot system note on the *next* chat()
   * call, then cleared. Fixes the perceived-memory gap when a user is routed
   * from the triage chat into a specialized mode mid-conversation.
   *
   * @param {string|null} contextText - Plain-text recap of recent turns, or null to clear
   */
  acceptHandoff(contextText) {
    this.pendingHandoff = contextText && contextText.trim() ? contextText.trim() : null;
  }

  setMode(mode, { clearHistory = false } = {}) {
    if (!ALL_MODES[mode]) {
      console.warn(`[Huxley] Unknown mode "${mode}", falling back to general`);
      mode = 'general';
    }
    this.currentMode = mode;
    this.currentPhase = ALL_MODES[mode].phases?.[0] || null;
    if (clearHistory) {
      this.conversationHistory = [];
    }

    // Reset mode handler if one exists for this mode
    const handler = this.modeHandlers[mode];
    if (handler) {
      handler.reset();
      console.log(`[Huxley] Mode handler active: ${mode}`);
    }
  }

  // ===========================================================================
  // MAIN CHAT METHOD
  // ===========================================================================

  /**
   * Send a message to Huxley. This is the ONLY method screens need to call.
   *
   * Transient proxy/API errors (network, 429, 5xx) are retried internally up to
   * PROXY_RETRY_ATTEMPTS times with exponential backoff. If all retries fail —
   * or the error is non-transient — this method THROWS. Callers should wrap
   * in try/catch and surface a retry affordance to the user. Do NOT show the
   * thrown error message verbatim to users (it may contain raw API details);
   * use generic "having trouble — please try again" copy.
   *
   * On error, the orphaned user turn (if any) is rolled out of conversation
   * history so a retry doesn't push a duplicate.
   *
   * @param {string} message - User's message
   * @param {object} [options] - Optional overrides
   * @param {string} [options.mode] - Override current mode for this message
   * @param {string} [options.phase] - Override current phase
   * @param {object} [options.modeContext] - Extra context (e.g. assessment scores for core_beliefs)
   * @returns {Promise<object>} { message, isAI: true, phase, mode, therapeuticData, exerciseRecommendation, sessionProgress }
   * @throws {Error} When the proxy call fails after all retries
   */
  async chat(message, options = {}) {
    const mode = options.mode || this.currentMode;
    const modeConfig = ALL_MODES[mode] || ALL_MODES.general;
    const handler = this.modeHandlers[mode] || null;
    const startTime = Date.now();

    // If a mode handler exists, it controls the phase and injects context
    const phase = handler
      ? handler.getPhase()
      : (options.phase || this.currentPhase);
    const modeContext = handler
      ? { ...options.modeContext, ...handler.getModeContext() }
      : options.modeContext;

    // Track whether we pushed the user message so we can roll back on failure
    // (prevents duplicate user turns if the caller retries after an error).
    let pushedUserMessage = false;

    try {
      // 1. Build the system prompt: a cacheable prefix (systemBlocks) plus a
      // per-turn volatile tail that gets appended to the user message below so
      // it stays out of the cached `system`.
      const { systemBlocks, volatileTail } = await this._buildSystemPrompt(mode, phase, modeContext);

      // 2. Add user message to history (skip empty messages for greeting/init calls)
      if (message && message.trim()) {
        this.conversationHistory.push({
          role: 'user',
          content: message,
          _mode: mode,
          _phase: phase,
          _timestamp: Date.now(),
        });
        pushedUserMessage = true;

        // BUG-313: Check the latest user message for crisis triggers. Once
        // detected in a session, the latch stays set. This prevents the prompt
        // from dropping the crisis protocol on turns where the user's recent
        // message has no trigger keywords (e.g., "i'm okay right now" after
        // disclosing SI two turns ago).
        if (!this.crisisDetected) {
          const detected = huxleyKnowledgeBase.detectScenarios(message);
          const criticalMatch = detected.find((s) => s.priority === 'critical');
          if (criticalMatch) {
            this.crisisDetected = true;
            this.crisisDetectedAtTurn = this.conversationHistory.filter(
              (m) => m.role === 'user'
            ).length;
            this.crisisTriggers = criticalMatch.matchedTriggers;
            console.log(
              `[Huxley] CRISIS LATCH ENGAGED at turn ${this.crisisDetectedAtTurn}: ${criticalMatch.matchedTriggers.join(', ')}`
            );
          }
        }
      }

      // 3. Build messages array (only role + content for API)
      let messages = this.conversationHistory.map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Ensure at least one user message for the API (init/greeting calls may have empty history)
      if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
        const initMessage = message && message.trim()
          ? message.trim()
          : `Start a new ${modeConfig.name || mode} session. Greet me warmly and begin.`;
        messages.push({ role: 'user', content: initMessage });
      }

      // Append the per-turn volatile tail (phase, scenario protocols, RAG, etc.)
      // to the final user message. This keeps the volatile material in the
      // message body instead of `system`, preserving the cached system prefix.
      if (volatileTail) {
        const lastIdx = messages.length - 1;
        messages[lastIdx] = {
          ...messages[lastIdx],
          content: `${messages[lastIdx].content}\n\n---\n${volatileTail}`,
        };
      }

      // 4. Call Claude via proxy (with retry on transient errors — see BUG-312)
      const data = await _callProxyWithRetry(claudeProxyService, messages, {
        system: systemBlocks,
        model: MODELS.PRIMARY,
        maxTokens: modeConfig.maxTokens,
        temperature: 0.7,
      });

      this.isOnline = true;
      const rawResponse = data.content[0].text;

      // 5. Parse structured output
      const { displayMessage, therapeuticData } = this._parseResponse(rawResponse);

      // 6. Add assistant message to history
      this.conversationHistory.push({
        role: 'assistant',
        content: displayMessage,
        _mode: mode,
        _phase: phase,
        _timestamp: Date.now(),
      });

      // 7. Update therapeutic state from structured data
      if (therapeuticData) {
        this._updateTherapeuticState(therapeuticData);
      }

      // 7b. Let mode handler process the response (phase gates, state tracking)
      let sessionProgress = null;
      if (handler) {
        sessionProgress = handler.processResponse(message, displayMessage, therapeuticData);
      }

      // 8. Log metrics
      const durationMs = Date.now() - startTime;
      const tokens = metricsService.constructor.extractTokens(data);
      const cost = tokens ? metricsService.constructor.calculateCost(tokens) : null;

      metricsService.logAIMetric({
        serviceName: 'huxley',
        operation: 'chat',
        durationMs,
        tokens,
        cost,
        status: 'success',
        metadata: { mode, phase, model: MODELS.PRIMARY },
        userId: this.userId,
      });

      // 9. Save persisted context (fire-and-forget)
      this._savePersistedContext(this.userId).catch(e =>
        console.warn('[Huxley] Persist error:', e.message)
      );

      return {
        message: displayMessage,
        isAI: true,
        phase: handler ? handler.getPhase() : phase, // Use handler's updated phase
        mode,
        therapeuticData,
        exerciseRecommendation: therapeuticData?.exerciseRecommendation
          ? getExerciseById(therapeuticData.exerciseRecommendation)
          : null,
        sessionProgress, // null for modes without handlers
      };

    } catch (error) {
      const durationMs = Date.now() - startTime;
      console.error('[Huxley] Chat error:', error.message);
      this.isOnline = false;

      // Roll back the orphaned user turn so a caller-side retry doesn't push
      // a duplicate (see BUG-312).
      if (pushedUserMessage && this.conversationHistory.length > 0) {
        const last = this.conversationHistory[this.conversationHistory.length - 1];
        if (last.role === 'user' && last.content === message) {
          this.conversationHistory.pop();
        }
      }

      metricsService.logAIMetric({
        serviceName: 'huxley',
        operation: 'chat',
        durationMs,
        status: 'error',
        metadata: { mode, phase, error: error.message },
        userId: this.userId,
      });

      metricsService.logError({
        serviceName: 'huxley',
        operation: 'chat',
        errorType: error.name || 'APIError',
        errorMessage: error.message,
        stackTrace: error.stack,
        context: { mode, phase },
        userId: this.userId,
      });

      // Throw so callers' existing try/catch + Alert flow surfaces the error.
      // Do NOT return a static fallback string as a user-facing message —
      // that's BUG-312: the canned text was being shown to users as if it
      // were a real AI response. Callers (DailyJournal, ConversationalNervousSystemMapping,
      // etc.) already handle thrown errors with Alert.alert(...).
      const wrapped = new Error(`Huxley chat failed: ${error.message}`);
      wrapped.cause = error;
      wrapped.huxley = { mode, phase };
      throw wrapped;
    }
  }

  // ===========================================================================
  // PROMPT CONSTRUCTION
  // ===========================================================================

  /**
   * Build the system prompt split into a cacheable prefix and a per-turn
   * volatile tail, for Anthropic prompt caching.
   *
   * Returns `{ systemBlocks, volatileTail }`:
   * - `systemBlocks`: array of Anthropic system content blocks. The single block
   *   is session-stable per mode and carries `cache_control: {type:'ephemeral'}`
   *   so Claude caches it across turns. Contents (in order):
   *     1. Identity
   *     2. Shared therapeutic context (rebuilds only when themes/parts change)
   *     3. Exercise catalog
   *     4. Mode-specific prompt + structured-output instructions
   * - `volatileTail`: a string of per-message material (phase, mode-context,
   *   handoff, crisis/scenario protocols, RAG) that the CALLER appends to the
   *   user message. Keeping it out of `system` preserves the cached prefix.
   *
   * Why the split: the volatile layers used to be interleaved into the middle of
   * `system`, which changed the prefix every turn and defeated caching entirely.
   */
  async _buildSystemPrompt(mode, phase, modeContext) {
    const modeConfig = ALL_MODES[mode] || ALL_MODES.general;

    // --- Cacheable prefix (session-stable per mode) ---
    const prefixParts = [];
    prefixParts.push(HUXLEY_IDENTITY);
    prefixParts.push(this._buildSharedContext());
    prefixParts.push(this._getExerciseCatalog());
    prefixParts.push(`\n## CURRENT MODE: ${modeConfig.name}\n\n${modeConfig.systemPrompt}`);
    prefixParts.push(this._getStructuredOutputInstructions());

    const systemBlocks = [
      {
        type: 'text',
        text: prefixParts.join('\n\n'),
        cache_control: { type: 'ephemeral' },
      },
    ];

    // --- Volatile tail (per-turn; caller appends to the user message) ---
    const tailParts = [];

    if (phase) {
      tailParts.push(`Current Phase: ${phase}`);
    }

    // Mode-specific dynamic context (e.g. core beliefs scores)
    if (modeContext) {
      tailParts.push(`## MODE-SPECIFIC CONTEXT:\n${JSON.stringify(modeContext, null, 2)}`);
    }

    // One-shot handoff: recent transcript from the routing chat, if the user
    // was just navigated here. Consumed (cleared) here so it only seeds the
    // first turn after navigation, not every subsequent turn in this mode.
    if (this.pendingHandoff) {
      tailParts.push(`## HANDOFF CONTEXT (from triage chat just before this mode started)
The user said the following to Huxley in the routing/triage chat moments ago. Use it to greet them with continuity — reference what they said before asking what they want to work on. Do NOT re-ask questions they already answered.

${this.pendingHandoff}`);
      this.pendingHandoff = null;
    }

    // Scenario detection / crisis latch (from knowledge base)
    const lastUserMsg = this.conversationHistory
      .filter(m => m.role === 'user')
      .slice(-1)[0]?.content || '';

    // BUG-313: If the session crisis latch is set, ALWAYS inject the crisis
    // protocol, even if the latest user message doesn't contain trigger keywords.
    // Also inject a crisis-override directive that suspends mode-specific phase
    // advancement and prevents Huxley from returning to e.g. IFS parts inquiry
    // or regulation toolkit work until safety is established.
    if (this.crisisDetected) {
      const crisisProtocol = huxleyKnowledgeBase.getProtocol('crisis');
      if (crisisProtocol) {
        tailParts.push('## ACTIVE CRISIS LATCH (HIGHEST PRIORITY)');
        tailParts.push(crisisProtocol);
        tailParts.push(`This user disclosed crisis content earlier in this session (trigger(s): ${this.crisisTriggers.join(', ')}). The crisis protocol above OVERRIDES the current mode's framework.

Rules while the crisis latch is active:
- Do NOT advance the current mode's phases. Do not return to mode-specific protocols (e.g. IFS parts inquiry, regulation toolkit discovery, experience mapping, parts work, body scans, somatic exercises) until safety is established AND the user has explicitly engaged with a safety plan.
- If the user declines the 988 hotline, do not give up on safety: warmly explore the barrier (fear of police, hospitalization, "making it a whole thing"), offer the chat option (988lifeline.org), suggest a trusted person, or help them contact their therapist sooner. Stay present. Do not silently move on.
- Do not invent or attribute words, descriptions, or part names to the user that they did not say in this conversation. If you reference something they said, use their exact phrasing.
- Brief, warm, plain. One question at a time. Keep checking in on safety.`);
      }
    } else if (lastUserMsg) {
      // No active latch — normal per-turn scenario detection.
      const scenarios = huxleyKnowledgeBase.detectScenarios(lastUserMsg);
      if (scenarios.length > 0) {
        tailParts.push('## DETECTED CLINICAL SCENARIOS:');
        for (const scenario of scenarios.slice(0, 2)) {
          const protocol = huxleyKnowledgeBase.getProtocol(scenario.key);
          if (protocol) tailParts.push(protocol);
        }
      }
    }

    // RAG context (skip if no user message yet)
    if (lastUserMsg && lastUserMsg.trim()) {
      try {
        const ragContext = await ragService.getContextForPrompt(lastUserMsg, {
          maxResults: 3,
          maxTokens: 1500,
          threshold: 0.4,
          categories: modeConfig.ragCategories,
        });
        if (ragContext) tailParts.push(ragContext);
      } catch (e) {
        // Graceful degradation
      }
    }

    return {
      systemBlocks,
      volatileTail: tailParts.length > 0 ? tailParts.join('\n\n') : '',
    };
  }

  /**
   * Build shared context from masterContextService + persisted therapeutic state
   */
  _buildSharedContext() {
    const lines = ['## THERAPEUTIC CONTEXT (across all sessions)'];

    // Persisted themes
    if (this.therapeuticState.themes.length > 0) {
      lines.push(`\nTHEMES IDENTIFIED ACROSS SESSIONS:`);
      this.therapeuticState.themes.forEach(t => lines.push(`- ${t}`));
    }

    // Persisted IFS parts
    if (this.therapeuticState.parts.length > 0) {
      lines.push(`\nKNOWN PARTS (from all sessions):`);
      this.therapeuticState.parts.forEach(p => {
        lines.push(`- "${p.name}" (${p.role}): ${p.notes || ''}`);
      });
    }

    // Current NS state
    if (this.therapeuticState.nervousSystemState) {
      lines.push(`\nLast known nervous system state: ${this.therapeuticState.nervousSystemState}`);
    }

    // Completed exercises
    if (this.therapeuticState.completedExercises.length > 0) {
      lines.push(`\nExercises already completed: ${this.therapeuticState.completedExercises.join(', ')}`);
      lines.push('Avoid re-recommending these unless the user asks.');
    }

    // Master context (from Supabase aggregation)
    if (this.masterContext) {
      const ctx = this.masterContext;

      // IFS parts from master context
      if (ctx.ifs?.recentParts?.length > 0) {
        lines.push(`\nPARTS FROM DATABASE:`);
        ctx.ifs.recentParts.forEach(part => {
          lines.push(`- "${part.name}" (${part.role}): Located in ${part.location || 'unknown'}. ${part.feelings ? `Feels: ${part.feelings.substring(0, 100)}` : ''}`);
        });
      }

      // NS patterns
      if (ctx.nervousSystem?.hasMappedStates) {
        lines.push(`\nNERVOUS SYSTEM PATTERNS:`);
        if (ctx.nervousSystem.sympatheticPatterns?.body_sensations?.length > 0) {
          lines.push(`- Sympathetic sensations: ${ctx.nervousSystem.sympatheticPatterns.body_sensations.slice(0, 3).join(', ')}`);
        }
        if (ctx.nervousSystem.dorsalPatterns?.body_sensations?.length > 0) {
          lines.push(`- Dorsal sensations: ${ctx.nervousSystem.dorsalPatterns.body_sensations.slice(0, 3).join(', ')}`);
        }
      }

      // Integration journals
      if (ctx.integrationJournals?.recentJournals?.length > 0) {
        lines.push(`\nRECENT INTEGRATION INSIGHTS:`);
        ctx.integrationJournals.recentJournals.forEach(journal => {
          if (journal.realizations) lines.push(`- ${journal.realizations.substring(0, 150)}`);
        });
      }

      // Cross-domain connections
      if (ctx.potentialConnections?.length > 0) {
        lines.push(`\nCROSS-DOMAIN CONNECTIONS TO EXPLORE:`);
        ctx.potentialConnections.slice(0, 3).forEach(conn => {
          lines.push(`- ${conn.aiSuggestion}`);
        });
        lines.push('Use these connections naturally when relevant.');
      }
    }

    return lines.join('\n');
  }

  /**
   * Get compact exercise catalog for the prompt
   */
  _getExerciseCatalog() {
    if (!this._exerciseCatalog) {
      const exercises = getAllExercises();
      const lines = ['## EXERCISE CATALOG (recommend by ID when appropriate)'];
      for (const ex of exercises) {
        lines.push(`${ex.id}: ${ex.title} (${ex.category}, ${ex.duration}min)`);
      }
      lines.push('\nTo recommend an exercise, include its ID in the exerciseRecommendation field of your structured output.');
      this._exerciseCatalog = lines.join('\n');
    }
    return this._exerciseCatalog;
  }

  /**
   * Structured output instructions
   */
  _getStructuredOutputInstructions() {
    return `## STRUCTURED OUTPUT (REQUIRED)

After your conversational response, ALWAYS append on a new line:

---THERAPEUTIC_DATA---
{
  "themes": ["array of therapeutic themes you've identified across this conversation"],
  "parts": [{"name": "Part Name", "role": "protector|exile|manager|firefighter|Self", "notes": "brief note"}],
  "nervousSystemState": "ventral|sympathetic|dorsal|null",
  "exerciseRecommendation": "XX-000 or null",
  "recommendationReason": "why this exercise or null"
}

RULES:
- The user NEVER sees anything after ---THERAPEUTIC_DATA---. The app strips it.
- themes: Accumulate across the conversation. Include all identified themes.
- parts: Include all parts identified. Update notes as you learn more.
- nervousSystemState: Your best assessment, or null if unclear.
- exerciseRecommendation: Only recommend when genuinely helpful. Use exercise IDs from the catalog.
- Always include the block, even if all values are null/empty.`;
  }

  // ===========================================================================
  // RESPONSE PARSING
  // ===========================================================================

  /**
   * Parse Claude's response to extract display message and therapeutic data
   */
  _parseResponse(rawResponse) {
    const marker = '---THERAPEUTIC_DATA---';
    const markerIndex = rawResponse.indexOf(marker);

    if (markerIndex === -1) {
      return { displayMessage: rawResponse.trim(), therapeuticData: null };
    }

    const displayMessage = rawResponse.substring(0, markerIndex).trim();
    const jsonString = rawResponse.substring(markerIndex + marker.length).trim();

    try {
      const therapeuticData = JSON.parse(jsonString);
      return { displayMessage, therapeuticData };
    } catch (e) {
      // Try to extract JSON from the remaining text
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const therapeuticData = JSON.parse(jsonMatch[0]);
          return { displayMessage, therapeuticData };
        } catch (e2) {
          console.warn('[Huxley] Could not parse therapeutic data:', e2.message);
        }
      }
      return { displayMessage, therapeuticData: null };
    }
  }

  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================

  /**
   * Update in-memory therapeutic state from structured output
   */
  _updateTherapeuticState(data) {
    // Merge themes (deduplicate)
    if (data.themes && Array.isArray(data.themes)) {
      const existing = new Set(this.therapeuticState.themes.map(t => t.toLowerCase()));
      for (const theme of data.themes) {
        if (!existing.has(theme.toLowerCase())) {
          this.therapeuticState.themes.push(theme);
          existing.add(theme.toLowerCase());
        }
      }
      // Keep last 20 themes
      if (this.therapeuticState.themes.length > 20) {
        this.therapeuticState.themes = this.therapeuticState.themes.slice(-20);
      }
    }

    // Merge parts (update existing, add new)
    if (data.parts && Array.isArray(data.parts)) {
      for (const newPart of data.parts) {
        const existingIdx = this.therapeuticState.parts.findIndex(
          p => p.name.toLowerCase() === newPart.name.toLowerCase()
        );
        if (existingIdx >= 0) {
          // Update existing part
          this.therapeuticState.parts[existingIdx] = {
            ...this.therapeuticState.parts[existingIdx],
            ...newPart,
          };
        } else {
          this.therapeuticState.parts.push(newPart);
        }
      }
    }

    // Update NS state
    if (data.nervousSystemState) {
      this.therapeuticState.nervousSystemState = data.nervousSystemState;
    }

    // Track recommended exercises
    if (data.exerciseRecommendation) {
      if (!this.therapeuticState.recommendedExercises.includes(data.exerciseRecommendation)) {
        this.therapeuticState.recommendedExercises.push(data.exerciseRecommendation);
      }
    }
  }

  /**
   * Mark an exercise as completed by the user
   */
  markExerciseCompleted(exerciseId) {
    if (!this.therapeuticState.completedExercises.includes(exerciseId)) {
      this.therapeuticState.completedExercises.push(exerciseId);
    }
  }

  // ===========================================================================
  // PERSISTENCE
  // ===========================================================================

  async _loadMasterContext(userId) {
    try {
      return await masterContextService.getMasterContext(userId, {
        focus: 'all',
        includeConnections: true,
        maxJournals: 3,
        maxParts: 10,
      });
    } catch (error) {
      console.error('[Huxley] Error loading master context:', error);
      return null;
    }
  }

  async _loadPersistedContext(userId) {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('therapeutic_context')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('[Huxley] Error loading persisted context:', error.message);
        return;
      }

      if (data) {
        this.therapeuticState.themes = data.themes || [];
        this.therapeuticState.parts = data.parts || [];
        this.therapeuticState.completedExercises = data.completed_exercises || [];
        this.therapeuticState.recommendedExercises = data.recommended_exercises || [];
        this.therapeuticState.nervousSystemState = data.nervous_system_state || null;
        this.persistedContextId = data.id;
        console.log('[Huxley] Loaded persisted context:', {
          themes: this.therapeuticState.themes.length,
          parts: this.therapeuticState.parts.length,
          exercises: this.therapeuticState.completedExercises.length,
        });
      }
    } catch (err) {
      console.warn('[Huxley] Could not load persisted context:', err.message);
    }
  }

  async _savePersistedContext(userId) {
    if (!userId) return;

    const contextData = {
      user_id: userId,
      themes: this.therapeuticState.themes,
      parts: this.therapeuticState.parts,
      completed_exercises: this.therapeuticState.completedExercises,
      recommended_exercises: this.therapeuticState.recommendedExercises,
      nervous_system_state: this.therapeuticState.nervousSystemState,
      updated_at: new Date().toISOString(),
    };

    try {
      if (this.persistedContextId) {
        const { error } = await supabase
          .from('therapeutic_context')
          .update(contextData)
          .eq('id', this.persistedContextId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('therapeutic_context')
          .insert(contextData)
          .select()
          .single();
        if (error) throw error;
        this.persistedContextId = data.id;
      }
    } catch (err) {
      console.warn('[Huxley] Could not save persisted context:', err.message);
    }

    // Clear master context cache so next load gets fresh data
    masterContextService.clearCache(userId);
  }

  // ===========================================================================
  // CONVENIENCE METHODS
  // ===========================================================================

  /**
   * Get conversation history (without internal metadata)
   */
  getConversationHistory() {
    return this.conversationHistory.map(m => ({
      role: m.role,
      content: m.content,
    }));
  }

  /**
   * Get current therapeutic state
   */
  getTherapeuticState() {
    return { ...this.therapeuticState };
  }

  /**
   * Get the active mode handler (if any). Screens can use this for
   * mode-specific queries like getSessionSummary().
   * @returns {BaseModeHandler|null}
   */
  getModeHandler() {
    return this.modeHandlers[this.currentMode] || null;
  }

  /**
   * Get session summary from the active mode handler.
   * Call this when a session ends to get structured data for persistence.
   * @returns {object|null}
   */
  getSessionSummary() {
    const handler = this.getModeHandler();
    return handler ? handler.getSessionSummary() : null;
  }

  /**
   * Reset for a new conversation (keeps persisted state)
   */
  reset() {
    this.conversationHistory = [];
    this.currentPhase = ALL_MODES[this.currentMode]?.phases?.[0] || null;
    // BUG-313: crisis latch is per-session — clear on new conversation
    this.crisisDetected = false;
    this.crisisDetectedAtTurn = null;
    this.crisisTriggers = [];
    // Reset mode handler too
    const handler = this.getModeHandler();
    if (handler) handler.reset();
  }

  /**
   * Full reset (clears everything except userId)
   */
  fullReset() {
    this.conversationHistory = [];
    this.currentMode = 'general';
    this.currentPhase = null;
    this.masterContext = null;
    // BUG-313: crisis latch is per-session — clear on full reset
    this.crisisDetected = false;
    this.crisisDetectedAtTurn = null;
    this.crisisTriggers = [];
    // Note: therapeuticState is NOT cleared — it persists across sessions
    // Reset all mode handlers
    Object.values(this.modeHandlers).forEach(h => h.reset());
  }

  /**
   * Check if the service is using AI (vs fallback)
   */
  isUsingAI() {
    return this.isOnline;
  }

  /**
   * Refresh master context (call after significant data changes)
   */
  async refreshContext() {
    if (this.userId) {
      masterContextService.clearCache(this.userId);
      this.masterContext = await this._loadMasterContext(this.userId);
    }
  }

  /**
   * Extract structured data from the conversation for domain-specific saves.
   * Replaces old service-specific extractMappingData/extractResourcesData/etc.
   *
   * @param {string} extractionPrompt - A prompt describing what to extract and the JSON format
   * @returns {Promise<object>} Parsed JSON data
   */
  async extractData(extractionPrompt) {
    const conversationText = this.conversationHistory
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('\n\n');

    const fullPrompt = `${extractionPrompt}\n\nConversation:\n${conversationText}\n\nReturn ONLY valid JSON.`;

    try {
      const data = await claudeProxyService.sendMessage(
        [{ role: 'user', content: fullPrompt }],
        { model: MODELS.PRIMARY, maxTokens: 800, temperature: 0 }
      );

      const jsonText = data.content[0].text;
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('[Huxley] Extraction error:', error);
      return {};
    }
  }

  /**
   * Generate a title from the conversation (useful for journals)
   */
  async generateTitle() {
    const conversationText = this.conversationHistory
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join(' ');

    try {
      const data = await claudeProxyService.sendMessage(
        [{ role: 'user', content: `Generate a short, meaningful title (3-6 words) for this journal entry:\n\n${conversationText.substring(0, 500)}\n\nTitle:` }],
        { model: MODELS.PRIMARY, maxTokens: 50, temperature: 0.7 }
      );
      return data.content[0].text.trim().replace(/^["']|["']$/g, '');
    } catch (error) {
      console.error('[Huxley] Title generation error:', error);
      return `Journal Entry - ${new Date().toLocaleDateString()}`;
    }
  }
}

// Export singleton
export default new HuxleyService();
