/**
 * Unit Tests for intentionGuidanceAIService (AI Layer)
 * FEAT-102: AI Guidance in Set Your Intention Screen
 *
 * Tests AI conversation orchestration with:
 * - Conversation flow management (3 stages: welcome, direction, confirm)
 * - Prompt engineering and framework-specific guidance
 * - Nervous system adaptation
 * - Draft analysis
 * - Privacy validation for intention saving
 * - Error handling and fallbacks
 */

// --- Mock: claudeProxyService (primary AI transport) ---
jest.mock('../../lib/claudeProxyService', () => ({
  __esModule: true,
  default: {
    sendMessage: jest.fn()
  }
}));

// --- Mock: enhancedClaudeService (imported by the module, not directly called in tests) ---
jest.mock('../../lib/enhancedClaudeService', () => ({
  __esModule: true,
  default: {
    sendMessage: jest.fn(),
    chat: jest.fn()
  }
}));

// --- Mock: intentionGuidanceService (DB layer) ---
jest.mock('../../lib/intentionGuidanceService', () => ({
  __esModule: true,
  default: {
    getUserPreferences: jest.fn(),
    getTemplates: jest.fn(),
    saveIntention: jest.fn(),
    updateUserPreferences: jest.fn()
  }
}));

// --- Mock: metricsService (instance methods + static methods via constructor) ---
jest.mock('../../lib/metricsService', () => {
  const extractTokens = jest.fn((data) => {
    if (!data || !data.usage) return null;
    return {
      input: data.usage.input_tokens || 0,
      output: data.usage.output_tokens || 0,
      total: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0)
    };
  });

  const calculateCost = jest.fn(() => 0.001);

  function MockMetricsService() {
    this.logAIMetric = jest.fn();
    this.logError = jest.fn();
  }
  MockMetricsService.extractTokens = extractTokens;
  MockMetricsService.calculateCost = calculateCost;

  const instance = new MockMetricsService();
  instance.constructor = MockMetricsService;

  return {
    __esModule: true,
    default: instance
  };
});

// --- Mock: config ---
jest.mock('../../lib/config', () => ({
  __esModule: true,
  default: {
    anthropicApiKey: 'test-api-key',
    supabaseUrl: 'https://test.supabase.co'
  }
}));

// --- Mock: supabase ---
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({ data: [], error: null })),
      insert: jest.fn(() => Promise.resolve({ data: [], error: null }))
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      getSession: jest.fn(() => Promise.resolve({
        data: { session: { access_token: 'test-token' } },
        error: null
      }))
    }
  }
}));

// =============================================================================
// TEST SUITE
// =============================================================================

