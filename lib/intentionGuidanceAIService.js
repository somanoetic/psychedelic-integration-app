// lib/intentionGuidanceAIService.js
// AI Service for FEAT-102: AI Guidance in Set Your Intention Screen

import claudeProxyService from './claudeProxyService';
import enhancedClaudeService from './enhancedClaudeService';
import intentionGuidanceService from './intentionGuidanceService';
import metricsService from './metricsService';
import ragService from './ragService';
import { MODELS } from './aiModels';

/**
 * Intention Guidance AI Service
 *
 * Provides AI-powered conversational guidance for setting meaningful intentions
 * for psychedelic sessions. Integrates with enhancedClaudeService for context-aware
 * conversations and intentionGuidanceService for database operations.
 *
 * Features:
 * - Multi-stage conversation flow (welcome, exploration, formulation, refinement, review)
 * - Framework-specific prompts (IFS, somatic, existential, healing)
 * - Nervous system state-aware responses
 * - Template suggestions and management
 * - Privacy-first intention storage (opt-in only)
 * - Draft intention analysis and feedback
 *
 * @class
 */
class IntentionGuidanceAIService {
  constructor() {
    this.enhancedClaude = enhancedClaudeService;
    this.dbService = intentionGuidanceService;

    // Conversation stages — 4-step flow (ADR-007: intention as goalpost, expanded for depth)
    this.conversationStages = ['welcome', 'direction', 'deepen', 'confirm'];
  }

  // =========================================================================
  // PUBLIC API METHODS
  // =========================================================================

  /**
   * Start a new intention-setting conversation
   *
   * Initializes the conversation with context-aware prompts based on:
   * - Session type (healing, exploration, creativity, spiritual, etc.)
   * - User's preferred framework (IFS, somatic, existential, healing)
   * - Current nervous system state
   * - User preferences from database
   *
   * @param {object} context - Conversation context
   * @param {string} context.userId - User ID (required)
   * @param {string} [context.sessionId] - Session ID (optional)
   * @param {string} [context.sessionType] - Session type: 'healing', 'exploration', 'creativity', 'spiritual', 'general'
   * @param {string} [context.framework] - Framework: 'ifs', 'somatic', 'existential', 'healing', 'integration'
   * @param {string} [context.nervousSystemState] - NS state: 'ventral', 'sympathetic', 'dorsal'
   * @param {number} [context.stateConfidence] - NS state confidence (0-1)
   * @returns {Promise<object>} Initial conversation response
   * @returns {string} return.conversationId - UUID for tracking this conversation
   * @returns {string} return.initialMessage - AI's welcome message
   * @returns {Array} return.suggestedTemplates - 3-5 relevant templates
   * @returns {object} return.userPreferences - User's intention preferences
   *
   * @example
   * const response = await startIntentionConversation({
   *   userId: 'user-uuid',
   *   sessionType: 'healing',
   *   framework: 'ifs',
   *   nervousSystemState: 'ventral',
   *   stateConfidence: 0.85
   * });
   */
  async startIntentionConversation(context) {
    const startTime = Date.now();
    const {
      userId,
      sessionId = null,
      sessionType = 'general',
      framework = null,
      nervousSystemState = 'ventral',
      stateConfidence = 0.7
    } = context;

    try {
      // 1. Load user preferences
      const preferences = await this.dbService.getUserPreferences(userId);

      // 2. Determine framework to use (user preference or passed framework)
      const selectedFramework = framework ||
        (preferences.favorite_frameworks && preferences.favorite_frameworks[0]) ||
        'healing';

      // 3. Get relevant templates
      const templates = await this.dbService.getTemplates(
        selectedFramework,
        sessionType,
        5 // limit to 5 templates
      );

      // 4. Build initial prompt with context
      const initialPrompt = this.buildIntentionPrompt({
        stage: 'welcome',
        sessionType,
        framework: selectedFramework,
        nervousSystemState,
        stateConfidence,
        preferences,
        message: '' // No user message yet
      });

      // 5. Get AI response via direct API call (simpler for initial message)
      const aiResponse = await this.callClaudeAPI(initialPrompt, userId, {
        operation: 'start_conversation',
        sessionType,
        framework: selectedFramework
      });

      // 6. Generate conversation ID (client can override)
      const conversationId = this.generateConversationId();

      // 7. Log successful start
      const durationMs = Date.now() - startTime;
      if (__DEV__) console.log(`[IntentionAI] Started conversation ${conversationId} in ${durationMs}ms`);

      return {
        conversationId,
        initialMessage: aiResponse,
        suggestedTemplates: templates.slice(0, 5),
        userPreferences: preferences,
        conversationStage: 'welcome'
      };

    } catch (error) {
      const durationMs = Date.now() - startTime;
      if (__DEV__) console.error('[IntentionAI] Error starting conversation:', error);

      metricsService.logError({
        serviceName: 'intentionGuidanceAI',
        operation: 'start_conversation',
        errorType: error.name,
        errorMessage: error.message,
        stackTrace: error.stack,
        userId
      });

      throw new Error(`Failed to start intention conversation: ${error.message}`);
    }
  }

