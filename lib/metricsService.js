import { supabase } from './supabase';

/**
 * AI Metrics Service
 *
 * Logs AI service metrics (usage, cost, errors) to Supabase for monitoring and observability.
 *
 * **Architecture:**
 * - Async fire-and-forget logging (never blocks app)
 * - Batch inserts (100 items or 10s, whichever comes first)
 * - Graceful degradation (fails silently if DB unavailable)
 * - Token counting and cost estimation for Claude API
 * - Sentry integration for error tracking
 *
 * **SECURITY NOTE:**
 * This service uses the user's authenticated Supabase session (anon key + JWT).
 * It does NOT use the service role key. Metrics insertion is authorized via RLS
 * policies that allow authenticated users to insert their own metrics.
 *
 * For admin-level read operations (dashboards), use a Supabase Edge Function
 * with the service role key on the server side.
 *
 * **Usage:**
 * ```javascript
 * import metricsService from './lib/metricsService';
 *
 * // Initialize on app start
 * await metricsService.initialize();
 *
 * // Log AI metric (fire-and-forget, non-blocking)
 * metricsService.logAIMetric({
 *   serviceName: 'enhancedClaude',
 *   operation: 'chat',
 *   durationMs: 1234,
 *   tokens: { input: 500, output: 200 },
 *   cost: 0.0045,
 *   status: 'success',
 *   userId: 'user_123'
 * });
 *
 * // Log routing decision (no PII - only metadata)
 * metricsService.logRoutingDecision({
 *   selectedRoute: 'nervous_system_mapping',
 *   confidence: 0.85,
 *   alternatives: [{ route: 'daily_journal', score: 0.65 }],
 *   userId: 'user_123'
 * });
 *
 * // Log error (inserted immediately, not batched)
 * metricsService.logError({
 *   serviceName: 'enhancedClaude',
 *   operation: 'chat',
 *   errorType: 'APIError',
 *   errorMessage: 'Rate limit exceeded',
 *   stackTrace: error.stack,
 *   sentryId: sentryEventId,
 *   userId: 'user_123'
 * });
 * ```
 */
class MetricsService {
  constructor() {
    this.batchQueue = [];
    this.routingQueue = [];
    this.flushInterval = 10000; // 10 seconds
    this.maxBatchSize = 100;
    this.flushTimer = null;
    this.isInitialized = false;
    this.isDisabled = false; // Set true if tables don't exist

    // Claude Sonnet 4.5 pricing (per million tokens)
    this.CLAUDE_PRICING = {
      'claude-sonnet-4-5-20250929': {
        input: 3.00,   // $3.00 per 1M input tokens
        output: 15.00  // $15.00 per 1M output tokens
      }
    };
  }

  /**
   * Initialize metrics service
   *
   * Sets up flush timer using the authenticated Supabase client.
   * Call this once on app startup.
   *
   * SECURITY: Uses the user's authenticated session (anon key + JWT).
   * No service role key is used. Metrics insertion is authorized via RLS.
   *
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('[Metrics] Already initialized');
      return;
    }

    try {
      // Verify we have a valid Supabase client
      if (!supabase) {
        console.warn('[Metrics] Supabase client not available - metrics will be disabled');
        return;
      }

      // Start flush timer
      this.startFlushTimer();

      this.isInitialized = true;
      console.log('[Metrics] Initialized successfully (using authenticated client)');
    } catch (error) {
      console.error('[Metrics] Initialization error:', error);
      // Fail silently - metrics are not critical
    }
  }

  /**
   * Start periodic flush timer
   * @private
   */
  startFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Log AI service metric
   *
   * **Fire-and-forget** - Does not await, never throws.
   * Queues metric for batch insert.
   *
   * @param {object} metric - Metric data
   * @param {string} metric.serviceName - AI service name ('enhancedClaude', 'ifsAI', etc.)
   * @param {string} metric.operation - Operation type ('chat', 'routing', 'context_load', etc.)
   * @param {number} metric.durationMs - Operation duration in milliseconds
   * @param {object} [metric.tokens] - Token usage { input: number, output: number, total: number }
   * @param {number} [metric.cost] - Estimated cost in USD
   * @param {string} [metric.status='success'] - Status ('success' | 'error')
   * @param {object} [metric.metadata] - Additional metadata (model, temperature, etc.)
   * @param {string} [metric.userId] - User ID
   * @returns {void}
   */
  logAIMetric({
    serviceName,
    operation,
    durationMs,
    tokens = null,
    cost = null,
    status = 'success',
    metadata = null,
    userId = null
  }) {
    if (!this.isInitialized) {
      return; // Silently skip if not initialized
    }

    try {
      const metric = {
        service_name: serviceName,
        operation,
        duration_ms: durationMs,
        input_tokens: tokens?.input || null,
        output_tokens: tokens?.output || null,
        total_tokens: tokens?.total || (tokens?.input + tokens?.output) || null,
        estimated_cost: cost,
        status,
        metadata,
        user_id: userId,
        timestamp: new Date().toISOString()
      };

      this.batchQueue.push(metric);

      // Flush if batch size reached
      if (this.batchQueue.length >= this.maxBatchSize) {
        this.flush();
      }
    } catch (error) {
      console.error('[Metrics] Error logging AI metric:', error);
      // Fail silently - never break app
    }
  }

