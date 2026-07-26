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

// RAG is best-effort grounding, not a hard dependency: the mode prompts are
// self-contained and work without it. RAG output sits IN the prompt (volatile
// tail), so chat() cannot send the Claude call — and therefore cannot emit the
// first streamed token — until RAG resolves OR this budget fires. That makes
// this cap the primary lever on time-to-first-token (ttft): whatever RAG hasn't
// finished by RAG_TIMEOUT_MS, the turn proceeds without it. The underlying fetch
// is NOT cancelled — it keeps running and may warm the RAG cache for a later
// turn — we just stop *waiting* on it.
//
// Chosen deliberately below steady-state RAG (~0.9–1.8s embed+search on device)
// to bias toward responsiveness now that streaming is live:
//   - Fast turns (embed cache-warm / short search) finish under the cap and
//     still get their knowledge chunk — no change for them.
//   - Slow/cold turns (embed MISS + cold pgvector, seen at 1.8–2.9s) hit the cap
//     and proceed WITHOUT RAG rather than making the user stare at a spinner.
// This is an explicit speed-over-grounding trade on the slow tail. It is safe
// because (a) the mode prompts stand alone, and (b) device logs show slow turns
// frequently returned 0 or marginal (36–38%) matches anyway — little lost.
//
// PRIOR NOTE (superseded): an earlier handoff said "do NOT drop below 2000, cold
// turns hit 2143ms." That was BEFORE streaming — a timed-out turn then meant the
// user waited the full 2s in silence for nothing. With streaming, the cap only
// governs how long we delay first-token, and dropping RAG on a slow turn is the
// RIGHT call. Real remaining fix is prefetch-while-typing (warms the cache so
// the send-turn is a hit); this cap is the interim step. Tune from device ttft=.
const RAG_TIMEOUT_MS = 900;

function _sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Race a promise against a timeout. If `promise` doesn't settle within `ms`,
 * resolve to `fallback` instead. The original promise is NOT cancelled — a slow
 * RAG fetch keeps running and may still warm the RAG cache for a later turn.
 */
