/**
 * Claude API Proxy Client
 *
 * Calls the server-side Supabase Edge Function instead of Claude API directly.
 * This keeps API keys secure and enables rate limiting.
 *
 * SECURITY: All API keys stay server-side. Client only needs Supabase auth token.
 */

import { supabase } from './supabase';
import config from './config';
import { DEFAULT_MODEL } from './aiModels';

const PROXY_ENDPOINT = `${config.supabaseUrl}/functions/v1/claude-proxy`;

class ClaudeProxyService {
  /**
   * Send a message to Claude via the secure proxy
   *
   * @param {Array} messages - Array of {role, content} message objects
   * @param {Object} options - Additional options (model, temperature, system, etc.)
   * @param {string|Array} [options.system] - System prompt. Either a plain string,
   *   or an array of content blocks (`{type:'text', text, cache_control?}`) to enable
   *   Anthropic prompt caching. When an array is passed it is forwarded verbatim, so
   *   the caller controls where the `cache_control: {type:'ephemeral'}` breakpoint sits.
   * @returns {Promise<Object>} Claude API response
   */
  async sendMessage(messages, options = {}) {
    try {
      // Get current user's auth token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('Authentication required. Please log in.');
      }

      const requestBody = {
        model: options.model || DEFAULT_MODEL,
        max_tokens: options.maxTokens || 1024,
        messages,
        temperature: options.temperature ?? 1.0,
        // `system` may be a string OR an array of content blocks carrying
        // cache_control breakpoints. Both pass straight through the proxy +
        // edge function to Anthropic. Guard on != null so an empty-array system
        // (no blocks) is still dropped, matching the old truthy-string check.
        ...(options.system != null && { system: options.system }),
        stream: false, // Note: Streaming requires different handling
      };

      // Call the proxy endpoint
      const response = await fetch(PROXY_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle rate limiting
        if (response.status === 429) {
          throw new Error(
            `Rate limit exceeded. Resets at ${new Date(errorData.window_reset).toLocaleTimeString()}`
          );
        }

        throw new Error(errorData.error || `Proxy request failed: ${response.status}`);
      }

      const data = await response.json();

      // Log rate limit info for debugging
      if (data._proxy_metadata && __DEV__) {
        console.log('[Claude Proxy] Rate limit remaining:', data._proxy_metadata.rate_limit_remaining);
      }

      // Surface prompt-cache effectiveness in dev. cache_read_input_tokens > 0
      // means the cached prefix hit; cache_creation_input_tokens is the one-time
      // cost of writing the prefix to the cache on a miss.
      if (data.usage && __DEV__) {
        const { cache_read_input_tokens: read, cache_creation_input_tokens: created } = data.usage;
        if (read || created) {
          console.log(`[Claude Proxy] Cache — read: ${read || 0}, created: ${created || 0}, uncached input: ${data.usage.input_tokens || 0}`);
        }
      }

      return data;

    } catch (error) {
      console.error('[Claude Proxy] Error:', error);
      throw error;
    }
  }

  /**
   * Get a simple text response from Claude
   *
   * @param {string} userMessage - The user's message
   * @param {Object} options - Additional options (system prompt, model, etc.)
   * @returns {Promise<string>} Claude's response text
   */
  async getTextResponse(userMessage, options = {}) {
    const messages = [{ role: 'user', content: userMessage }];

    const response = await this.sendMessage(messages, options);

    // Extract text from response
    if (response.content && response.content[0]?.text) {
      return response.content[0].text;
    }

    throw new Error('Invalid response format from Claude API');
  }

  /**
   * Get user's current rate limit status
   *
   * @returns {Promise<Object>} Rate limit info { request_count, window_start, remaining }
   */
  async getRateLimitStatus() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Authentication required');
      }

      const { data, error } = await supabase
        .from('user_rate_limits')
        .select('request_count, window_start')
        .eq('user_id', user.id)
        .eq('service', 'claude_api')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      const RATE_LIMIT = 100; // Same as edge function
      const requestCount = data?.request_count || 0;

      return {
        used: requestCount,
        remaining: Math.max(0, RATE_LIMIT - requestCount),
        limit: RATE_LIMIT,
        windowStart: data?.window_start || new Date().toISOString(),
      };

    } catch (error) {
      console.error('[Claude Proxy] Error fetching rate limit:', error);
      throw error;
    }
  }

  /**
   * Get user's API usage history (last 30 days)
   *
   * @returns {Promise<Array>} Usage summary
   */
  async getUsageHistory() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Authentication required');
      }

      const { data, error } = await supabase
        .from('user_api_usage_summary')
        .select('*')
        .eq('user_id', user.id)
        .order('usage_date', { ascending: false });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('[Claude Proxy] Error fetching usage:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const claudeProxyService = new ClaudeProxyService();

export default claudeProxyService;
