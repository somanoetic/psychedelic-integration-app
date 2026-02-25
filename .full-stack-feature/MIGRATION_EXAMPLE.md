# AI Service Migration Example

**Purpose:** Show how to migrate an AI service from direct Claude API calls to the secure proxy.

**Example Service:** `dailyJournalAIService.js`

---

## Before (INSECURE) ❌

```javascript
import config from './config';
import metricsService from './metricsService';

const ANTHROPIC_API_KEY = config.anthropicApiKey; // ❌ SECURITY ISSUE
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

export class DailyJournalAIService {
  constructor() {
    this.conversationHistory = [];
    this.phase = 'journaling';
    this.journalData = { /* ... */ };
    this.isOnline = true;
  }

  getSystemPrompt() {
    return `You are Huxley...`;
  }

  async sendMessage(userMessage) {
    try {
      const userMsg = { role: 'user', content: userMessage };
      this.conversationHistory.push(userMsg);

      // ❌ DIRECT API CALL WITH EXPOSED KEY
      const response = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY, // ❌ KEY IN CLIENT
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: this.getSystemPrompt(),
          messages: this.conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.content[0].text;

      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage,
      });

      await metricsService.logAIInteraction('daily_journal', {
        model: 'claude-sonnet-4-20250514',
        tokens: data.usage,
      });

      return assistantMessage;
    } catch (error) {
      console.error('Journal AI error:', error);
      throw error;
    }
  }

  clearHistory() {
    this.conversationHistory = [];
    this.phase = 'journaling';
  }
}

export default new DailyJournalAIService();
```

### Problems with the above code:

1. ❌ **API key exposed in client bundle** - Anyone can extract it
2. ❌ **No rate limiting** - Users can make unlimited requests
3. ❌ **No cost control** - API costs can skyrocket
4. ❌ **No authentication** - Any client can use the key
5. ❌ **No usage tracking** - Can't monitor or audit usage

---

## After (SECURE) ✅

```javascript
import claudeProxyService from './claudeProxyService'; // ✅ Use proxy
import metricsService from './metricsService';

// ✅ No API key needed on client

export class DailyJournalAIService {
  constructor() {
    this.conversationHistory = [];
    this.phase = 'journaling';
    this.journalData = { /* ... */ };
    this.isOnline = true;
  }

  getSystemPrompt() {
    return `You are Huxley...`;
  }

  async sendMessage(userMessage) {
    try {
      const userMsg = { role: 'user', content: userMessage };
      this.conversationHistory.push(userMsg);

      // ✅ CALL SECURE PROXY
      const data = await claudeProxyService.sendMessage(
        this.conversationHistory,
        {
          model: 'claude-sonnet-4-20250514',
          maxTokens: 1024,
          system: this.getSystemPrompt(),
        }
      );

      const assistantMessage = data.content[0].text;

      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage,
      });

      // ✅ Usage already logged by proxy, but can add local metrics too
      await metricsService.logAIInteraction('daily_journal', {
        model: 'claude-sonnet-4-20250514',
        tokens: data.usage,
        rateLimitRemaining: data._proxy_metadata?.rate_limit_remaining,
      });

      return assistantMessage;
    } catch (error) {
      console.error('Journal AI error:', error);

      // ✅ Handle rate limiting gracefully
      if (error.message.includes('Rate limit exceeded')) {
        // Show user-friendly message
        throw new Error(
          'You\'ve reached your daily AI conversation limit. ' +
          'The limit will reset tomorrow. Your journal entry has been saved.'
        );
      }

      throw error;
    }
  }

  clearHistory() {
    this.conversationHistory = [];
    this.phase = 'journaling';
  }

  // ✅ NEW: Check rate limit before starting conversation
  async checkRateLimit() {
    try {
      const status = await claudeProxyService.getRateLimitStatus();
      return status;
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return null;
    }
  }
}

export default new DailyJournalAIService();
```

### Security improvements:

1. ✅ **API key server-side only** - Never exposed to client
2. ✅ **Automatic rate limiting** - 100 requests/day per user
3. ✅ **Cost tracking** - Every request logged with cost estimate
4. ✅ **Authentication required** - Must be logged in via Supabase
5. ✅ **Usage monitoring** - Full audit trail in database
6. ✅ **Graceful degradation** - User-friendly error messages

---

## Migration Steps

### 1. Update Imports

```diff
- import config from './config';
+ import claudeProxyService from './claudeProxyService';

- const ANTHROPIC_API_KEY = config.anthropicApiKey;
- const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
```