function _withTimeout(promise, ms, fallback) {
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function _callProxyWithRetry(proxy, messages, options) {
  let lastError;
  for (let attempt = 1; attempt <= PROXY_RETRY_ATTEMPTS; attempt++) {
    try {
      // Streaming path: sendMessageStream returns the same {content, usage} shape
      // as sendMessage, so callers/parsers downstream are identical. Retry is
      // only safe on attempts that emitted NOTHING to the UI — once onToken has
      // fired, a retry would double-render. We guard that in chat() by only
      // passing onStream on the FIRST attempt via a wrapper that latches.
      if (options.onStream) {
        return await proxy.sendMessageStream(messages, {
          ...options,
          onToken: options.onStream,
        });
      }
      return await proxy.sendMessage(messages, options);
    } catch (err) {
      lastError = err;
      const msg = err?.message || '';
      const transient = TRANSIENT_ERROR_RE.test(msg);
      if (!transient || attempt === PROXY_RETRY_ATTEMPTS) throw err;
      // If a streamed attempt already emitted tokens, we cannot silently retry
      // (the UI has partial text). Surface the error so the caller resets.
      if (options.onStream && options._streamEmitted && options._streamEmitted()) {
        throw err;
      }
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

    // Perf instrumentation: last RAG retrieval wall-time (ms) and whether it
    // exceeded RAG_TIMEOUT_MS (so chat() proceeded without RAG this turn). Set
    // by _startRagRetrieval, read by the chat() PERF log. See [Huxley PERF].
    this._lastRagMs = 0;
    this._lastRagTimedOut = false;
    // Whether _startRagRetrieval reused a prefetched result this turn (vs. ran a
    // fresh search). Read by the chat() PERF log so we can measure how often the
    // prefetch actually lands — i.e. the divergence rate that decides whether the
    // deferred "bridge message" work is worth building. See prefetchRag().
    this._lastRagReused = false;

    // Last RAG prefetch launched while the user was typing (see prefetchRag).
    // { query, formatted } where `formatted` is the Promise<string> from
    // getContextForPrompt. _startRagRetrieval reuses this when the sent message
    // is "close enough" to `query`, turning the inline embed into a no-op.
    this._ragPrefetch = null;

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
   * @param {(delta:string)=>void} [options.onToken] - If provided, the reply is
   *   STREAMED: onToken fires with each new chunk of user-facing PROSE as it
   *   arrives (the ---THERAPEUTIC_DATA--- JSON tail is gated out and never
   *   emitted). The returned object is identical to the non-streamed path — same
   *   fields, parsed the same way — so callers that pass onToken get live text
   *   AND the final structured result. Callers that omit it are unchanged.
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
      // 1. Add user message to history FIRST (skip empty messages for
      // greeting/init calls). This must happen before RAG launch and prompt
      // build so both key off the CURRENT turn: previously the message was
      // pushed after _buildSystemPrompt, so RAG and per-turn scenario detection
      // ran against the PRIOR user message — and skipped the very first turn
      // entirely (empty history → empty query). Pushing here fixes both.
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

      // 2. Kick off the RAG retrieval NOW, before the synchronous prompt
      // assembly, so the (network-bound) embeddings + vector search overlaps
      // with string building and the auth/session lookups instead of running
      // strictly in series ahead of the Claude call. We pass the promise into
      // _buildSystemPrompt, which awaits it only at the very end when it
      // assembles the volatile tail. RAG output goes INTO the prompt, so it
      // cannot overlap the Claude call itself — but it fully overlaps everything
      // else. Because the user message is now already in history, RAG queries
      // against the CURRENT turn.
      const ragPromise = this._startRagRetrieval(modeConfig);

      // 3. Build the system prompt: a cacheable prefix (systemBlocks) plus a
      // per-turn volatile tail that gets appended to the user message below so
      // it stays out of the cached `system`.
      const buildStart = Date.now();
      const { systemBlocks, volatileTail } = await this._buildSystemPrompt(mode, phase, modeContext, ragPromise);
      const buildMs = Date.now() - buildStart;

      // 4. Build messages array (only role + content for API)
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

      // 5. Call Claude via proxy (with retry on transient errors — see BUG-312)
      const claudeStart = Date.now();
      const proxyOptions = {
        system: systemBlocks,
        model: MODELS.PRIMARY,
        maxTokens: modeConfig.maxTokens,
        temperature: 0.7,
      };

      // Streaming: gate raw token deltas so the caller only ever sees user-facing
      // PROSE, never the ---THERAPEUTIC_DATA--- JSON tail. The model emits prose
      // BEFORE the marker, so we forward deltas until the marker appears in the
      // accumulating text, then stop. We track a small overlap window because the
      // marker itself can be split across two deltas.
      let ttftMs = null; // time-to-first-token, for the PERF line
      const MARKER = '---THERAPEUTIC_DATA---';
      const gate = { acc: '', emittedLen: 0, closed: false, emittedAny: false };
      if (typeof options.onToken === 'function') {
        proxyOptions._streamEmitted = () => gate.emittedAny;
        proxyOptions.onStream = (delta) => {
          if (ttftMs === null) ttftMs = Date.now() - claudeStart;
          gate.acc += delta;
          if (gate.closed) return;
          const mIdx = gate.acc.indexOf(MARKER);
          if (mIdx !== -1) {
            // Emit prose up to the marker, then close the gate for good.
            if (mIdx > gate.emittedLen) {
              options.onToken(gate.acc.slice(gate.emittedLen, mIdx));
              gate.emittedAny = true;
            }
            gate.emittedLen = mIdx;
            gate.closed = true;
            return;
          }
          // Marker not seen yet. Hold back a tail as long as the marker so we
          // never emit a partial marker that's about to complete next delta.
          const safeLen = Math.max(gate.emittedLen, gate.acc.length - MARKER.length);
          if (safeLen > gate.emittedLen) {
            options.onToken(gate.acc.slice(gate.emittedLen, safeLen));
            gate.emittedLen = safeLen;
            gate.emittedAny = true;
          }
        };
      }

      const data = await _callProxyWithRetry(claudeProxyService, messages, proxyOptions);
      const claudeMs = Date.now() - claudeStart;

      // Flush any prose held back by the marker guard. If the response had NO
      // marker, the gate withheld the final MARKER-length tail as a precaution;
      // emit it now so the streamed text matches the parsed displayMessage.
      if (typeof options.onToken === 'function' && !gate.closed) {
        const mIdx = gate.acc.indexOf(MARKER);
        const end = mIdx === -1 ? gate.acc.length : mIdx;
        if (end > gate.emittedLen) {
          options.onToken(gate.acc.slice(gate.emittedLen, end));
          gate.emittedAny = true;
        }
      }

      this.isOnline = true;
      const rawResponse = data.content[0].text;

      // PERF BREAKDOWN (dev only). Reads:
      // - rag:    true RAG wall-time (network embeddings + vector search)
      // - build:  synchronous prompt assembly + any time spent BLOCKED awaiting
      //           RAG at the tail. If build >> rag, parallelization hid RAG well.
      //           If build ≈ rag, RAG is on the critical path and outlasts build.
      // - claude: the model call (usually the dominant cost; non-streamed, so
      //           this is full generation time, not time-to-first-token).
      // - total:  end-to-end wall-time for the turn.
      if (__DEV__) {
        const { cache_read_input_tokens: cRead, cache_creation_input_tokens: cCreated } =
          data.usage || {};
        const ragTag = this._lastRagTimedOut ? ' (TIMED OUT, no RAG this turn)' : '';
        // REUSED = the send message was close enough to the typed-ahead prefetch
        // that we reused its result (no inline embed). fresh = a real search ran
        // this turn. The REUSED:fresh ratio is the divergence rate that decides
        // whether the deferred "bridge message" work is worth building.
        const reuseTag = this._lastRagReused ? ' REUSED' : ' fresh';
        // Per-stage server split of the RAG second (from the edge fn timing,
        // surfaced via ragService.lastServerTiming) so the real auth/embed/rpc
        // breakdown shows on-device without reading Supabase logs. Absent on a
        // RAG cache hit / timeout / empty-query turn (no live server call).
        const st = ragService.lastServerTiming;
        const ragSplit = st
          ? ` [auth=${st.authMs}(${st.authPath || '?'}) embed=${st.embedMs}${st.embedCacheHit ? 'H' : 'M'} rpc=${st.rpcMs} net=${Math.max(0, st.clientMs - st.authMs - st.embedMs - st.rpcMs)}]`
          : '';
        // out= is reply + JSON tail combined, so it can't measure prose length.
        // Split on the marker here (log-only; the real parse happens below) to
        // surface the user-facing reply size vs the extraction JSON size. ~4
        // chars/token is a rough guide. Temporary instrumentation for the
        // brevity work — remove once reply length is dialed in.
        const _mIdx = rawResponse.indexOf('---THERAPEUTIC_DATA---');
        const _replyChars = (_mIdx === -1 ? rawResponse : rawResponse.slice(0, _mIdx)).trim().length;
        const _jsonChars = _mIdx === -1 ? 0 : rawResponse.slice(_mIdx).trim().length;
        // ttft= (time-to-first-token) is the number that matters once streaming:
        // how long until text STARTS appearing, vs claude= (full generation).
        // Only present on streamed turns (onToken passed); '-' otherwise.
        const ttftTag = ttftMs !== null ? `ttft=${ttftMs}ms ` : '';
        console.log(
          `[Huxley PERF] mode=${mode} rag=${this._lastRagMs ?? '?'}ms${reuseTag}${ragSplit}${ragTag} ` +
          `build=${buildMs}ms ${ttftTag}claude=${claudeMs}ms total=${Date.now() - startTime}ms ` +
          `| cache read=${cRead || 0} created=${cCreated || 0} in=${data.usage?.input_tokens || 0} out=${data.usage?.output_tokens || 0} ` +
          `| reply=${_replyChars}c json=${_jsonChars}c${_mIdx === -1 ? ' (NO MARKER)' : ''}`
        );
      }

      // 6. Parse structured output
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
   * Start the RAG retrieval for this turn, returning a promise the caller awaits
   * later (see chat()). Launching it early lets the network-bound embeddings +
   * vector search overlap with synchronous prompt assembly rather than blocking
   * ahead of it.
   *
   * The query is the last user message in conversationHistory. chat() now pushes
   * the current turn BEFORE calling this, so RAG queries against the current
   * message (previously it saw the prior turn and skipped turn 1 entirely).
   * Returns a promise resolving to a formatted context block (or '').
   * Errors degrade gracefully to '' (RAG is best-effort grounding, never fatal).
   *
   * @param {object} modeConfig - The resolved mode config (for ragCategories)
   * @returns {Promise<string>}
   */
  _startRagRetrieval(modeConfig) {
    const lastUserMsg = this.conversationHistory
      .filter(m => m.role === 'user')
      .slice(-1)[0]?.content || '';

    if (!lastUserMsg || !lastUserMsg.trim()) {
      this._lastRagMs = 0;
      return Promise.resolve('');
    }

    // Record true RAG wall-time (launch → resolve), independent of when chat()
    // awaits it. Compared against the prompt-build time, this tells us whether
    // parallelization fully hid RAG (rag <= build) or RAG is the bottleneck.
    const ragStart = Date.now();
    this._lastRagMs = null;       // in-flight marker
    this._lastRagTimedOut = false; // reset per turn
    this._lastRagReused = false;   // reset per turn

    // Reuse-if-close: if a prefetch (fired while the user was typing) queried
    // text close enough to what they actually sent, reuse its result instead of
    // paying a fresh embed inline. The prefetch draft is almost always a prefix
    // of the final message (user paused mid-sentence, then finished it), so the
    // retrieved knowledge is the same in practice. A genuine topic change
    // (_ragQueryIsClose returns false) still falls through to a fresh search.
    const prefetch = this._ragPrefetch;
    this._ragPrefetch = null; // consume it; a stale prefetch shouldn't leak forward
    if (prefetch && this._ragQueryIsClose(lastUserMsg, prefetch.query)) {
      this._lastRagReused = true;
      // The prefetch promise already ran (or is running) getContextForPrompt with
      // identical options, so its resolved string is what a fresh call would
      // return. Still honor the timeout cap in case the prefetch is slow/in-flight.
      const reuseFetch = prefetch.formatted
        .catch(() => '')
        .finally(() => { this._lastRagMs = Date.now() - ragStart; });
      const TIMED_OUT_REUSE = Symbol('rag_timeout');
      return _withTimeout(reuseFetch, RAG_TIMEOUT_MS, TIMED_OUT_REUSE).then((result) => {
        if (result === TIMED_OUT_REUSE) {
          this._lastRagTimedOut = true;
          return '';
        }
        return result;
      });
    }
    // Clear last turn's server split so the PERF line only shows a breakdown
    // when THIS turn actually made a live (non-cached) search call. A RAG
    // client-cache hit, timeout, or empty-query turn leaves this null → no split.
    ragService.lastServerTiming = null;

    // The real retrieval. Keep the true wall-time on _lastRagMs even if we stop
    // waiting on it below — so PERF logs show actual RAG latency, not the cap.
    const ragFetch = ragService
      .getContextForPrompt(lastUserMsg, {
        maxResults: 3,
        maxTokens: 1500,
        // 0.30 (was 0.4): the earlier 0-results were NOT primarily a threshold
        // issue — IFS mode was filtering ['ifs'] only, so somatic felt-sense
        // queries ("pressure in my chest") matched 0 rows (that content is
        // categorized 'somatic'; fixed in huxleyModeConfigs ifsMode). With the
        // category widened, verified score tiers via knowledge-base/rag/search.py:
        // parts hits 54-56% (ifs), somatic felt-sense hits 31-38% (somatic).
        // 0.30 admits the somatic tier while still filtering noise (<30%). Very
        // terse fragments ("right under my sternum") still return 0 — too short
        // to embed meaningfully; that's expected, not a bug.
        // Tune from device [score%] logs; see handoffs/rag-speed-and-quality.md.
        threshold: 0.30,
        categories: modeConfig.ragCategories,
      })
      .catch(() => '') // Graceful degradation — never let RAG failure break chat
      .finally(() => { this._lastRagMs = Date.now() - ragStart; });

    // Cap how long chat() will block on it. On timeout we proceed with '' (no
    // RAG this turn); the underlying fetch keeps running and may warm the RAG
    // cache for a later turn. A sentinel distinguishes "timed out" from a
    // genuine empty result so we can flag it in the PERF log.
    const TIMED_OUT = Symbol('rag_timeout');
    return _withTimeout(ragFetch, RAG_TIMEOUT_MS, TIMED_OUT).then((result) => {
      if (result === TIMED_OUT) {
        this._lastRagTimedOut = true;
        return '';
      }
      return result;
    });
  }

  /**
   * Warm the RAG cache for a draft the user is still typing.
   *
   * The dominant remaining time-to-first-token cost is the RAG embed: every send
   * turn is a fresh, unique query, so it's an embed MISS paid inline before the
   * first token can appear. This runs the SAME search (identical query text and
   * options) in the background during the dead time while the user types, so the
   * real send-turn call in _startRagRetrieval is a client-cache HIT — RAG then
   * resolves ~instantly and the 900ms cap rarely fires.
   *
   * Cache-hit contract (see ragService._cacheKey): the key is
   * `query|maxResults|threshold|categories`. This method MUST pass the exact same
   * query text and the same options as _startRagRetrieval, or the send turn keys
   * a different entry and pays the embed anyway. If the user edits the draft
   * before sending, the literal hit is lost, but the fetch still warms the
   * embed pipeline server-side (and OpenAI may cache the near-identical embed).
   *
   * Fire-and-forget: caller does not await, and all errors are swallowed. This
   * never affects correctness — it only pre-populates a cache that _startRagRetrieval
   * reads. Callers should debounce (only after typing pauses) and skip very short
   * drafts, which return 0 results and just waste an embed call.
   *
   * @param {string} draftText - The in-progress input text.
   * @param {object} [options]
   * @param {string} [options.mode] - Mode override; defaults to currentMode, so
   *   the categories match the mode the send turn will use.
   */
  prefetchRag(draftText, options = {}) {
    const query = (draftText || '').trim();
    // Skip short drafts: too terse to embed meaningfully (they return 0 rows),
    // so a prefetch just burns an embed call. Mirror the "too short" reality
    // noted in _startRagRetrieval's threshold comment.
    if (query.length < 15) return;

    const mode = options.mode || this.currentMode;
    const modeConfig = ALL_MODES[mode] || ALL_MODES.general;

    // Options MUST match _startRagRetrieval exactly (minus maxTokens, which is a
    // formatting-only arg and is NOT part of the cache key). Hold onto the
    // promise so _startRagRetrieval can REUSE this exact retrieval when the sent
    // message is close to `query` — that reuse (not the ragService text-keyed
    // cache) is what turns the send turn into a no-embed HIT, since the draft is
    // usually only a prefix of the final message and wouldn't match by text.
    const formatted = ragService
      .getContextForPrompt(query, {
        maxResults: 3,
        maxTokens: 1500,
        threshold: 0.30,
        categories: modeConfig.ragCategories,
      })
      .catch(() => ''); // Never let a background prefetch surface an error.

    this._ragPrefetch = { query, formatted };

    if (__DEV__) {
      formatted.then(() =>
        console.log(`[Huxley PERF] RAG prefetch warmed for "${query.substring(0, 40)}"`)
      );
    }
  }

  /**
   * Whether a sent message is "close enough" to a prefetched draft to reuse the
   * prefetch's RAG result rather than run a fresh embed+search.
   *
   * The dominant real-world case is: the user paused mid-sentence (prefetch fired
   * on that partial draft), then finished the thought and sent — so the final
   * message STARTS WITH the prefetched draft. We also accept the exact-match and
   * the "trimmed a little off the end" cases. A genuine topic change (rewrote the
   * message to something unrelated) fails all of these and gets a fresh search.
   *
   * Deliberately conservative: a false "close" reuses knowledge retrieved from a
   * partial sentence (usually fine — meaning is mostly present by mid-sentence),
   * but a wildly wrong reuse would ground the reply on the wrong material, so we
   * only reuse on a clear prefix/suffix containment, not fuzzy similarity.
   */
  _ragQueryIsClose(sent, prefetched) {
    // Normalize for comparison: lowercase, collapse whitespace, and strip
    // punctuation. Real typing adds punctuation and trailing spaces mid-draft
    // (e.g. prefetch caught "...wanted to be." with a stray period, final was
    // "...wanted to be a doctor" — a clean prefix in meaning but NOT a literal
    // one because of that period). Comparing on words-only makes the prefix test
    // robust to that. This only gates REUSE of retrieved knowledge, not the
    // actual query text sent to the embed, so loosening it can't corrupt output.
    const norm = (s) =>
      (s || '')
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')   // punctuation -> space
        .replace(/\s+/g, ' ')       // collapse runs of whitespace
        .trim();
    const a = norm(sent);
    const b = norm(prefetched);
    if (!a || !b) return false;
    if (a === b) return true;
    // Prefetch was a prefix of what got sent (typed more after the pause), or the
    // reverse (user backspaced a little). Compare on a word boundary so a short
    // prefetch isn't treated as a prefix of a longer word ("wond" vs "wonder");
    // require the shared prefix to be substantial so "I'm" -> a whole new
    // sentence doesn't count as close.
    const shorter = a.length < b.length ? a : b;
    const longer = a.length < b.length ? b : a;
    if (shorter.length < 15) return false;
    return longer === shorter || longer.startsWith(shorter + ' ');
  }

  /**
   * Build the system prompt split into a cacheable prefix and a per-turn
   * volatile tail, for Anthropic prompt caching.
   *
   * Returns `{ systemBlocks, volatileTail }`:
   * - `systemBlocks`: array of Anthropic system content blocks. The single block
   *   is session-stable per mode and carries `cache_control: {type:'ephemeral'}`
   *   so Claude caches it across turns. Contents (in order), ALL stable per mode:
   *     1. Identity
   *     2. Exercise catalog
   *     3. Mode-specific prompt + structured-output instructions
   *   NOTE: shared therapeutic context is deliberately NOT here — it mutates
   *   mid-session and would bust the cache; it lives in the volatile tail.
   * - `volatileTail`: a string of per-message material (phase, shared therapeutic
   *   context, mode-context, handoff, crisis/scenario protocols, RAG) that the
   *   CALLER appends to the user message. Keeping it out of `system` preserves
   *   the cached prefix.
   *
   * Why the split: the volatile layers used to be interleaved into the middle of
   * `system`, which changed the prefix every turn and defeated caching entirely.
   *
   * @param {Promise<string>} ragPromise - In-flight RAG retrieval launched by
   *   chat() so it overlaps this synchronous assembly; awaited at the tail.
   */
  async _buildSystemPrompt(mode, phase, modeContext, ragPromise) {
    const modeConfig = ALL_MODES[mode] || ALL_MODES.general;

    // --- Cacheable prefix (session-stable per mode) ---
    // IMPORTANT: everything here must be STABLE across turns, or the cached
    // prefix changes and Claude re-writes all ~6,900 tokens (cache read=0,
    // created=~6900) instead of reading them. _buildSharedContext() is NOT
    // stable — it emits therapeutic state (themes, parts, NS state, master
    // context) that mutates as the session extracts new parts/themes. It USED
    // to live here and intermittently busted the cache the moment state changed
    // mid-session. It now rides in the volatile tail below. What's left here is
    // genuinely session-stable per mode: identity, exercise catalog, mode
    // prompt, and the structured-output instructions.
    const prefixParts = [];
    prefixParts.push(HUXLEY_IDENTITY);
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

    // Shared therapeutic context (themes, parts, NS state, master context).
    // Moved here OUT of the cached prefix: it mutates as the session extracts
    // new parts/themes, and any change to the prefix forces a full cache
    // rewrite. It's small relative to the prefix, so paying for it uncached in
    // the tail is far cheaper than letting it intermittently bust the ~6,900-
    // token cached prefix. _buildSharedContext() always returns at least its
    // header line; only emit when there's actual content under it (>1 line),
    // so empty-state turns don't tack a bare header onto every tail.
    const sharedContext = this._buildSharedContext();
    if (sharedContext && sharedContext.trim().split('\n').length > 1) {
      tailParts.push(sharedContext);
    }

    // Mode-specific dynamic context (e.g. core beliefs scores, IFS session
    // state). Compact JSON (no pretty-print indentation) — this rides uncached
    // in the tail every turn and the IFS modeContext in particular accumulates
    // (parts, phaseSummaries, stateDocument), so the whitespace is pure token
    // waste. The model parses minified JSON fine.
    if (modeContext) {
      tailParts.push(`## MODE-SPECIFIC CONTEXT:\n${JSON.stringify(modeContext)}`);
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

    // RAG context — the retrieval was launched at the top of chat() so it could
    // overlap the synchronous prompt assembly above. Await it here at the point
    // we actually need it. _startRagRetrieval already handles the empty-message
    // and error cases (resolving to ''), so no try/catch needed.
    if (ragPromise) {
      const ragContext = await ragPromise;
      if (ragContext) tailParts.push(ragContext);
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
  "themes": ["array of NEW themes surfaced THIS turn"],
  "parts": [{"name": "Part Name", "role": "protector|exile|manager|firefighter|Self", "notes": "brief note"}],
  "nervousSystemState": "ventral|sympathetic|dorsal|null",
  "exerciseRecommendation": "XX-000 or null",
  "recommendationReason": "why this exercise or null"
}

RULES:
- The user NEVER sees anything after ---THERAPEUTIC_DATA---. The app strips it.
- DELTA ONLY: The app already remembers everything from prior turns (it's shown to you in the shared-context block above). Do NOT re-list what's already known. Send only what is NEW or CHANGED this turn.
- themes: Only themes newly surfaced this turn. Omit or use [] if nothing new.
- parts: Only parts newly identified this turn, OR an existing part whose notes/role changed. When updating an existing part, include its exact "name" (the app matches on name) plus only the changed fields. Omit or use [] if no part changed.
- nervousSystemState: Your best current assessment, or null if unchanged/unclear.
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
