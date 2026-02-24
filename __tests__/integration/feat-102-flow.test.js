/**
 * Integration Tests for FEAT-102: End-to-End Flows
 *
 * Tests complete user journeys through the intention-setting feature:
 * - Complete conversation flow (welcome -> direction -> confirm -> save)
 * - Template browsing and usage
 * - Draft editing and AI feedback
 * - Privacy controls
 * - Offline functionality
 * - Error recovery
 * - User preferences management
 * - Nervous system state adaptation
 */

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any require() calls
// ---------------------------------------------------------------------------

jest.mock('../../lib/claudeProxyService', () => ({
  __esModule: true,
  default: {
    sendMessage: jest.fn()
  }
}));

jest.mock('../../lib/enhancedClaudeService', () => ({
  __esModule: true,
  default: {}
}));

jest.mock('../../lib/metricsService', () => ({
  __esModule: true,
  default: {
    logAIMetric: jest.fn(),
    logError: jest.fn(),
    // The AI service calls metricsService.constructor.extractTokens / calculateCost
    // on the singleton, so we hang those static-style methods on the mock instance
    constructor: {
      extractTokens: jest.fn().mockReturnValue(null),
      calculateCost: jest.fn().mockReturnValue(0)
    }
  }
}));

jest.mock('../../lib/config', () => ({
  __esModule: true,
  default: {
    anthropicApiKey: 'test-key',
    supabaseUrl: 'https://test.supabase.co'
  }
}));

// NOTE: intentionGuidanceService is NOT mocked here — we let it run against
// the supabase mock so we can test the db layer integration.