  /**
   * Log routing decision
   *
   * **Fire-and-forget** - Does not await, never throws.
   * Queues routing decision for batch insert.
   *
   * SECURITY: Does NOT log user input text (PII). Only logs metadata:
   * - input_length: character count of the user's message
   * - detected_intents: array of intent keywords detected
   * - selected_route, confidence, alternatives
   *
   * @param {object} decision - Routing decision data
   * @param {number} [decision.inputLength] - Length of user's input (no text content)
   * @param {Array} [decision.detectedIntents] - Intent keywords detected in input
   * @param {string} decision.selectedRoute - Selected route ('daily_journal', 'ifs_chat', etc.)
   * @param {number} decision.confidence - Confidence score (0-1)
   * @param {Array} [decision.alternatives] - Alternative routes considered [{ route: string, score: number }]
   * @param {object} [decision.metadata] - Additional metadata
   * @param {string} [decision.userId] - User ID
   * @returns {void}
   */
  logRoutingDecision({
    inputLength = null,
    detectedIntents = null,
    selectedRoute,
    confidence,
    alternatives = null,
    metadata = null,
    userId = null
  }) {
    if (!this.isInitialized) {
      return; // Silently skip if not initialized
    }

    try {
      const decision = {
        // SECURITY: No user input text stored. Only non-PII metadata.
        input_text: null,
        selected_route: selectedRoute,
        confidence,
        alternatives_considered: alternatives,
        metadata: {
          ...(metadata || {}),
          input_length: inputLength,
          detected_intents: detectedIntents
        },
        user_id: userId,
        timestamp: new Date().toISOString()
      };

      this.routingQueue.push(decision);

      // Flush if batch size reached
      if (this.routingQueue.length >= this.maxBatchSize) {
        this.flush();
      }
    } catch (error) {
      console.error('[Metrics] Error logging routing decision:', error);
      // Fail silently - never break app
    }
  }

