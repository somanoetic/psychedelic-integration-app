import { callClaude } from './claudeAPI';
import huxleyKnowledgeBase from './huxleyKnowledgeBase';
import metricsService from './metricsService';
import ragService from './ragService';
import { MODELS } from './aiModels';

/**
 * Integration Guide Service (Huxley)
 *
 * Context-aware psychedelic integration guide with personality-driven AI.
 * This is Huxley - the main therapeutic guide for the app.
 *
 * **Huxley's Role:**
 * - Psychedelic experience integration (primary focus)
 * - General therapeutic support
 * - Cross-domain insight synthesis
 * - Embodied integration practices
 *
 * **Therapeutic Frameworks:**
 * 1. Robert Johnson's 4-Step Integration Framework
 *    - Associations: What does this remind you of?
 *    - Dynamics: What's the emotional/psychological pattern?
 *    - Integration: How does this apply to your life?
 *    - Ritual: What action honors this insight?
 *
 * 2. Internal Family Systems (IFS)
 *    - Recognizes Manager, Firefighter, Exile dynamics
 *    - Uses parts-aware language throughout
 *    - Explores parts that emerged in journey
 *
 * 3. Polyvagal Theory
 *    - Assesses nervous system state first
 *    - State-specific responses (ventral/sympathetic/dorsal)
 *    - Offers regulation before deep work
 *
 * **Voice Principles (from huxleyKnowledgeBase):**
 * 1. Warm but not saccharine
 * 2. Curious, not knowing
 * 3. Brief and clear (1-4 sentences)
 * 4. Follow, don't lead
 * 5. Both/And thinking
 * 6. Embodied (always connect to body)
 * 7. Parts-aware
 *
 * **Knowledge Base Integration:**
 * Uses huxleyKnowledgeBase.js for:
 * - Clinical voice patterns
 * - 22 scenario-specific protocols
 * - Cross-domain bridging language
 * - Homework suggestions
 *
 * @class
 */
class IntegrationGuideService {
  constructor() {
    this.sessionContext = {};
    this.practiceLibrary = new PracticeLibrary();
    this.entities = [];
    this.conversationHistory = [];
    this.knowledgeBase = huxleyKnowledgeBase;
  }

  initializeSession(context) {
    this.sessionContext = context;
    this.entities = context.entities || [];
    this.conversationHistory = context.messages || [];
  }

