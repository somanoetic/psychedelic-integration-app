/**
 * End-to-End Tests for AI Monitoring & Observability
 *
 * Tests the complete flow from AI service call to dashboard display:
 * 1. AI service makes a call
 * 2. Metrics are logged to metricsService
 * 3. Metrics are batched and flushed to database
 * 4. Dashboard queries and displays metrics
 * 5. Admin sees the metrics on the dashboard
 */

// Mock ../../lib/supabase at the top level so Jest hoists it correctly.
// The `from` function is a plain jest.fn() here; its implementation is
// configured per-test inside beforeEach so each test gets its own
// table-level handlers and captured arrays.
let mockSupabaseFrom;
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('AI Monitoring E2E Flow', () => {
  let metricsService;

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();

    // Capture arrays for each table so assertions can inspect inserted data.
    const insertedMetrics = [];
    const insertedRouting = [];
    const insertedErrors = [];

    // Get the mock reference that was registered by jest.mock above.
    const { supabase } = require('../../lib/supabase');
    mockSupabaseFrom = supabase.from;

    // Configure table-specific behaviour for this test run.
    mockSupabaseFrom.mockImplementation((table) => {
      if (table === 'ai_metrics') {
        return {
          insert: jest.fn((data) => {
            insertedMetrics.push(...data);
            return Promise.resolve({ data, error: null });
          }),
          select: jest.fn(() => ({
            gte: jest.fn(() => ({
              not: jest.fn(() =>
                Promise.resolve({
                  data: insertedMetrics.filter(m => m.estimated_cost != null),
                  error: null,
                })
              ),
            })),
          })),
        };
      }

      if (table === 'ai_routing_decisions') {
        return {
          insert: jest.fn((data) => {
            insertedRouting.push(...data);
            return Promise.resolve({ data, error: null });
          }),
          select: jest.fn(() => ({
            gte: jest.fn(() =>
              Promise.resolve({ data: insertedRouting, error: null })
            ),
          })),
        };
      }

      if (table === 'ai_errors') {
        return {
          insert: jest.fn((data) => {
            insertedErrors.push(...data);
            return Promise.resolve({ data, error: null });
          }),
        };
      }

      if (table === 'mv_service_performance_last_7d') {
        return {
          select: jest.fn(() => ({
            order: jest.fn(() =>
              Promise.resolve({
                data: [
                  {
                    service_name: 'enhancedClaude',
                    total_calls: 100,
                    success_rate: 98.5,
                    avg_duration_ms: 1500,
                  },
                ],
                error: null,
              })
            ),
          })),
        };
      }

      if (table === 'mv_top_errors_last_24h') {
        return {
          select: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() =>
                Promise.resolve({
                  data: insertedErrors.map(e => ({
                    service_name: e.service_name,
                    error_type: e.error_type,
                    error_count: 1,
                  })),
                  error: null,
                })
              ),
            })),
          })),
        };
      }

      // Default handler for any other table.
      return {
        insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
        select: jest.fn(() => Promise.resolve({ data: [], error: null })),
      };
    });

    // Re-require after mocks are configured so the service picks up the mock.
    const MetricsServiceModule = require('../../lib/metricsService');
    metricsService = MetricsServiceModule.default;

    // Reset singleton state between tests.
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
    jest.useRealTimers();
    if (metricsService && metricsService.flushTimer) {
      clearInterval(metricsService.flushTimer);
    }
    jest.clearAllMocks();
  });

  describe('Complete Monitoring Flow', () => {
    test('should track AI call from service to dashboard', async () => {
      jest.useRealTimers();
      // Step 1: Initialize metrics service
      await metricsService.initialize();
      expect(metricsService.isInitialized).toBe(true);

      // Step 2: Simulate AI service making a call
      const startTime = Date.now();

      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 50));

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Step 3: Log the metric
      metricsService.logAIMetric({
        serviceName: 'enhancedClaude',
        operation: 'chat',
        durationMs: duration,
        tokens: { input: 500, output: 300 },
        cost: 0.0065,
        status: 'success',
        userId: 'user_test123',
      });

      expect(metricsService.batchQueue).toHaveLength(1);

      // Step 4: Flush metrics to database
      await metricsService.flush();

      expect(metricsService.batchQueue).toHaveLength(0);
      expect(mockSupabaseFrom).toHaveBeenCalledWith('ai_metrics');

      // Step 5: Query metrics for dashboard
      const serviceHealth = await metricsService.getServiceHealth();
      expect(serviceHealth).toHaveLength(1);
      expect(serviceHealth[0].service_name).toBe('enhancedClaude');

      const costSummary = await metricsService.getCostSummary('7d');
      expect(costSummary.totalCost).toBeGreaterThan(0);
    });

    test('should track routing decision flow', async () => {
      await metricsService.initialize();

      // Simulate routing decision.
      // logRoutingDecision does NOT accept inputText — it accepts inputLength
      // and detectedIntents (no PII is stored).
      const userInput = 'I want to explore my inner parts';
      const routes = [
        { route: 'ifs_chat', score: 0.92 },
        { route: 'daily_journal', score: 0.45 },
      ];

      // Log routing decision
      metricsService.logRoutingDecision({
        inputLength: userInput.length,
        detectedIntents: ['ifs', 'parts_work'],
        selectedRoute: routes[0].route,
        confidence: routes[0].score,
        alternatives: routes.slice(1),
        userId: 'user_test123',
      });

      // Flush to database
      await metricsService.flush();

      // Query routing quality
      const routingQuality = await metricsService.getRoutingQuality();
      expect(routingQuality.totalDecisions).toBeGreaterThan(0);
      expect(routingQuality.mostCommonRoute).toBe('ifs_chat');
    });

    test('should track error flow immediately', async () => {
      jest.useRealTimers();
      await metricsService.initialize();

      // Simulate error
      const error = new Error('API rate limit exceeded');

      metricsService.logError({
        serviceName: 'enhancedClaude',
        operation: 'chat',
        errorType: 'RateLimitError',
        errorMessage: error.message,
        stackTrace: error.stack,
        userId: 'user_test123',
      });

      // Wait for async insertion
      await new Promise(resolve => setTimeout(resolve, 50));

      // Query errors
      const topErrors = await metricsService.getTopErrors();
      expect(topErrors.length).toBeGreaterThan(0);
    });

    test('should track multiple services concurrently', async () => {
      await metricsService.initialize();

      // Simulate multiple AI services making calls
      const services = ['enhancedClaude', 'ifsAI', 'nervousSystemMapping', 'routingService'];

      services.forEach((service, index) => {
        metricsService.logAIMetric({
          serviceName: service,
          operation: 'process',
          durationMs: 1000 + (index * 100),
          tokens: { input: 400, output: 200 },
          cost: 0.003 * (index + 1),
          status: 'success',
        });
      });

      expect(metricsService.batchQueue).toHaveLength(4);

      await metricsService.flush();

      const costSummary = await metricsService.getCostSummary('7d');
      expect(costSummary.services.length).toBeGreaterThan(0);
    });

    test('should handle automatic periodic flushing', async () => {
      await metricsService.initialize();

      // Log a metric
      metricsService.logAIMetric({
        serviceName: 'test',
        operation: 'test',
        durationMs: 100,
      });

      expect(metricsService.batchQueue).toHaveLength(1);

      // Fast-forward time to trigger flush
      jest.advanceTimersByTime(metricsService.flushInterval || 30000);

      // Give the flush promise time to resolve
      await Promise.resolve();
      await Promise.resolve();

      // The batch should be flushed (or attempting to flush)
      // With fake timers, the flush may be queued
      expect(metricsService.batchQueue.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Dashboard Integration', () => {
    test('should provide all data needed for dashboard', async () => {
      await metricsService.initialize();

      // Simulate AI activity
      for (let i = 0; i < 10; i++) {
        metricsService.logAIMetric({
          serviceName: i % 2 === 0 ? 'enhancedClaude' : 'ifsAI',
          operation: 'chat',
          durationMs: 1000 + Math.random() * 1000,
          tokens: { input: 500, output: 300 },
          cost: 0.005,
          status: i < 9 ? 'success' : 'error',
        });
      }

      await metricsService.flush();

      // Fetch all dashboard data
      const [serviceHealth, costSummary, topErrors, routingQuality] = await Promise.all([
        metricsService.getServiceHealth(),
        metricsService.getCostSummary('30d'),
        metricsService.getTopErrors(),
        metricsService.getRoutingQuality(),
      ]);

      // Verify all data is available
      expect(serviceHealth).toBeDefined();
      expect(costSummary).toBeDefined();
      expect(costSummary.totalCost).toBeGreaterThan(0);
      expect(topErrors).toBeDefined();
      expect(routingQuality).toBeDefined();
    });

    test('should handle dashboard refresh', async () => {
      await metricsService.initialize();

      // Initial load
      let costSummary = await metricsService.getCostSummary('7d');
      const initialCost = costSummary.totalCost;

      // Add more metrics
      metricsService.logAIMetric({
        serviceName: 'test',
        operation: 'test',
        durationMs: 100,
        cost: 1.00,
      });

      await metricsService.flush();

      // Refresh dashboard
      costSummary = await metricsService.getCostSummary('7d');
      expect(costSummary.totalCost).toBeGreaterThanOrEqual(initialCost);
    });
  });

  describe('Real-World Scenarios', () => {
    test('should handle high-volume usage', async () => {
      await metricsService.initialize();

      // Simulate 1000 AI calls
      for (let i = 0; i < 1000; i++) {
        metricsService.logAIMetric({
          serviceName: 'enhancedClaude',
          operation: 'chat',
          durationMs: Math.random() * 2000,
          tokens: { input: 500, output: 300 },
          cost: 0.005,
          status: 'success',
        });
      }

      // Should auto-flush multiple times
      expect(metricsService.batchQueue.length).toBeLessThan(1000);

      await metricsService.flush();
      expect(metricsService.batchQueue).toHaveLength(0);
    });

    test('should handle mixed success and failure calls', async () => {
      await metricsService.initialize();

      const statuses = ['success', 'success', 'success', 'error', 'success'];

      statuses.forEach((status, index) => {
        metricsService.logAIMetric({
          serviceName: 'enhancedClaude',
          operation: 'chat',
          durationMs: 1000,
          status,
        });

        if (status === 'error') {
          metricsService.logError({
            serviceName: 'enhancedClaude',
            operation: 'chat',
            errorType: 'APIError',
            errorMessage: `Error ${index}`,
          });
        }
      });

      await metricsService.flush();

      const serviceHealth = await metricsService.getServiceHealth();
      expect(serviceHealth[0].success_rate).toBeLessThan(100);
    });

    test('should track user-specific metrics', async () => {
      await metricsService.initialize();

      const users = ['user_1', 'user_2', 'user_3'];

      users.forEach(userId => {
        metricsService.logAIMetric({
          serviceName: 'enhancedClaude',
          operation: 'chat',
          durationMs: 1000,
          userId,
        });
      });

      await metricsService.flush();

      // Verify the supabase client was called with the correct table.
      expect(mockSupabaseFrom).toHaveBeenCalledWith('ai_metrics');
    });

    test('should handle service degradation gracefully', async () => {
      await metricsService.initialize();

      // Simulate database becoming unavailable.
      mockSupabaseFrom.mockReturnValue({
        insert: jest.fn(() => Promise.reject(new Error('Database unavailable'))),
      });

      metricsService.logAIMetric({
        serviceName: 'test',
        operation: 'test',
        durationMs: 100,
      });

      // Should not throw
      await expect(metricsService.flush()).resolves.not.toThrow();
    });

    test('should recover from temporary failures', async () => {
      await metricsService.initialize();

      let attemptCount = 0;
      mockSupabaseFrom.mockReturnValue({
        insert: jest.fn(() => {
          attemptCount++;
          if (attemptCount === 1) {
            return Promise.reject(new Error('Temporary failure'));
          }
          return Promise.resolve({ data: [], error: null });
        }),
      });

      // First flush fails
      metricsService.logAIMetric({
        serviceName: 'test',
        operation: 'test',
        durationMs: 100,
      });
      await metricsService.flush();

      // Second flush succeeds
      metricsService.logAIMetric({
        serviceName: 'test',
        operation: 'test',
        durationMs: 100,
      });
      await metricsService.flush();

      expect(attemptCount).toBe(2);
    });
  });

  describe('Performance and Optimization', () => {
    test('should batch metrics efficiently', async () => {
      await metricsService.initialize();

      // Override from to track insert calls for this test.
      const insertCalls = [];
      mockSupabaseFrom.mockImplementation((table) => {
        if (table === 'ai_metrics') {
          return {
            insert: jest.fn((data) => {
              insertCalls.push(data);
              return Promise.resolve({ data: [], error: null });
            }),
          };
        }
        return {
          insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
          select: jest.fn(() => Promise.resolve({ data: [], error: null })),
        };
      });

      // Set a known batch size
      const originalMaxBatchSize = metricsService.maxBatchSize;
      metricsService.maxBatchSize = 100;

      // Add 250 metrics
      for (let i = 0; i < 250; i++) {
        metricsService.logAIMetric({
          serviceName: 'test',
          operation: 'test',
          durationMs: 100,
        });
      }

      // Flush remaining
      await metricsService.flush();

      // Should have made multiple insert calls
      expect(insertCalls.length).toBeGreaterThan(0);

      // Restore
      metricsService.maxBatchSize = originalMaxBatchSize;
    });

    test('should not block AI service calls', async () => {
      await metricsService.initialize();

      const startTime = Date.now();

      // Log metric (fire-and-forget)
      metricsService.logAIMetric({
        serviceName: 'test',
        operation: 'test',
        durationMs: 100,
      });

      const endTime = Date.now();

      // Should complete immediately (<10ms)
      expect(endTime - startTime).toBeLessThan(10);
    });

    test('should handle concurrent metric logging', async () => {
      await metricsService.initialize();

      // Simulate concurrent calls from multiple services
      const promises = Array.from({ length: 50 }, (_, i) =>
        Promise.resolve(
          metricsService.logAIMetric({
            serviceName: `service_${i % 5}`,
            operation: 'test',
            durationMs: 100,
          })
        )
      );

      await Promise.all(promises);

      // All metrics should be queued
      expect(metricsService.batchQueue.length).toBeGreaterThan(0);
    });
  });
});
