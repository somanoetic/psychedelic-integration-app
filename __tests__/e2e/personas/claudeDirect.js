/**
 * Direct Anthropic API client for persona-matrix tests.
 *
 * Bypasses the Supabase proxy (which requires a live user session) and calls
 * Anthropic directly. Used both for Huxley calls (via mocked claudeProxyService)
 * and for the persona-side AI agent.
 *
 * Reads ANTHROPIC_API_KEY directly from .env because jest.setup.js overwrites
 * process.env.ANTHROPIC_API_KEY with a test placeholder.
 */

const fs = require('fs');
const path = require('path');

let cachedApiKey = null;

function getApiKey() {
  if (cachedApiKey) return cachedApiKey;
  const envPath = path.join(__dirname, '..', '..', '..', '.env');
  try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/^ANTHROPIC_API_KEY=(.+)$/m);
    if (match) {
      cachedApiKey = match[1].trim();
      return cachedApiKey;
    }
  } catch (e) {
    // fall through
  }
  throw new Error('ANTHROPIC_API_KEY not found in .env');
}

/**
 * Call the Anthropic API directly.
 *
 * @param {Object} params
 * @param {Array<{role: string, content: string}>} params.messages
 * @param {string} [params.system]
 * @param {string} [params.model]
 * @param {number} [params.maxTokens]
 * @param {number} [params.temperature]
 * @returns {Promise<Object>} Full Anthropic response
 */
async function callAnthropic({ messages, system, model, maxTokens, temperature } = {}) {
  const apiKey = getApiKey();

  const body = {
    model: model || 'claude-sonnet-4-5-20250929',
    max_tokens: maxTokens || 1024,
    messages,
    temperature: temperature ?? 0.7,
  };
  if (system) body.system = system;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      `Anthropic API error ${response.status}: ${err.error?.message || response.statusText}`
    );
  }

  return response.json();
}

/**
 * Extract just the text content from an Anthropic response.
 */
function extractText(response) {
  if (response?.content?.[0]?.text) return response.content[0].text;
  throw new Error('Invalid Anthropic response format');
}

module.exports = { callAnthropic, extractText, getApiKey };