  /**
   * Continue an ongoing intention-setting conversation
   *
   * Maintains conversation context and guides user through the intention-setting
   * process with stage-appropriate prompts and suggestions.
   *
   * @param {string} message - User's message
   * @param {object} context - Conversation context
   * @param {string} context.conversationId - Conversation UUID
   * @param {string} context.userId - User ID
   * @param {string} [context.sessionType] - Session type
   * @param {string} [context.framework] - Framework being used
   * @param {string} [context.nervousSystemState] - Current NS state
   * @param {number} [context.stateConfidence] - NS state confidence (0-1)
   * @param {Array} [context.conversationHistory] - Previous messages
   * @param {string} [context.currentDraft] - Current draft intention text
   * @returns {Promise<object>} AI response
   * @returns {string} return.message - AI's response message
   * @returns {Array} return.suggestedActions - Suggested next actions
   * @returns {string} return.conversationStage - Current stage
   * @returns {object} [return.nervousSystemUpdate] - NS state update if detected
   *
   * @example
   * const response = await continueIntentionConversation(
   *   "I've been feeling disconnected from my inner child",
   *   {
   *     conversationId: 'conv-uuid',
   *     userId: 'user-uuid',
   *     sessionType: 'healing',
   *     framework: 'ifs',
   *     nervousSystemState: 'sympathetic',
   *     conversationHistory: [...]
   *   }
   * );
   */
  async continueIntentionConversation(message, context) {
    const startTime = Date.now();
    const {
      conversationId,
      userId,
      sessionType = 'general',
      framework = 'healing',
      nervousSystemState = 'ventral',
      stateConfidence = 0.7,
      conversationHistory = [],
      currentDraft = null
    } = context;

    try {
      // 1. Detect conversation stage
      const stage = this.detectConversationStage(conversationHistory, currentDraft);

      // 2. Build intention-specific prompt
      let prompt = this.buildIntentionPrompt({
        stage,
        message,
        sessionType,
        framework,
        nervousSystemState,
        stateConfidence,
        conversationHistory,
        currentDraft
      });

      // 2b. Add RAG context for psychedelic integration / spirituality
      try {
        const ragContext = await ragService.getContextForPrompt(message, {
          maxResults: 3, maxTokens: 1500, threshold: 0.4,
          categories: ['psychedelic-integration', 'spirituality'],
        });
        if (ragContext) prompt += ragContext;
      } catch (e) { /* graceful degradation */ }

      // 3. Call Claude API
      const aiResponse = await this.callClaudeAPI(prompt, userId, {
        operation: 'continue_conversation',
        conversationId,
        stage,
        sessionType,
        framework
      });

      // 4. Analyze response for actions
      const suggestedActions = this.analyzeSuggestedActions(aiResponse, stage);

      // 5. Check if NS state assessment is needed (delegate to enhancedClaudeService)
      const nervousSystemUpdate = nervousSystemState ? {
        detectedState: nervousSystemState,
        confidence: stateConfidence,
        needsRegulation: false
      } : null;

      const durationMs = Date.now() - startTime;
      if (__DEV__) console.log(`[IntentionAI] Continued conversation ${conversationId}, stage: ${stage}, ${durationMs}ms`);

      return {
        message: aiResponse,
        suggestedActions,
        conversationStage: stage,
        nervousSystemUpdate
      };

    } catch (error) {
      const durationMs = Date.now() - startTime;
      if (__DEV__) console.error('[IntentionAI] Error continuing conversation:', error);

      metricsService.logError({
        serviceName: 'intentionGuidanceAI',
        operation: 'continue_conversation',
        errorType: error.name,
        errorMessage: error.message,
        stackTrace: error.stack,
        userId
      });

      // Return fallback response
      return {
        message: this.getFallbackResponse(context),
        suggestedActions: [],
        conversationStage: this.detectConversationStage(conversationHistory, currentDraft),
        nervousSystemUpdate: null,
        error: true
      };
    }
  }