  /**
   * Log error
   *
   * **Inserts immediately** (not batched) since errors are critical.
   * Fire-and-forget - does not await, never throws.
   *
   * @param {object} error - Error data
   * @param {string} error.serviceName - AI service name
   * @param {string} error.operation - Operation that failed
   * @param {string} error.errorType - Error type/class
   * @param {string} error.errorMessage - Error message
   * @param {string} [error.stackTrace] - Stack trace
   * @param {string} [error.sentryId] - Sentry event ID
   * @param {object} [error.context] - Additional context
   * @param {string} [error.userId] - User ID
   * @returns {void}
   */
  logError({
    serviceName,
    operation,
    errorType,
    errorMessage,
    stackTrace = null,
    sentryId = null,
    context = null,
    userId = null
  }) {
    if (!this.isInitialized) {
      return; // Silently skip if not initialized
    }

    // Insert immediately (don't batch errors)
    this._insertErrorAsync({
      service_name: serviceName,
      operation,
      error_type: errorType,
      error_message: errorMessage,
      stack_trace: stackTrace,
      sentry_event_id: sentryId,
      context,
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Insert error async (fire-and-forget)
   * @private
   */
  async _insertErrorAsync(errorData) {
    if (this.isDisabled) return;

    try {
      const { error } = await supabase
        .from('ai_errors')
        .insert([errorData]);

      if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01') {
          console.warn('[Metrics] ai_errors table not found - disabling metrics.');
          this.isDisabled = true;
          return;
        }
        console.error('[Metrics] Error inserting error log:', error);
      }
    } catch (error) {
      console.error('[Metrics] Error in _insertErrorAsync:', error);
      // Fail silently - never break app
    }
  }

  /**
   * Flush batched metrics to database
   *
   * Inserts all queued metrics and routing decisions.
   * Called automatically every 10s or when batch size reached.
   *
   * Uses the authenticated Supabase client (respects RLS).
   *
   * @returns {Promise<void>}
   */
  async flush() {
    if (!this.isInitialized || this.isDisabled) {
      return;
    }

    const metricsToFlush = [...this.batchQueue];
    const routingToFlush = [...this.routingQueue];

    // Clear queues immediately to avoid duplicate inserts
    this.batchQueue = [];
    this.routingQueue = [];

    if (metricsToFlush.length === 0 && routingToFlush.length === 0) {
      return; // Nothing to flush
    }

    try {
      // Insert AI metrics using authenticated client
      if (metricsToFlush.length > 0) {
        const { error: metricsError } = await supabase
          .from('ai_metrics')
          .insert(metricsToFlush);

        if (metricsError) {
          // If table doesn't exist, disable metrics to stop spamming errors
          if (metricsError.code === 'PGRST205' || metricsError.code === '42P01') {
            console.warn('[Metrics] ai_metrics table not found - disabling metrics. Create the table to re-enable.');
            this.isDisabled = true;
            return;
          }
          console.error('[Metrics] Error inserting metrics:', metricsError);
        } else {
          console.log(`[Metrics] Flushed ${metricsToFlush.length} metrics`);
        }
      }

      // Insert routing decisions using authenticated client
      if (routingToFlush.length > 0) {
        const { error: routingError } = await supabase
          .from('ai_routing_decisions')
          .insert(routingToFlush);

        if (routingError) {
          if (routingError.code === 'PGRST205' || routingError.code === '42P01') {
            console.warn('[Metrics] ai_routing_decisions table not found - disabling metrics.');
            this.isDisabled = true;
            return;
          }
          console.error('[Metrics] Error inserting routing decisions:', routingError);
        } else {
          console.log(`[Metrics] Flushed ${routingToFlush.length} routing decisions`);
        }
      }
    } catch (error) {
      console.error('[Metrics] Error in flush:', error);
      // Fail silently - never break app
    }
  }

  /**
   * Get service health summary
   *
   * Returns health metrics for all AI services from materialized view.
   *
   * NOTE: This reads from materialized views. The authenticated user must have
   * SELECT access (admin role) or this should be called via a Supabase Edge Function.
   *
   * @returns {Promise<Array>} Service health data
   */
  async getServiceHealth() {
    if (!this.isInitialized) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('mv_service_performance_last_7d')
        .select('*')
        .order('total_calls', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[Metrics] Error fetching service health:', error);
      return [];
    }
  }

  /**
   * Get cost summary for time range
   *
   * @param {string} timeRange - Time range ('24h' | '7d' | '30d')
   * @returns {Promise<object>} Cost summary
   */
  async getCostSummary(timeRange = '7d') {
    if (!this.isInitialized) {
      return { totalCost: 0, services: [] };
    }

    try {
      const cutoffDate = this._getCutoffDate(timeRange);

      const { data, error } = await supabase
        .from('ai_metrics')
        .select('service_name, estimated_cost')
        .gte('timestamp', cutoffDate)
        .not('estimated_cost', 'is', null);

      if (error) throw error;

      // Aggregate by service
      const costByService = {};
      let totalCost = 0;

      data.forEach(row => {
        const service = row.service_name;
        const cost = row.estimated_cost || 0;
        costByService[service] = (costByService[service] || 0) + cost;
        totalCost += cost;
      });

      const services = Object.entries(costByService).map(([name, cost]) => ({
        service: name,
        cost
      })).sort((a, b) => b.cost - a.cost);

      return {
        totalCost,
        services,
        timeRange
      };
    } catch (error) {
      console.error('[Metrics] Error fetching cost summary:', error);
      return { totalCost: 0, services: [] };
    }
  }

  /**
   * Get top errors
   *
   * Returns top errors from last 24h from materialized view.
   *
   * @returns {Promise<Array>} Top errors
   */
  async getTopErrors() {
    if (!this.isInitialized) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('mv_top_errors_last_24h')
        .select('*')
        .order('error_count', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[Metrics] Error fetching top errors:', error);
      return [];
    }
  }

  /**
   * Get routing quality metrics
   *
   * Returns routing effectiveness metrics from last 7 days.
   *
   * @returns {Promise<object>} Routing quality data
   */
  async getRoutingQuality() {
    if (!this.isInitialized) {
      return {
        avgConfidence: 0,
        totalDecisions: 0,
        mostCommonRoute: null,
        lowConfidenceCount: 0
      };
    }

    try {
      const cutoffDate = this._getCutoffDate('7d');

      const { data, error } = await supabase
        .from('ai_routing_decisions')
        .select('selected_route, confidence')
        .gte('timestamp', cutoffDate);

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          avgConfidence: 0,
          totalDecisions: 0,
          mostCommonRoute: null,
          lowConfidenceCount: 0
        };
      }

      // Calculate average confidence
      const totalConfidence = data.reduce((sum, row) => sum + (row.confidence || 0), 0);
      const avgConfidence = totalConfidence / data.length;

      // Count low confidence decisions (<0.7)
      const lowConfidenceCount = data.filter(row => (row.confidence || 0) < 0.7).length;

      // Find most common route
      const routeCounts = {};
      data.forEach(row => {
        const route = row.selected_route;
        routeCounts[route] = (routeCounts[route] || 0) + 1;
      });

      const mostCommonRoute = Object.entries(routeCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

      return {
        avgConfidence: Math.round(avgConfidence * 100),
        totalDecisions: data.length,
        mostCommonRoute,
        lowConfidenceCount
      };
    } catch (error) {
      console.error('[Metrics] Error fetching routing quality:', error);
      return {
        avgConfidence: 0,
        totalDecisions: 0,
        mostCommonRoute: null,
        lowConfidenceCount: 0
      };
    }
  }

