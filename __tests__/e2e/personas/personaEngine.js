/**
 * Persona Turn Engine
 *
 * Drives a full conversation between an AI-driven persona and Huxley.
 *
 * Each turn:
 *   1. Ask the persona-Claude for the next user message (given full history)
 *   2. If persona returns [END], stop the conversation
 *   3. Otherwise pass that message to huxleyService.chat()
 *   4. Record turn, repeat until cap or [END]
 *
 * The persona sees the conversation FROM THE USER'S PERSPECTIVE — so in its
 * messages array, the user's previous lines are role="assistant" (its own
 * prior outputs) and Huxley's lines are role="user".
 */

const { callAnthropic, extractText } = require('./claudeDirect');
const { buildPersonaSystemPrompt } = require('./personaLibrary');

const PERSONA_MODEL = 'claude-sonnet-4-5-20250929';
const MAX_TURNS = 12;
const END_SENTINEL = '[END]';
const RETRY_ATTEMPTS = 4;
const RETRY_BASE_DELAY_MS = 2000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a fn that may throw on transient network/API errors.
 * Backoff: 2s, 4s, 8s, 16s.
 */
async function withRetry(fn, label) {
  let lastErr;
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const transient =
        /fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|socket hang up|529|overload|rate.?limit|429|502|503|504/i.test(
          err.message || ''
        );
      if (!transient || attempt === RETRY_ATTEMPTS) throw err;
      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.log(`    [retry ${attempt}/${RETRY_ATTEMPTS}] ${label}: "${err.message}" — waiting ${delay}ms`);
      await sleep(delay);
    }
  }
  throw lastErr;
}

/**
 * Ask the persona for its next message, given the conversation so far.
 *
 * @param {Object} persona - From personaLibrary
 * @param {Array<{role, content}>} history - Bidirectional conversation history
 *   in app convention (user = the persona, assistant = Huxley)
 * @returns {Promise<{text: string, ended: boolean}>}
 */
async function generatePersonaMessage(persona, history) {
  const systemPrompt = buildPersonaSystemPrompt(persona);

  // Flip the roles for the persona's POV: Huxley's lines become "user"
  // messages addressed to the persona, and the persona's prior lines become
  // its own "assistant" outputs.
  const flipped = history.map((m) => ({
    role: m.role === 'user' ? 'assistant' : 'user',
    content: m.content,
  }));

  // If history is empty, prime with a single user turn so the API accepts it.
  const messages = flipped.length > 0
    ? flipped
    : [{ role: 'user', content: '(The chat just opened. Send your first message.)' }];

  // If the last message in flipped is an "assistant" message (i.e. the persona
  // already spoke last and we somehow didn't get a Huxley reply), append a
  // nudge so the API has a user turn to respond to.
  if (messages[messages.length - 1].role === 'assistant') {
    messages.push({ role: 'user', content: '(Huxley did not respond. Send your next message.)' });
  }

  const response = await withRetry(
    () =>
      callAnthropic({
        system: systemPrompt,
        messages,
        model: PERSONA_MODEL,
        maxTokens: 400,
        temperature: 0.9,
      }),
    'persona-message'
  );

  let text = extractText(response).trim();

  // Detect end sentinel (case-insensitive, allow surrounding whitespace/punctuation)
  if (/^\[end\]\s*\.?$/i.test(text) || text.toUpperCase().includes(END_SENTINEL)) {
    return { text: text.replace(/\[end\]/i, '').trim(), ended: true };
  }

  return { text, ended: false };
}

/**
 * Run a full conversation between a persona and huxleyService for a given mode.
 *
 * @param {Object} huxleyService - The (mocked-proxy) huxleyService singleton
 * @param {Object} persona - From personaLibrary
 * @param {string} mode - Huxley mode id (e.g., 'general', 'ifs')
 * @param {number} runIndex - 1, 2, or 3 for the three runs
 * @returns {Promise<Object>} transcript
 */
async function runConversation(huxleyService, persona, mode, runIndex) {
  // Reset huxley state for a clean run
  huxleyService.conversationHistory = [];
  huxleyService.currentMode = 'general';
  huxleyService.currentPhase = null;
  huxleyService.userId = `persona-${persona.id}-run${runIndex}`;
  huxleyService.masterContext = {};
  huxleyService.therapeuticState = {
    themes: [],
    parts: [],
    completedExercises: [],
    recommendedExercises: [],
    nervousSystemState: null,
  };
  huxleyService._exerciseCatalog = null;
  Object.values(huxleyService.modeHandlers || {}).forEach((h) => h.reset && h.reset());

  huxleyService.setMode(mode, { clearHistory: true });

  const transcript = {
    persona: persona.name,
    personaId: persona.id,
    mode,
    runIndex,
    safetyCritical: !!persona.safety_critical,
    description: persona.short,
    startedAt: new Date().toISOString(),
    turns: [],
    phases: [],
    therapeuticData: [],
    errors: [],
    endedNaturally: false,
    endReason: null,
  };

  // Track bidirectional history in app convention: user=persona, assistant=huxley
  const history = [];

  for (let i = 0; i < MAX_TURNS; i++) {
    // 1. Persona speaks
    let userMessage;
    let personaEnded;
    try {
      const personaTurn = await generatePersonaMessage(persona, history);
      userMessage = personaTurn.text;
      personaEnded = personaTurn.ended;
    } catch (error) {
      transcript.errors.push({
        turn: i + 1,
        side: 'persona',
        error: error.message,
      });
      break;
    }

    // If persona returned only [END] with no remaining text, end here.
    if (personaEnded && (!userMessage || userMessage.length === 0)) {
      transcript.endedNaturally = true;
      transcript.endReason = 'persona signaled end with no final message';
      break;
    }

    history.push({ role: 'user', content: userMessage });

    // 2. Huxley responds (with retry on transient errors)
    const turnStart = Date.now();
    let response;
    try {
      // huxleyService.chat() handles its own retries internally (see BUG-312
      // fix in lib/huxleyService.js). We rely on it throwing on persistent
      // failure rather than swallowing into a static fallback string.
      response = await huxleyService.chat(userMessage);
    } catch (error) {
      transcript.errors.push({
        turn: i + 1,
        side: 'huxley',
        userMessage,
        error: error.message,
      });
      break;
    }

    history.push({ role: 'assistant', content: response.message });

    transcript.turns.push({
      turn: i + 1,
      user: userMessage,
      huxley: response.message,
      phase: response.phase,
      mode: response.mode,
      durationMs: Date.now() - turnStart,
    });

    if (response.phase) transcript.phases.push(response.phase);
    if (response.therapeuticData) {
      transcript.therapeuticData.push({
        turn: i + 1,
        data: response.therapeuticData,
      });
    }

    if (personaEnded) {
      transcript.endedNaturally = true;
      transcript.endReason = 'persona signaled end after final exchange';
      break;
    }
  }

  if (!transcript.endedNaturally && !transcript.errors.length) {
    transcript.endReason = `max_turns (${MAX_TURNS}) reached`;
  }

  transcript.completedAt = new Date().toISOString();
  transcript.totalTurns = transcript.turns.length;
  transcript.uniquePhases = [...new Set(transcript.phases)];
  transcript.finalTherapeuticData =
    transcript.therapeuticData[transcript.therapeuticData.length - 1]?.data || null;

  return transcript;
}

module.exports = { runConversation, generatePersonaMessage, MAX_TURNS };