  /**
   * Analyze a draft intention and provide AI feedback
   *
   * Provides gentle, constructive feedback on:
   * - Specificity and clarity
   * - Alignment with session type and framework
   * - Actionability and focus
   * - Resonance with what user has shared
   *
   * @param {string} draftIntention - User's draft intention text
   * @param {object} context - Context for analysis
   * @param {string} context.userId - User ID
   * @param {string} [context.sessionType] - Session type
   * @param {string} [context.framework] - Framework being used
   * @param {Array} [context.conversationHistory] - Previous conversation
   * @returns {Promise<object>} Feedback response
   * @returns {string} return.feedback - AI's feedback message
   * @returns {Array} return.suggestions - Specific suggestions for improvement
   * @returns {object} return.analysis - Structured analysis
   *
   * @example
   * const feedback = await analyzeDraftIntention(
   *   "I intend to heal my trauma",
   *   {
   *     userId: 'user-uuid',
   *     sessionType: 'healing',
   *     framework: 'ifs'
   *   }
   * );
   */
  async analyzeDraftIntention(draftIntention, context) {
    const startTime = Date.now();
    const {
      userId,
      sessionType = 'general',
      framework = 'healing',
      conversationHistory = []
    } = context;

    try {
      // Build analysis prompt
      const analysisPrompt = this.buildAnalysisPrompt(
        draftIntention,
        sessionType,
        framework,
        conversationHistory
      );

      // Get AI feedback
      const aiResponse = await this.callClaudeAPI(analysisPrompt, userId, {
        operation: 'analyze_intention',
        sessionType,
        framework
      });

      // Parse response for structured feedback
      const analysis = this.parseAnalysisFeedback(aiResponse);

      const durationMs = Date.now() - startTime;
      if (__DEV__) console.log(`[IntentionAI] Analyzed draft intention in ${durationMs}ms`);

      return {
        feedback: aiResponse,
        suggestions: analysis.suggestions,
        analysis: analysis.structured
      };

    } catch (error) {
      if (__DEV__) console.error('[IntentionAI] Error analyzing intention:', error);

      metricsService.logError({
        serviceName: 'intentionGuidanceAI',
        operation: 'analyze_intention',
        errorType: error.name,
        errorMessage: error.message,
        userId
      });

      return {
        feedback: "I'm having trouble analyzing your intention right now. Your intention looks thoughtful - trust your intuition.",
        suggestions: [],
        analysis: {},
        error: true
      };
    }
  }

  /**
   * Get intention templates filtered by framework and session type
   *
   * Delegates to intentionGuidanceService for database access.
   *
   * @param {string} [framework] - Framework filter
   * @param {string} [sessionType] - Session type filter
   * @param {object} [options] - Additional options
   * @param {number} [options.limit] - Max results
   * @param {boolean} [options.featured] - Only featured templates
   * @returns {Promise<Array>} Array of template objects
   */
  async getTemplates(framework = null, sessionType = null, options = {}) {
    try {
      return await this.dbService.getTemplates(framework, sessionType, options.limit);
    } catch (error) {
      console.error('[IntentionAI] Error getting templates:', error);
      throw error;
    }
  }

