# Psycheteleos Testing Guide

Complete guide to running, writing, and maintaining tests.

---

## Quick Reference

```bash
# Run all tests
npm test

# Run in watch mode (re-runs on file changes)
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run specific test suites
npm run test:unit          # lib/ services only
npm run test:integration   # Integration tests
npm run test:e2e           # End-to-end flows
npm run test:components    # Component tests (currently skipped)

# Run a single test file
npx jest __tests__/lib/ragService.test.js

# Run tests matching a pattern
npx jest --testPathPattern="metrics"
```

---

## Current Test Stats

| Category | Files | Tests | Status |
|----------|-------|-------|--------|
| Unit (lib/) | 10 | ~380 | Passing |
| Integration | 2 | ~42 | Passing |
| E2E | 2 | ~16 | Passing |
| Component | 2 | 81 | Skipped (need RN renderer) |
| **Total** | **18** | **600** | **519 passing, 81 skipped** |

---

## Test Structure

```
__tests__/
├── helpers/
│   └── aiTestFixtures.js      # Shared mocks (Claude API, users, sessions)
├── lib/                        # Unit tests for services
│   ├── conversationalRoutingService.test.js  (48 tests)
│   ├── enhancedClaudeService.test.js         (30+ tests)
│   ├── huxleyKnowledgeBase.test.js           (53 tests)
│   ├── intentionGuidanceAIService.test.js    (67 tests)
│   ├── intentionGuidanceService.test.js      (12 tests)
│   ├── masterContextService.test.js          (43 tests)
│   ├── metricsIntegration.test.js            (26 tests)
│   ├── metricsService.test.js                (41 tests)
│   ├── ragService.test.js                    (19 tests)
│   └── sessionChecklistService.test.js       (tests)
├── integration/
│   ├── checklistAPI.test.js                  (API lifecycle tests)
│   └── feat-102-flow.test.js                 (Intention guidance flow)
├── e2e/
│   ├── conversationBot.test.js               (Full conversation flows)
│   └── monitoringFlow.test.js                (Metrics pipeline flow)
├── database/
│   ├── checklistSchema.test.js               (Schema validation)
│   └── feat-102-schema.test.js               (Intention schema)
└── components/                               (Skipped — need JSDOM/RN renderer)
    └── metrics/
        ├── CostSummaryCard.test.js
        └── SystemOverviewCard.test.js
```

---

## Configuration

### jest.config.js

