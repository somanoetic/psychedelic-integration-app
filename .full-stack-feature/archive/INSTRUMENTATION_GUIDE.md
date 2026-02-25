# AI Service Instrumentation Guide

**Quick reference for adding metrics logging to new AI services**

---

## Template: Instrumenting a New AI Service

### Step 1: Add Import

```javascript
import metricsService from './metricsService';
```

### Step 2: Wrap API Call

Replace this:
```javascript
async function callAPI(message) {
  const response = await fetch(CLAUDE_API_URL, {
    // ... config
  });

  const data = await response.json();
  return data.content[0].text;
}
```

With this:
```javascript
async function callAPI(message, userId = null) {
  const startTime = Date.now();

  try {
    const response = await fetch(CLAUDE_API_URL, {
      // ... config
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const durationMs = Date.now() - startTime;

    // Extract tokens and calculate cost
    const tokens = metricsService.constructor.extractTokens(data);
    const cost = tokens ? metricsService.constructor.calculateCost(tokens) : null;

    // Log success metrics (fire-and-forget)
    metricsService.logAIMetric({
      serviceName: 'yourServiceName',
      operation: 'operationName',
      durationMs,
      tokens,
      cost,
      status: 'success',
      metadata: { /* context-specific data */ },
      userId
    });

    return data.content[0].text;
  } catch (error) {
    const durationMs = Date.now() - startTime;

    // Log error metrics
    metricsService.logAIMetric({
      serviceName: 'yourServiceName',
      operation: 'operationName',
      durationMs,
      status: 'error',
      metadata: { error: error.message },
      userId
    });

    metricsService.logError({
      serviceName: 'yourServiceName',
      operation: 'operationName',
      errorType: error.name || 'APIError',
      errorMessage: error.message,
      stackTrace: error.stack,
      context: { /* context-specific data */ },
      userId
    });

    throw error;
  }
}
```

---

## Service Names

Use these standardized service names:

- `enhancedClaude` - Huxley integration guide
- `conversationalRouting` - Message routing
- `masterContext` - Context aggregation
- `ifsAI` - IFS parts work
- `polyvagalAI` - Polyvagal mapping
- `nervousSystemMapping` - NS state mapping
- `triggersGlimmers` - Triggers & glimmers
- `coreBeliefs` - Core beliefs discussion
- `dailyJournal` - Daily journaling

---

## Operation Names

Common operation names:

- `chat` - General AI conversation
- `mapping` - Mapping exercise (NS, triggers, etc.)
- `discussion` - Discussion/exploration
- `routing` - Routing decision
- `context_load` - Context loading

---

## Metadata Examples

### For IFS Service
```javascript
metadata: {
  phase: 'find', // or 'focus', 'flesh_out', 'feel_toward', 'befriend', 'fears'
  model: 'claude-sonnet-4-5-20250929'
}
```

### For Polyvagal Service
```javascript
metadata: {
  state: 'sympathetic', // or 'dorsal', 'ventral'
  field: 'body' // or 'memory', 'thoughts'
}
```

### For Routing Service
```javascript
// Also log routing decision
metricsService.logRoutingDecision({
  inputText: userMessage,
  selectedRoute: 'daily_journal',
  confidence: 0.85,
  alternatives: [
    { route: 'ifs_chat', score: 0.65 },
    { route: 'nervous_system_mapping', score: 0.45 }
  ],
  metadata: { method: 'ai' }, // or 'fallback'
  userId
});
```

### For Context Service
```javascript
metadata: {
  cacheHit: true, // or false
  focus: 'ifs', // or 'all', 'nervous_system', 'integration', 'beliefs'
  partsCount: 5,
  journalsCount: 3,
  connectionsCount: 12
}
```

---

## Routing Decision Logging

When implementing routing/decision-making:

```javascript
metricsService.logRoutingDecision({
  inputText: userMessage.substring(0, 500), // Truncate long messages
  selectedRoute: 'daily_journal',
  confidence: 0.85,
  alternatives: [
    { route: 'ifs_chat', score: 0.65 },
    { route: 'post_session_journal', score: 0.45 }
  ],
  metadata: {
    method: 'ai', // or 'fallback', 'rule-based'
    scenariosDetected: ['inner_critic', 'shame']
  },
  userId
});
```

---

## Error Logging

Log errors immediately (not batched):

```javascript
metricsService.logError({
  serviceName: 'yourServiceName',
  operation: 'operationName',
  errorType: error.name || 'APIError',
  errorMessage: error.message,
  stackTrace: error.stack,
  sentryId: sentryEventId, // Optional - if using Sentry
  context: {
    // Any relevant context
    phase: this.currentPhase,
    state: this.currentState,
    userId: this.userId
  },
  userId
});
```

