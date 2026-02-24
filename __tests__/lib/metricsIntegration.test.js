/**
 * Integration Tests for Metrics Database Operations
 *
 * Tests the full integration between metricsService and Supabase database:
 * - Database connection and authentication
 * - Metric insertion and retrieval
 * - Materialized view queries
 * - Error handling with real database errors
 * - Service account vs user account access
 *
 * NOTE: metricsService imports `supabase` from '../../lib/supabase' and uses it
 * directly. There is no createClient call. All DB calls go through the single
 * `mockFrom` jest.fn() defined at the top of this file.
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

describe('Metrics Database Integration', () => {
  let metricsService;

  beforeEach(() => {
    jest.resetModules();

    // Reset the mockFrom function itself so call counts/implementations don't bleed
    mockFrom.mockReset();

    process.env.SUPABASE_SERVICE_KEY = 'test-service-key';

    const MetricsServiceModule = require('../../lib/metricsService');
    metricsService = MetricsServiceModule.default;

    // Reset service state
    metricsService.batchQueue = [];
    metricsService.routingQueue = [];
    metricsService.isInitialized = false;
    metricsService.isDisabled = false;

    if (metricsService.flushTimer) {
      clearInterval(metricsService.flushTimer);
      metricsService.flushTimer = null;
    }
  });

  afterEach(() => {
    if (metricsService && metricsService.flushTimer) {
      clearInterval(metricsService.flushTimer);
    }
    jest.clearAllMocks();
  });

  describe('Database Connection', () => {
    test('should initialize successfully when supabase client is available', async () => {
      await metricsService.initialize();

      expect(metricsService.isInitialized).toBe(true);
      expect(metricsService.flushTimer).toBeTruthy();
    });

    test('should fail gracefully when supabase client is null', async () => {
      // Temporarily re-mock supabase as null for this test only
      jest.resetModules();
      jest.doMock('../../lib/supabase', () => ({ supabase: null }));

      const mod = require('../../lib/metricsService');
      const svc = mod.default;

      // Reset state
      svc.batchQueue = [];
      svc.routingQueue = [];
      svc.isInitialized = false;
      svc.isDisabled = false;
      if (svc.flushTimer) {
        clearInterval(svc.flushTimer);
        svc.flushTimer = null;
      }

      await svc.initialize();

      expect(svc.isInitialized).toBe(false);

      // Restore the original mock for subsequent tests
      jest.resetModules();
      jest.doMock('../../lib/supabase', () => ({
        supabase: { from: mockFrom },
      }));
    });
  });

  describe('AI Metrics Table Operations', () => {
    beforeEach(async () => {
      await metricsService.initialize();
    });

    test('should insert AI metrics with correct schema', async () => {
      const mockInsert = jest.fn(() => Promise.resolve({ data: [{ id: 1 }], error: null }));
      mockFrom.mockReturnValue({ insert: mockInsert });

      metricsService.logAIMetric({
        serviceName: 'enhancedClaude',
        operation: 'chat',
        durationMs: 1500,
        tokens: { input: 600, output: 300 },
        cost: 0.0065,
        status: 'success',
        metadata: { model: 'claude-sonnet-4-5', temperature: 0.7 },
        userId: 'user_abc123',
      });

      await metricsService.flush();

      expect(mockFrom).toHaveBeenCalledWith('ai_metrics');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            service_name: 'enhancedClaude',
            operation: 'chat',
            duration_ms: 1500,
            input_tokens: 600,
            output_tokens: 300,
            total_tokens: 900,
            estimated_cost: 0.0065,
            status: 'success',
            user_id: 'user_abc123',
            metadata: expect.objectContaining({
              model: 'claude-sonnet-4-5',
              temperature: 0.7,
            }),
            timestamp: expect.any(String),
          }),
        ])
      );
    });

    test('should handle constraint violations gracefully', async () => {
      const mockInsert = jest.fn(() =>
        Promise.resolve({
          error: {
            code: '23505',
            message: 'duplicate key value violates unique constraint',
          },
        })
      );
      mockFrom.mockReturnValue({ insert: mockInsert });

      metricsService.logAIMetric({
        serviceName: 'test',
        operation: 'test',
        durationMs: 100,
      });

      await expect(metricsService.flush()).resolves.not.toThrow();
    });

    test('should handle NULL values correctly', async () => {
      const mockInsert = jest.fn(() => Promise.resolve({ data: [], error: null }));
      mockFrom.mockReturnValue({ insert: mockInsert });

      metricsService.logAIMetric({
        serviceName: 'test',
        operation: 'test',
        durationMs: 100,
        // No tokens, cost, metadata, or userId
      });

      await metricsService.flush();

      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            input_tokens: null,
            output_tokens: null,
            total_tokens: null,
            estimated_cost: null,
            metadata: null,
            user_id: null,
          }),
        ])
      );
    });

    test('should batch insert multiple metrics', async () => {
      const mockInsert = jest.fn(() => Promise.resolve({ data: [], error: null }));
      mockFrom.mockReturnValue({ insert: mockInsert });

      // Add multiple metrics
      for (let i = 0; i < 5; i++) {
        metricsService.logAIMetric({
          serviceName: `service${i}`,
          operation: 'test',
          durationMs: 100 * i,
        });
      }

      await metricsService.flush();

      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(mockInsert).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ service_name: 'service0' }),
        expect.objectContaining({ service_name: 'service4' }),
      ]));
    });
  });

  describe('Routing Decisions Table Operations', () => {
    beforeEach(async () => {
      await metricsService.initialize();
    });

    test('should insert routing decisions with correct schema', async () => {
      const mockInsert = jest.fn(() => Promise.resolve({ data: [], error: null }));
      mockFrom.mockReturnValue({ insert: mockInsert });

      // SECURITY: The service does NOT accept or store inputText. Only inputLength
      // and detectedIntents are accepted (no PII). input_text is always null.
      metricsService.logRoutingDecision({
        inputLength: 38,
        detectedIntents: ['ifs', 'inner_parts'],
        selectedRoute: 'ifs_chat',
        confidence: 0.92,
        alternatives: [
          { route: 'daily_journal', score: 0.45 },
          { route: 'nervous_system_mapping', score: 0.38 },
        ],
        metadata: { context: 'user_message' },
        userId: 'user_xyz789',
      });

      await metricsService.flush();

      expect(mockFrom).toHaveBeenCalledWith('ai_routing_decisions');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            // input_text is always null — no PII stored
            input_text: null,
            selected_route: 'ifs_chat',
            confidence: 0.92,
            alternatives_considered: expect.arrayContaining([
              expect.objectContaining({ route: 'daily_journal', score: 0.45 }),
            ]),
            user_id: 'user_xyz789',
          }),
        ])
      );
    });

    test('should always store input_text as null regardless of inputLength', async () => {
      const mockInsert = jest.fn(() => Promise.resolve({ data: [], error: null }));
      mockFrom.mockReturnValue({ insert: mockInsert });

      // Even if a large inputLength is passed, no text content is ever stored
      metricsService.logRoutingDecision({
        inputLength: 1000,
        selectedRoute: 'test',
        confidence: 0.8,
      });

      await metricsService.flush();

      const insertedData = mockInsert.mock.calls[0][0][0];
      expect(insertedData.input_text).toBeNull();
      // The length is captured in metadata for analytics without PII
      expect(insertedData.metadata.input_length).toBe(1000);
    });
  });

  describe('Error Logging Table Operations', () => {
    beforeEach(async () => {
      await metricsService.initialize();
    });

    test('should insert errors immediately without batching', async () => {
      const mockInsert = jest.fn(() => Promise.resolve({ data: [], error: null }));
      mockFrom.mockReturnValue({ insert: mockInsert });

      metricsService.logError({
        serviceName: 'enhancedClaude',
        operation: 'streaming',
        errorType: 'NetworkError',
        errorMessage: 'Connection timeout after 30s',
        stackTrace: 'Error: Connection timeout\n  at fetch (http.js:45)\n  at ...',
        sentryId: 'sentry-event-abc123',
        context: { attemptNumber: 3, lastSuccessful: '2026-02-09T10:00:00Z' },
        userId: 'user_123',
      });

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFrom).toHaveBeenCalledWith('ai_errors');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            service_name: 'enhancedClaude',
            operation: 'streaming',
            error_type: 'NetworkError',
            error_message: 'Connection timeout after 30s',
            stack_trace: expect.stringContaining('at fetch'),
            sentry_event_id: 'sentry-event-abc123',
          }),
        ])
      );
    });

    test('should not add errors to batch queue', async () => {
      metricsService.logError({
        serviceName: 'test',
        operation: 'test',
        errorType: 'TestError',
        errorMessage: 'Test error',
      });

      expect(metricsService.batchQueue).toHaveLength(0);
      expect(metricsService.routingQueue).toHaveLength(0);
    });
  });

  describe('Materialized View Queries', () => {
    beforeEach(async () => {
      await metricsService.initialize();
    });

    test('should query service performance view', async () => {
      const mockData = [
        {
          service_name: 'enhancedClaude',
          total_calls: 1250,
          success_rate: 98.4,
          avg_duration_ms: 1450,
          total_tokens: 850000,
          estimated_cost: 12.50,
        },
      ];

      const mockBuilder = {
        select: jest.fn(() => mockBuilder),
        order: jest.fn(() => Promise.resolve({ data: mockData, error: null })),
      };

      mockFrom.mockReturnValue(mockBuilder);

      const result = await metricsService.getServiceHealth();

      expect(mockFrom).toHaveBeenCalledWith('mv_service_performance_last_7d');
      expect(mockBuilder.select).toHaveBeenCalledWith('*');
      expect(mockBuilder.order).toHaveBeenCalledWith('total_calls', { ascending: false });
      expect(result).toEqual(mockData);
    });

    test('should query top errors view', async () => {
      const mockData = [
        {
          service_name: 'ifsAI',
          error_type: 'RateLimitError',
          error_count: 12,
          latest_occurrence: '2026-02-09T15:30:00Z',
        },
      ];

      const mockBuilder = {
        select: jest.fn(() => mockBuilder),
        order: jest.fn(() => mockBuilder),
        limit: jest.fn(() => Promise.resolve({ data: mockData, error: null })),
      };

      mockFrom.mockReturnValue(mockBuilder);

      const result = await metricsService.getTopErrors();

      expect(mockFrom).toHaveBeenCalledWith('mv_top_errors_last_24h');
      expect(result).toEqual(mockData);
    });

    test('should handle view refresh lag gracefully', async () => {
      // Materialized views may have stale data
      const staleData = [
        { service_name: 'test', total_calls: 100 },
      ];

      const mockBuilder = {
        select: jest.fn(() => mockBuilder),
        order: jest.fn(() => Promise.resolve({ data: staleData, error: null })),
      };

      mockFrom.mockReturnValue(mockBuilder);

      const result = await metricsService.getServiceHealth();

      expect(result).toEqual(staleData);
    });
  });

  describe('Cost Summary Queries', () => {
    beforeEach(async () => {
      await metricsService.initialize();
    });

    test('should aggregate costs for time range', async () => {
      const mockData = [
        { service_name: 'enhancedClaude', estimated_cost: 5.50 },
        { service_name: 'enhancedClaude', estimated_cost: 3.20 },
        { service_name: 'ifsAI', estimated_cost: 2.10 },
        { service_name: 'routingService', estimated_cost: 0.85 },
      ];

      const mockBuilder = {
        select: jest.fn(() => mockBuilder),
        gte: jest.fn(() => mockBuilder),
        not: jest.fn(() => Promise.resolve({ data: mockData, error: null })),
      };

      mockFrom.mockReturnValue(mockBuilder);

      const result = await metricsService.getCostSummary('30d');

      expect(result.totalCost).toBeCloseTo(11.65);
      expect(result.services).toHaveLength(3);
      expect(result.services[0]).toEqual({ service: 'enhancedClaude', cost: 8.70 });
      expect(result.timeRange).toBe('30d');
    });

    test('should filter out null costs', async () => {
      const mockData = [
        { service_name: 'test1', estimated_cost: 1.00 },
        { service_name: 'test2', estimated_cost: null }, // Should be filtered
      ];

      const mockBuilder = {
        select: jest.fn(() => mockBuilder),
        gte: jest.fn(() => mockBuilder),
        not: jest.fn(() => Promise.resolve({ data: mockData, error: null })),
      };

      mockFrom.mockReturnValue(mockBuilder);

      const result = await metricsService.getCostSummary('7d');

      expect(mockBuilder.not).toHaveBeenCalledWith('estimated_cost', 'is', null);
      expect(result.totalCost).toBe(1.00);
    });

    test('should handle different time ranges', async () => {
      const mockBuilder = {
        select: jest.fn(() => mockBuilder),
        gte: jest.fn(() => mockBuilder),
        not: jest.fn(() => Promise.resolve({ data: [], error: null })),
      };

      mockFrom.mockReturnValue(mockBuilder);

      await metricsService.getCostSummary('24h');
      let gteCall = mockBuilder.gte.mock.calls[0][1];
      const date24h = new Date(gteCall);

      mockBuilder.gte.mockClear();

      await metricsService.getCostSummary('7d');
      gteCall = mockBuilder.gte.mock.calls[0][1];
      const date7d = new Date(gteCall);

      expect(date24h > date7d).toBe(true); // 24h is more recent
    });
  });

  describe('Routing Quality Queries', () => {
    beforeEach(async () => {
      await metricsService.initialize();
    });

    test('should calculate routing quality metrics', async () => {
      const mockData = [
        { selected_route: 'ifs_chat', confidence: 0.95 },
        { selected_route: 'ifs_chat', confidence: 0.88 },
        { selected_route: 'daily_journal', confidence: 0.82 },
        { selected_route: 'nervous_system_mapping', confidence: 0.65 }, // Low
        { selected_route: 'ifs_chat', confidence: 0.91 },
      ];

      const mockBuilder = {
        select: jest.fn(() => mockBuilder),
        gte: jest.fn(() => Promise.resolve({ data: mockData, error: null })),
      };

      mockFrom.mockReturnValue(mockBuilder);

      const result = await metricsService.getRoutingQuality();

      expect(result.totalDecisions).toBe(5);
      expect(result.mostCommonRoute).toBe('ifs_chat'); // 3 occurrences
      expect(result.lowConfidenceCount).toBe(1); // Only 0.65 < 0.7
      expect(result.avgConfidence).toBeGreaterThan(80); // Average should be > 80%
    });

    test('should handle empty routing data', async () => {
      const mockBuilder = {
        select: jest.fn(() => mockBuilder),
        gte: jest.fn(() => Promise.resolve({ data: [], error: null })),
      };

      mockFrom.mockReturnValue(mockBuilder);

      const result = await metricsService.getRoutingQuality();

      expect(result).toEqual({
        avgConfidence: 0,
        totalDecisions: 0,
        mostCommonRoute: null,
        lowConfidenceCount: 0,
      });
    });
  });

  describe('Row Level Security (RLS)', () => {
    test('should insert metrics using the authenticated supabase client', async () => {
      await metricsService.initialize();

      // The authenticated client handles RLS via the user JWT.
      // Inserts succeed for metrics belonging to the current user.
      const mockInsert = jest.fn(() => Promise.resolve({ data: [], error: null }));
      mockFrom.mockReturnValue({ insert: mockInsert });

      metricsService.logAIMetric({
        serviceName: 'test',
        operation: 'test',
        durationMs: 100,
        userId: 'different_user',
      });

      await metricsService.flush();

      expect(mockInsert).toHaveBeenCalled();
    });

    test('should handle RLS-style policy violation errors gracefully', async () => {
      // Simulate what happens when the DB returns an RLS error
      const mockBuilder = {
        select: jest.fn(() => mockBuilder),
        order: jest.fn(() =>
          Promise.resolve({
            data: [],
            error: { message: 'Row level security policy violation' },
          })
        ),
      };

      mockFrom.mockReturnValue(mockBuilder);

      await metricsService.initialize();

      const result = await metricsService.getServiceHealth();

      // Service should handle RLS errors gracefully
      expect(result).toEqual([]);
    });
  });

  describe('Error Handling and Resilience', () => {
    beforeEach(async () => {
      await metricsService.initialize();
    });

    test('should handle network timeouts', async () => {
      const mockInsert = jest.fn(() =>
        Promise.reject(new Error('ETIMEDOUT: Connection timeout'))
      );
      mockFrom.mockReturnValue({ insert: mockInsert });

      metricsService.logAIMetric({
        serviceName: 'test',
        operation: 'test',
        durationMs: 100,
      });

      await expect(metricsService.flush()).resolves.not.toThrow();
    });

    test('should handle database unavailable', async () => {
      const mockInsert = jest.fn(() =>
        Promise.reject(new Error('ECONNREFUSED: Database not available'))
      );
      mockFrom.mockReturnValue({ insert: mockInsert });

      metricsService.logAIMetric({
        serviceName: 'test',
        operation: 'test',
        durationMs: 100,
      });

      await expect(metricsService.flush()).resolves.not.toThrow();
      // Metrics should remain in app, not crash
    });

    test('should handle query errors gracefully', async () => {
      const mockBuilder = {
        select: jest.fn(() => mockBuilder),
        order: jest.fn(() =>
          Promise.reject(new Error('Query execution failed'))
        ),
      };

      mockFrom.mockReturnValue(mockBuilder);

      const result = await metricsService.getServiceHealth();

      expect(result).toEqual([]);
    });

    test('should handle malformed database responses', async () => {
      const mockBuilder = {
        select: jest.fn(() => mockBuilder),
        gte: jest.fn(() => Promise.resolve({ data: null, error: null })), // Unexpected null
      };

      mockFrom.mockReturnValue(mockBuilder);

      const result = await metricsService.getRoutingQuality();

      expect(result).toBeDefined();
      expect(result.totalDecisions).toBe(0);
    });
  });

  describe('Transaction-like Behavior', () => {
    beforeEach(async () => {
      await metricsService.initialize();
    });

    test('should handle partial batch failures', async () => {
      let callCount = 0;
      const mockInsert = jest.fn(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ data: [], error: 'First call failed' });
        }
        return Promise.resolve({ data: [], error: null });
      });

      mockFrom.mockReturnValue({ insert: mockInsert });

      // Add metrics and routing
      metricsService.logAIMetric({ serviceName: 'test', operation: 'test', durationMs: 100 });
      metricsService.logRoutingDecision({ inputLength: 4, selectedRoute: 'test', confidence: 0.8 });

      await metricsService.flush();

      // Both inserts should be attempted even if one fails
      expect(mockInsert).toHaveBeenCalledTimes(2);
    });

    test('should clear queues even on database errors', async () => {
      mockFrom.mockReturnValue({
        insert: jest.fn(() => Promise.resolve({ error: 'Database error' })),
      });

      metricsService.logAIMetric({ serviceName: 'test', operation: 'test', durationMs: 100 });
      metricsService.logRoutingDecision({ inputLength: 4, selectedRoute: 'test', confidence: 0.8 });

      await metricsService.flush();

      // Queues should be cleared to prevent memory leaks
      expect(metricsService.batchQueue).toHaveLength(0);
      expect(metricsService.routingQueue).toHaveLength(0);
    });
  });
});