  /**
   * Save user's intention to database (opt-in only)
   *
   * Validates privacy preferences and saves intention with metadata.
   *
   * @param {object} intention - Intention data
   * @param {string} intention.intentionText - The intention text (required)
   * @param {string} [intention.framework] - Framework used
   * @param {string} [intention.sessionType] - Session type
   * @param {object} [intention.aiConversationContext] - Conversation metadata
   * @param {string} [intention.inspiredByTemplateId] - Template ID if used
   * @param {boolean} intention.userWantsToSave - Explicit opt-in (required)
   * @param {string} userId - User ID
   * @param {string} [sessionId] - Session ID (optional)
   * @returns {Promise<object>} Save result
   * @returns {boolean} return.success - Whether save succeeded
   * @returns {string} [return.intentionId] - Saved intention ID
   * @returns {string} [return.error] - Error message if failed
   * @returns {string} [return.errorCode] - Error code for client handling
   */
  async saveIntention(intention, userId, sessionId = null) {
    const startTime = Date.now();

    try {
      const {
        intentionText,
        framework = 'general',
        sessionType = 'general',
        aiConversationContext = {},
        inspiredByTemplateId = null,
        userWantsToSave = false
      } = intention;

      // 1. Validate opt-in (critical privacy check)
      if (!userWantsToSave) {
        // Check user preferences
        const preferences = await this.dbService.getUserPreferences(userId);

        if (!preferences.save_by_default) {
          return {
            success: false,
            error: 'User has not opted in to saving intentions',
            errorCode: 'PRIVACY_OPT_IN_REQUIRED'
          };
        }
      }

      // 2. Validate intention text
      if (!intentionText || intentionText.trim().length === 0) {
        return {
          success: false,
          error: 'Intention text is required',
          errorCode: 'INVALID_INTENTION_TEXT'
        };
      }

      if (intentionText.length > 2000) {
        return {
          success: false,
          error: 'Intention text too long (max 2000 characters)',
          errorCode: 'INTENTION_TOO_LONG'
        };
      }

      // 3. Save via database service
      const result = await this.dbService.saveIntention({
        user_id: userId,
        session_id: sessionId,
        intention_text: intentionText,
        framework,
        session_type: sessionType,
        ai_conversation_context: aiConversationContext,
        inspired_by_template_id: inspiredByTemplateId
      });

      const durationMs = Date.now() - startTime;
      if (__DEV__) console.log(`[IntentionAI] Saved intention ${result.id} in ${durationMs}ms`);

      return {
        success: true,
        intentionId: result.id,
        created_at: result.created_at,
        message: 'Your intention has been saved'
      };

    } catch (error) {
      const durationMs = Date.now() - startTime;
      if (__DEV__) console.error('[IntentionAI] Error saving intention:', error);

      metricsService.logError({
        serviceName: 'intentionGuidanceAI',
        operation: 'save_intention',
        errorType: error.name,
        errorMessage: error.message,
        userId
      });

      return {
        success: false,
        error: 'Failed to save intention to database',
        errorCode: 'DATABASE_ERROR',
        details: error.message
      };
    }
  }

  /**
   * Get or create user preferences
   *
   * @param {string} userId - User ID
   * @returns {Promise<object>} User preferences
   */
  async getUserPreferences(userId) {
    try {
      return await this.dbService.getUserPreferences(userId);
    } catch (error) {
      console.error('[IntentionAI] Error getting user preferences:', error);
      throw error;
    }
  }

  /**
   * Update user preferences
   *
   * @param {string} userId - User ID
   * @param {object} updates - Preference updates
   * @returns {Promise<object>} Updated preferences
   */
  async updateUserPreferences(userId, updates) {
    try {
      return await this.dbService.updateUserPreferences(userId, updates);
    } catch (error) {
      console.error('[IntentionAI] Error updating user preferences:', error);
      throw error;
    }
  }

  // =========================================================================
  // PRIVATE HELPER METHODS
  // =========================================================================