---

## Performance Best Practices

### ✅ DO

- Use fire-and-forget logging (no await)
- Log at the API boundary (not deep in logic)
- Pass userId when available
- Include relevant metadata
- Use try/catch around API calls
- Measure duration with Date.now()

### ❌ DON'T

- Don't await log calls
- Don't log in loops (aggregate instead)
- Don't include PII in metadata
- Don't log sensitive data (API keys, passwords)
- Don't throw if logging fails
- Don't block user experience for logging

---

## Testing Your Instrumentation

### 1. Check Console

After API call, you should see:
```
[Metrics] Flushed 5 metrics
[Metrics] Flushed 2 routing decisions
```

### 2. Check Database

```sql
SELECT
  service_name,
  operation,
  COUNT(*) as calls,
  AVG(duration_ms) as avg_duration,
  SUM(estimated_cost) as total_cost
FROM ai_metrics
WHERE service_name = 'yourServiceName'
  AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY service_name, operation;
```

### 3. Check Metrics Service

```javascript
import metricsService from './lib/metricsService';

// Get service health
const health = await metricsService.getServiceHealth();
console.log(health);

// Get cost summary
const costs = await metricsService.getCostSummary('24h');
console.log(costs);

// Get top errors
const errors = await metricsService.getTopErrors();
console.log(errors);
```

---

## Common Patterns

### Pattern 1: Simple Chat Service

```javascript
async sendMessage(userMessage, userId = null) {
  const startTime = Date.now();

  try {
    const response = await this.getAIResponse(userMessage, userId);

    return {
      success: true,
      message: response,
      isAI: true
    };
  } catch (error) {
    metricsService.logError({
      serviceName: 'yourServiceName',
      operation: 'chat',
      errorType: error.name,
      errorMessage: error.message,
      stackTrace: error.stack,
      userId
    });

    // Fallback logic here
    return {
      success: true,
      message: this.getFallbackResponse(userMessage),
      isAI: false
    };
  }
}
```

### Pattern 2: Multi-Phase Service

```javascript
async continueConversation(message, phase, userId = null) {
  const startTime = Date.now();

  try {
    const response = await this.callAPI(message, userId);

    metricsService.logAIMetric({
      serviceName: 'yourServiceName',
      operation: 'chat',
      durationMs: Date.now() - startTime,
      tokens: this.extractTokens(response),
      cost: this.calculateCost(response),
      status: 'success',
      metadata: { phase }, // Track current phase
      userId
    });

    return response;
  } catch (error) {
    // Error handling...
  }
}
```

### Pattern 3: Context Loading Service

```javascript
async loadContext(userId, options = {}) {
  const startTime = Date.now();

  try {
    const context = await this.fetchFromDatabase(userId, options);

    metricsService.logAIMetric({
      serviceName: 'contextService',
      operation: 'context_load',
      durationMs: Date.now() - startTime,
      status: 'success',
      metadata: {
        cacheHit: false,
        itemsLoaded: context.items.length,
        focus: options.focus
      },
      userId
    });

    return context;
  } catch (error) {
    // Error handling...
  }
}
```

---

## Troubleshooting

### Metrics Not Showing Up

1. Check initialization:
   ```javascript
   console.log('[Metrics] Initialized:', metricsService.isInitialized);
   ```

2. Check service key:
   ```javascript
   console.log('[Metrics] Admin client:', !!metricsService.supabaseAdmin);
   ```

3. Check flush timer:
   ```javascript
   console.log('[Metrics] Timer:', !!metricsService.flushTimer);
   ```

4. Force flush:
   ```javascript
   await metricsService.flush();
   ```

### High Overhead

If logging adds >10ms overhead:

1. Check network latency (should be <5ms for batch insert)
2. Verify batching is working (check queue size)
3. Check database performance (slow inserts)
4. Consider reducing metadata size

### Memory Leaks

If queue grows unbounded:

1. Check flush timer is running
2. Check database connectivity
3. Verify batch inserts are succeeding
4. Check for errors in flush() method

---

## Summary Checklist

When instrumenting a new service:

- [ ] Import metricsService
- [ ] Wrap API call with try/catch
- [ ] Measure duration with Date.now()
- [ ] Extract tokens from response
- [ ] Calculate cost from tokens
- [ ] Log success metrics (fire-and-forget)
- [ ] Log error metrics in catch block
- [ ] Pass userId when available
- [ ] Include relevant metadata
- [ ] Test database insertion
- [ ] Verify performance impact <10ms
