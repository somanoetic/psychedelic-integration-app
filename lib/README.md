# Services Directory

This directory contains all AI services, context services, and utilities for the Psychedelic Integration App.

**Last Updated:** 2026-02-09

---

## 📁 Directory Structure

### AI Services (Stateful Classes)

These services manage conversation state and are instantiated per component:

- **`ifsAIService.js`** - Internal Family Systems parts work guidance
- **`polyvagalAIService.js`** - Nervous system state tracking and regulation
- **`nervousSystemMappingAIService.js`** - Polyvagal assessment and practices
- **`triggersGlimmersAIService.js`** - Dysregulation and regulation trigger mapping
- **`coreBeliefsAIService.js`** - Core belief exploration and restructuring
- **`regulatingResourcesAIService.js`** - Personalized regulation toolkit building
- **`dailyJournalAIService.js`** - General journaling with AI-guided prompts

### Integration Services (Stateful Classes)

These services handle psychedelic experience integration:

- **`enhancedClaudeService.js`** - Context-aware integration guide (Huxley)
- **`experienceMappingService.js`** - Robert Johnson's 4-step framework processing
- **`therapeuticIntegrationService.js`** - Therapeutic integration with practices
- **`fallbackIntegrationService.js`** - Offline fallback integration responses

### Context Services (Singletons)

These services provide shared context aggregation and are exported as singletons:

- **`masterContextService.js`** - Cross-domain context aggregation (⭐ core service)
- **`ifsContextService.js`** - IFS-specific context management
- **`polyvagalContextService.js`** - Nervous system context management

### Base Services

Core API integration and routing:

- **`claudeService.js`** - Base Claude API integration (`IntegrationGuide` class)
- **`conversationalRoutingService.js`** - Intent detection and routing
- **`huxleyKnowledgeBase.js`** - Clinical protocols and voice patterns

### Utility Services (Singletons)

Supporting utilities:

- **`userRoleService.js`** - User roles and permissions
- **`educationProgressService.js`** - Learning progress tracking
- **`subliminalPrimingService.js`** - Therapeutic affirmations and nudges

---

## 🎯 Naming Conventions

### Pattern 1: Stateful AI Services
**When to use:** Services that manage conversation history, session state, or are instantiated per component

```javascript
// File: ifsAIService.js
export class IFSAIService {
  constructor() {
    this.conversationHistory = [];
    this.sessionContext = {};
  }
  // ... methods
}

// Usage in component:
import { IFSAIService } from '../lib/ifsAIService';
const ifsService = useRef(new IFSAIService()).current;
```

**Files using this pattern:**
- ifsAIService.js
- polyvagalAIService.js
- coreBeliefsAIService.js
- dailyJournalAIService.js
- nervousSystemMappingAIService.js
- triggersGlimmersAIService.js
- regulatingResourcesAIService.js
- conversationalRoutingService.js

### Pattern 2: Singleton Context/Utility Services
**When to use:** Services that provide shared functionality, no per-instance state needed

```javascript
// File: masterContextService.js
class MasterContextService {
  async getMasterContext(userId, options) {
    // ... context aggregation logic
  }
  // ... methods
}

export default new MasterContextService();

// Usage in service:
import masterContextService from './masterContextService';
const context = await masterContextService.getMasterContext(userId);
```

**Files using this pattern:**
- masterContextService.js (⭐ singleton)
- ifsContextService.js
- polyvagalContextService.js
- userRoleService.js
- educationProgressService.js

### Pattern 3: Default Export Classes
**When to use:** Services instantiated in components but exported as default

```javascript
// File: enhancedClaudeService.js
class IntegrationGuideService {
  constructor() {
    this.sessionContext = {};
  }
  // ... methods
}

export default IntegrationGuideService;

// Usage in component:
import IntegrationGuideService from '../lib/enhancedClaudeService';
const guide = useRef(new IntegrationGuideService()).current;
```

**Files using this pattern:**
- enhancedClaudeService.js
- experienceMappingService.js
- therapeuticIntegrationService.js
- fallbackIntegrationService.js

### Pattern 4: Configuration Exports
**When to use:** Constants, configuration objects, knowledge bases

```javascript
// File: subliminalPrimingService.js
export const AFFIRMATION_THEMES = {
  // ... configuration
};

// Usage:
import { AFFIRMATION_THEMES } from '../lib/subliminalPrimingService';
```

**Files using this pattern:**
- subliminalPrimingService.js
- huxleyKnowledgeBase.js