  /**
   * Build intention-specific prompt for Claude
   *
   * Creates context-aware system prompts based on conversation stage,
   * session type, framework, and nervous system state.
   *
   * @param {object} options - Prompt options
   * @param {string} options.stage - Conversation stage
   * @param {string} [options.message] - User's message
   * @param {string} options.sessionType - Session type
   * @param {string} options.framework - Framework
   * @param {string} options.nervousSystemState - NS state
   * @param {number} [options.stateConfidence] - NS confidence
   * @param {Array} [options.conversationHistory] - Message history
   * @param {string} [options.currentDraft] - Current draft
   * @param {object} [options.preferences] - User preferences
   * @returns {string} Complete system prompt
   * @private
   */
  buildIntentionPrompt(options) {
    const {
      stage,
      message = '',
      sessionType,
      framework,
      nervousSystemState,
      stateConfidence = 0.7,
      conversationHistory = [],
      currentDraft = null,
    } = options;

    // Welcome variability — different opening approach each time (fixes BUG-208)
    const welcomeApproaches = [
      'Start with a warm check-in. Ask one simple question: what\'s calling them today?',
      'Open by acknowledging the courage it takes to show up for this work. Then ask what direction feels alive for them right now.',
      'Begin with a brief grounding invitation ("take a breath, notice what\'s here"), then ask what\'s present for them today.',
      'Open with genuine curiosity — what brought them here? What are they moving toward?',
      'Start softly. Ask what they most want to bring into this session — not what they want to achieve, but where they want to go.',
    ];
    const welcomeApproach = welcomeApproaches[Math.floor(Math.random() * welcomeApproaches.length)];

    const stageInstructions = {
      welcome: `This is the opening. ${welcomeApproach}
Keep your response to 2–3 sentences. Ask ONE question only.`,

      direction: `The user has shared something. Reflect it back in their own words — let them feel heard.
Then offer a simple directional framing: "So it sounds like you're moving toward [X] — does that feel right?"
2–3 sentences. No analysis. Just the reflection and the gentle naming. End with ONE question to go deeper.`,

      deepen: `The user has confirmed or expanded on their direction. Go a little deeper.
Help them feel into it: what does this intention mean to them? What would it look like to carry this in?
Reflect what you're hearing and gently sharpen the direction. 2–3 sentences. One question at most.
Do NOT rush to confirm — let the intention breathe and take shape.`,

      confirm: `The user has found their direction. Name it cleanly and simply — one sentence.
Close with something like: "Hold it lightly — let the medicine take you from here."
2–3 sentences total. Warm, brief, done. Do not add more questions or suggestions.`,
    };

    const nsNote = {
      sympathetic: '- They may be activated. Keep it short, grounding, calm.',
      dorsal: '- They may be withdrawn. Gentle, slow, no pressure whatsoever.',
      ventral: '- They are open and regulated. Good moment for clarity and directness.',
    }[nervousSystemState] || '';

    return `You are Huxley, a warm guide helping someone find a direction for their psychedelic session.

AN INTENTION IS A GOALPOST, NOT A PLAN.
Your only job: help them point toward something — the top of a mountain — then get out of the way.
The medicine takes it from there. Do not over-refine. Do not critique. Do not ask more than one question.

SESSION CONTEXT:
- Session Type: ${sessionType || 'general'}
- Framework: ${framework || 'healing'}
- Nervous System: ${nervousSystemState} (${Math.round(stateConfidence * 100)}% confidence)
- Stage: ${stage}

${currentDraft ? `CURRENT INTENTION DRAFT:\n"${currentDraft}"\n` : ''}\
${conversationHistory.length > 0
  ? `CONVERSATION SO FAR (last 3):\n${conversationHistory.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}\n`
  : ''}\
${message ? `USER SAID: "${message}"` : 'This is the very start of the conversation.'}

STAGE INSTRUCTION:
${stageInstructions[stage] || stageInstructions.confirm}

${nsNote ? `NERVOUS SYSTEM NOTE:\n${nsNote}\n` : ''}\
FRAMEWORK COLOURING:
${this.getFrameworkGuidance(framework)}

HARD RULES:
- 2–3 sentences maximum
- One question only, never two
- Never critique the intention for specificity or correctness
- Warmth without saccharine positivity
- NEVER use markdown formatting (no **, no *, no #). Respond in plain text only.`;
  }