describe('IntentionGuidanceAIService - AI Layer', () => {
  let service;
  let mockDbService;
  let mockMetricsService;
  let mockClaudeProxy;

  // Canonical Claude API response shape
  const makeProxyResponse = (text = 'AI response text') => ({
    content: [{ text }],
    usage: {
      input_tokens: 500,
      output_tokens: 50
    }
  });

  beforeAll(() => {
    service = require('../../lib/intentionGuidanceAIService').default;
    mockDbService = require('../../lib/intentionGuidanceService').default;
    mockMetricsService = require('../../lib/metricsService').default;
    mockClaudeProxy = require('../../lib/claudeProxyService').default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // startIntentionConversation
  // ===========================================================================

  describe('startIntentionConversation', () => {
    const mockUserId = 'user-123';

    const mockPreferences = {
      user_id: mockUserId,
      save_by_default: false,
      favorite_frameworks: ['ifs', 'somatic'],
      guidance_style: 'balanced'
    };

    const mockTemplates = [
      {
        id: 'template-1',
        title: 'Meeting the Inner Critic',
        intention_text: 'I intend to meet my inner critic with compassion',
        framework: 'ifs',
        session_type: 'healing'
      },
      {
        id: 'template-2',
        title: 'Healing Grief',
        intention_text: 'I intend to hold my grief with gentleness',
        framework: 'healing',
        session_type: 'healing'
      }
    ];

    beforeEach(() => {
      mockDbService.getUserPreferences.mockResolvedValue(mockPreferences);
      mockDbService.getTemplates.mockResolvedValue(mockTemplates);
      mockClaudeProxy.sendMessage.mockResolvedValue(
        makeProxyResponse("Hello, I'm Huxley. What's present for you right now?")
      );
    });

    it('should start conversation successfully and return expected shape', async () => {
      const result = await service.startIntentionConversation({
        userId: mockUserId,
        sessionType: 'healing',
        framework: 'ifs',
        nervousSystemState: 'ventral',
        stateConfidence: 0.85
      });

      expect(result).toBeDefined();
      expect(result.conversationId).toBeDefined();
      expect(result.initialMessage).toBe("Hello, I'm Huxley. What's present for you right now?");
      expect(result.suggestedTemplates).toHaveLength(2);
      expect(result.userPreferences).toEqual(mockPreferences);
      expect(result.conversationStage).toBe('welcome');
    });

    it('should load user preferences for the given userId', async () => {
      await service.startIntentionConversation({ userId: mockUserId, sessionType: 'healing', framework: 'ifs' });

      expect(mockDbService.getUserPreferences).toHaveBeenCalledWith(mockUserId);
    });

    it('should fetch relevant templates with framework, sessionType, and limit 5', async () => {
      await service.startIntentionConversation({
        userId: mockUserId,
        sessionType: 'healing',
        framework: 'ifs'
      });

      expect(mockDbService.getTemplates).toHaveBeenCalledWith('ifs', 'healing', 5);
    });

    it('should fall back to favorite_frameworks[0] when no framework is passed', async () => {
      await service.startIntentionConversation({
        userId: mockUserId,
        sessionType: 'healing'
        // no framework
      });

      // Preferences have favorite_frameworks: ['ifs', 'somatic'] → should use 'ifs'
      expect(mockDbService.getTemplates).toHaveBeenCalledWith('ifs', 'healing', 5);
    });

    it('should fall back to "healing" framework when preferences have no favorites', async () => {
      mockDbService.getUserPreferences.mockResolvedValue({ save_by_default: false });

      await service.startIntentionConversation({
        userId: mockUserId,
        sessionType: 'general'
      });

      expect(mockDbService.getTemplates).toHaveBeenCalledWith('healing', 'general', 5);
    });

    it('should call claudeProxyService.sendMessage (not fetch directly)', async () => {
      await service.startIntentionConversation({
        userId: mockUserId,
        sessionType: 'healing',
        framework: 'ifs'
      });

      expect(mockClaudeProxy.sendMessage).toHaveBeenCalledTimes(1);

      // Verify message structure sent to proxy
      const [messages, options] = mockClaudeProxy.sendMessage.mock.calls[0];
      expect(messages).toBeInstanceOf(Array);
      expect(messages[0]).toHaveProperty('role', 'user');
      expect(messages[0]).toHaveProperty('content');
      expect(options).toMatchObject({ maxTokens: 1024, temperature: 0.7 });
    });

    it('should throw when claudeProxyService.sendMessage rejects', async () => {
      mockClaudeProxy.sendMessage.mockRejectedValue(new Error('Proxy error'));

      await expect(
        service.startIntentionConversation({ userId: mockUserId, sessionType: 'healing', framework: 'ifs' })
      ).rejects.toThrow('Failed to start intention conversation');
    });

    it('should log the error to metricsService when sendMessage rejects', async () => {
      mockClaudeProxy.sendMessage.mockRejectedValue(new Error('Proxy error'));

      try {
        await service.startIntentionConversation({ userId: mockUserId });
      } catch {
        // expected
      }

      expect(mockMetricsService.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceName: 'intentionGuidanceAI',
          operation: 'start_conversation'
        })
      );
    });

    it('should still call sendMessage for a sympathetic nervous system state', async () => {
      await service.startIntentionConversation({
        userId: mockUserId,
        sessionType: 'healing',
        framework: 'ifs',
        nervousSystemState: 'sympathetic',
        stateConfidence: 0.8
      });

      expect(mockClaudeProxy.sendMessage).toHaveBeenCalledTimes(1);
    });
  });

  // ===========================================================================
  // continueIntentionConversation
  // ===========================================================================

  describe('continueIntentionConversation', () => {
    const mockMessage = "I've been struggling with self-criticism";
    const baseContext = {
      conversationId: 'conv-123',
      userId: 'user-123',
      sessionType: 'healing',
      framework: 'ifs',
      nervousSystemState: 'ventral'
    };

    beforeEach(() => {
      mockClaudeProxy.sendMessage.mockResolvedValue(
        makeProxyResponse("I hear that self-criticism is present. What part of you is most critical?")
      );
    });

    it('should return message, suggestedActions, and conversationStage on success', async () => {
      const result = await service.continueIntentionConversation(mockMessage, {
        ...baseContext,
        conversationHistory: [
          { role: 'assistant', content: 'Hello, what would you like to explore?' },
          { role: 'user', content: 'I want to work on self-compassion' }
        ]
      });

      expect(result).toBeDefined();
      expect(result.message).toBe("I hear that self-criticism is present. What part of you is most critical?");
      expect(result.suggestedActions).toBeInstanceOf(Array);
      expect(result.conversationStage).toBeDefined();
    });

    it('should detect "welcome" stage with empty conversation history (0 user messages)', async () => {
      const result = await service.continueIntentionConversation(mockMessage, {
        ...baseContext,
        conversationHistory: []
      });

      expect(result.conversationStage).toBe('welcome');
    });

    it('should detect "direction" stage with exactly 1 user message in history', async () => {
      const result = await service.continueIntentionConversation(mockMessage, {
        ...baseContext,
        conversationHistory: [
          { role: 'assistant', content: 'Hello' },
          { role: 'user', content: 'First user reply' }
        ]
      });

      expect(result.conversationStage).toBe('direction');
    });

    it('should detect "confirm" stage with 2 or more user messages in history', async () => {
      const result = await service.continueIntentionConversation(mockMessage, {
        ...baseContext,
        conversationHistory: [
          { role: 'assistant', content: 'Hello' },
          { role: 'user', content: 'First reply' },
          { role: 'assistant', content: 'Reflect back' },
          { role: 'user', content: 'Second reply' }
        ]
      });

      expect(result.conversationStage).toBe('confirm');
    });

    it('should detect "confirm" stage with 3+ user messages (regardless of draft)', async () => {
      const result = await service.continueIntentionConversation(mockMessage, {
        ...baseContext,
        conversationHistory: [
          { role: 'user', content: 'msg 1' },
          { role: 'user', content: 'msg 2' },
          { role: 'user', content: 'msg 3' }
        ],
        currentDraft: 'I intend to meet my inner critic with compassion'
      });

      expect(result.conversationStage).toBe('confirm');
    });

    it('should include browse_templates action when AI response contains "example"', async () => {
      mockClaudeProxy.sendMessage.mockResolvedValue(
        makeProxyResponse("Would you like to browse some example intentions?")
      );

      const result = await service.continueIntentionConversation(mockMessage, {
        ...baseContext,
        conversationHistory: []
      });

      const types = result.suggestedActions.map((a) => a.type);
      expect(types).toContain('browse_templates');
    });

    it('should return fallback response (not throw) when sendMessage rejects', async () => {
      mockClaudeProxy.sendMessage.mockRejectedValue(new Error('Network error'));

      const result = await service.continueIntentionConversation(mockMessage, {
        ...baseContext,
        conversationHistory: []
      });

      expect(result).toBeDefined();
      expect(result.error).toBe(true);
      expect(typeof result.message).toBe('string');
      expect(result.message.length).toBeGreaterThan(0);
      expect(result.suggestedActions).toEqual([]);
    });

    it('should use sympathetic fallback message for sympathetic NS state on error', async () => {
      mockClaudeProxy.sendMessage.mockRejectedValue(new Error('Network error'));

      const result = await service.continueIntentionConversation(mockMessage, {
        ...baseContext,
        nervousSystemState: 'sympathetic',
        conversationHistory: []
      });

      // Sympathetic fallback references breathing/grounding
      expect(result.message.toLowerCase()).toMatch(/breath|ground|calm/);
    });

    it('should use dorsal fallback message for dorsal NS state on error', async () => {
      mockClaudeProxy.sendMessage.mockRejectedValue(new Error('Network error'));

      const result = await service.continueIntentionConversation(mockMessage, {
        ...baseContext,
        nervousSystemState: 'dorsal',
        conversationHistory: []
      });

      expect(result.message.toLowerCase()).toMatch(/slow|gentle|pause/);
    });
  });

  // ===========================================================================
  // analyzeDraftIntention
  // ===========================================================================

  describe('analyzeDraftIntention', () => {
    const mockDraft = 'I intend to heal my trauma';
    const mockContext = {
      userId: 'user-123',
      sessionType: 'healing',
      framework: 'ifs',
      conversationHistory: []
    };

    beforeEach(() => {
      mockClaudeProxy.sendMessage.mockResolvedValue(
        makeProxyResponse(
          "Your intention to heal is courageous. To make it more specific, consider naming which part of your trauma you want to work with."
        )
      );
    });

    it('should return feedback, suggestions, and analysis on success', async () => {
      const result = await service.analyzeDraftIntention(mockDraft, mockContext);

      expect(result).toBeDefined();
      expect(typeof result.feedback).toBe('string');
      expect(result.suggestions).toBeInstanceOf(Array);
      expect(result.analysis).toBeDefined();
    });

    it('should parse a specificity suggestion when feedback mentions "more specific"', async () => {
      mockClaudeProxy.sendMessage.mockResolvedValue(
        makeProxyResponse("Consider making it more specific. Your intention is a little too vague.")
      );

      const result = await service.analyzeDraftIntention(mockDraft, mockContext);

      const types = result.suggestions.map((s) => s.type);
      expect(types).toContain('specificity');
    });

    it('should handle a very short draft without throwing', async () => {
      const result = await service.analyzeDraftIntention('I intend to heal', mockContext);
      expect(result).toBeDefined();
      expect(result.feedback).toBeDefined();
    });

    it('should handle a very long draft without throwing', async () => {
      const longDraft = 'I intend to heal'.repeat(100);
      const result = await service.analyzeDraftIntention(longDraft, mockContext);
      expect(result).toBeDefined();
    });

    it('should return error:true with fallback feedback when sendMessage rejects', async () => {
      mockClaudeProxy.sendMessage.mockRejectedValue(new Error('API error'));

      const result = await service.analyzeDraftIntention(mockDraft, mockContext);

      expect(result.error).toBe(true);
      expect(typeof result.feedback).toBe('string');
      expect(result.feedback.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // saveIntention
  // ===========================================================================

  describe('saveIntention', () => {
    const mockUserId = 'user-123';
    const mockSessionId = 'session-456';

    const validIntention = {
      intentionText: 'I intend to meet my inner critic with compassion',
      framework: 'ifs',
      sessionType: 'healing',
      userWantsToSave: true
    };

    beforeEach(() => {
      mockDbService.saveIntention.mockResolvedValue({
        id: 'intention-789',
        user_id: mockUserId,
        intention_text: validIntention.intentionText,
        created_at: '2026-02-10T10:00:00Z'
      });
    });

    it('should save and return success:true with intentionId when userWantsToSave is true', async () => {
      const result = await service.saveIntention(validIntention, mockUserId, mockSessionId);

      expect(result.success).toBe(true);
      expect(result.intentionId).toBe('intention-789');
      expect(mockDbService.saveIntention).toHaveBeenCalledTimes(1);
    });

    it('should call dbService.saveIntention with snake_case fields', async () => {
      const intentionWithContext = {
        ...validIntention,
        aiConversationContext: { prompt_count: 3, frameworks_explored: ['ifs'] },
        inspiredByTemplateId: 'template-1'
      };

      await service.saveIntention(intentionWithContext, mockUserId, mockSessionId);

      expect(mockDbService.saveIntention).toHaveBeenCalledWith({
        user_id: mockUserId,
        session_id: mockSessionId,
        intention_text: validIntention.intentionText,
        framework: 'ifs',
        session_type: 'healing',
        ai_conversation_context: intentionWithContext.aiConversationContext,
        inspired_by_template_id: 'template-1'
      });
    });

    it('should reject with PRIVACY_OPT_IN_REQUIRED when userWantsToSave is false and save_by_default is false', async () => {
      mockDbService.getUserPreferences.mockResolvedValue({
        save_by_default: false
      });

      const result = await service.saveIntention(
        { ...validIntention, userWantsToSave: false },
        mockUserId,
        mockSessionId
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PRIVACY_OPT_IN_REQUIRED');
      // Should check preferences before rejecting, and should NOT call saveIntention
      expect(mockDbService.getUserPreferences).toHaveBeenCalledWith(mockUserId);
      expect(mockDbService.saveIntention).not.toHaveBeenCalled();
    });

    it('should save when userWantsToSave is false but save_by_default is true', async () => {
      mockDbService.getUserPreferences.mockResolvedValue({
        save_by_default: true
      });

      const result = await service.saveIntention(
        { ...validIntention, userWantsToSave: false },
        mockUserId,
        mockSessionId
      );

      expect(result.success).toBe(true);
      expect(mockDbService.saveIntention).toHaveBeenCalledTimes(1);
    });

    it('should return INVALID_INTENTION_TEXT when intentionText is empty', async () => {
      const result = await service.saveIntention(
        { ...validIntention, intentionText: '' },
        mockUserId,
        mockSessionId
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_INTENTION_TEXT');
      expect(mockDbService.saveIntention).not.toHaveBeenCalled();
    });

    it('should return INVALID_INTENTION_TEXT when intentionText is only whitespace', async () => {
      const result = await service.saveIntention(
        { ...validIntention, intentionText: '   ' },
        mockUserId,
        mockSessionId
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_INTENTION_TEXT');
    });

    it('should return INTENTION_TOO_LONG when intentionText exceeds 2000 characters', async () => {
      const result = await service.saveIntention(
        { ...validIntention, intentionText: 'x'.repeat(2001) },
        mockUserId,
        mockSessionId
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INTENTION_TOO_LONG');
    });

    it('should return DATABASE_ERROR when dbService.saveIntention rejects', async () => {
      mockDbService.saveIntention.mockRejectedValue(new Error('DB connection failed'));

      const result = await service.saveIntention(validIntention, mockUserId, mockSessionId);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('DATABASE_ERROR');
    });
  });

  // ===========================================================================
  // getTemplates
  // ===========================================================================

  describe('getTemplates', () => {
    const mockTemplates = [
      { id: 'template-1', title: 'Template 1', framework: 'ifs' },
      { id: 'template-2', title: 'Template 2', framework: 'somatic' }
    ];

    beforeEach(() => {
      mockDbService.getTemplates.mockResolvedValue(mockTemplates);
    });

    it('should delegate to dbService with framework, sessionType, and options.limit', async () => {
      const result = await service.getTemplates('ifs', 'healing', { limit: 10 });

      expect(mockDbService.getTemplates).toHaveBeenCalledWith('ifs', 'healing', 10);
      expect(result).toEqual(mockTemplates);
    });

    it('should pass undefined limit when options are empty', async () => {
      await service.getTemplates('ifs', 'healing', {});

      expect(mockDbService.getTemplates).toHaveBeenCalledWith('ifs', 'healing', undefined);
    });

    it('should pass null for framework and sessionType when called with no args', async () => {
      await service.getTemplates();

      expect(mockDbService.getTemplates).toHaveBeenCalledWith(null, null, undefined);
    });
  });

  // ===========================================================================
  // getUserPreferences
  // ===========================================================================

  describe('getUserPreferences', () => {
    const mockUserId = 'user-123';
    const mockPreferences = {
      user_id: mockUserId,
      save_by_default: false,
      favorite_frameworks: ['ifs']
    };

    it('should delegate to dbService and return its result', async () => {
      mockDbService.getUserPreferences.mockResolvedValue(mockPreferences);

      const result = await service.getUserPreferences(mockUserId);

      expect(mockDbService.getUserPreferences).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockPreferences);
    });

    it('should propagate errors from dbService', async () => {
      mockDbService.getUserPreferences.mockRejectedValue(new Error('DB error'));

      await expect(service.getUserPreferences(mockUserId)).rejects.toThrow('DB error');
    });
  });

  // ===========================================================================
  // updateUserPreferences
  // ===========================================================================

  describe('updateUserPreferences', () => {
    const mockUserId = 'user-123';
    const mockUpdates = {
      save_by_default: true,
      favorite_frameworks: ['ifs', 'somatic']
    };

    it('should delegate to dbService with userId and updates', async () => {
      const updated = { ...mockUpdates, user_id: mockUserId };
      mockDbService.updateUserPreferences.mockResolvedValue(updated);

      const result = await service.updateUserPreferences(mockUserId, mockUpdates);

      expect(mockDbService.updateUserPreferences).toHaveBeenCalledWith(mockUserId, mockUpdates);
      expect(result).toEqual(updated);
    });

    it('should propagate errors from dbService', async () => {
      mockDbService.updateUserPreferences.mockRejectedValue(new Error('Update failed'));

      await expect(service.updateUserPreferences(mockUserId, mockUpdates)).rejects.toThrow('Update failed');
    });
  });

  // ===========================================================================
  // detectConversationStage (private, tested via public method or directly)
  // ===========================================================================

  describe('detectConversationStage', () => {
    it('should return "welcome" for null history', () => {
      const stage = service.detectConversationStage(null, null);
      expect(stage).toBe('welcome');
    });

    it('should return "welcome" for empty history array', () => {
      const stage = service.detectConversationStage([], null);
      expect(stage).toBe('welcome');
    });

    it('should return "welcome" when history has only assistant messages (0 user messages)', () => {
      const stage = service.detectConversationStage(
        [{ role: 'assistant', content: 'Hello' }],
        null
      );
      expect(stage).toBe('welcome');
    });

    it('should return "direction" when exactly 1 user message in history', () => {
      const stage = service.detectConversationStage(
        [
          { role: 'assistant', content: 'Hello' },
          { role: 'user', content: 'I want to work on grief' }
        ],
        null
      );
      expect(stage).toBe('direction');
    });

    it('should return "confirm" when 2 user messages in history', () => {
      const stage = service.detectConversationStage(
        [
          { role: 'user', content: 'first' },
          { role: 'user', content: 'second' }
        ],
        null
      );
      expect(stage).toBe('confirm');
    });

    it('should return "confirm" when 3+ user messages in history', () => {
      const stage = service.detectConversationStage(
        [
          { role: 'user', content: 'first' },
          { role: 'user', content: 'second' },
          { role: 'user', content: 'third' }
        ],
        'I intend to heal with compassion'
      );
      expect(stage).toBe('confirm');
    });
  });

  // ===========================================================================
  // analyzeSuggestedActions
  // ===========================================================================

  describe('analyzeSuggestedActions', () => {
    it('should return save_intention action on "confirm" stage', () => {
      const actions = service.analyzeSuggestedActions('Your direction is clear.', 'confirm');

      expect(actions).toContainEqual(
        expect.objectContaining({ type: 'save_intention' })
      );
    });

    it('should NOT return save_intention action on "welcome" stage', () => {
      const actions = service.analyzeSuggestedActions('Welcome, what is present for you?', 'welcome');

      const types = actions.map((a) => a.type);
      expect(types).not.toContain('save_intention');
    });

    it('should NOT return save_intention action on "direction" stage', () => {
      const actions = service.analyzeSuggestedActions('So it sounds like you want to heal grief.', 'direction');

      const types = actions.map((a) => a.type);
      expect(types).not.toContain('save_intention');
    });

    it('should return browse_templates when message contains "template"', () => {
      const actions = service.analyzeSuggestedActions(
        'You might find a template helpful.',
        'welcome'
      );

      expect(actions).toContainEqual(
        expect.objectContaining({ type: 'browse_templates' })
      );
    });

    it('should return browse_templates when message contains "example"', () => {
      const actions = service.analyzeSuggestedActions(
        'Would you like to see an example intention?',
        'direction'
      );

      expect(actions).toContainEqual(
        expect.objectContaining({ type: 'browse_templates' })
      );
    });

    it('should return browse_templates when message contains "inspiration"', () => {
      const actions = service.analyzeSuggestedActions(
        'Here is some inspiration to get you started.',
        'welcome'
      );

      expect(actions).toContainEqual(
        expect.objectContaining({ type: 'browse_templates' })
      );
    });

    it('should return both save_intention and browse_templates on confirm stage with "example" in message', () => {
      const actions = service.analyzeSuggestedActions(
        'Your intention is set. Browse an example if you want.',
        'confirm'
      );

      const types = actions.map((a) => a.type);
      expect(types).toContain('save_intention');
      expect(types).toContain('browse_templates');
    });

    it('should return empty array when no triggers match on welcome stage', () => {
      const actions = service.analyzeSuggestedActions(
        'What is most present for you today?',
        'welcome'
      );

      expect(actions).toEqual([]);
    });

    it('should NOT include a "start_draft" action type (that action type does not exist)', () => {
      const actions = service.analyzeSuggestedActions(
        'Would you like to start drafting your intention?',
        'direction'
      );

      const types = actions.map((a) => a.type);
      expect(types).not.toContain('start_draft');
    });
  });

  // ===========================================================================
  // getFrameworkGuidance
  // ===========================================================================

  describe('getFrameworkGuidance', () => {
    it('should return guidance for "ifs" containing "parts" and "What part of you"', () => {
      const guidance = service.getFrameworkGuidance('ifs');

      expect(guidance).toContain('parts');
      expect(guidance).toContain('What part of you');
    });

    it('should return guidance for "somatic" containing "body" and "move toward"', () => {
      const guidance = service.getFrameworkGuidance('somatic');

      expect(guidance).toContain('body');
      expect(guidance).toContain('move toward');
    });

    it('should return guidance for "existential" containing "meaning" and "question"', () => {
      const guidance = service.getFrameworkGuidance('existential');

      expect(guidance).toContain('meaning');
      expect(guidance).toContain('question');
    });

    it('should return guidance for "healing" containing "ready to shift"', () => {
      const guidance = service.getFrameworkGuidance('healing');

      expect(guidance).toContain('ready to shift');
    });

    it('should return the healing guidance as default for unknown frameworks', () => {
      const unknown = service.getFrameworkGuidance('unknown_framework');
      const healing = service.getFrameworkGuidance('healing');

      expect(unknown).toBe(healing);
    });

    it('should return defined guidance for "exploration" framework', () => {
      const guidance = service.getFrameworkGuidance('exploration');

      expect(guidance).toBeDefined();
      expect(guidance).toContain('curiosity');
    });

    it('should return defined guidance for "spiritual" framework', () => {
      const guidance = service.getFrameworkGuidance('spiritual');

      expect(guidance).toBeDefined();
      expect(guidance).toContain('connect');
    });
  });

  // ===========================================================================
  // buildIntentionPrompt (nervous system adaptation)
  // ===========================================================================

  describe('buildIntentionPrompt - Nervous System State Adaptation', () => {
    it('should include sympathetic note for sympathetic NS state', () => {
      const prompt = service.buildIntentionPrompt({
        stage: 'welcome',
        nervousSystemState: 'sympathetic',
        stateConfidence: 0.8,
        sessionType: 'healing',
        framework: 'ifs'
      });

      expect(prompt).toContain('They may be activated. Keep it short, grounding, calm.');
    });

    it('should include dorsal note for dorsal NS state', () => {
      const prompt = service.buildIntentionPrompt({
        stage: 'welcome',
        nervousSystemState: 'dorsal',
        stateConfidence: 0.8,
        sessionType: 'healing',
        framework: 'ifs'
      });

      expect(prompt).toContain('They may be withdrawn. Gentle, slow, no pressure whatsoever.');
    });

    it('should include ventral note for ventral NS state', () => {
      const prompt = service.buildIntentionPrompt({
        stage: 'welcome',
        nervousSystemState: 'ventral',
        stateConfidence: 0.9,
        sessionType: 'healing',
        framework: 'ifs'
      });

      expect(prompt).toContain('open and regulated');
    });

    it('should include the current draft when provided', () => {
      const draft = 'I intend to meet my grief with compassion';
      const prompt = service.buildIntentionPrompt({
        stage: 'confirm',
        nervousSystemState: 'ventral',
        sessionType: 'healing',
        framework: 'healing',
        currentDraft: draft
      });

      expect(prompt).toContain(draft);
    });

    it('should include framework guidance in the prompt', () => {
      const prompt = service.buildIntentionPrompt({
        stage: 'welcome',
        nervousSystemState: 'ventral',
        sessionType: 'healing',
        framework: 'ifs'
      });

      // IFS guidance should appear
      expect(prompt).toContain('parts');
    });

    it('should include session type and framework in the SESSION CONTEXT block', () => {
      const prompt = service.buildIntentionPrompt({
        stage: 'direction',
        nervousSystemState: 'ventral',
        sessionType: 'exploration',
        framework: 'somatic'
      });

      expect(prompt).toContain('exploration');
      expect(prompt).toContain('somatic');
    });

    it('should always be a non-empty string', () => {
      const prompt = service.buildIntentionPrompt({
        stage: 'welcome',
        nervousSystemState: 'ventral',
        sessionType: 'general',
        framework: 'healing'
      });

      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });
  });
});