  /**
   * Continue conversation with context-aware guidance
   *
   * **Main conversation method for Huxley.**
   *
   * **Process:**
   * 1. Assess nervous system state from message
   * 2. If dysregulated (sympathetic >7 or dorsal >6), offer regulation first
   * 3. Build enhanced prompt with context + scenario protocols
   * 4. Call Claude API
   * 5. Extract entities (archetypal symbols, emotions, somatic sensations)
   * 6. Analyze practice needs and NS shifts
   * 7. Return response with suggestions
   *
   * **Context-Awareness:**
   * Injects from sessionContext:
   * - Current nervous system state
   * - Session phase (check-in, exploration, integration, closure)
   * - Practices completed
   * - Recent entities encountered
   * - Conversation history
   *
   * **State-Responsive:**
   * - Ventral (safe): Deeper exploration, complex concepts
   * - Sympathetic (activated): Shorter responses, grounding focus
   * - Dorsal (shutdown): Very gentle, no pressure, validation
   *
   * @param {string} message - User's message
   * @param {object} context - Session context
   * @param {string} [context.nervousSystemState] - 'ventral'|'sympathetic'|'dorsal'
   * @param {number} [context.stateConfidence] - Confidence in state detection (0-1)
   * @param {string} [context.sessionPhase] - 'check_in'|'exploration'|'integration'|'closure'
   * @param {Array} [context.practicesCompleted] - Completed practices this session
   * @returns {Promise<object>} Response with guidance and suggestions
   * @returns {string} return.message - Claude's response
   * @returns {Array} return.extractedEntities - Archetypal entities found (e.g., "owl", "mother", "fear")
   * @returns {object|null} return.suggestedPractice - Practice recommendation if needed
   * @returns {object|null} return.nervousSystemUpdate - NS state update if detected
   * @returns {string} return.sessionPhaseUpdate - Updated session phase
   *
   * @example
   * const response = await continueConversation(
   *   "I saw this terrifying dark figure",
   *   {
   *     nervousSystemState: 'sympathetic',
   *     stateConfidence: 0.8,
   *     sessionPhase: 'exploration'
   *   }
   * );
   * // Returns guidance with NS-appropriate response
   */
  async continueConversation(message, context) {
    const startTime = Date.now();
    const userId = context?.userId || null;

    try {
      // Update session context and conversation history
      this.sessionContext = { ...this.sessionContext, ...context };
      this.conversationHistory = context.messages || this.conversationHistory;

      // Assess nervous system state from message
      const nervousSystemAssessment = this.assessNervousSystemFromMessage(message);

      // Determine if immediate regulation is needed
      if (nervousSystemAssessment.needsRegulation) {
        return this.generateRegulationResponse(nervousSystemAssessment);
      }

      // Build comprehensive prompt (async for RAG)
      const prompt = await this.buildEnhancedPrompt(message, context);

      // Get Claude response (with instrumentation)
      const claudeResponse = await this.callClaudeAPI(prompt, userId);

      // Extract entities and analyze response
      const extractedEntities = this.extractEntities(claudeResponse);
      const practiceRecommendation = this.analyzePracticeNeeds(claudeResponse, context);
      const nervousSystemUpdate = this.analyzeNervousSystemShift(claudeResponse, context);

      return {
        message: claudeResponse,
        extractedEntities: extractedEntities,
        suggestedPractice: practiceRecommendation,
        nervousSystemUpdate: nervousSystemUpdate,
        sessionPhaseUpdate: this.determineSessionPhase(claudeResponse, context)
      };

    } catch (error) {
      console.error('Error in conversation:', error);

      // Log error metrics
      metricsService.logError({
        serviceName: 'enhancedClaude',
        operation: 'continueConversation',
        errorType: error.name || 'Error',
        errorMessage: error.message,
        stackTrace: error.stack,
        context: { nervousSystemState: context?.nervousSystemState },
        userId
      });

      return this.generateSafetyResponse(context);
    }
  }