### 2. Replace API Call

**Before:**
```javascript
const response = await fetch(CLAUDE_API_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: this.getSystemPrompt(),
    messages: this.conversationHistory,
  }),
});

const data = await response.json();
```

**After:**
```javascript
const data = await claudeProxyService.sendMessage(
  this.conversationHistory,
  {
    model: 'claude-sonnet-4-20250514',
    maxTokens: 1024,
    system: this.getSystemPrompt(),
  }
);
```

### 3. Add Rate Limit Handling

```javascript
async sendMessage(userMessage) {
  try {
    // ... existing code ...
  } catch (error) {
    // Add graceful rate limit handling
    if (error.message.includes('Rate limit exceeded')) {
      throw new Error('Daily AI limit reached. Resets tomorrow.');
    }
    throw error;
  }
}
```

### 4. Optional: Add Rate Limit Check

```javascript
// Before starting a conversation, check if user has quota
async checkRateLimit() {
  const status = await claudeProxyService.getRateLimitStatus();
  if (status.remaining === 0) {
    return {
      canContinue: false,
      message: `Daily limit reached. Resets at ${new Date(status.windowStart).toLocaleTimeString()}`,
    };
  }
  return { canContinue: true };
}
```

---

## Testing Checklist

After migrating a service, test these scenarios:

- [ ] **Happy path**: AI responses work correctly
- [ ] **Authentication**: Works only when logged in
- [ ] **Rate limiting**: Gets rate limit error after 100 requests
- [ ] **Error handling**: Shows user-friendly messages
- [ ] **Conversation history**: Multi-turn conversations work
- [ ] **Offline mode**: Gracefully handles no connection
- [ ] **Metrics**: Usage logged correctly

---

## All Services to Migrate

Use the same pattern for these services:

1. ✅ `lib/dailyJournalAIService.js` (example above)
2. ⏳ `lib/nervousSystemMappingAIService.js`
3. ⏳ `lib/coreBeliefsAIService.js`
4. ⏳ `lib/polyvagalAIService.js`
5. ⏳ `lib/triggersGlimmersAIService.js`
6. ⏳ `lib/ifsAIService.js`
7. ⏳ `lib/regulatingResourcesAIService.js`
8. ⏳ `lib/claudeService.js` (base service)
9. ⏳ `lib/enhancedClaudeService.js`
10. ⏳ `lib/conversationalRoutingService.js`
11. ⏳ And any others...

---

## Common Gotchas

### 1. Max Tokens Parameter

Proxy uses `maxTokens` (camelCase), not `max_tokens`:

```javascript
// ❌ Wrong
{ max_tokens: 1024 }

// ✅ Correct
{ maxTokens: 1024 }
```

### 2. System Prompt Location

System prompt is in `options`, not a separate header:

```javascript
// ✅ Correct
await claudeProxyService.sendMessage(messages, {
  system: 'Your system prompt here',
  maxTokens: 1024,
});
```

### 3. Response Format

The proxy returns the same format as Claude API, so parsing logic stays the same:

```javascript
// Same as before
const assistantMessage = data.content[0].text;
```

### 4. Rate Limit Headers

New: Check rate limit info in response metadata:

```javascript
if (data._proxy_metadata) {
  console.log('Remaining requests:', data._proxy_metadata.rate_limit_remaining);
}
```

---

## UI Improvements (Optional)

Consider adding rate limit UI:

```javascript
// In a component
const [rateLimit, setRateLimit] = useState(null);

useEffect(() => {
  async function checkLimit() {
    const status = await claudeProxyService.getRateLimitStatus();
    setRateLimit(status);
  }
  checkLimit();
}, []);

// Show in UI
{rateLimit && (
  <Text style={styles.rateLimitInfo}>
    AI requests today: {rateLimit.used} / {rateLimit.limit}
  </Text>
)}
```

---

## Rollback Plan

If issues arise, you can temporarily revert:

```javascript
// Keep both imports during transition
import config from './config';
import claudeProxyService from './claudeProxyService';

// Add fallback logic
const USE_PROXY = true; // Set to false to rollback

async sendMessage(userMessage) {
  if (USE_PROXY) {
    return this._sendViaProxy(userMessage);
  } else {
    return this._sendDirect(userMessage);
  }
}
```

⚠️ **WARNING:** Only use as temporary rollback. Direct API calls expose the key!

---

**Migration Status:** ✅ Example Complete
**Next:** Migrate remaining services using this pattern