  /**
   * Get framework-specific guidance for prompt
   *
   * @param {string} framework - Framework name
   * @returns {string} Framework-specific prompt additions
   * @private
   */
  getFrameworkGuidance(framework) {
    // Each entry colours the ONE question Huxley asks — brief, directional
    const guidance = {
      ifs:         'Lean toward parts language: "What part of you is calling for attention?" or "What needs witnessing today?"',
      somatic:     'Lean toward body: "What does your body most want to move toward?" or "Where do you feel this pulling you?"',
      existential: 'Lean toward meaning: "What question are you bringing?" or "What wants to be understood?"',
      healing:     'Lean toward what\'s ready to shift: "What\'s ready to heal?" or "How do you want to relate to your pain differently?"',
      exploration: 'Lean toward curiosity: "What are you most curious about?" or "What do you want to understand better?"',
      creativity:  'Lean toward expression: "What wants to be expressed?" or "What creative energy is wanting to move?"',
      spiritual:   'Lean toward connection: "What are you seeking to connect with?" or "What calls you?"',
      integration: 'Lean toward grounding: "What from past experiences still needs to land?" or "What insight wants to become lived?"',
    };

    return guidance[framework] || guidance.healing;
  }

  /**
   * Build analysis prompt for draft intention feedback
   *
   * @param {string} draftIntention - User's draft
   * @param {string} sessionType - Session type
   * @param {string} framework - Framework
   * @param {Array} conversationHistory - Conversation history
   * @returns {string} Analysis prompt
   * @private
   */
  buildAnalysisPrompt(draftIntention, sessionType, framework, conversationHistory) {
    return `You are Huxley, analyzing a draft intention for a ${sessionType} psychedelic session using a ${framework} framework.

DRAFT INTENTION:
"${draftIntention}"

CONTEXT FROM CONVERSATION:
${conversationHistory && conversationHistory.length > 0
  ? conversationHistory.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join('\n')
  : 'No prior conversation.'}

ANALYSIS CRITERIA:
1. SPECIFICITY: Is it specific enough? Or too vague?
2. CLARITY: Is it clear what they're working with?
3. FOCUS: Is it focused on ONE area, or trying to do too much?
4. ALIGNMENT: Does it align with what they've shared and the session type?
5. ACTIONABILITY: Does it give them something to work with during the session?
6. RESONANCE: Does it feel authentic to their experience?

Provide gentle, constructive feedback in 3-4 sentences. Start with what's strong about the intention, then offer ONE specific suggestion for improvement if needed. Be encouraging and validating, not critical. End with affirmation of their courage.`;
  }

  /**
   * Parse AI feedback into structured analysis
   *
   * @param {string} feedback - AI's feedback message
   * @returns {object} Structured analysis
   * @private
   */
  parseAnalysisFeedback(feedback) {
    // Simple parsing - extract suggestions from feedback
    const suggestions = [];
    const lowerFeedback = feedback.toLowerCase();

    if (lowerFeedback.includes('more specific') || lowerFeedback.includes('specificity')) {
      suggestions.push({
        type: 'specificity',
        message: 'Consider making your intention more specific'
      });
    }

    if (lowerFeedback.includes('focused') || lowerFeedback.includes('focus on one')) {
      suggestions.push({
        type: 'focus',
        message: 'Try focusing on just one area'
      });
    }

    if (lowerFeedback.includes('body') || lowerFeedback.includes('somatic')) {
      suggestions.push({
        type: 'somatic',
        message: 'Consider connecting your intention to body awareness'
      });
    }

    return {
      suggestions,
      structured: {
        hasFeedback: feedback.length > 0,
        isPositive: lowerFeedback.includes('strong') || lowerFeedback.includes('clear'),
        needsWork: lowerFeedback.includes('consider') || lowerFeedback.includes('suggest')
      }
    };
  }

