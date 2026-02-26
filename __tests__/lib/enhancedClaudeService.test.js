/**
 * Unit Tests for enhancedClaudeService.js (Integration Guide / Huxley)
 *
 * Tests conversation flow, nervous system assessment, entity extraction,
 * prompt building, safety responses, and practice recommendations.
 */

const { mockClaudeResponse, MOCK_USER_ID } = require('../helpers/aiTestFixtures');

// Mock dependencies
jest.mock('../../lib/config', () => ({
  __esModule: true,
  default: { anthropicApiKey: 'test-api-key' }
}));

jest.mock('../../lib/huxleyKnowledgeBase', () => {
  const actual = jest.requireActual('../../lib/huxleyKnowledgeBase');
  return { __esModule: true, ...actual };
});

jest.mock('../../lib/ragService', () => ({
  __esModule: true,
  default: {
    getContextForPrompt: jest.fn().mockResolvedValue(''),
    search: jest.fn().mockResolvedValue([]),
    clearCache: jest.fn()
  }
}));

jest.mock('../../lib/metricsService', () => ({
  __esModule: true,
  default: {
    logAIMetric: jest.fn(),
    logError: jest.fn(),
    logRoutingDecision: jest.fn(),
    constructor: {
      extractTokens: jest.fn((response) => response?.usage || null),
      calculateCost: jest.fn(() => 0.001)
    }
  }
}));

// Mock fetch
global.fetch = jest.fn();

