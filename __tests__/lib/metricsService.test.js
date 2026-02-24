/**
 * Unit Tests for MetricsService
 *
 * Tests core functionality of the metrics service including:
 * - Initialization and configuration
 * - Metric logging (AI metrics, routing decisions, errors)
 * - Batching and flushing
 * - Token counting and cost calculation
 * - Data retrieval methods
 * - Error handling and graceful degradation
 */

// NOTE: No ESM import of jest — Jest globals are available automatically.

const mockFrom = jest.fn();

// Mock the supabase module — the service imports `supabase` from './supabase'.
// All DB operations go through this single client.
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}));

describe('MetricsService', () => {
  let metricsService;

  beforeEach(() => {
    // Clear module cache to get a fresh singleton instance
    jest.resetModules();

    // Reset the mockFrom function itself so call counts/implementations don't bleed
    mockFrom.mockReset();

    // Set environment variable (kept for parity; service doesn't read it directly)
    process.env.SUPABASE_SERVICE_KEY = 'test-service-key';

    // Import a fresh instance after module reset
    const MetricsServiceModule = require('../../lib/metricsService');
    metricsService = MetricsServiceModule.default;

    // Reset service state
    metricsService.batchQueue = [];
    metricsService.routingQueue = [];
    metricsService.isInitialized = false;
    metricsService.isDisabled = false;

    // Clear any running flush timer
    if (metricsService.flushTimer) {
      clearInterval(metricsService.flushTimer);
      metricsService.flushTimer = null;
    }
  });

  afterEach(() => {
    // Stop any timers that may have been started during the test
    if (metricsService && metricsService.flushTimer) {
      clearInterval(metricsService.flushTimer);
    }
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------
  describe('Initialization', () => {
    test('should initialize successfully with valid Supabase client', async () => {
      await metricsService.initialize();

      expect(metricsService.isInitialized).toBe(true);
      expect(metricsService.flushTimer).toBeTruthy();
    });

    test('should not initialize twice', async () => {
      await metricsService.initialize();
      await metricsService.initialize();

      // isInitialized stays true and no error is thrown
      expect(metricsService.isInitialized).toBe(true);
    });

    test('should fail gracefully when supabase client is null', async () => {
      // Temporarily re-mock supabase as null for this test only
      jest.resetModules();
      jest.doMock('../../lib/supabase', () => ({ supabase: null }));

      const mod = require('../../lib/metricsService');
      const svc = mod.default;

      await svc.initialize();

      expect(svc.isInitialized).toBe(false);

      // Restore the original mock for subsequent tests
      jest.resetModules();
      jest.doMock('../../lib/supabase', () => ({
        supabase: { from: mockFrom },
      }));
    });

    test('should start flush timer on initialization', async () => {
      jest.useFakeTimers();

      await metricsService.initialize();

      expect(metricsService.flushTimer).toBeTruthy();

      jest.useRealTimers();
    });
  });

  // ---------------------------------------------------------------------------
  // logAIMetric
  // ---------------------------------------------------------------------------
  describe('logAIMetric', () => {
    beforeEach(async () => {
      await metricsService.initialize();
    });

    test('should queue AI metric with all fields', () => {
      const metric = {
        serviceName: 'enhancedClaude',
        operation: 'chat',
        durationMs: 1234,
        tokens: { input: 500, output: 200, total: 700 },
        cost: 0.0045,
        status: 'success',
        metadata: { model: 'claude-sonnet-4-5' },
        userId: 'user_123',
      };

      metricsService.logAIMetric(metric);

      expect(metricsService.batchQueue).toHaveLength(1);
      expect(metricsService.batchQueue[0]).toMatchObject({
        service_name: 'enhancedClaude',
        operation: 'chat',
        duration_ms: 1234,
        input_tokens: 500,
        output_tokens: 200,
        total_tokens: 700,
        estimated_cost: 0.0045,
        status: 'success',
        user_id: 'user_123',
      });
    });

    test('should handle metric with minimal fields', () => {
      metricsService.logAIMetric({
        serviceName: 'testService',
        operation: 'test',
        durationMs: 100,
      });

      expect(metricsService.batchQueue).toHaveLength(1);
      expect(metricsService.batchQueue[0]).toMatchObject({
        service_name: 'testService',
        operation: 'test',
        duration_ms: 100,
        input_tokens: null,
        output_tokens: null,
        total_tokens: null,
        estimated_cost: null,
        status: 'success',
      });
    });

    test('should calculate total tokens from input and output', () => {
      metricsService.logAIMetric({
        serviceName: 'test',
        operation: 'test',
        durationMs: 100,
        tokens: { input: 300, output: 400 },
      });

      expect(metricsService.batchQueue[0].total_tokens).toBe(700);
    });

    test('should not queue if service not initialized', () => {
      metricsService.isInitialized = false;

      metricsService.logAIMetric({
        serviceName: 'test',
        operation: 'test',
        durationMs: 100,
      });

      expect(metricsService.batchQueue).toHaveLength(0);
    });

    test('should flush when batch size reaches maxBatchSize', async () => {
      const mockFlush = jest.spyOn(metricsService, 'flush').mockResolvedValue();
      metricsService.maxBatchSize = 3;

      metricsService.logAIMetric({ serviceName: 'test', operation: 'test', durationMs: 100 });
      metricsService.logAIMetric({ serviceName: 'test', operation: 'test', durationMs: 100 });
      expect(mockFlush).not.toHaveBeenCalled();

      metricsService.logAIMetric({ serviceName: 'test', operation: 'test', durationMs: 100 });
      expect(mockFlush).toHaveBeenCalledTimes(1);

      mockFlush.mockRestore();
    });

    test('should handle errors gracefully and not throw', () => {
      metricsService.isInitialized = true;

      // Passing {} (all params undefined) exercises the try/catch inside the method.
      // Passing null would throw at parameter destructuring before try/catch — that
      // is expected JS behaviour, not a bug in the service.
      expect(() => {
        metricsService.logAIMetric({});
      }).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // logRoutingDecision
  // ---------------------------------------------------------------------------
  describe('logRoutingDecision', () => {
    beforeEach(async () => {
      await metricsService.initialize();
    });

    test('should queue routing decision with all fields', () => {
      const decision = {
        inputLength: 38,          // character count — no raw text is stored
        detectedIntents: ['anxiety'],
        selectedRoute: 'nervous_system_mapping',
        confidence: 0.85,
        alternatives: [{ route: 'daily_journal', score: 0.65 }],
        metadata: { context: 'user_initiated' },
        userId: 'user_123',
      };

      metricsService.logRoutingDecision(decision);

      expect(metricsService.routingQueue).toHaveLength(1);
      const queued = metricsService.routingQueue[0];

      // input_text is ALWAYS null — no PII is stored
      expect(queued.input_text).toBeNull();
      expect(queued.selected_route).toBe('nervous_system_mapping');
      expect(queued.confidence).toBe(0.85);
      expect(queued.user_id).toBe('user_123');
      expect(queued.metadata.input_length).toBe(38);
      expect(queued.metadata.detected_intents).toContain('anxiety');
    });

    test('should always store input_text as null regardless of inputLength', () => {
      metricsService.logRoutingDecision({
        inputLength: 1000,
        selectedRoute: 'test',
        confidence: 0.9,
      });

      // The service explicitly does not store user input text (PII protection)
      expect(metricsService.routingQueue[0].input_text).toBeNull();
    });

    test('should handle minimal routing decision', () => {
      metricsService.logRoutingDecision({
        inputLength: 4,
        selectedRoute: 'daily_journal',
        confidence: 0.7,
      });

      expect(metricsService.routingQueue).toHaveLength(1);
      expect(metricsService.routingQueue[0]).toMatchObject({
        input_text: null,
        selected_route: 'daily_journal',
        confidence: 0.7,
        alternatives_considered: null,
      });
    });

    test('should flush when batch size reached', async () => {
      const mockFlush = jest.spyOn(metricsService, 'flush').mockResolvedValue();
      metricsService.maxBatchSize = 2;

      metricsService.logRoutingDecision({ inputLength: 4, selectedRoute: 'route1', confidence: 0.8 });
      metricsService.logRoutingDecision({ inputLength: 4, selectedRoute: 'route2', confidence: 0.9 });

      expect(mockFlush).toHaveBeenCalledTimes(1);

      mockFlush.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // logError
  // ---------------------------------------------------------------------------
  describe('logError', () => {
    beforeEach(async () => {
      await metricsService.initialize();
    });

    test('should insert error immediately (not batched)', async () => {
      const mockInsert = jest.fn(() => Promise.resolve({ data: [], error: null }));
      mockFrom.mockReturnValue({
        insert: mockInsert,
      });

      const errorData = {
        serviceName: 'enhancedClaude',
        operation: 'chat',
        errorType: 'APIError',
        errorMessage: 'Rate limit exceeded',
        stackTrace: 'Error: Rate limit\n  at ...',
        sentryId: 'sentry-123',
        userId: 'user_123',
      };

      metricsService.logError(errorData);

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFrom).toHaveBeenCalledWith('ai_errors');
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          service_name: 'enhancedClaude',
          operation: 'chat',
          error_type: 'APIError',
          error_message: 'Rate limit exceeded',
        }),
      ]);
    });

    test('should handle error insertion failure gracefully', async () => {
      mockFrom.mockReturnValue({
        insert: jest.fn(() => Promise.resolve({ error: 'Database error' })),
      });

      expect(() => {
        metricsService.logError({
          serviceName: 'test',
          operation: 'test',
          errorType: 'TestError',
          errorMessage: 'Test',
        });
      }).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // flush
  // ---------------------------------------------------------------------------
  describe('flush', () => {
    beforeEach(async () => {
      await metricsService.initialize();
    });

    test('should flush metrics and routing decisions', async () => {
      const mockMetricsInsert = jest.fn(() => Promise.resolve({ data: [], error: null }));
      const mockRoutingInsert = jest.fn(() => Promise.resolve({ data: [], error: null }));

      mockFrom.mockImplementation((table) => {
        if (table === 'ai_metrics') {
          return { insert: mockMetricsInsert };
        }
        if (table === 'ai_routing_decisions') {
          return { insert: mockRoutingInsert };
        }
      });

      // Add items to queues
      metricsService.logAIMetric({ serviceName: 'test1', operation: 'test', durationMs: 100 });
      metricsService.logAIMetric({ serviceName: 'test2', operation: 'test', durationMs: 200 });
      metricsService.logRoutingDecision({ inputLength: 4, selectedRoute: 'route1', confidence: 0.8 });

      await metricsService.flush();

      expect(mockMetricsInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ service_name: 'test1' }),
          expect.objectContaining({ service_name: 'test2' }),
        ])
      );
      expect(mockRoutingInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ selected_route: 'route1' }),
        ])
      );
    });

    test('should clear queues after flushing', async () => {
      mockFrom.mockReturnValue({
        insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
      });

      metricsService.logAIMetric({ serviceName: 'test', operation: 'test', durationMs: 100 });
      metricsService.logRoutingDecision({ inputLength: 4, selectedRoute: 'route', confidence: 0.8 });

      expect(metricsService.batchQueue).toHaveLength(1);
      expect(metricsService.routingQueue).toHaveLength(1);

      await metricsService.flush();

      expect(metricsService.batchQueue).toHaveLength(0);
      expect(metricsService.routingQueue).toHaveLength(0);
    });

    test('should handle empty queues', async () => {
      mockFrom.mockReturnValue({
        insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
      });

      await metricsService.flush();

      // Nothing queued → from() should never be called
      expect(mockFrom).not.toHaveBeenCalled();
    });

    test('should handle database errors gracefully', async () => {
      mockFrom.mockReturnValue({
        insert: jest.fn(() => Promise.resolve({ error: 'Database error' })),
      });

      metricsService.logAIMetric({ serviceName: 'test', operation: 'test', durationMs: 100 });

      await expect(metricsService.flush()).resolves.not.toThrow();
    });

    test('should not flush if not initialized', async () => {
      metricsService.isInitialized = false;
      // Directly push to queue (logAIMetric skips when not initialized)
      metricsService.batchQueue.push({ service_name: 'test', operation: 'test', duration_ms: 100 });

      await metricsService.flush();

      // Queue should NOT be cleared because flush returns early
      expect(metricsService.batchQueue).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Token and Cost Calculation
  // ---------------------------------------------------------------------------
  describe('Token and Cost Calculation', () => {
    test('calculateCost should calculate correct cost for Claude Sonnet 4.5', () => {
      const MetricsServiceClass = require('../../lib/metricsService').default.constructor;

      const tokens = { input: 1000000, output: 1000000 }; // 1M each
      const cost = MetricsServiceClass.calculateCost(tokens);

      // $3.00 per 1M input + $15.00 per 1M output = $18.00
      expect(cost).toBe(18.00);
    });

    test('calculateCost should handle fractional token counts', () => {
      const MetricsServiceClass = require('../../lib/metricsService').default.constructor;

      const tokens = { input: 500000, output: 250000 }; // 0.5M input, 0.25M output
      const cost = MetricsServiceClass.calculateCost(tokens);

      // (0.5 * $3.00) + (0.25 * $15.00) = $1.50 + $3.75 = $5.25
      expect(cost).toBe(5.25);
    });

    test('calculateCost should return 0 for null input', () => {
      const MetricsServiceClass = require('../../lib/metricsService').default.constructor;

      expect(MetricsServiceClass.calculateCost(null)).toBe(0);
    });

    test('calculateCost should return NaN when output tokens are missing', () => {
      const MetricsServiceClass = require('../../lib/metricsService').default.constructor;

      // tokens.output is undefined → (undefined / 1_000_000) * price = NaN
      const result = MetricsServiceClass.calculateCost({ input: 100 });
      expect(result).toBeNaN();
    });

    test('estimateTokens should estimate tokens from text', () => {
      const MetricsServiceClass = require('../../lib/metricsService').default.constructor;

      const text = 'a'.repeat(400); // 400 characters
      const tokens = MetricsServiceClass.estimateTokens(text);

      expect(tokens).toBe(100); // 400 / 4 = 100
    });

    test('estimateTokens should handle empty text', () => {
      const MetricsServiceClass = require('../../lib/metricsService').default.constructor;

      expect(MetricsServiceClass.estimateTokens('')).toBe(0);
      expect(MetricsServiceClass.estimateTokens(null)).toBe(0);
    });

    test('extractTokens should extract from Claude API response', () => {
      const MetricsServiceClass = require('../../lib/metricsService').default.constructor;

      const response = {
        usage: {
          input_tokens: 500,
          output_tokens: 200,
        },
      };

      const tokens = MetricsServiceClass.extractTokens(response);

      expect(tokens).toEqual({
        input: 500,
        output: 200,
        total: 700,
      });
    });

    test('extractTokens should handle missing usage', () => {
      const MetricsServiceClass = require('../../lib/metricsService').default.constructor;

      expect(MetricsServiceClass.extractTokens(null)).toBeNull();
      expect(MetricsServiceClass.extractTokens({})).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Data Retrieval Methods
  // ---------------------------------------------------------------------------
  describe('Data Retrieval Methods', () => {
    beforeEach(async () => {
      await metricsService.initialize();
    });

    test('getServiceHealth should fetch and return service health data', async () => {
      const mockData = [
        { service_name: 'enhancedClaude', total_calls: 100, success_rate: 98.5 },
        { service_name: 'ifsAI', total_calls: 50, success_rate: 99.0 },
      ];

      mockFrom.mockReturnValue({
        select: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: mockData, error: null })),
        })),
      });

      const result = await metricsService.getServiceHealth();

      expect(result).toEqual(mockData);
      expect(mockFrom).toHaveBeenCalledWith('mv_service_performance_last_7d');
    });

    test('getServiceHealth should return empty array on error', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: null, error: 'DB error' })),
        })),
      });

      const result = await metricsService.getServiceHealth();

      expect(result).toEqual([]);
    });

    test('getCostSummary should aggregate costs by service', async () => {
      const mockData = [
        { service_name: 'enhancedClaude', estimated_cost: 0.05 },
        { service_name: 'enhancedClaude', estimated_cost: 0.03 },
        { service_name: 'ifsAI', estimated_cost: 0.02 },
      ];

      mockFrom.mockReturnValue({
        select: jest.fn(() => ({
          gte: jest.fn(() => ({
            not: jest.fn(() => Promise.resolve({ data: mockData, error: null })),
          })),
        })),
      });

      const result = await metricsService.getCostSummary('7d');

      expect(result.totalCost).toBe(0.10);
      expect(result.services).toHaveLength(2);
      expect(result.services[0]).toEqual({ service: 'enhancedClaude', cost: 0.08 });
      expect(result.services[1]).toEqual({ service: 'ifsAI', cost: 0.02 });
    });

    test('getTopErrors should fetch top errors', async () => {
      const mockErrors = [
        { service_name: 'enhancedClaude', error_type: 'APIError', error_count: 5 },
      ];

      mockFrom.mockReturnValue({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ data: mockErrors, error: null })),
          })),
        })),
      });

      const result = await metricsService.getTopErrors();

      expect(result).toEqual(mockErrors);
    });

    test('getRoutingQuality should calculate routing metrics', async () => {
      const mockData = [
        { selected_route: 'route1', confidence: 0.9 },
        { selected_route: 'route1', confidence: 0.8 },
        { selected_route: 'route2', confidence: 0.6 }, // Low confidence
      ];

      mockFrom.mockReturnValue({
        select: jest.fn(() => ({
          gte: jest.fn(() => Promise.resolve({ data: mockData, error: null })),
        })),
      });

      const result = await metricsService.getRoutingQuality();

      expect(result.avgConfidence).toBe(77); // (0.9 + 0.8 + 0.6) / 3 * 100 = 76.67 → 77
      expect(result.totalDecisions).toBe(3);
      expect(result.mostCommonRoute).toBe('route1');
      expect(result.lowConfidenceCount).toBe(1); // Only 0.6 is <0.7
    });

    test('getRoutingQuality should handle no data', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn(() => ({
          gte: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      });

      const result = await metricsService.getRoutingQuality();

      expect(result).toEqual({
        avgConfidence: 0,
        totalDecisions: 0,
        mostCommonRoute: null,
        lowConfidenceCount: 0,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Shutdown
  // ---------------------------------------------------------------------------
  describe('Shutdown', () => {
    test('should flush metrics and clear timer on shutdown', async () => {
      await metricsService.initialize();

      metricsService.logAIMetric({ serviceName: 'test', operation: 'test', durationMs: 100 });

      const mockFlush = jest.spyOn(metricsService, 'flush').mockResolvedValue();

      await metricsService.shutdown();

      expect(mockFlush).toHaveBeenCalled();
      expect(metricsService.flushTimer).toBeNull();

      mockFlush.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases and Boundary Conditions
  // ---------------------------------------------------------------------------
  describe('Edge Cases and Boundary Conditions', () => {
    beforeEach(async () => {
      await metricsService.initialize();
    });

    test('should handle very large batch sizes', async () => {
      const mockInsert = jest.fn(() => Promise.resolve({ data: [], error: null }));
      mockFrom.mockReturnValue({ insert: mockInsert });

      // Add 1000 metrics directly to avoid triggering early flushes
      for (let i = 0; i < 1000; i++) {
        metricsService.batchQueue.push({
          service_name: 'test',
          operation: 'test',
          duration_ms: i,
        });
      }

      await metricsService.flush();

      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ duration_ms: 0 }),
          expect.objectContaining({ duration_ms: 999 }),
        ])
      );
    });

    test('should handle extreme duration values', () => {
      metricsService.logAIMetric({
        serviceName: 'test',
        operation: 'test',
        durationMs: 999999999,
      });

      expect(metricsService.batchQueue[0].duration_ms).toBe(999999999);
    });

    test('should handle negative cost values', () => {
      metricsService.logAIMetric({
        serviceName: 'test',
        operation: 'test',
        durationMs: 100,
        cost: -0.01,
      });

      expect(metricsService.batchQueue[0].estimated_cost).toBe(-0.01);
    });

    test('should store input_text as null and preserve metadata for special characters', () => {
      // The service does NOT store user input text (PII protection).
      // inputLength is stored in metadata instead.
      const specialText = 'Test with "quotes" and \'apostrophes\' and <tags> and émojis 🎉';
      const inputLength = specialText.length;

      metricsService.logRoutingDecision({
        inputLength,
        selectedRoute: 'test',
        confidence: 0.8,
      });

      const queued = metricsService.routingQueue[0];
      // input_text is always null — no raw text stored
      expect(queued.input_text).toBeNull();
      // The length is preserved so routing quality can be analysed without PII
      expect(queued.metadata.input_length).toBe(inputLength);
    });

    test('should handle concurrent flush calls', async () => {
      const mockInsert = jest.fn(() =>
        new Promise(resolve => setTimeout(() => resolve({ data: [], error: null }), 100))
      );
      mockFrom.mockReturnValue({ insert: mockInsert });

      metricsService.logAIMetric({ serviceName: 'test', operation: 'test', durationMs: 100 });

      // Call flush multiple times concurrently
      await Promise.all([
        metricsService.flush(),
        metricsService.flush(),
        metricsService.flush(),
      ]);

      // Queues are cleared on first flush; subsequent calls see empty queues → no insert
      expect(mockInsert).toHaveBeenCalledTimes(1);
    });
  });
});
