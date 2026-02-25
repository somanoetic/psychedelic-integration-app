# MetricsService API Reference

**Module:** `lib/metricsService.js`
**Version:** 1.0
**Last Updated:** 2026-02-09

---

## Table of Contents

1. [Overview](#overview)
2. [Initialization](#initialization)
3. [Logging Methods](#logging-methods)
4. [Query Methods](#query-methods)
5. [Utility Methods](#utility-methods)
6. [Configuration](#configuration)
7. [Error Handling](#error-handling)
8. [Examples](#examples)

---

## Overview

The `MetricsService` provides fire-and-forget logging for AI service metrics. It's designed to be:
- **Non-blocking:** Never delays AI responses
- **Resilient:** Fails silently if logging breaks
- **Efficient:** Batches inserts to reduce database load
- **Secure:** Respects RLS policies, never logs PII

### Quick Start

```javascript
import metricsService from './lib/metricsService';

// Initialize on app start (once)
await metricsService.initialize();

// Log metrics (fire-and-forget)
metricsService.logAIMetric({
  serviceName: 'enhancedClaude',
  operation: 'chat',
  durationMs: 1234,
  tokens: { input: 500, output: 200 },
  cost: 0.0045,
  status: 'success',
  userId: 'user_123'
});
```

---

## Initialization

### `initialize()`

Initializes the metrics service and starts the batch flush timer. **Call once on app startup.**

**Signature:**
```javascript
async initialize(): Promise<void>
```

**Returns:** `Promise<void>`

**Side Effects:**
- Sets up batch flush timer (every 10 seconds)
- Verifies Supabase client availability
- Sets `isInitialized = true`

**Example:**
```javascript
// In App.js or root component
import metricsService from './lib/metricsService';

useEffect(() => {
  metricsService.initialize();
}, []);
```

**Console Output:**
```
[Metrics] Initialized successfully (using authenticated client)
```

**Error Handling:**
- If Supabase client unavailable: Logs warning, disables metrics
- If initialization fails: Logs error, fails silently
- Never throws errors (app continues)

---

### `shutdown()`

Flushes remaining metrics and stops the flush timer. **Call on app shutdown.**

**Signature:**
```javascript
async shutdown(): Promise<void>
```

**Returns:** `Promise<void>`

**Side Effects:**
- Clears flush timer
- Flushes remaining queued metrics
- Logs shutdown message

**Example:**
```javascript
// On app unmount
useEffect(() => {
  return () => {
    metricsService.shutdown();
  };
}, []);
```

**Console Output:**
```
[Metrics] Shutdown complete
```

---

## Logging Methods

### `logAIMetric()`

Logs AI service performance metrics. **Fire-and-forget** (does not return a value, never throws).

**Signature:**
```javascript
logAIMetric(metric: AIMetric): void
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `serviceName` | `string` | ✅ | AI service identifier (e.g., `'enhancedClaude'`) |
| `operation` | `string` | ✅ | Operation type (e.g., `'chat'`, `'routing'`) |
| `durationMs` | `number` | ✅ | Operation duration in milliseconds |
| `tokens` | `object` | ❌ | Token usage: `{ input: number, output: number, total?: number }` |
| `cost` | `number` | ❌ | Estimated cost in USD |
| `status` | `string` | ❌ | `'success'` or `'error'` (default: `'success'`) |
| `metadata` | `object` | ❌ | Additional context (JSONB, any structure) |
| `userId` | `string` | ❌ | User ID (UUID) |

**Example:**
```javascript
const startTime = Date.now();

try {
  const response = await callClaudeAPI(message);

  metricsService.logAIMetric({
    serviceName: 'enhancedClaude',
    operation: 'chat',
    durationMs: Date.now() - startTime,
    tokens: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
      total: response.usage.input_tokens + response.usage.output_tokens
    },
    cost: MetricsService.calculateCost({
      input: response.usage.input_tokens,
      output: response.usage.output_tokens
    }),
    status: 'success',
    metadata: {
      model: 'claude-sonnet-4-5-20250929',
      temperature: 0.7,
      phase: 'find'
    },
    userId: user.id
  });

  return response;
} catch (error) {
  metricsService.logAIMetric({
    serviceName: 'enhancedClaude',
    operation: 'chat',
    durationMs: Date.now() - startTime,
    status: 'error',
    metadata: { error: error.message },
    userId: user.id
  });

  throw error;
}
```

**Batching Behavior:**
- Metric queued in memory (batch queue)
- Flushed when queue reaches 100 items OR 10 seconds pass
- Console log on flush: `[Metrics] Flushed 5 metrics`

**Performance:**
- Overhead: <1ms (just pushing to array)
- Non-blocking: Does not await database insert
- Safe: Never throws errors

---

### `logRoutingDecision()`

Logs AI routing decisions. **Fire-and-forget, PII-safe** (never logs user message text).

**Signature:**
```javascript
logRoutingDecision(decision: RoutingDecision): void
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `selectedRoute` | `string` | ✅ | Route selected (e.g., `'daily_journal'`) |
| `confidence` | `number` | ✅ | Confidence score (0-1) |
| `inputLength` | `number` | ❌ | Character count of user input (NOT the text itself) |
| `detectedIntents` | `string[]` | ❌ | Intent keywords detected (e.g., `['mapping', 'nervous_system']`) |
| `alternatives` | `object[]` | ❌ | Alternative routes: `[{ route: string, score: number }]` |
| `metadata` | `object` | ❌ | Additional context (JSONB) |
| `userId` | `string` | ❌ | User ID (UUID) |

**Example:**
```javascript
const userMessage = "I want to explore my inner critic";

// Analyze message (routing logic)
const analysis = await analyzeMessage(userMessage);

// Log decision (NO user message text!)
metricsService.logRoutingDecision({
  selectedRoute: 'ifs_chat',
  confidence: 0.85,
  inputLength: userMessage.length,  // 38 characters
  detectedIntents: ['ifs', 'parts_work', 'inner_critic'],
  alternatives: [
    { route: 'core_beliefs', score: 0.65 },
    { route: 'daily_journal', score: 0.45 }
  ],
  metadata: {
    method: 'ai',  // or 'fallback', 'rule-based'
    scenariosDetected: ['inner_critic', 'self_criticism']
  },
  userId: user.id
});
```

**IMPORTANT - Privacy:**
- ❌ **DO NOT** log `inputText` or user message content
- ✅ **DO** log `inputLength` (character count)
- ✅ **DO** log `detectedIntents` (keywords only)

**Batching Behavior:**
- Queued separately from AI metrics
- Flushed with same logic (100 items or 10s)
- Console log: `[Metrics] Flushed 2 routing decisions`

---

### `logError()`

Logs AI service errors. **Inserts immediately** (not batched) for critical error tracking.

**Signature:**
```javascript
logError(error: AIError): void
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `serviceName` | `string` | ✅ | AI service identifier |
| `operation` | `string` | ✅ | Operation that failed |
| `errorType` | `string` | ✅ | Error class/type (e.g., `'RateLimitExceeded'`) |
| `errorMessage` | `string` | ✅ | Error message |
| `stackTrace` | `string` | ❌ | Full stack trace |
| `sentryId` | `string` | ❌ | Sentry event ID for cross-reference |
| `context` | `object` | ❌ | Additional debug context (JSONB) |
| `userId` | `string` | ❌ | User ID (UUID) |

**Example:**
```javascript
try {
  const response = await callClaudeAPI(message);
  return response;
} catch (error) {
  // Capture in Sentry first
  const sentryEventId = Sentry.captureException(error, {
    tags: { service: 'enhancedClaude', operation: 'chat' },
    contexts: { user: { id: user.id } }
  });

  // Log to database
  metricsService.logError({
    serviceName: 'enhancedClaude',
    operation: 'chat',
    errorType: error.name || 'APIError',
    errorMessage: error.message,
    stackTrace: error.stack,
    sentryId: sentryEventId,
    context: {
      messageLength: message.length,
      retryCount: retryCount,
      apiEndpoint: CLAUDE_API_URL
    },
    userId: user.id
  });

  throw error;
}
```

**Immediate Insert:**
- ❌ **NOT** batched (errors are critical)
- ✅ Inserted immediately to database
- ✅ Captured even if app crashes shortly after

**Console Output:**
```
[Metrics] Error inserting error log: [error details]
```

---

## Query Methods

### `getServiceHealth()`

Returns service health metrics from the last 7 days via materialized view.

**Signature:**
```javascript
async getServiceHealth(): Promise<ServiceHealth[]>
```

**Returns:** `Promise<ServiceHealth[]>`

**Return Type:**
```typescript
interface ServiceHealth {
  service_name: string;        // 'enhancedClaude'
  total_calls: number;          // 1234
  success_rate: number;         // 97.2 (percent)
  avg_duration_ms: number;      // 1234
  p95_duration_ms: number;      // 2345
  total_tokens: number;         // 500000
  estimated_cost: number;       // 12.34 (USD)
}
```

**Example:**
```javascript
const health = await metricsService.getServiceHealth();

health.forEach(service => {
  console.log(`${service.service_name}:`);
  console.log(`  Calls: ${service.total_calls}`);
  console.log(`  Success: ${service.success_rate}%`);
  console.log(`  Avg Duration: ${service.avg_duration_ms}ms`);
  console.log(`  Cost: $${service.estimated_cost}`);
});
```

**Data Source:** Materialized view `mv_service_performance_last_7d`

**Refresh Frequency:** Every 15 minutes (scheduled job)

**Access Control:** Admins see all services, users see their own only (RLS)

---

### `getCostSummary()`

Returns cost summary for a given time range.

**Signature:**
```javascript
async getCostSummary(timeRange: '24h' | '7d' | '30d'): Promise<CostSummary>
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `timeRange` | `string` | ❌ | `'7d'` | Time range: `'24h'`, `'7d'`, or `'30d'` |

**Returns:** `Promise<CostSummary>`

**Return Type:**
```typescript
interface CostSummary {
  totalCost: number;          // 45.67 (USD)
  timeRange: string;          // '30d'
  services: Array<{
    service: string;          // 'enhancedClaude'
    cost: number;             // 23.45 (USD)
  }>;
}
```

**Example:**
```javascript
const costs = await metricsService.getCostSummary('30d');

console.log(`Total cost (${costs.timeRange}): $${costs.totalCost}`);
console.log('Top services:');
costs.services.slice(0, 3).forEach((svc, i) => {
  const percent = (svc.cost / costs.totalCost * 100).toFixed(1);
  console.log(`  ${i + 1}. ${svc.service}: $${svc.cost} (${percent}%)`);
});
```

**Output:**
```
Total cost (30d): $45.67
Top services:
  1. enhancedClaude: $23.45 (51.3%)
  2. ifsAI: $12.34 (27.0%)
  3. polyvagalAI: $5.67 (12.4%)
```

**Data Source:** Raw `ai_metrics` table (filtered by timestamp)

**Performance:** <100ms for 30-day query with indexes

---

### `getTopErrors()`

Returns top errors from the last 24 hours via materialized view.

**Signature:**
```javascript
async getTopErrors(): Promise<TopError[]>
```

**Returns:** `Promise<TopError[]>`

**Return Type:**
```typescript
interface TopError {
  service_name: string;        // 'enhancedClaude'
  operation: string;           // 'chat'
  error_type: string;          // 'RateLimitExceeded'
  error_message: string;       // 'Rate limit: 50 req/min'
  error_count: number;         // 12
  last_occurrence: string;     // '2026-02-09 14:23:45'
  sample_sentry_id: string;    // 'abc123...'
}
```

**Example:**
```javascript
const errors = await metricsService.getTopErrors();

console.log(`Top errors (last 24h):`);
errors.slice(0, 5).forEach((error, i) => {
  console.log(`${i + 1}. ${error.error_type}: ${error.error_count} occurrences`);
  console.log(`   Service: ${error.service_name}`);
  console.log(`   Last: ${error.last_occurrence}`);
  if (error.sample_sentry_id) {
    console.log(`   Sentry: https://sentry.io/events/${error.sample_sentry_id}`);
  }
});
```

**Data Source:** Materialized view `mv_top_errors_last_24h`

**Refresh Frequency:** Every 15 minutes

**Limit:** Top 10 errors by count

---

### `getRoutingQuality()`

Returns routing effectiveness metrics from the last 7 days.

**Signature:**
```javascript
async getRoutingQuality(): Promise<RoutingQuality>
```

**Returns:** `Promise<RoutingQuality>`

**Return Type:**
```typescript
interface RoutingQuality {
  avgConfidence: number;          // 82 (percent)
  totalDecisions: number;         // 1234
  mostCommonRoute: string;        // 'daily_journal'
  lowConfidenceCount: number;     // 23 (decisions with confidence <0.7)
}
```

**Example:**
```javascript
const routing = await metricsService.getRoutingQuality();

console.log('Routing Quality (7d):');
console.log(`  Avg Confidence: ${routing.avgConfidence}%`);
console.log(`  Total Decisions: ${routing.totalDecisions}`);
console.log(`  Most Common Route: ${routing.mostCommonRoute}`);
console.log(`  Low Confidence: ${routing.lowConfidenceCount} (${(routing.lowConfidenceCount / routing.totalDecisions * 100).toFixed(1)}%)`);
```

**Data Source:** Raw `ai_routing_decisions` table (last 7 days)

**Performance:** <50ms with indexes

**Thresholds:**
- Excellent: 80-100% avg confidence
- Good: 70-80%
- Warning: 60-70%
- Critical: <60%

---

## Utility Methods

### `MetricsService.calculateCost()`

Calculates estimated cost from token usage. **Static method.**

**Signature:**
```javascript
static calculateCost(
  tokens: { input: number, output: number },
  model?: string
): number
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `tokens` | `object` | ✅ | - | Token counts: `{ input: number, output: number }` |
| `model` | `string` | ❌ | `'claude-sonnet-4-5-20250929'` | Model identifier |

**Returns:** `number` (cost in USD)

**Pricing (Claude Sonnet 4.5):**
- Input: $3.00 per 1M tokens
- Output: $15.00 per 1M tokens

**Formula:**
```javascript
cost = (input / 1_000_000) * 3.00 + (output / 1_000_000) * 15.00
```

**Example:**
```javascript
const cost = MetricsService.calculateCost({
  input: 500,
  output: 200
});

console.log(`Estimated cost: $${cost.toFixed(4)}`);
// Output: Estimated cost: $0.0045
```

**Accuracy:** Within 5% of actual API cost

---

### `MetricsService.estimateTokens()`

Estimates token count from text. **Static method. Rough estimation.**

**Signature:**
```javascript
static estimateTokens(text: string): number
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `text` | `string` | ✅ | Text to estimate |

**Returns:** `number` (estimated token count)

**Formula:**
```javascript
tokens = Math.ceil(text.length / 4)
```

**Example:**
```javascript
const text = "Hello, how are you today?";
const tokens = MetricsService.estimateTokens(text);

console.log(`Estimated tokens: ${tokens}`);
// Output: Estimated tokens: 7
```

**Accuracy:** ±15% for English text

**Note:** For accurate counts, use `extractTokens()` from API response.

---

### `MetricsService.extractTokens()`

Extracts actual token usage from Claude API response. **Static method.**

**Signature:**
```javascript
static extractTokens(response: ClaudeAPIResponse): Tokens | null
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `response` | `object` | ✅ | Claude API response with `usage` field |

**Returns:** `Tokens | null`

**Return Type:**
```typescript
interface Tokens {
  input: number;
  output: number;
  total: number;
}
```

**Example:**
```javascript
const response = await fetch(CLAUDE_API_URL, { /* ... */ });
const data = await response.json();

const tokens = MetricsService.extractTokens(data);
if (tokens) {
  console.log(`Input tokens: ${tokens.input}`);
  console.log(`Output tokens: ${tokens.output}`);
  console.log(`Total tokens: ${tokens.total}`);
}
```

**Returns `null` if:**
- Response missing `usage` field
- Response is malformed

---

### `flush()`

Manually flushes batched metrics to database. **Rarely needed** (auto-flushes every 10s).

**Signature:**
```javascript
async flush(): Promise<void>
```

**Returns:** `Promise<void>`

**Side Effects:**
- Inserts all queued metrics to `ai_metrics` table
- Inserts all queued routing decisions to `ai_routing_decisions` table
- Clears both queues
- Logs flush count to console

**Example:**
```javascript
// Force flush before app shutdown
await metricsService.flush();
```

**Console Output:**
```
[Metrics] Flushed 5 metrics
[Metrics] Flushed 2 routing decisions
```

**When to Use:**
- Before app shutdown (`shutdown()` calls this)
- After critical operations (to ensure logged immediately)
- During testing (to verify metrics written)

**Automatic Flush Triggers:**
- Every 10 seconds (timer)
- When queue reaches 100 items

---

## Configuration

### Instance Configuration

**Modifiable properties:**

```javascript
metricsService.flushInterval = 10000;   // Flush frequency (ms)
metricsService.maxBatchSize = 100;      // Max items before auto-flush
```

**Pricing Configuration:**

```javascript
metricsService.CLAUDE_PRICING = {
  'claude-sonnet-4-5-20250929': {
    input: 3.00,    // $ per 1M tokens
    output: 15.00   // $ per 1M tokens
  },
  'claude-haiku-4': {
    input: 0.80,
    output: 4.00
  }
};
```

**Example:**
```javascript
// Flush more frequently for high-traffic apps
metricsService.flushInterval = 5000;  // 5 seconds

// Increase batch size for better throughput
metricsService.maxBatchSize = 200;
```

---

## Error Handling

### Design Philosophy

**Fail Silently:** Metrics logging NEVER breaks the app.

**All logging methods:**
- Wrapped in try/catch
- Log errors to console only
- Never throw exceptions
- Return gracefully

### Handling Errors

**Initialization Errors:**
```javascript
await metricsService.initialize();
// If Supabase unavailable:
// [Metrics] Supabase client not available - metrics will be disabled
```

**Logging Errors:**
```javascript
metricsService.logAIMetric({ /* ... */ });
// If error:
// [Metrics] Error logging AI metric: [error details]
// App continues normally
```

**Flush Errors:**
```javascript
await metricsService.flush();
// If database error:
// [Metrics] Error inserting metrics: [error details]
// Metrics lost, but app continues
```

**Query Errors:**
```javascript
const health = await metricsService.getServiceHealth();
// If error:
// [Metrics] Error fetching service health: [error details]
// Returns empty array []
```

### Debugging Metrics Issues

**Check Initialization:**
```javascript
console.log('Initialized:', metricsService.isInitialized);
// Should be: true
```

**Check Queue Size:**
```javascript
console.log('Queue size:', metricsService.batchQueue.length);
// Should be: 0-100 (empties every 10s)
```

**Force Flush:**
```javascript
await metricsService.flush();
// Check console for errors
```

**Query Database:**
```sql
-- Check recent metrics
SELECT COUNT(*) FROM ai_metrics
WHERE timestamp > NOW() - INTERVAL '1 hour';

-- Should match expected call count
```

---

## Examples

### Complete Service Instrumentation

```javascript
import metricsService from './metricsService';

class EnhancedClaudeService {
  async chat(message, userId) {
    const startTime = Date.now();

    try {
      // Call Claude API
      const response = await this.callClaudeAPI(message);
      const durationMs = Date.now() - startTime;

      // Extract tokens from response
      const tokens = MetricsService.extractTokens(response);
      const cost = tokens ? MetricsService.calculateCost(tokens) : null;

      // Log success metrics (fire-and-forget)
      metricsService.logAIMetric({
        serviceName: 'enhancedClaude',
        operation: 'chat',
        durationMs,
        tokens,
        cost,
        status: 'success',
        metadata: {
          model: 'claude-sonnet-4-5-20250929',
          messageLength: message.length
        },
        userId
      });

      return {
        success: true,
        message: response.content[0].text,
        isAI: true
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;

      // Log error metrics
      metricsService.logAIMetric({
        serviceName: 'enhancedClaude',
        operation: 'chat',
        durationMs,
        status: 'error',
        metadata: { error: error.message },
        userId
      });

      // Log detailed error
      metricsService.logError({
        serviceName: 'enhancedClaude',
        operation: 'chat',
        errorType: error.name || 'APIError',
        errorMessage: error.message,
        stackTrace: error.stack,
        context: { messageLength: message.length },
        userId
      });

      // Fallback response
      return {
        success: true,
        message: this.getFallbackResponse(),
        isAI: false
      };
    }
  }
}
```

### Routing Service with Metrics

```javascript
class ConversationalRoutingService {
  async route(userMessage, userId) {
    const startTime = Date.now();

    try {
      // Analyze message
      const analysis = await this.analyzeMessage(userMessage);
      const durationMs = Date.now() - startTime;

      // Log AI metric for analysis
      metricsService.logAIMetric({
        serviceName: 'conversationalRouting',
        operation: 'routing',
        durationMs,
        tokens: analysis.tokens,
        cost: analysis.cost,
        status: 'success',
        userId
      });

      // Log routing decision (NO user message text!)
      metricsService.logRoutingDecision({
        selectedRoute: analysis.selectedRoute,
        confidence: analysis.confidence,
        inputLength: userMessage.length,
        detectedIntents: analysis.intents,
        alternatives: analysis.alternatives,
        metadata: { method: 'ai' },
        userId
      });

      return analysis.selectedRoute;
    } catch (error) {
      // Log error and fall back to default route
      metricsService.logError({
        serviceName: 'conversationalRouting',
        operation: 'routing',
        errorType: error.name,
        errorMessage: error.message,
        stackTrace: error.stack,
        userId
      });

      return 'daily_journal';  // Safe fallback
    }
  }
}
```

### Dashboard Component

```javascript
import React, { useEffect, useState } from 'react';
import metricsService from '../lib/metricsService';

export default function MetricsDashboard() {
  const [health, setHealth] = useState([]);
  const [costs, setCosts] = useState(null);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);  // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const [healthData, costData, errorData] = await Promise.all([
        metricsService.getServiceHealth(),
        metricsService.getCostSummary('30d'),
        metricsService.getTopErrors()
      ]);

      setHealth(healthData);
      setCosts(costData);
      setErrors(errorData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load metrics:', error);
      setLoading(false);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>AI Metrics Dashboard</h1>

      <section>
        <h2>Cost Summary (30d)</h2>
        <p>Total: ${costs.totalCost.toFixed(2)}</p>
        <ul>
          {costs.services.slice(0, 3).map(svc => (
            <li key={svc.service}>
              {svc.service}: ${svc.cost.toFixed(2)}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Service Health (7d)</h2>
        {health.map(service => (
          <div key={service.service_name}>
            <h3>{service.service_name}</h3>
            <p>Calls: {service.total_calls}</p>
            <p>Success: {service.success_rate}%</p>
            <p>Avg Duration: {service.avg_duration_ms}ms</p>
            <p>Cost: ${service.estimated_cost.toFixed(2)}</p>
          </div>
        ))}
      </section>

      <section>
        <h2>Top Errors (24h)</h2>
        <ul>
          {errors.map((error, i) => (
            <li key={i}>
              {error.error_type}: {error.error_count} occurrences
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
```

### Testing Metrics

```javascript
import metricsService from '../lib/metricsService';

describe('MetricsService', () => {
  beforeAll(async () => {
    await metricsService.initialize();
  });

  afterAll(async () => {
    await metricsService.shutdown();
  });

  it('logs AI metric successfully', async () => {
    metricsService.logAIMetric({
      serviceName: 'test',
      operation: 'test_op',
      durationMs: 100,
      status: 'success',
      userId: 'test_user'
    });

    // Force flush to database
    await metricsService.flush();

    // Query database to verify
    const { data } = await supabase
      .from('ai_metrics')
      .select('*')
      .eq('service_name', 'test')
      .single();

    expect(data.operation).toBe('test_op');
    expect(data.duration_ms).toBe(100);
  });

  it('calculates cost correctly', () => {
    const cost = MetricsService.calculateCost({
      input: 1000,
      output: 500
    });

    // (1000 / 1M * 3.00) + (500 / 1M * 15.00)
    // = 0.003 + 0.0075 = 0.0105
    expect(cost).toBeCloseTo(0.0105, 4);
  });
});
```

---

## Best Practices

### DO

✅ Initialize once on app startup
✅ Log at API boundaries (not deep in logic)
✅ Include userId when available
✅ Use meaningful service/operation names
✅ Add relevant metadata for debugging
✅ Extract tokens from API response (accurate)
✅ Log routing decisions WITHOUT user text

### DON'T

❌ Await log calls (fire-and-forget)
❌ Log in loops (aggregate instead)
❌ Include PII in metadata
❌ Log sensitive data (API keys, passwords)
❌ Throw errors if logging fails
❌ Block user experience for logging
❌ Log user message text in routing decisions

---

## Changelog

**v1.0 (2026-02-09):**
- Initial release
- Batch logging with 10s/100-item flush
- Support for AI metrics, routing decisions, errors
- Query methods for dashboard
- RLS security
- PII protection

---

## Support

**Documentation:**
- Complete Guide: `docs/MONITORING.md`
- Database Schema: `docs/DATABASE_SCHEMA.md`
- Architecture: `docs/ADR_AI_MONITORING.md`

**Troubleshooting:**
- Check console for `[Metrics]` logs
- Verify initialization with `metricsService.isInitialized`
- Force flush with `await metricsService.flush()`
- Query database directly if metrics not appearing

**Getting Help:**
- Review instrumentation guide: `.full-stack-feature/INSTRUMENTATION_GUIDE.md`
- Check test suite: `__tests__/lib/metricsService.test.js`
- Consult context system: `context/bugs/` or `context/features/`

---

**Last Updated:** 2026-02-09
**Version:** 1.0
**Maintainer:** Engineering Team