- **Environment:** `node` (not jsdom — services don't need a browser)
- **Transform:** `babel-jest` for JS/JSX/TS/TSX
- **Setup:** `jest.setup.js` runs before every suite
- **Timeout:** 10 seconds per test
- **Coverage threshold:** 80% (branches, functions, lines, statements)

### jest.setup.js — Global Mocks

The setup file mocks external dependencies so unit tests run without network:

| Mock | What it replaces |
|------|-----------------|
| `AsyncStorage` | In-memory key-value store |
| `@sentry/react-native` | No-op init, wrap, captureException |
| `expo-secure-store` | No-op get/set/delete |
| `react-native` | Minimal Platform, StyleSheet, Alert stubs |
| `./lib/supabase` | Mock Supabase client (from/select/insert/update) |

**Global variables set:**
- `__DEV__ = true`
- `SUPABASE_SERVICE_KEY = 'test-service-key'`
- `ANTHROPIC_API_KEY = 'test-api-key'`
- Console `warn` and `error` are silenced (jest.fn())

---

## Shared Test Fixtures

**File:** `__tests__/helpers/aiTestFixtures.js`

Provides reusable mocks for all AI service tests:

```javascript
const { mockClaudeResponse, mockClaudeError, MOCK_USER_ID } = require('../helpers/aiTestFixtures');

// Mock a successful Claude API response
const response = mockClaudeResponse('Here is my therapeutic response');

// Mock an error response
const error = mockClaudeError(429, 'Rate limited');
```

Use these fixtures instead of creating one-off mocks to keep tests consistent.

---

## Writing New Tests

### Where to put your test

| Testing... | Directory | Example |
|------------|-----------|---------|
| A service in `lib/` | `__tests__/lib/` | `myService.test.js` |
| An API flow | `__tests__/integration/` | `myFeature-flow.test.js` |
| A full user journey | `__tests__/e2e/` | `myJourney.test.js` |
| Database schema | `__tests__/database/` | `mySchema.test.js` |
| A React component | `__tests__/components/` | `MyComponent.test.js` |

### Test file template

```javascript
// Use CommonJS (not ESM) — our jest config requires it
const { mockClaudeResponse } = require('../helpers/aiTestFixtures');

// Mock the module BEFORE importing the service under test
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: {}, error: null })),
    })),
  },
}));

const myService = require('../../lib/myService');

describe('MyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('myMethod', () => {
    it('should do the expected thing', async () => {
      const result = await myService.myMethod('input');
      expect(result).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      // Override mock for this test
      const { supabase } = require('../../lib/supabase');
      supabase.from.mockReturnValueOnce({
        select: jest.fn(() => Promise.resolve({ data: null, error: { message: 'fail' } })),
      });

      const result = await myService.myMethod('input');
      expect(result).toBeNull();
    });
  });
});
```

### Key patterns

1. **CommonJS only** — use `require()`, not `import`. Our jest transform expects it.

2. **Mock before import** — `jest.mock()` calls are hoisted, but put them at the top for clarity.

3. **Clear mocks in beforeEach** — prevents test pollution:
   ```javascript
   beforeEach(() => {
     jest.clearAllMocks();
   });
   ```

4. **Use shared fixtures** — import from `__tests__/helpers/aiTestFixtures.js` for Claude API mocks.

5. **Test the public API** — don't test private methods directly. Test through the public interface.

6. **Fire-and-forget services** — metricsService methods return void. Test that the Supabase mock was called:
   ```javascript
   expect(supabase.from).toHaveBeenCalledWith('ai_metrics');
   ```

---

## Running Coverage

```bash
npm run test:coverage
```

Coverage report is generated in `coverage/`. The threshold is 80% across branches, functions, lines, and statements. CI will fail if coverage drops below this.

**Currently covered services:**
- `huxleyKnowledgeBase.js` — 100%
- `conversationalRoutingService.js` — 99%
- `masterContextService.js` — high
- `enhancedClaudeService.js` — 88%
- `metricsService.js` — high
- `ragService.js` — covered
- `intentionGuidanceAIService.js` — covered
- `intentionGuidanceService.js` — covered
- `sessionChecklistService.js` — covered

---

## What Each Test Suite Covers

### conversationalRoutingService.test.js (48 tests)
- Keyword-based routing to correct AI service (crisis, psychedelic, IFS, etc.)
- Fallback responses for crisis detection
- Edge cases: empty input, greetings, ambiguous messages

### huxleyKnowledgeBase.test.js (53 tests)
- Scenario detection from user messages (crisis, hyperarousal, shutdown, etc.)
- Protocol retrieval for each scenario key
- Enhanced prompt building with voice principles and cross-domain context
- Homework suggestion generation by theme
- Data integrity: all scenarios have triggers, protocols, valid priorities

### enhancedClaudeService.test.js (30+ tests)
- Chat with context injection (master context + conversation history)
- Streaming response handling
- Error recovery and retry logic
- Context window management

### masterContextService.test.js (43 tests)
- Context aggregation from multiple sources
- Cache behavior (5-minute TTL)
- Partial failure handling (one source fails, others still load)
- Context formatting for Claude prompt injection

### intentionGuidanceAIService.test.js (67 tests)
- Intention conversation flow (welcome → direction → deepen → confirm)
- Stage transitions and validation
- Template-based vs free-form intentions
- Privacy controls integration

### metricsService.test.js (41 tests)
- Initialization and flush timer
- Batch queuing and auto-flush at 100 items
- Cost calculation from token counts
- Token estimation from text length
- Graceful degradation when DB unavailable

### metricsIntegration.test.js (26 tests)
- Full metric logging pipeline (log → batch → flush → DB insert)
- Routing decision logging
- Error logging (immediate, not batched)
- Service health and cost summary queries

### ragService.test.js (19 tests)
- Embedding search with category scoping
- 5-minute cache behavior
- Graceful degradation when edge function unavailable
- Result formatting for Claude context injection

### monitoringFlow.test.js (16 tests)
- End-to-end: metric logged → batched → flushed → queryable
- Dashboard data retrieval (service health, costs, errors, routing quality)

### conversationBot.test.js
- Full conversation lifecycle: open → message → response → close
- Multi-turn conversations with context preservation

---

## Component Tests (Currently Skipped)

The 81 component tests in `__tests__/components/` are skipped because they need a React Native rendering environment (JSDOM or @testing-library/react-native with proper setup). They test:

- `CostSummaryCard` — cost display formatting, time range selection
- `SystemOverviewCard` — health indicators, status badges

**To enable:** Update `jest.config.js` to use `jsdom` environment for component tests, or add a separate jest config for component testing.

---

## CI Integration

The project has a lean CI workflow (`.github/workflows/`). Tests run on every push:

```bash
npm test  # Runs all tests (no --coverage flag to avoid threshold failure in CI)
```

To run with coverage locally:
```bash
npm run test:coverage
```

---

## Troubleshooting

### "Cannot find module" errors
Most likely a mock is missing. Check `jest.setup.js` for the required mock. Common ones:
- New Expo module? Add mock in `jest.setup.js`
- New service dependency? Mock at the top of your test file

### Tests pass locally but fail in CI
- Check for environment-dependent code (dates, random, file paths)
- Ensure `jest.clearAllMocks()` in `beforeEach` — CI runs all suites together

### "ReferenceError: __DEV__ is not defined"
The `jest.setup.js` sets `global.__DEV__ = true`. If you're running a test outside of jest, this won't be set.

### Component tests skipped
The 81 component tests show as "skipped" — this is expected. They need a React Native renderer environment. This does not affect the 519 passing tests.

### Mock interference between suites
If test A's mock leaks into test B, ensure:
1. `jest.clearAllMocks()` in `beforeEach`
2. Mocks are defined per-file, not globally
3. Singleton services (like metricsService) are reset between tests

---

## Adding Tests for New Features

When you add a new feature:

1. **Service layer** — add unit tests in `__tests__/lib/yourService.test.js`
2. **API integration** — if it touches Supabase, add flow test in `__tests__/integration/`
3. **User journey** — for complex flows, add E2E test in `__tests__/e2e/`
4. **Run the full suite** before committing: `npm test`

Minimum expectation: every new service gets unit tests for its public methods, happy path + error cases.
