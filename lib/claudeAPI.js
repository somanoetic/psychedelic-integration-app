/**
 * Claude API Bridge
 *
 * Centralized module for all Claude API calls. Routes through the
 * server-side proxy (claudeProxyService) so API keys stay server-side.
 *
 * Usage:
 *   import { callClaude } from './claudeAPI';
 *   const data = await callClaude({ system, messages, model, max_tokens, temperature });
 *   const text = data.content[0].text;
 */

import claudeProxyService from './claudeProxyService';

const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';
const DEFAULT_MAX_TOKENS = 1024;
const DEFAULT_TEMPERATURE = 0.7;

/**
 * Call Claude via the server-side proxy.
 *
 * @param {Object} params
 * @param {Array<{role: string, content: string}>} params.messages - Conversation messages
 * @param {string} [params.system] - System prompt
 * @param {string} [params.model] - Model ID
 * @param {number} [params.max_tokens] - Max response tokens
 * @param {number} [params.temperature] - Sampling temperature
 * @returns {Promise<Object>} Full Anthropic-format response (access .content[0].text for text)
 */
export async function callClaude({
  messages,
  system,
  model = DEFAULT_MODEL,
  max_tokens = DEFAULT_MAX_TOKENS,
  temperature = DEFAULT_TEMPERATURE,
} = {}) {
  return claudeProxyService.sendMessage(messages, {
    system,
    model,
    maxTokens: max_tokens,
    temperature,
  });
}

export default callClaude;