  /**
   * Build enhanced prompt with context injection
   *
   * **How Huxley's prompts work:**
   *
   * **Structure:**
   * 1. Role & frameworks (Johnson, IFS, polyvagal, somatic)
   * 2. Current session context (NS state, phase, entities)
   * 3. Conversation style guidelines
   * 4. State-specific instructions (if sympathetic or dorsal)
   * 5. Practice integration guidelines
   * 6. Recent conversation history (last 3 messages)
   * 7. Clinical voice principles
   * 8. Scenario-specific protocols (if detected)
   *
   * **Context Injection:**
   * - Nervous system state → Adjusts response style
   * - Session phase → Guides conversation direction
   * - Recent entities → Maintains continuity
   * - Conversation history → Provides context
   *
   * **Scenario Detection:**
   * Uses huxleyKnowledgeBase to detect scenarios in user message
   * (e.g., "inner critic", "shame", "mystical experience")
   * Injects relevant clinical protocols
   *
   * @param {string} message - User's message
   * @param {object} context - Session context
   * @param {string} context.nervousSystemState - Current NS state
   * @param {number} context.stateConfidence - Confidence in state (0-1)
   * @param {string} context.sessionPhase - Current session phase
   * @param {Array} [context.practicesCompleted] - Completed practices
   * @returns {string} Enhanced system prompt for Claude API
   * @private
   *
   * @example
   * const prompt = this.buildEnhancedPrompt(
   *   "I can't stop feeling ashamed",
   *   { nervousSystemState: 'dorsal', stateConfidence: 0.7 }
   * );
   * // Returns prompt with:
   * // - Base integration guide role
   * // - Dorsal-specific instructions (gentle, warm, no pressure)
   * // - Shame protocol from huxleyKnowledgeBase
   * // - Clinical voice principles
   */
  async buildEnhancedPrompt(message, context) {
    const { nervousSystemState, stateConfidence, sessionPhase, practicesCompleted } = context;

    // Detect relevant scenarios from the user's message
    const detectedScenarios = this.knowledgeBase.detectScenarios(message);

    let basePrompt = `You are Huxley, an expert integration guide specializing in psychedelic-assisted therapy. You help users process their experiences using:

1. Johnson's 4-step framework (Associations, Dynamics, Integration, Ritual)
2. Internal Family Systems (IFS) - recognizing Manager, Firefighter, and Exiled parts
3. Polyvagal theory - tracking nervous system states and regulation
4. Somatic awareness and embodied integration

CURRENT SESSION CONTEXT:
- Nervous System State: ${nervousSystemState} (confidence: ${stateConfidence}/1.0)
- Session Phase: ${sessionPhase}
- Practices Completed: ${practicesCompleted?.length || 0}
- Recent Entities: ${this.entities.slice(-5).map(e => e.name).join(', ')}

CONVERSATION STYLE:
- Always attune to their nervous system state first
- Use IFS language to help them understand internal experiences
- Offer regulation practices when someone seems activated or shutdown
- Celebrate courage and progress consistently
- Hold space for all experiences including darkness, difficulty, or "nothing"
- Be warm, professional, and therapeutically attuned

NERVOUS SYSTEM RESPONSIVENESS:
${nervousSystemState === 'sympathetic' ? `
- They're in fight/flight (${Math.round((stateConfidence || 0) * 100)}% confidence)
- Speak slowly, validate their experience, offer grounding
- Suggest breathing or movement practices if overwhelm is high
- Use shorter sentences, be extra reassuring` : ''}

${nervousSystemState === 'dorsal' ? `
- They're in shutdown/freeze (${Math.round((stateConfidence || 0) * 100)}% confidence)  
- Use gentle, warm language, no pressure
- Offer very gentle activation practices
- Honor their protective state, validate the wisdom of withdrawal` : ''}

${nervousSystemState === 'ventral' ? `
- They're in safe/social state (${Math.round((stateConfidence || 0) * 100)}% confidence)
- Great time for deeper exploration and meaning-making
- Can handle more complex concepts and connections
- Perfect for parts work and integration planning` : ''}

PRACTICE INTEGRATION GUIDELINES:
- Only suggest practices when genuinely needed (activation >7/10 or shutdown >6/10)
- Match practice intensity to their current capacity
- Always explain WHY a practice might help
- Give them full choice and control

USER'S MESSAGE: "${message}"

PREVIOUS CONTEXT: ${this.conversationHistory.slice(-3).map(msg =>
  `${msg.role}: ${msg.content}`
).join('\n')}

CLINICAL VOICE PRINCIPLES:
- Warm but not saccharine - genuine care without performative positivity
- Curious, not knowing - ask before assuming
- Follow, don't lead - user's experience guides the conversation
- Brief and clear - no jargon unless they use it first
- Connect to body when possible - "Where do you feel that?"

FORMATTING: Respond in plain text only. NEVER use markdown formatting (no **, no *, no #, no bullet lists). Write naturally as spoken conversation.

Respond with deep therapeutic attunement, nervous system awareness, and trauma-informed care. If you sense they need regulation support, mention this but don't force it. Help them feel seen, safe, and guided.`;

    // Add scenario-specific protocols if detected
    if (detectedScenarios.length > 0) {
      basePrompt += '\n\n## DETECTED CONTEXT - USE THESE PROTOCOLS:\n';
      const topScenarios = detectedScenarios.slice(0, 2);
      for (const scenario of topScenarios) {
        const protocol = this.knowledgeBase.getProtocol(scenario.key);
        if (protocol) {
          basePrompt += '\n' + protocol;
        }
      }
    }

    // Add RAG knowledge base context (semantic search)
    try {
      const ragContext = await ragService.getContextForPrompt(message, {
        maxResults: 3,
        maxTokens: 1500,
        threshold: 0.4,
      });
      if (ragContext) {
        basePrompt += ragContext;
      }
    } catch (error) {
      // Graceful degradation - continue without RAG
      console.warn('[Huxley] RAG context unavailable:', error.message);
    }

    return basePrompt;
  }