  /**
   * Detect current conversation stage
   *
   * @param {Array} conversationHistory - Message history
   * @param {string} currentDraft - Current draft intention
   * @returns {string} Stage name
   * @private
   */
  detectConversationStage(conversationHistory, currentDraft) {
    if (!conversationHistory || conversationHistory.length === 0) {
      return 'welcome';
    }

    const userMessages = conversationHistory.filter(m => m.role === 'user');

    if (userMessages.length === 0) return 'welcome';
    if (userMessages.length === 1) return 'direction';
    if (userMessages.length === 2) return 'deepen';
    return 'confirm'; // 3+ user messages → name the direction and wrap up
  }

  /**
   * Analyze AI response for suggested actions
   *
   * @param {string} aiMessage - AI's response
   * @param {string} stage - Current stage
   * @returns {Array} Suggested actions
   * @private
   */
  analyzeSuggestedActions(aiMessage, stage) {
    const actions = [];
    const lower = aiMessage.toLowerCase();

    // On confirm stage, always surface the save action
    if (stage === 'confirm') {
      actions.push({
        type: 'save_intention',
        message: 'Save your intention',
        icon: 'check',
      });
    }

    // Templates shortcut — only if Huxley mentions examples (any stage)
    if (lower.includes('template') || lower.includes('example') || lower.includes('inspiration')) {
      actions.push({
        type: 'browse_templates',
        message: 'Browse example intentions',
        icon: 'book',
      });
    }

    return actions;
  }

  /**
   * Call Claude API via secure server-side proxy
   *
   * Routes all AI calls through the Supabase Edge Function to keep API keys
   * server-side. Includes rate limiting and auth via the proxy.
   *
   * @param {string} prompt - Full prompt (sent as user message)
   * @param {string} userId - User ID for metrics
   * @param {object} metadata - Operation metadata
   * @returns {Promise<string>} AI response text
   * @private
   */
  async callClaudeAPI(prompt, userId = null, metadata = {}) {
    const startTime = Date.now();

    try {
      const data = await claudeProxyService.sendMessage(
        [{ role: 'user', content: prompt }],
        {
          model: MODELS.PRIMARY,
          maxTokens: 1024,
          temperature: 0.7,
        }
      );

      const durationMs = Date.now() - startTime;

      // Extract tokens and calculate cost
      const tokens = metricsService.constructor.extractTokens(data);
      const cost = tokens ? metricsService.constructor.calculateCost(tokens) : null;

      // Log success metrics
      metricsService.logAIMetric({
        serviceName: 'intentionGuidanceAI',
        operation: metadata.operation || 'chat',
        durationMs,
        tokens,
        cost,
        status: 'success',
        metadata: {
          model: MODELS.PRIMARY,
          max_tokens: 1024,
          ...metadata
        },
        userId
      });

      return data.content[0].text;

    } catch (error) {
      const durationMs = Date.now() - startTime;

      metricsService.logAIMetric({
        serviceName: 'intentionGuidanceAI',
        operation: metadata.operation || 'chat',
        durationMs,
        status: 'error',
        metadata: {
          error: error.message,
          ...metadata
        },
        userId
      });

      if (__DEV__) {
        console.error('[IntentionAI] Claude API error:', error);
      }
      throw error;
    }
  }

  /**
   * Generate conversation ID
   *
   * @returns {string} UUID
   * @private
   */
  generateConversationId() {
    return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get fallback response when AI fails
   *
   * @param {object} context - Conversation context
   * @returns {string} Fallback message
   * @private
   */
  getFallbackResponse(context) {
    const { nervousSystemState } = context;

    const fallbacks = {
      sympathetic: "I'm having a moment of difficulty connecting. Take a breath with me. What's most important for you to explore in this session?",
      dorsal: "I'm experiencing a technical pause. That's okay - we can go slow. What feels true for you right now?",
      ventral: "I'm having trouble responding right now, but I'm still here with you. What would you like to explore about your intention?"
    };

    return fallbacks[nervousSystemState] || fallbacks.ventral;
  }
}

// Export singleton instance
export default new IntentionGuidanceAIService();
