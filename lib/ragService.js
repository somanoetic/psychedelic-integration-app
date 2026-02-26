/**
 * RAG Knowledge Base Service
 *
 * Client-side service for retrieving relevant clinical knowledge from
 * the vector-indexed document corpus. Calls the embeddings edge function
 * for semantic search and formats results for prompt injection.
 *
 * Follows claudeProxyService.js pattern (singleton, Supabase auth).
 * Uses 5-min cache (same TTL as masterContextService).
 *
 * Graceful degradation: returns empty on error so AI services
 * continue without RAG context.
 */

import { supabase } from './supabase';
import config from './config';
import metricsService from './metricsService';

const EMBEDDINGS_ENDPOINT = `${config.supabaseUrl}/functions/v1/embeddings`;

// Cache configuration (matches masterContextService)
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class RAGService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Search the knowledge base for relevant chunks.
   *
   * @param {string} query - Search query (user message or topic)
   * @param {object} [options]
   * @param {number} [options.maxResults=5] - Maximum results to return
   * @param {number} [options.threshold=0.3] - Minimum similarity threshold (0-1)
   * @param {string[]|null} [options.categories=null] - Filter by categories (null = all)
   * @returns {Promise<Array>} Ranked search results with content and metadata
   */
  async search(query, options = {}) {
    const {
      maxResults = 5,
      threshold = 0.3,
      categories = null,
    } = options;

    // Check cache
    const cacheKey = this._cacheKey(query, options);
    const cached = this._getFromCache(cacheKey);
    if (cached) return cached;

    const startTime = Date.now();

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.warn('[RAG] No auth session, skipping search');
        return [];
      }

      const response = await fetch(EMBEDDINGS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'search',
          query,
          match_count: maxResults,
          match_threshold: threshold,
          categories,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('[RAG] Search failed:', response.status, errorData.error, errorData.details || '');
        return [];
      }

      const data = await response.json();
      const results = data.results || [];
      const durationMs = Date.now() - startTime;

      // Cache results
      this._setCache(cacheKey, results);

      // Log metrics
      metricsService.logAIMetric({
        serviceName: 'rag',
        operation: 'search',
        durationMs,
        status: 'success',
        metadata: {
          query: query.substring(0, 100),
          resultCount: results.length,
          categories,
          threshold,
        },
      });

      if (__DEV__) {
        console.log(`[RAG] Search: ${results.length} results in ${durationMs}ms`);
      }

      return results;

    } catch (error) {
      console.warn('[RAG] Search error (degrading gracefully):', error.message);

      metricsService.logError({
        serviceName: 'rag',
        operation: 'search',
        errorType: error.name || 'Error',
        errorMessage: error.message,
      });

      return [];
    }
  }

  /**
   * Format search results as a markdown block for prompt injection.
   *
   * @param {Array} results - Results from search()
   * @param {object} [options]
   * @param {number} [options.maxTokens=1500] - Approximate token budget for context
   * @param {boolean} [options.includeSources=true] - Include source attribution
   * @returns {string} Formatted context block, or empty string if no results
   */
  formatForPromptInjection(results, options = {}) {
    const { maxTokens = 1500, includeSources = true } = options;

    if (!results || results.length === 0) return '';

    let block = '\n\n## RELEVANT KNOWLEDGE BASE CONTEXT:\n';
    let approxTokens = 20; // Header overhead

    for (const result of results) {
      // Rough token estimate: ~4 chars per token
      const chunkTokens = Math.ceil(result.content.length / 4);

      if (approxTokens + chunkTokens > maxTokens) {
        // Truncate this chunk to fit remaining budget
        const remainingTokens = maxTokens - approxTokens;
        if (remainingTokens > 50) {
          const truncatedLength = remainingTokens * 4;
          block += `\n### ${result.section_title || result.source_document}\n`;
          block += result.content.substring(0, truncatedLength) + '...\n';
          if (includeSources) {
            block += `[Source: ${result.source_document}, Category: ${result.category}]\n`;
          }
        }
        break;
      }

      block += `\n### ${result.section_title || result.source_document}\n`;
      block += result.content + '\n';
      if (includeSources) {
        block += `[Source: ${result.source_document}, Category: ${result.category}, Similarity: ${(result.similarity * 100).toFixed(0)}%]\n`;
      }
      approxTokens += chunkTokens + 15; // section header + source overhead
    }

    block += '\nUse this research context to ground your response in evidence-based practices. Cite specific concepts when relevant.\n';

    return block;
  }

  /**
   * Convenience method: search + format in one call.
   *
   * @param {string} query - Search query
   * @param {object} [options]
   * @param {number} [options.maxResults=3] - Maximum results
   * @param {number} [options.maxTokens=1500] - Token budget for formatted output
   * @param {number} [options.threshold=0.4] - Similarity threshold
   * @param {string[]|null} [options.categories=null] - Category filter
   * @returns {Promise<string>} Formatted context block or empty string
   */
  async getContextForPrompt(query, options = {}) {
    const {
      maxResults = 3,
      maxTokens = 1500,
      threshold = 0.4,
      categories = null,
    } = options;

    const results = await this.search(query, {
      maxResults,
      threshold,
      categories,
    });

    return this.formatForPromptInjection(results, { maxTokens });
  }

  /**
   * Clear the search cache. Useful after ingestion.
   */
  clearCache() {
    this.cache.clear();
  }

  // --- Private cache helpers ---

  _cacheKey(query, options) {
    const cats = options.categories ? options.categories.sort().join(',') : 'all';
    return `${query}|${options.maxResults || 5}|${options.threshold || 0.3}|${cats}`;
  }

  _getFromCache(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  _setCache(key, data) {
    // Evict old entries if cache gets large
    if (this.cache.size > 50) {
      const now = Date.now();
      for (const [k, v] of this.cache) {
        if (now - v.timestamp > CACHE_TTL) {
          this.cache.delete(k);
        }
      }
    }

    this.cache.set(key, { data, timestamp: Date.now() });
  }
}

// Export singleton
export const ragService = new RAGService();
export default ragService;