  async callClaudeAPI(prompt, userId = null) {
    const startTime = Date.now();

    try {
      const data = await callClaude({
        model: MODELS.PRIMARY,
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const durationMs = Date.now() - startTime;

      // Extract tokens and calculate cost
      const tokens = metricsService.constructor.extractTokens(data);
      const cost = tokens ? metricsService.constructor.calculateCost(tokens) : null;

      // Log success metrics (fire-and-forget, async)
      metricsService.logAIMetric({
        serviceName: 'enhancedClaude',
        operation: 'chat',
        durationMs,
        tokens,
        cost,
        status: 'success',
        metadata: { model: MODELS.PRIMARY, max_tokens: 1000 },
        userId
      });

      return data.content[0].text;

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

      metricsService.logError({
        serviceName: 'enhancedClaude',
        operation: 'chat',
        errorType: error.name || 'APIError',
        errorMessage: error.message,
        stackTrace: error.stack,
        userId
      });

      console.error('Claude API error:', error);
      throw error;
    }
  }

  /**
   * Assess nervous system state from message content
   *
   * **Detects NS state using keyword analysis.**
   *
   * **Not as sophisticated as proper assessment, but useful for quick triage.**
   *
   * **Detection Method:**
   * - Counts sympathetic words (anxious, overwhelmed, racing, panic, etc.)
   * - Counts dorsal words (numb, disconnected, empty, tired, etc.)
   * - Counts ventral words (calm, peaceful, connected, safe, etc.)
   * - Highest count determines state
   * - Intensity calculated from match count
   *
   * **Thresholds:**
   * - Sympathetic intensity >7 → needsRegulation = true
   * - Dorsal intensity >6 → needsRegulation = true
   * - If regulation needed, offer practices before exploration
   *
   * @param {string} message - User's message
   * @returns {object} NS assessment
   * @returns {string} return.detectedState - 'sympathetic'|'dorsal'|'ventral'|'unknown'
   * @returns {number} return.intensity - Intensity score (1-10)
   * @returns {boolean} return.needsRegulation - Should offer regulation practices?
   * @returns {number} return.confidence - Confidence in detection (0-1)
   * @private
   *
   * @example
   * const assessment = this.assessNervousSystemFromMessage("I'm freaking out, can't breathe");
   * // Returns:
   * {
   *   detectedState: 'sympathetic',
   *   intensity: 9,
   *   needsRegulation: true,
   *   confidence: 0.8
   * }
   */
  assessNervousSystemFromMessage(message) {
    // Analyze message content for nervous system indicators
    const lowerMessage = message.toLowerCase();
    
    // Sympathetic activation indicators
    const sympatheticWords = [
      'anxious', 'overwhelmed', 'racing', 'panic', 'stressed', 'urgent',
      'heart racing', 'can\'t breathe', 'too much', 'spinning', 'frantic'
    ];
    
    // Dorsal shutdown indicators  
    const dorsalWords = [
      'numb', 'disconnected', 'empty', 'nothing', 'blank', 'tired',
      'heavy', 'can\'t feel', 'withdrawn', 'shut down', 'hopeless'
    ];
    
    // Ventral safety indicators
    const ventralWords = [
      'calm', 'peaceful', 'connected', 'safe', 'grounded', 'curious',
      'excited', 'grateful', 'warm', 'open', 'ready'
    ];

    const sympatheticScore = sympatheticWords.filter(word => lowerMessage.includes(word)).length;
    const dorsalScore = dorsalWords.filter(word => lowerMessage.includes(word)).length;
    const ventralScore = ventralWords.filter(word => lowerMessage.includes(word)).length;

    let detectedState = 'unknown';
    let intensity = 5;
    let needsRegulation = false;

    if (sympatheticScore > dorsalScore && sympatheticScore > ventralScore) {
      detectedState = 'sympathetic';
      intensity = Math.min(10, 5 + sympatheticScore * 2);
      needsRegulation = intensity > 7;
    } else if (dorsalScore > ventralScore) {
      detectedState = 'dorsal';
      intensity = Math.min(10, 4 + dorsalScore * 2);
      needsRegulation = intensity > 6;
    } else if (ventralScore > 0) {
      detectedState = 'ventral';
      intensity = Math.max(3, 8 - ventralScore);
    }

    return {
      detectedState,
      intensity,
      needsRegulation,
      confidence: Math.min(1, Math.max(sympatheticScore, dorsalScore, ventralScore) / 3)
    };
  }

  generateRegulationResponse(assessment) {
    const { detectedState, intensity } = assessment;
    
    if (detectedState === 'sympathetic' && intensity > 7) {
      return {
        message: `I can sense there's a lot of energy and activation in your system right now. That's completely understandable - your nervous system is doing exactly what it's designed to do to protect you.

Before we continue exploring, would it be helpful to take a moment to help your system settle? I have some gentle practices that can help when things feel intense.`,
        suggestedPractice: {
          type: 'breathing_exercise',
          title: 'Calming Breath for Activation',
          description: 'A gentle breathing pattern to help settle your nervous system',
          urgency: 'high',
          practice: this.practiceLibrary.getBreathingForSympathetic()
        },
        nervousSystemUpdate: {
          state: detectedState,
          confidence: assessment.confidence
        }
      };
    }

    if (detectedState === 'dorsal' && intensity > 6) {
      return {
        message: `I notice it might feel hard to connect or feel much right now. That's okay - sometimes our system needs to protect us by pulling back. There's wisdom in that.

If it feels right, I have some very gentle practices that can help you reconnect with your body when you're ready. No pressure at all.`,
        suggestedPractice: {
          type: 'gentle_activation',
          title: 'Gentle Reconnection Practice',
          description: 'Soft ways to reconnect with your body and feelings',
          urgency: 'medium',
          practice: this.practiceLibrary.getGentleActivation()
        },
        nervousSystemUpdate: {
          state: detectedState,
          confidence: assessment.confidence
        }
      };
    }

    return null;
  }

  analyzePracticeNeeds(response, context) {
    // Analyze Claude's response to determine if practice is recommended
    const lowerResponse = response.toLowerCase();
    
    // Look for practice indicators in Claude's response
    if (lowerResponse.includes('breathing') || lowerResponse.includes('breath')) {
      return {
        type: 'breathing_exercise',
        title: 'Breathing Practice',
        description: 'A guided breathing exercise',
        urgency: 'medium'
      };
    }
    
    if (lowerResponse.includes('parts') || lowerResponse.includes('part of you')) {
      return {
        type: 'parts_work',
        title: 'Parts Check-in',
        description: 'Explore different parts of yourself',
        urgency: 'low'
      };
    }
    
    if (lowerResponse.includes('body') || lowerResponse.includes('sensation')) {
      return {
        type: 'body_scan',
        title: 'Body Awareness',
        description: 'Gentle body scanning practice',
        urgency: 'low'
      };
    }

    return null;
  }

  /**
   * Extract entities from Claude's response
   *
   * **Identifies archetypal symbols, emotions, and somatic experiences.**
   *
   * **Entity Categories:**
   * 1. Archetypal: mother, father, child, wise woman, warrior, dragon, serpent, tree, etc.
   * 2. Emotional: joy, sadness, anger, fear, shame, guilt, love, grief, etc.
   * 3. Somatic: tension, warmth, tingling, numbness, heavy, chest, heart, belly, etc.
   *
   * **Why extract entities:**
   * - Track recurring symbols across sessions
   * - Connect entities to IFS parts
   * - Notice patterns in user's inner world
   * - Build continuity in conversation
   *
   * **Deduplication:**
   * Returns top 5 unique entities (avoids repetition)
   *
   * @param {string} response - Claude's response text
   * @returns {Array} Extracted entities
   * @returns {string} return[].name - Entity name (lowercase)
   * @returns {string} return[].category - 'archetypal'|'emotional'|'somatic'
   * @returns {string} return[].context - Sentence where entity appeared
   * @returns {number} return[].confidence - Confidence score (0-1)
   * @private
   *
   * @example
   * const entities = this.extractEntities("The owl represents a wise part watching over a scared child");
   * // Returns:
   * [
   *   { name: 'owl', category: 'archetypal', context: '...', confidence: 0.8 },
   *   { name: 'wise', category: 'archetypal', context: '...', confidence: 0.8 },
   *   { name: 'child', category: 'archetypal', context: '...', confidence: 0.8 },
   *   { name: 'fear', category: 'emotional', context: '...', confidence: 0.9 }
   * ]
   */
  extractEntities(response) {
    // Enhanced entity extraction from Claude's response
    const entities = [];
    
    // Look for archetypal symbols
    const archetypePatterns = [
      /\b(mother|father|child|wise\s+woman|wise\s+man|warrior|lover|magician|innocent|explorer|creator|ruler|caregiver|everyman|jester|sage|hero|outlaw)\b/gi,
      /\b(serpent|dragon|tree|water|fire|earth|air|mountain|ocean|forest|desert|cave|bridge|door|window|mirror|crown|sword|shield)\b/gi
    ];
    
    // Look for emotional states
    const emotionPatterns = [
      /\b(joy|sadness|anger|fear|shame|guilt|love|gratitude|peace|anxiety|excitement|wonder|awe|grief|rage|terror|bliss)\b/gi
    ];
    
    // Look for somatic experiences  
    const somaticPatterns = [
      /\b(tension|relaxation|warmth|cold|tingling|numbness|heavy|light|tight|open|expanded|contracted|flowing|stuck|vibrating|pulsing)\b/gi,
      /\b(heart|chest|stomach|throat|shoulders|back|head|hands|feet|belly|spine|breath|breathing)\b/gi
    ];

    // Extract and categorize
    archetypePatterns.forEach(pattern => {
      const matches = response.match(pattern);
      if (matches) {
        matches.forEach(match => {
          entities.push({
            name: match.toLowerCase(),
            category: 'archetypal',
            context: this.getEntityContext(response, match),
            confidence: 0.8
          });
        });
      }
    });

    emotionPatterns.forEach(pattern => {
      const matches = response.match(pattern);
      if (matches) {
        matches.forEach(match => {
          entities.push({
            name: match.toLowerCase(),
            category: 'emotional',
            context: this.getEntityContext(response, match),
            confidence: 0.9
          });
        });
      }
    });

    somaticPatterns.forEach(pattern => {
      const matches = response.match(pattern);
      if (matches) {
        matches.forEach(match => {
          entities.push({
            name: match.toLowerCase(),
            category: 'somatic',
            context: this.getEntityContext(response, match),
            confidence: 0.7
          });
        });
      }
    });

    // Deduplicate and return top entities
    const uniqueEntities = entities.filter((entity, index, self) => 
      index === self.findIndex(e => e.name === entity.name && e.category === entity.category)
    );

    return uniqueEntities.slice(0, 5); // Return top 5 entities
  }

  getEntityContext(text, entity) {
    const sentences = text.split(/[.!?]+/);
    const contextSentence = sentences.find(sentence => 
      sentence.toLowerCase().includes(entity.toLowerCase())
    );
    return contextSentence ? contextSentence.trim() : '';
  }

  async respondToNervousSystemCheck(assessment) {
    const { state, intensity, notes } = assessment;
    
    const stateResponses = {
      ventral: `Beautiful! I can sense that you're feeling relatively safe and connected right now. Your nervous system is in a lovely place for exploration and integration work. This is a wonderful foundation for our conversation.`,
      
      sympathetic: intensity > 7 
        ? `I can feel the activation and energy in your system. Your fight/flight response is very much online - this is normal and protective. Before we dive deeper, let's help your nervous system find some calm.`
        : `I notice some activation energy in your system. That's completely normal - there's a lot to process. We can work with this energy in a way that feels manageable.`,
        
      dorsal: intensity > 6
        ? `I sense your system might be in a protective shutdown right now. That's a wise response when things feel overwhelming. We'll go very gently and follow your pace completely.`
        : `It feels like part of you might be pulled back or protected right now. That's okay - we'll honor that and move very slowly.`
    };

    let response = stateResponses[state] || "Thank you for sharing how you're feeling. I'm here to support you wherever your nervous system is right now.";
    
    if (notes) {
      response += ` I appreciate you sharing that ${notes}.`;
    }

    response += " What would feel most supportive to explore first?";

    const suggestedPractice = this.getSuggestedPracticeForState(state, intensity);

    return {
      message: response,
      suggestedPractice: suggestedPractice
    };
  }

  getSuggestedPracticeForState(state, intensity) {
    if (state === 'sympathetic' && intensity > 6) {
      return {
        type: 'breathing_exercise',
        title: 'Calming Breath',
        description: 'Help your nervous system settle',
        urgency: 'high'
      };
    }
    
    if (state === 'dorsal' && intensity > 5) {
      return {
        type: 'gentle_activation',
        title: 'Gentle Reconnection',
        description: 'Soft ways to feel your body again',
        urgency: 'medium'
      };
    }
    
    return null;
  }

  async respondToPracticeCompletion(practiceData) {
    const { practice, currentState } = practiceData;
    
    const responses = {
      breathing_exercise: `How beautiful that you took that time for your nervous system. Breathing practices are such a gift we can give ourselves. How are you feeling now?`,
      
      parts_work: `Thank you for taking time to listen to your parts. That kind of internal dialogue is so healing. What did you notice?`,
      
      body_scan: `I love that you connected with your body. Our bodies hold so much wisdom. What sensations or insights came up?`,
      
      gentle_activation: `So gentle and wise to move slowly back into feeling. Your system knows exactly what it needs. How does it feel to be reconnecting?`
    };

    const response = responses[practice.type] || "Thank you for engaging with that practice. How was that experience for you?";

    return {
      message: response,
      suggestedPractice: null // Usually no immediate follow-up practice
    };
  }

  generateSafetyResponse(context) {
    return {
      message: "I'm here with you. Take a deep breath. You're safe in this moment. Would you like to share what's present for you right now?",
      suggestedPractice: {
        type: 'grounding',
        title: 'Simple Grounding',
        description: 'Return to safety and presence',
        urgency: 'high'
      },
      nervousSystemUpdate: null
    };
  }

  determineSessionPhase(response, context) {
    // Analyze conversation to determine what phase we're in
    const lowerResponse = response.toLowerCase();
    
    if (lowerResponse.includes('intention') || lowerResponse.includes('beginning')) {
      return 'check_in';
    }
    
    if (lowerResponse.includes('meaning') || lowerResponse.includes('integration') || lowerResponse.includes('understand')) {
      return 'integration';
    }
    
    if (lowerResponse.includes('action') || lowerResponse.includes('practice') || lowerResponse.includes('forward')) {
      return 'closure';
    }
    
    return 'exploration'; // Default
  }

  analyzeNervousSystemShift(claudeResponse, context) {
    // Simple analysis - in a real implementation, this could be more sophisticated
    return null;
  }
}

// Practice Library for embedded exercises
class PracticeLibrary {
  constructor() {
    this.practices = {
      breathing: this.getBreathingExercises(),
      partsWork: this.getPartsWorkExercises(),
      somatic: this.getSomaticExercises(),
      grounding: this.getGroundingExercises()
    };
  }

  getBreathingForSympathetic() {
    return {
      title: "Calming Breath for Activation",
      steps: [
        "Place one hand on your chest, one on your belly",
        "Breathe in slowly through your nose for 4 counts",
        "Hold gently for 4 counts",
        "Exhale slowly through your mouth for 6 counts",
        "Repeat 5-8 times",
        "Notice how your body feels now"
      ],
      duration: 3,
      instructions: "This helps activate your parasympathetic nervous system"
    };
  }

  getGentleActivation() {
    return {
      title: "Gentle Reconnection",
      steps: [
        "Place both hands on your heart",
        "Feel the warmth of your hands",
        "Take the smallest, gentlest breath",
        "Wiggle your fingers and toes slightly",
        "Look around and name 3 things you can see",
        "Say: 'I am safe to feel again'"
      ],
      duration: 5,
      instructions: "Very gentle ways to reconnect with your body"
    };
  }

  getBreathingExercises() {
    return [
      this.getBreathingForSympathetic(),
      {
        title: "Heart Coherence Breathing",
        steps: [
          "Place your hand on your heart",
          "Breathe in for 5 counts",
          "Breathe out for 5 counts", 
          "Focus on your heart area",
          "Think of something you appreciate",
          "Continue for 3-5 minutes"
        ],
        duration: 5
      }
    ];
  }

  getPartsWorkExercises() {
    return [
      {
        title: "Parts Check-in",
        steps: [
          "Take a moment to look inside",
          "What part of you feels most active right now?",
          "What does this part need?",
          "What would you like to say to this part?",
          "How does this part protect you?",
          "Thank this part for its work"
        ],
        duration: 7
      }
    ];
  }

  getSomaticExercises() {
    return [
      {
        title: "Body Scan",
        steps: [
          "Start at the top of your head",
          "Slowly scan down through your body",
          "Notice any sensations without changing them",
          "Send breath to areas that feel tight",
          "Thank your body for holding your experience"
        ],
        duration: 5
      }
    ];
  }

  getGroundingExercises() {
    return [
      {
        title: "5-4-3-2-1 Grounding",
        steps: [
          "Name 5 things you can see",
          "Name 4 things you can touch",
          "Name 3 things you can hear",
          "Name 2 things you can smell",
          "Name 1 thing you can taste",
          "Take a deep breath"
        ],
        duration: 3
      }
    ];
  }
}

export default IntegrationGuideService;