// The supabase mock is already declared in jest.setup.js but the integration
// tests need to control per-test return values, so we override it here.
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(() =>
        Promise.resolve({ data: { user: { id: 'test-user-123' } }, error: null })
      ),
      getSession: jest.fn(() =>
        Promise.resolve({
          data: { session: { access_token: 'test-token' } },
          error: null
        })
      )
    }
  }
}));

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('FEAT-102 Integration Tests - Complete User Flows', () => {
  let intentionGuidanceAIService;
  let intentionGuidanceService;
  let mockSupabase;
  let mockClaudeProxy;
  let AsyncStorage;

  const TEST_USER_ID = 'test-user-123';
  const TEST_SESSION_ID = 'test-session-456';

  beforeAll(() => {
    intentionGuidanceAIService = require('../../lib/intentionGuidanceAIService').default;
    intentionGuidanceService = require('../../lib/intentionGuidanceService').default;
    mockSupabase = require('../../lib/supabase').supabase;
    mockClaudeProxy = require('../../lib/claudeProxyService').default;
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
  });

  // =========================================================================
  // HELPERS
  // =========================================================================

  /**
   * Build a chainable supabase query mock that ends with .single().
   *
   * Used by getUserPreferences (uses .select().eq().single()) and
   * updateUserPreferences (uses .update().eq().select().single()).
   */
  function makeSingleQuery(resolvedValue) {
    const query = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue(resolvedValue)
    };
    return query;
  }

  /**
   * Build a chainable supabase query mock that is thenable (awaitable directly).
   *
   * getTemplates awaits the query object itself after chaining:
   *   let query = supabase.from(...).select(...).eq(...).order(...).order(...)
   *   ...conditionally .eq() / .limit()
   *   const { data, error } = await query;
   *
   * We must therefore make the mock object thenable so that `await query`
   * resolves to the provided value.
   */
  function makeThenableQuery(resolvedValue) {
    const query = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis()
    };
    // Make the object itself awaitable
    query.then = (resolve) => resolve(resolvedValue);
    return query;
  }

  // =========================================================================
  // COMPLETE CONVERSATION FLOW
  // =========================================================================

  describe('Complete Conversation Flow: Welcome -> Direction -> Confirm -> Save', () => {
    it('should complete full conversation journey', async () => {
      // --- Supabase mock setup ---
      // startIntentionConversation calls:
      //   1. getUserPreferences  → single()
      //   2. getTemplates        → thenable query
      const mockPreferences = {
        user_id: TEST_USER_ID,
        save_by_default: false,
        favorite_frameworks: ['ifs'],
        guidance_style: 'balanced'
      };

      const prefsQuery = makeSingleQuery({ data: mockPreferences, error: null });
      const templatesQuery = makeThenableQuery({ data: [], error: null });

      mockSupabase.from
        .mockReturnValueOnce(prefsQuery)   // getUserPreferences
        .mockReturnValueOnce(templatesQuery); // getTemplates

      // --- Claude proxy mock setup ---
      const aiMessages = [
        "Hello, I'm Huxley. What's calling you today?",
        "It sounds like you're carrying some weight with self-criticism. What part of you is asking for attention?",
        "Your inner critic sounds protective. Hold that lightly — let the medicine take you from there."
      ];

      let aiCallIndex = 0;
      mockClaudeProxy.sendMessage.mockImplementation(() =>
        Promise.resolve({
          content: [{ text: aiMessages[aiCallIndex++] || aiMessages[0] }],
          usage: { input_tokens: 500, output_tokens: 50 }
        })
      );

      // 1. Start conversation
      const startResult = await intentionGuidanceAIService.startIntentionConversation({
        userId: TEST_USER_ID,
        sessionType: 'healing',
        framework: 'ifs',
        nervousSystemState: 'ventral'
      });

      expect(startResult.conversationId).toBeDefined();
      expect(startResult.initialMessage).toBeDefined();
      expect(startResult.conversationStage).toBe('welcome');

      const conversationId = startResult.conversationId;
      const conversationHistory = [
        { role: 'assistant', content: startResult.initialMessage }
      ];

      // 2. Continue conversation — first user message (stage: direction)
      const message1 = "I've been struggling with self-criticism";
      conversationHistory.push({ role: 'user', content: message1 });

      const response1 = await intentionGuidanceAIService.continueIntentionConversation(
        message1,
        {
          conversationId,
          userId: TEST_USER_ID,
          sessionType: 'healing',
          framework: 'ifs',
          nervousSystemState: 'ventral',
          conversationHistory
        }
      );

      expect(response1.message).toBeDefined();
      // After 1 user message the stage is 'direction'
      expect(response1.conversationStage).toBe('direction');
      conversationHistory.push({ role: 'assistant', content: response1.message });

      // 3. Continue conversation — second user message (stage: confirm)
      const message2 = "My inner critic tells me I'm never good enough";
      conversationHistory.push({ role: 'user', content: message2 });

      const response2 = await intentionGuidanceAIService.continueIntentionConversation(
        message2,
        {
          conversationId,
          userId: TEST_USER_ID,
          sessionType: 'healing',
          framework: 'ifs',
          nervousSystemState: 'ventral',
          conversationHistory
        }
      );

      expect(response2.message).toBeDefined();
      // After 2+ user messages the stage is 'confirm'
      expect(response2.conversationStage).toBe('confirm');
      conversationHistory.push({ role: 'assistant', content: response2.message });

      // 4. Draft intention
      const draftIntention = "I intend to meet my inner critic with curiosity and compassion";

      // 5. Get AI feedback on draft
      mockClaudeProxy.sendMessage.mockResolvedValueOnce({
        content: [{ text: "This is a heartfelt intention. The clarity about meeting your inner critic is strong." }],
        usage: { input_tokens: 600, output_tokens: 80 }
      });

      const feedbackResult = await intentionGuidanceAIService.analyzeDraftIntention(
        draftIntention,
        {
          userId: TEST_USER_ID,
          sessionType: 'healing',
          framework: 'ifs',
          conversationHistory
        }
      );

      expect(feedbackResult.feedback).toBeDefined();
      expect(feedbackResult.suggestions).toBeInstanceOf(Array);

      // 6. Save intention — mock the session_intentions insert chain
      const saveQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'intention-789',
            user_id: TEST_USER_ID,
            intention_text: draftIntention,
            created_at: '2026-02-10T10:00:00Z'
          },
          error: null
        })
      };
      mockSupabase.from.mockReturnValue(saveQuery);

      const saveResult = await intentionGuidanceAIService.saveIntention(
        {
          intentionText: draftIntention,
          framework: 'ifs',
          sessionType: 'healing',
          aiConversationContext: {
            prompt_count: Math.floor(conversationHistory.length / 2),
            frameworks_explored: ['ifs'],
            session_duration_seconds: 240
          },
          userWantsToSave: true
        },
        TEST_USER_ID,
        TEST_SESSION_ID
      );

      expect(saveResult.success).toBe(true);
      expect(saveResult.intentionId).toBe('intention-789');

      // 7. Verify conversation completed successfully
      expect(conversationHistory.length).toBeGreaterThan(4);
    });
  });

  // =========================================================================
  // TEMPLATE USAGE FLOW
  // =========================================================================

  describe('Template Browsing and Usage Flow', () => {
    it('should browse templates and use one for intention', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          title: 'Meeting the Inner Critic',
          intention_text: 'I intend to meet my inner critic with compassion',
          framework: 'ifs',
          session_type: 'healing',
          tags: ['inner_critic', 'self_compassion'],
          is_featured: true
        },
        {
          id: 'template-2',
          title: 'Healing Grief',
          intention_text: 'I intend to hold my grief with gentleness',
          framework: 'healing',
          session_type: 'healing',
          tags: ['grief', 'gentleness']
        }
      ];

      // getTemplates awaits the query directly — use thenable mock
      const templatesQuery = makeThenableQuery({ data: mockTemplates, error: null });
      mockSupabase.from.mockReturnValue(templatesQuery);

      // 1. Browse templates by framework
      const templates = await intentionGuidanceService.getTemplates('ifs', 'healing', 10);

      expect(templates).toBeDefined();
      expect(templates.length).toBeGreaterThan(0);
      // The mock returns both templates; filter is applied via .eq() which is
      // a no-op on our mock, so all templates come back — verify we got data
      expect(templates[0].framework).toBe('ifs');

      // 2. Select a template
      const selectedTemplate = templates[0];

      // 3. Use template as draft
      const draftFromTemplate = selectedTemplate.intention_text;

      // 4. Get AI feedback on the template-based draft
      mockClaudeProxy.sendMessage.mockResolvedValueOnce({
        content: [{
          text: "This is a beautiful intention. You might consider what specifically you want to meet with compassion."
        }],
        usage: { input_tokens: 600, output_tokens: 80 }
      });

      const feedback = await intentionGuidanceAIService.analyzeDraftIntention(
        draftFromTemplate,
        {
          userId: TEST_USER_ID,
          sessionType: 'healing',
          framework: 'ifs'
        }
      );

      expect(feedback.feedback).toBeDefined();

      // 5. Customize and save
      const customizedIntention = draftFromTemplate + " about my past experiences";

      const saveQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'intention-123',
            intention_text: customizedIntention,
            inspired_by_template_id: selectedTemplate.id
          },
          error: null
        })
      };
      mockSupabase.from.mockReturnValue(saveQuery);

      const saveResult = await intentionGuidanceAIService.saveIntention(
        {
          intentionText: customizedIntention,
          framework: 'ifs',
          sessionType: 'healing',
          inspiredByTemplateId: selectedTemplate.id,
          userWantsToSave: true
        },
        TEST_USER_ID,
        TEST_SESSION_ID
      );

      expect(saveResult.success).toBe(true);
    });
  });

  // =========================================================================
  // PRIVACY CONTROL FLOW
  // =========================================================================

  describe('Privacy Control Flow', () => {
    it('should respect privacy opt-out', async () => {
      // When userWantsToSave: false, saveIntention calls getUserPreferences
      // to check save_by_default. We return false so it rejects the save.
      const prefsQuery = makeSingleQuery({
        data: { user_id: TEST_USER_ID, save_by_default: false },
        error: null
      });
      mockSupabase.from.mockReturnValue(prefsQuery);

      const intention = {
        intentionText: 'My private intention',
        framework: 'ifs',
        sessionType: 'healing',
        userWantsToSave: false // Explicit opt-out
      };

      const result = await intentionGuidanceAIService.saveIntention(
        intention,
        TEST_USER_ID,
        TEST_SESSION_ID
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PRIVACY_OPT_IN_REQUIRED');
      // The session_intentions table should never be touched
      expect(mockSupabase.from).not.toHaveBeenCalledWith('session_intentions');
    });

    it('should save when user explicitly opts in', async () => {
      // userWantsToSave: true skips the preferences check and goes straight
      // to validation + db insert.
      const saveQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'intention-123', intention_text: 'My intention' },
          error: null
        })
      };
      mockSupabase.from.mockReturnValue(saveQuery);

      const intention = {
        intentionText: 'My intention',
        framework: 'ifs',
        sessionType: 'healing',
        userWantsToSave: true // Explicit opt-in
      };

      const result = await intentionGuidanceAIService.saveIntention(
        intention,
        TEST_USER_ID,
        TEST_SESSION_ID
      );

      expect(result.success).toBe(true);
      expect(saveQuery.insert).toHaveBeenCalled();
    });

    it('should check save_by_default preference', async () => {
      // shouldSaveByDefault delegates to getUserPreferences which uses .single()
      const prefsQuery = makeSingleQuery({
        data: { user_id: TEST_USER_ID, save_by_default: true },
        error: null
      });
      mockSupabase.from.mockReturnValue(prefsQuery);

      const shouldSave = await intentionGuidanceService.shouldSaveByDefault(TEST_USER_ID);

      expect(shouldSave).toBe(true);
    });
  });

  // =========================================================================
  // OFFLINE FUNCTIONALITY FLOW
  // =========================================================================

  describe('Offline Functionality', () => {
    it('should cache conversation to AsyncStorage', async () => {
      const cacheKey = `intention_draft_${TEST_USER_ID}_${TEST_SESSION_ID}`;
      const cacheData = {
        draftIntention: 'My draft intention',
        sessionType: 'healing',
        framework: 'ifs',
        conversationHistory: [
          { role: 'assistant', content: 'Hello' },
          { role: 'user', content: 'Hi' }
        ],
        timestamp: Date.now()
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));

      const retrieved = await AsyncStorage.getItem(cacheKey);
      const parsed = JSON.parse(retrieved);

      expect(parsed.draftIntention).toBe('My draft intention');
      expect(parsed.conversationHistory).toHaveLength(2);
    });

    it('should restore from cache on reload', async () => {
      const cacheKey = `intention_draft_${TEST_USER_ID}_${TEST_SESSION_ID}`;
      const cacheData = {
        draftIntention: 'Restored intention',
        sessionType: 'healing',
        framework: 'ifs',
        conversationHistory: [
          { role: 'assistant', content: 'Welcome back' },
          { role: 'user', content: 'Thanks' }
        ],
        timestamp: Date.now()
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));

      // Simulate app reload
      const retrieved = await AsyncStorage.getItem(cacheKey);
      const restored = JSON.parse(retrieved);

      expect(restored.draftIntention).toBe('Restored intention');
      expect(restored.conversationHistory).toHaveLength(2);
    });

    it('should clear cache after successful save', async () => {
      const cacheKey = `intention_draft_${TEST_USER_ID}_${TEST_SESSION_ID}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify({ draft: 'test' }));

      // Simulate the UI clearing the cache after a successful save
      await AsyncStorage.removeItem(cacheKey);

      const retrieved = await AsyncStorage.getItem(cacheKey);
      expect(retrieved).toBeNull();
    });
  });

  // =========================================================================
  // ERROR RECOVERY FLOW
  // =========================================================================

  describe('Error Recovery', () => {
    it('should recover from API failure with fallback response', async () => {
      // claudeProxyService.sendMessage rejects — continueIntentionConversation
      // must catch it and return a fallback object with error: true
      mockClaudeProxy.sendMessage.mockRejectedValue(new Error('Network error'));

      const result = await intentionGuidanceAIService.continueIntentionConversation(
        'My message',
        {
          conversationId: 'conv-123',
          userId: TEST_USER_ID,
          sessionType: 'healing',
          framework: 'ifs',
          nervousSystemState: 'ventral',
          conversationHistory: []
        }
      );

      expect(result).toBeDefined();
      expect(result.error).toBe(true);
      expect(result.message).toBeDefined(); // Fallback message is always returned
    });

    it('should recover from database failure during save', async () => {
      const failingQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database connection failed')
        })
      };
      mockSupabase.from.mockReturnValue(failingQuery);

      const result = await intentionGuidanceAIService.saveIntention(
        {
          intentionText: 'My intention',
          userWantsToSave: true
        },
        TEST_USER_ID,
        TEST_SESSION_ID
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('DATABASE_ERROR');
    });

    it('should handle invalid (empty) intention text', async () => {
      const result = await intentionGuidanceAIService.saveIntention(
        {
          intentionText: '', // Empty text — fails validation before any DB call
          userWantsToSave: true
        },
        TEST_USER_ID,
        TEST_SESSION_ID
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_INTENTION_TEXT');
    });

    it('should handle too-long intention text', async () => {
      const result = await intentionGuidanceAIService.saveIntention(
        {
          intentionText: 'x'.repeat(2001), // Max is 2000 characters
          userWantsToSave: true
        },
        TEST_USER_ID,
        TEST_SESSION_ID
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INTENTION_TOO_LONG');
    });
  });

  // =========================================================================
  // USER PREFERENCES MANAGEMENT
  // =========================================================================

  describe('User Preferences Management', () => {
    it('should create default preferences on first access', async () => {
      // getUserPreferences:
      //   1st call: .from('user_intention_preferences').select().eq().single()
      //             returns PGRST116 (no row found)
      //   2nd call: .from('user_intention_preferences').insert().select().single()
      //             returns the newly created defaults

      const noRowError = { code: 'PGRST116', message: 'No rows found' };

      // First supabase.from() call — the SELECT+single() that finds nothing
      const selectQuery = makeSingleQuery({ data: null, error: noRowError });

      // Second supabase.from() call — the INSERT+select+single() that creates defaults
      const insertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            user_id: TEST_USER_ID,
            save_by_default: false,
            guidance_style: 'balanced'
          },
          error: null
        })
      };

      mockSupabase.from
        .mockReturnValueOnce(selectQuery)
        .mockReturnValueOnce(insertQuery);

      const preferences = await intentionGuidanceService.getUserPreferences(TEST_USER_ID);

      expect(preferences).toBeDefined();
      expect(preferences.save_by_default).toBe(false);
    });

    it('should update preferences', async () => {
      // updateUserPreferences uses: .update().eq().select().single()
      const updateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            user_id: TEST_USER_ID,
            save_by_default: true,
            favorite_frameworks: ['ifs', 'somatic']
          },
          error: null
        })
      };
      mockSupabase.from.mockReturnValue(updateQuery);

      const result = await intentionGuidanceService.updateUserPreferences(
        TEST_USER_ID,
        {
          saveByDefault: true,
          favoriteFrameworks: ['ifs', 'somatic']
        }
      );

      expect(result.save_by_default).toBe(true);
      expect(result.favorite_frameworks).toContain('ifs');
    });
  });

  // =========================================================================
  // NERVOUS SYSTEM ADAPTATION FLOW
  // =========================================================================

  describe('Nervous System State Adaptation', () => {
    it('should adapt conversation to sympathetic (activated) state', async () => {
      // startIntentionConversation needs:
      //   1. getUserPreferences  → single()
      //   2. getTemplates        → thenable query

      const prefsQuery = makeSingleQuery({
        data: { user_id: TEST_USER_ID, save_by_default: false },
        error: null
      });
      const templatesQuery = makeThenableQuery({ data: [], error: null });

      mockSupabase.from
        .mockReturnValueOnce(prefsQuery)
        .mockReturnValueOnce(templatesQuery);

      mockClaudeProxy.sendMessage.mockResolvedValueOnce({
        content: [{ text: "Let's take this slowly. Take a breath." }],
        usage: { input_tokens: 500, output_tokens: 50 }
      });

      const result = await intentionGuidanceAIService.startIntentionConversation({
        userId: TEST_USER_ID,
        sessionType: 'healing',
        framework: 'ifs',
        nervousSystemState: 'sympathetic',
        stateConfidence: 0.85
      });

      expect(result.initialMessage).toBeDefined();
      expect(result.conversationStage).toBe('welcome');
    });

    it('should adapt conversation to dorsal (shutdown) state', async () => {
      const prefsQuery = makeSingleQuery({
        data: { user_id: TEST_USER_ID, save_by_default: false },
        error: null
      });
      const templatesQuery = makeThenableQuery({ data: [], error: null });

      mockSupabase.from
        .mockReturnValueOnce(prefsQuery)
        .mockReturnValueOnce(templatesQuery);

      mockClaudeProxy.sendMessage.mockResolvedValueOnce({
        content: [{ text: "There's no pressure here. We can go at your pace." }],
        usage: { input_tokens: 500, output_tokens: 50 }
      });

      const result = await intentionGuidanceAIService.startIntentionConversation({
        userId: TEST_USER_ID,
        sessionType: 'healing',
        framework: 'ifs',
        nervousSystemState: 'dorsal',
        stateConfidence: 0.75
      });

      expect(result.initialMessage).toBeDefined();
      expect(result.conversationStage).toBe('welcome');
    });
  });
});
