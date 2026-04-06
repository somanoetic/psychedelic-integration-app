/**
 * BaseModeHandler
 *
 * Abstract base for mode-specific session logic plugins.
 * Mode handlers are NOT services — they have no API calls, no persistence,
 * no prompts of their own. They add therapeutic process intelligence
 * to HuxleyService's existing chat pipeline.
 *
 * Lifecycle (called by HuxleyService):
 *   1. reset()              — when setMode() is called
 *   2. getModeContext()      — before building the prompt (injected as modeContext)
 *   3. getPhase()           — overrides phase sent to the prompt
 *   4. processResponse()    — after AI response, updates session state
 *   5. getSessionProgress() — attached to chat() return value for screens
 *
 * Subclasses override these + implement domain-specific phase gates.
 */
class BaseModeHandler {
  constructor(modeId) {
    this.modeId = modeId;
    this.exchangeCount = 0;
    this.reset();
  }

  /** Reset all session state. Called when entering this mode. */
  reset() {
    this.phase = 'intro';
    this.exchangeCount = 0;
  }

  /**
   * Returns mode-specific context to inject into the system prompt.
   * HuxleyService merges this into options.modeContext automatically.
   * @returns {object}
   */
  getModeContext() {
    return {};
  }

  /**
   * Returns the current phase. HuxleyService uses this instead of
   * whatever the screen passes, so the handler controls progression.
   * @returns {string}
   */
  getPhase() {
    return this.phase;
  }

  /**
   * Process the AI response and update session state.
   * Called by HuxleyService after every chat() response.
   *
   * @param {string} userMessage - What the user said
   * @param {string} aiResponse - The display message from AI
   * @param {object|null} therapeuticData - Parsed ---THERAPEUTIC_DATA--- block
   * @returns {object} sessionProgress — attached to chat() return value
   */
  processResponse(userMessage, aiResponse, therapeuticData) {
    this.exchangeCount++;
    return this.getSessionProgress();
  }

  /**
   * Session progress object returned to screens via chat() result.
   * Screens use this for UI (progress indicators, phase labels, etc.)
   * @returns {object}
   */
  getSessionProgress() {
    return {
      phase: this.phase,
      exchangeCount: this.exchangeCount,
    };
  }

  /**
   * Returns data to persist when the session ends.
   * HuxleyService calls this to save domain-specific session results.
   * @returns {object|null}
   */
  getSessionSummary() {
    return null;
  }
}

export default BaseModeHandler;