---

## 🔗 Service Relationships

### Master Context System (⭐ Key Architecture)

The `masterContextService` is the **central hub** of the AI system:

```
┌─────────────────────────────────────┐
│     masterContextService.js         │
│   (Cross-Domain Aggregation)        │
└──────────────┬──────────────────────┘
               │
               ├── Aggregates from:
               │   ├── IFS parts (ifsContextService)
               │   ├── Nervous system states (polyvagalContextService)
               │   ├── Integration journals
               │   ├── Session data
               │   ├── Core beliefs
               │   ├── Triggers & glimmers
               │   └── Regulating resources
               │
               └── Used by:
                   ├── ifsAIService
                   ├── polyvagalAIService
                   ├── dailyJournalAIService
                   ├── enhancedClaudeService
                   └── All other AI services
```

### Conversational Routing

```
User Input
    │
    ├─> conversationalRoutingService (Intent Detection)
    │       │
    │       ├── Crisis → triggeredSupport
    │       ├── Parts work → ifsAIService
    │       ├── Nervous system → polyvagalAIService
    │       ├── Journaling → dailyJournalAIService
    │       └── General → enhancedClaudeService
    │
    └─> Selected AI Service
            │
            ├─> Loads masterContext (user data)
            ├─> Generates AI response
            └─> Returns to user
```

---

## 📖 Usage Examples

### Using an AI Service

```javascript
import { IFSAIService } from '../lib/ifsAIService';
import masterContextService from '../lib/masterContextService';

const ifsService = new IFSAIService();

// Initialize with context
await ifsService.initialize(userId);

// Continue conversation
const response = await ifsService.continueConversation(
  userMessage,
  context
);
```

### Using Master Context

```javascript
import masterContextService from '../lib/masterContextService';

// Get comprehensive context
const context = await masterContextService.getMasterContext(userId, {
  focus: 'ifs',           // Focus area: 'ifs', 'nervous_system', 'integration', 'all'
  recentDays: 90,         // Only last 90 days
  maxParts: 10,           // Max IFS parts to include
  includeConnections: true, // Include cross-domain links
  useCache: true          // Use 5-min cache
});

// Context includes:
// - User profile
// - IFS parts (recent 10)
// - Nervous system states
// - Integration journals (recent 5)
// - Session data (recent 5)
// - Triggers & glimmers
// - Core beliefs
// - Regulating resources
// - Discovered cross-domain connections
```

---

## ✅ Best Practices

### When Creating a New Service

1. **Choose the right pattern:**
   - Stateful/per-instance → `export class ServiceName`
   - Shared/singleton → `export default new ServiceName()`
   - Configuration → `export const`

2. **Name consistently:**
   - AI services → `*AIService.js` (e.g., `ifsAIService.js`)
   - Context services → `*ContextService.js`
   - General services → `*Service.js`

3. **Document in this README:**
   - Add to appropriate section
   - Update relationships diagram if needed

4. **Use master context:**
   ```javascript
   import masterContextService from './masterContextService';

   async initialize(userId) {
     this.masterContext = await masterContextService.getMasterContext(userId, {
       focus: 'your_domain'
     });
   }
   ```

### When Modifying Services

1. **Check dependencies** - Services depend on each other
2. **Update tests** - Add/update tests when changing behavior
3. **Test offline fallbacks** - AI services should handle API failures gracefully
4. **Maintain voice principles** - Follow Huxley's clinical voice patterns

---

## 🚨 Important Notes

### Security
- **Never commit API keys** - Use environment variables
- **Validate user input** - All user-provided data should be sanitized
- **Check permissions** - Use userRoleService for access control

### Performance
- **Master context caching** - 5-minute TTL, use wisely
- **Lazy loading** - Only load context you need (use `focus` parameter)
- **Async operations** - Always use async/await properly

### Offline Support
- All AI services should have fallback responses
- Use `fallbackIntegrationService` when Claude API unavailable
- Test offline behavior regularly

---

## 📚 Further Reading

- **AI System Assessment:** `docs/AI_SYSTEM_ASSESSMENT.md`
- **Prompt Engineering:** `docs/PROMPT_ENGINEERING.md` (coming soon)
- **Architecture Overview:** `docs/AI_ARCHITECTURE.md` (coming soon)
- **Master Context Deep Dive:** See `masterContextService.js` inline documentation

---

**Maintained by:** AI Integration Team
**Last Cleanup:** 2026-02-09 (FEAT-201: Code Organization Cleanup)