describe('IntegrationGuideService (Huxley)', () => {
  let IntegrationGuideServiceClass;
  let service;
  let metricsService;

  beforeAll(() => {
    // The module exports the CLASS itself (not an instance)
    IntegrationGuideServiceClass = require('../../lib/enhancedClaudeService').default;
    metricsService = require('../../lib/metricsService').default;
  });

  beforeEach(() => {
    // Create fresh instance for each test
    service = new IntegrationGuideServiceClass();
    jest.clearAllMocks();
  });

  const defaultContext = {
    nervousSystemState: 'ventral',
    stateConfidence: 0.8,
    sessionPhase: 'exploration',
    practicesCompleted: [],
    userId: MOCK_USER_ID
  };

  // =========================================================================
  // CONTINUE CONVERSATION
  // =========================================================================

  describe('continueConversation', () => {
    it('should call Claude API and return response', async () => {
      global.fetch.mockResolvedValue(mockClaudeResponse(
        "I hear you. What part of you is feeling that right now?"
      ));

      const result = await service.continueConversation(
        "I feel conflicted about my experience",
        defaultContext
      );

      expect(result.message).toBeDefined();
      expect(result.message).toContain("I hear you");
    });

    it('should extract entities from response', async () => {
      global.fetch.mockResolvedValue(mockClaudeResponse(
        "The child part carries a deep sadness in your chest. What does this fear want you to know?"
      ));

      const result = await service.continueConversation(
        "There's something heavy in my chest",
        defaultContext
      );

      expect(result.extractedEntities).toBeInstanceOf(Array);
      expect(result.extractedEntities.length).toBeGreaterThan(0);
    });

    it('should return safety response on API error', async () => {
      global.fetch.mockRejectedValue(new Error('API down'));

      const result = await service.continueConversation(
        "Hello",
        defaultContext
      );

      expect(result.message).toBeDefined();
      expect(result.message).toContain("safe");
      expect(result.suggestedPractice).toBeDefined();
    });

    it('should log error when API fails', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      await service.continueConversation("Hello", defaultContext);

      expect(metricsService.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceName: 'enhancedClaude',
          operation: 'continueConversation'
        })
      );
    });

    it('should return regulation response when needs regulation', async () => {
      const result = await service.continueConversation(
        "I'm anxious and overwhelmed, my heart is racing and I can't breathe, everything is too much and spinning",
        { ...defaultContext, nervousSystemState: 'sympathetic' }
      );

      // Should detect high sympathetic activation
      expect(result.message).toBeDefined();
      expect(result.suggestedPractice).toBeDefined();
    });

    it('should detect session phase from response', async () => {
      global.fetch.mockResolvedValue(mockClaudeResponse(
        "Let's explore what meaning this has for your integration going forward"
      ));

      const result = await service.continueConversation(
        "What does this all mean?",
        defaultContext
      );

      expect(result.sessionPhaseUpdate).toBeDefined();
    });

    it('should analyze practice needs from response', async () => {
      global.fetch.mockResolvedValue(mockClaudeResponse(
        "Let's try some breathing together. Take a slow breath in..."
      ));

      const result = await service.continueConversation(
        "I feel tense",
        defaultContext
      );

      expect(result.suggestedPractice).toBeDefined();
      expect(result.suggestedPractice.type).toBe('breathing_exercise');
    });
  });

  // =========================================================================
  // BUILD ENHANCED PROMPT
  // =========================================================================

  describe('buildEnhancedPrompt', () => {
    it('should include Huxley identity', async () => {
      const prompt = await service.buildEnhancedPrompt("Hello", defaultContext);
      expect(prompt).toContain('Huxley');
    });

    it('should include Johnson framework', async () => {
      const prompt = await service.buildEnhancedPrompt("Hello", defaultContext);
      expect(prompt).toContain('Johnson');
      expect(prompt).toContain('Associations');
    });

    it('should include IFS framework', async () => {
      const prompt = await service.buildEnhancedPrompt("Hello", defaultContext);
      expect(prompt).toContain('Internal Family Systems');
    });

    it('should include polyvagal framework', async () => {
      const prompt = await service.buildEnhancedPrompt("Hello", defaultContext);
      expect(prompt).toContain('Polyvagal');
    });

    it('should inject nervous system state into prompt', async () => {
      const prompt = await service.buildEnhancedPrompt("Hello", {
        ...defaultContext,
        nervousSystemState: 'sympathetic',
        stateConfidence: 0.9
      });

      expect(prompt).toContain('fight/flight');
      expect(prompt).toContain('90%');
    });

    it('should inject dorsal-specific instructions', async () => {
      const prompt = await service.buildEnhancedPrompt("Hello", {
        ...defaultContext,
        nervousSystemState: 'dorsal',
        stateConfidence: 0.7
      });

      expect(prompt).toContain('shutdown');
      expect(prompt).toContain('gentle');
    });

    it('should inject ventral-specific instructions', async () => {
      const prompt = await service.buildEnhancedPrompt("Hello", {
        ...defaultContext,
        nervousSystemState: 'ventral',
        stateConfidence: 0.85
      });

      expect(prompt).toContain('safe');
      expect(prompt).toContain('deeper exploration');
    });

    it('should include session phase', async () => {
      const prompt = await service.buildEnhancedPrompt("Hello", {
        ...defaultContext,
        sessionPhase: 'integration'
      });

      expect(prompt).toContain('integration');
    });

    it('should inject scenario protocols when detected', async () => {
      const prompt = await service.buildEnhancedPrompt(
        "My inner critic is so loud, I hate myself",
        defaultContext
      );

      expect(prompt).toContain('DETECTED CONTEXT');
      expect(prompt).toContain('INNER CRITIC');
    });

    it('should not inject protocols for non-triggering messages', async () => {
      const prompt = await service.buildEnhancedPrompt(
        "I had a lovely day today",
        defaultContext
      );

      expect(prompt).not.toContain('DETECTED CONTEXT');
    });

    it('should include clinical voice principles', async () => {
      const prompt = await service.buildEnhancedPrompt("Hello", defaultContext);
      expect(prompt).toContain('Warm but not saccharine');
      expect(prompt).toContain('Curious, not knowing');
    });

    it('should include user message in prompt', async () => {
      const prompt = await service.buildEnhancedPrompt("I saw a great owl in my vision", defaultContext);
      expect(prompt).toContain("I saw a great owl in my vision");
    });
  });

  // =========================================================================
  // ASSESS NERVOUS SYSTEM FROM MESSAGE
  // =========================================================================

  describe('assessNervousSystemFromMessage', () => {
    it('should detect sympathetic state from activation words', () => {
      const assessment = service.assessNervousSystemFromMessage(
        "I feel anxious and overwhelmed, my heart is racing"
      );

      expect(assessment.detectedState).toBe('sympathetic');
      expect(assessment.intensity).toBeGreaterThan(5);
    });

    it('should detect dorsal state from shutdown words', () => {
      const assessment = service.assessNervousSystemFromMessage(
        "I feel numb and disconnected, everything is empty"
      );

      expect(assessment.detectedState).toBe('dorsal');
    });

    it('should detect ventral state from safety words', () => {
      const assessment = service.assessNervousSystemFromMessage(
        "I feel calm and peaceful, really connected and safe"
      );

      expect(assessment.detectedState).toBe('ventral');
    });

    it('should return unknown for neutral messages', () => {
      const assessment = service.assessNervousSystemFromMessage(
        "What time is it?"
      );

      expect(assessment.detectedState).toBe('unknown');
    });

    it('should set needsRegulation=true for high sympathetic intensity', () => {
      const assessment = service.assessNervousSystemFromMessage(
        "I'm anxious and overwhelmed, racing heart, can't breathe, too much, spinning"
      );

      expect(assessment.needsRegulation).toBe(true);
      expect(assessment.intensity).toBeGreaterThan(7);
    });

    it('should set needsRegulation=true for high dorsal intensity', () => {
      const assessment = service.assessNervousSystemFromMessage(
        "I'm numb, disconnected, empty, nothing matters, heavy, can't feel anything"
      );

      expect(assessment.needsRegulation).toBe(true);
      expect(assessment.intensity).toBeGreaterThan(6);
    });

    it('should set needsRegulation=false for ventral state', () => {
      const assessment = service.assessNervousSystemFromMessage(
        "I feel calm and peaceful"
      );

      expect(assessment.needsRegulation).toBe(false);
    });

    it('should return confidence based on match count', () => {
      const strongMatch = service.assessNervousSystemFromMessage(
        "anxious overwhelmed racing panic stressed urgent"
      );
      const weakMatch = service.assessNervousSystemFromMessage(
        "a bit anxious"
      );

      expect(strongMatch.confidence).toBeGreaterThan(weakMatch.confidence);
    });
  });

  // =========================================================================
  // EXTRACT ENTITIES
  // =========================================================================

  describe('extractEntities', () => {
    it('should extract archetypal entities', () => {
      const entities = service.extractEntities(
        "The mother figure appeared holding a child near the tree"
      );

      expect(entities.some(e => e.name === 'mother' && e.category === 'archetypal')).toBe(true);
      expect(entities.some(e => e.name === 'child' && e.category === 'archetypal')).toBe(true);
      expect(entities.some(e => e.name === 'tree' && e.category === 'archetypal')).toBe(true);
    });

    it('should extract emotional entities', () => {
      const entities = service.extractEntities(
        "There was deep sadness, but also joy and a sense of peace"
      );

      expect(entities.some(e => e.name === 'sadness' && e.category === 'emotional')).toBe(true);
      expect(entities.some(e => e.name === 'joy' && e.category === 'emotional')).toBe(true);
      expect(entities.some(e => e.name === 'peace' && e.category === 'emotional')).toBe(true);
    });

    it('should extract somatic entities', () => {
      const entities = service.extractEntities(
        "There was tension in the chest and warmth flowing through the heart"
      );

      expect(entities.some(e => e.name === 'tension' && e.category === 'somatic')).toBe(true);
      expect(entities.some(e => e.name === 'warmth' && e.category === 'somatic')).toBe(true);
      expect(entities.some(e => e.name === 'chest' && e.category === 'somatic')).toBe(true);
    });

    it('should deduplicate entities', () => {
      const entities = service.extractEntities(
        "Fear appeared. Fear was strong. More fear came."
      );

      const fearEntities = entities.filter(e => e.name === 'fear');
      expect(fearEntities.length).toBe(1);
    });

    it('should return max 5 entities', () => {
      const entities = service.extractEntities(
        "The mother and father with a child and warrior near the tree by the ocean " +
        "feeling joy and sadness with tension and warmth"
      );

      expect(entities.length).toBeLessThanOrEqual(5);
    });

    it('should return empty array for non-entity text', () => {
      const entities = service.extractEntities(
        "Can you please schedule a meeting for tomorrow?"
      );

      expect(entities).toBeInstanceOf(Array);
    });

    it('should include context for each entity', () => {
      const entities = service.extractEntities(
        "The wise warrior stood in the forest."
      );

      entities.forEach(entity => {
        expect(entity.context).toBeDefined();
      });
    });

    it('should include confidence scores', () => {
      const entities = service.extractEntities(
        "Deep sadness in the chest with a child present"
      );

      entities.forEach(entity => {
        expect(entity.confidence).toBeGreaterThan(0);
        expect(entity.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  // =========================================================================
  // GENERATE REGULATION RESPONSE
  // =========================================================================

  describe('generateRegulationResponse', () => {
    it('should return breathing exercise for high sympathetic', () => {
      const result = service.generateRegulationResponse({
        detectedState: 'sympathetic',
        intensity: 9,
        confidence: 0.8,
        needsRegulation: true
      });

      expect(result).toBeDefined();
      expect(result.message).toContain('activation');
      expect(result.suggestedPractice.type).toBe('breathing_exercise');
      expect(result.suggestedPractice.urgency).toBe('high');
    });

    it('should return gentle activation for high dorsal', () => {
      const result = service.generateRegulationResponse({
        detectedState: 'dorsal',
        intensity: 8,
        confidence: 0.7,
        needsRegulation: true
      });

      expect(result).toBeDefined();
      expect(result.message).toContain('connect');
      expect(result.suggestedPractice.type).toBe('gentle_activation');
    });

    it('should return null for low intensity states', () => {
      const result = service.generateRegulationResponse({
        detectedState: 'sympathetic',
        intensity: 5,
        confidence: 0.5,
        needsRegulation: false
      });

      expect(result).toBeNull();
    });

    it('should include nervous system state update', () => {
      const result = service.generateRegulationResponse({
        detectedState: 'sympathetic',
        intensity: 9,
        confidence: 0.85,
        needsRegulation: true
      });

      expect(result.nervousSystemUpdate).toBeDefined();
      expect(result.nervousSystemUpdate.state).toBe('sympathetic');
      expect(result.nervousSystemUpdate.confidence).toBe(0.85);
    });
  });

  // =========================================================================
  // GENERATE SAFETY RESPONSE
  // =========================================================================

  describe('generateSafetyResponse', () => {
    it('should return safe fallback message', () => {
      const result = service.generateSafetyResponse(defaultContext);

      expect(result.message).toContain("safe");
      expect(result.message).toContain("here");
    });

    it('should include grounding practice', () => {
      const result = service.generateSafetyResponse(defaultContext);

      expect(result.suggestedPractice).toBeDefined();
      expect(result.suggestedPractice.type).toBe('grounding');
      expect(result.suggestedPractice.urgency).toBe('high');
    });

    it('should return null nervousSystemUpdate', () => {
      const result = service.generateSafetyResponse(defaultContext);
      expect(result.nervousSystemUpdate).toBeNull();
    });
  });

  // =========================================================================
  // DETERMINE SESSION PHASE
  // =========================================================================

  describe('determineSessionPhase', () => {
    it('should detect check_in phase', () => {
      const phase = service.determineSessionPhase(
        "Welcome! Let's start by setting your intention for this session",
        defaultContext
      );

      expect(phase).toBe('check_in');
    });

    it('should detect integration phase', () => {
      const phase = service.determineSessionPhase(
        "Let's think about what this means for your integration and understanding",
        defaultContext
      );

      expect(phase).toBe('integration');
    });

    it('should detect closure phase', () => {
      const phase = service.determineSessionPhase(
        "What action would honor this insight? Let's think about practice going forward",
        defaultContext
      );

      expect(phase).toBe('closure');
    });

    it('should default to exploration', () => {
      const phase = service.determineSessionPhase(
        "Tell me more about that image you saw",
        defaultContext
      );

      expect(phase).toBe('exploration');
    });
  });

  // =========================================================================
  // GET SUGGESTED PRACTICE FOR STATE
  // =========================================================================

  describe('getSuggestedPracticeForState', () => {
    it('should return breathing exercise for high sympathetic', () => {
      const practice = service.getSuggestedPracticeForState('sympathetic', 8);

      expect(practice).toBeDefined();
      expect(practice.type).toBe('breathing_exercise');
      expect(practice.urgency).toBe('high');
    });

    it('should return gentle activation for high dorsal', () => {
      const practice = service.getSuggestedPracticeForState('dorsal', 7);

      expect(practice).toBeDefined();
      expect(practice.type).toBe('gentle_activation');
    });

    it('should return null for low sympathetic intensity', () => {
      const practice = service.getSuggestedPracticeForState('sympathetic', 4);
      expect(practice).toBeNull();
    });

    it('should return null for ventral state', () => {
      const practice = service.getSuggestedPracticeForState('ventral', 5);
      expect(practice).toBeNull();
    });
  });

  // =========================================================================
  // PRACTICE LIBRARY
  // =========================================================================

  describe('PracticeLibrary', () => {
    it('should have breathing for sympathetic practice', () => {
      const practice = service.practiceLibrary.getBreathingForSympathetic();

      expect(practice.title).toBeDefined();
      expect(practice.steps).toBeInstanceOf(Array);
      expect(practice.steps.length).toBeGreaterThan(0);
      expect(practice.duration).toBeDefined();
    });

    it('should have gentle activation practice', () => {
      const practice = service.practiceLibrary.getGentleActivation();

      expect(practice.title).toBeDefined();
      expect(practice.steps).toBeInstanceOf(Array);
      expect(practice.steps.length).toBeGreaterThan(0);
    });

    it('should have breathing exercises', () => {
      const exercises = service.practiceLibrary.getBreathingExercises();
      expect(exercises).toBeInstanceOf(Array);
      expect(exercises.length).toBeGreaterThan(0);
    });

    it('should have parts work exercises', () => {
      const exercises = service.practiceLibrary.getPartsWorkExercises();
      expect(exercises).toBeInstanceOf(Array);
      expect(exercises.length).toBeGreaterThan(0);
    });

    it('should have somatic exercises', () => {
      const exercises = service.practiceLibrary.getSomaticExercises();
      expect(exercises).toBeInstanceOf(Array);
    });

    it('should have grounding exercises', () => {
      const exercises = service.practiceLibrary.getGroundingExercises();
      expect(exercises).toBeInstanceOf(Array);
    });

    it('should have required fields in all practices', () => {
      const allPractices = [
        ...service.practiceLibrary.getBreathingExercises(),
        ...service.practiceLibrary.getPartsWorkExercises(),
        ...service.practiceLibrary.getSomaticExercises(),
        ...service.practiceLibrary.getGroundingExercises()
      ];

      allPractices.forEach(practice => {
        expect(practice.title).toBeDefined();
        expect(practice.steps).toBeInstanceOf(Array);
        expect(practice.duration).toBeDefined();
      });
    });
  });

  // =========================================================================
  // ANALYZE PRACTICE NEEDS
  // =========================================================================

  describe('analyzePracticeNeeds', () => {
    it('should detect breathing practice from response', () => {
      const result = service.analyzePracticeNeeds(
        "Let's try some gentle breathing together",
        defaultContext
      );

      expect(result).toBeDefined();
      expect(result.type).toBe('breathing_exercise');
    });

    it('should detect parts work from response', () => {
      const result = service.analyzePracticeNeeds(
        "It sounds like a part of you is carrying that burden",
        defaultContext
      );

      expect(result).toBeDefined();
      expect(result.type).toBe('parts_work');
    });

    it('should detect body scan from response', () => {
      const result = service.analyzePracticeNeeds(
        "Let's check in with your body and notice the sensation",
        defaultContext
      );

      expect(result).toBeDefined();
      expect(result.type).toBe('body_scan');
    });

    it('should return null when no practice indicated', () => {
      const result = service.analyzePracticeNeeds(
        "Tell me more about what happened next",
        defaultContext
      );

      expect(result).toBeNull();
    });
  });
});