  /**
   * Calculate cost from tokens
   *
   * @param {object} tokens - Token usage { input: number, output: number }
   * @param {string} [model='claude-sonnet-4-5-20250929'] - Model name
   * @returns {number} Estimated cost in USD
   */
  static calculateCost(tokens, model = 'claude-sonnet-4-5-20250929') {
    const pricing = new MetricsService().CLAUDE_PRICING[model];
    if (!pricing || !tokens) {
      return 0;
    }

    const inputCost = (tokens.input / 1_000_000) * pricing.input;
    const outputCost = (tokens.output / 1_000_000) * pricing.output;

    return inputCost + outputCost;
  }

  /**
   * Estimate tokens from text
   *
   * **Rough estimation** - 1 token ~ 4 characters for English.
   * For accurate counts, use extractTokens() from Claude API response.
   *
   * @param {string} text - Text to estimate
   * @returns {number} Estimated token count
   */
  static estimateTokens(text) {
    if (!text) return 0;
    // Rough estimation: 1 token ~ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Extract tokens from Claude API response
   *
   * @param {object} response - Claude API response
   * @returns {object} Tokens { input: number, output: number, total: number }
   */
  static extractTokens(response) {
    if (!response || !response.usage) {
      return null;
    }

    return {
      input: response.usage.input_tokens || 0,
      output: response.usage.output_tokens || 0,
      total: (response.usage.input_tokens || 0) + (response.usage.output_tokens || 0)
    };
  }

  /**
   * Get cutoff date for time range
   * @private
   */
  _getCutoffDate(timeRange) {
    const now = new Date();
    const hours = {
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30
    }[timeRange] || 24 * 7;

    now.setHours(now.getHours() - hours);
    return now.toISOString();
  }

  /**
   * Shutdown metrics service
   *
   * Flushes remaining metrics and stops timer.
   * Call on app shutdown.
   *
   * @returns {Promise<void>}
   */
  async shutdown() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    await this.flush();
    console.log('[Metrics] Shutdown complete');
  }
}

export default new MetricsService();
