import { callClaude } from './claudeAPI';
import metricsService from './metricsService';
import ragService from './ragService';
import { MODELS } from './aiModels';

/**
 * Polyvagal AI Service
 * Uses Claude API for nervous system mapping with offline fallback
 */
export class PolyvagalAIService {
  constructor() {
    this.conversationHistory = [];
    this.currentState = null; // 'sympathetic', 'dorsal', or 'ventral'
    this.currentField = null; // 'memory', 'body', 'thoughts', etc.
    this.responses = {
      sympathetic: {},
      dorsal: {},
      ventral: {}
    };
    this.isOnline = true;
  }

  getSystemPrompt() {
    return `You are a compassionate guide helping someone map their nervous system states using Polyvagal Theory.

YOUR ROLE:
- Guide the user through identifying their three nervous system states
- Help them notice patterns in body, thoughts, and situations
- Normalize all states as adaptive and protective
- Use warm, non-pathologizing language
- Help users build self-awareness without judgment

THE THREE STATES:

**Ventral Vagal (Safe & Social)** 💚
- Optimal state for connection and integration
- Calm, present, engaged, curious
- Body: relaxed, breathing deeply, warm
- Thoughts: "I'm okay", "Life has beauty", open and receptive

**Sympathetic (Fight/Flight)** ⚡
- Mobilization state when perceiving threat
- Activated, anxious, energized, overwhelmed
- Body: racing heart, tension, shallow breathing
- Thoughts: "I need to...", "Something will go wrong", urgent

**Dorsal Vagal (Shutdown)** 🛡️
- Immobilization state when threat feels overwhelming
- Numb, disconnected, withdrawn, collapsed
- Body: heavy, tired, hard to move, slow
- Thoughts: "What's the point?", "I can't...", hopeless

POLYVAGAL PRINCIPLES:
- All states are adaptive - they helped us survive
- No state is "bad" - each serves a protective function
- The nervous system is constantly assessing safety vs. danger
- We cycle through states naturally
- The goal is awareness and compassion, not "fixing"

RESPONSE GUIDELINES:
- Validate whatever the user shares - all responses are legitimate
- Reflect back what you hear with compassion
- Help them notice patterns and connections
- Use polyvagal language: "nervous system", "state", "regulation", "safety cues"
- Keep responses warm, brief, and encouraging (2-3 sentences)
- Ask one clarifying question if needed
- Normalize difficult states: "That makes sense your system responded that way"

CURRENT MAPPING TASK:
You're helping them identify what each state looks/feels like FOR THEM specifically.

When mapping a state, explore:
- **Situations/Triggers**: When does this state happen?
- **Body Sensations**: What do they notice physically?
- **Thought Patterns**: What thoughts run through their mind?
- **Behaviors**: What do they do in this state?

Remember: You're facilitating their self-discovery, not analyzing them. Their experience is the expert.`;
  }

  async sendMessage(userMessage, state, field) {
    this.currentState = state;
    this.currentField = field;

    try {
      // Try AI first
      const aiResponse = await this.getAIResponse(userMessage);
      this.isOnline = true;
      return {
        response: aiResponse,
        isAI: true
      };
    } catch (error) {
      console.log('AI unavailable, using fallback:', error.message);
      this.isOnline = false;

      // Use rule-based fallback
      const fallbackResponse = this.getFallbackResponse(userMessage, state, field);
      return {
        response: fallbackResponse,
        isAI: false
      };
    }
  }

  async getAIResponse(userMessage, userId = null) {
    const startTime = Date.now();

    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    const messages = [...this.conversationHistory];

    // Build context about current task
    const stateNames = {
      sympathetic: 'Fight/Flight (Sympathetic)',
      dorsal: 'Shutdown (Dorsal Vagal)',
      ventral: 'Safe & Social (Ventral Vagal)'
    };

    const fieldNames = {
      memory: 'situations/triggers when this state happens',
      body: 'body sensations in this state',
      thoughts: 'thought patterns in this state'
    };

    const contextPrompt = `\n\nCurrent Task: Helping user identify ${fieldNames[this.currentField]} for their ${stateNames[this.currentState]} state.\n\nRespond warmly and briefly (2-3 sentences). Validate what they shared and guide them gently to the next field or acknowledge completion.`;

    try {
      // Fetch RAG context for polyvagal knowledge
      let ragContext = '';
      try {
        ragContext = await ragService.getContextForPrompt(userMessage, {
          maxResults: 3, maxTokens: 1500, threshold: 0.4, categories: ['autonomics'],
        });
      } catch (e) { /* graceful degradation */ }

      const data = await callClaude({
        model: MODELS.PRIMARY,
        max_tokens: 300,
        system: this.getSystemPrompt() + contextPrompt + ragContext,
        messages: messages,
      });
      const assistantMessage = data.content[0].text;
      const durationMs = Date.now() - startTime;

      // Extract tokens and calculate cost
      const tokens = metricsService.constructor.extractTokens(data);
      const cost = tokens ? metricsService.constructor.calculateCost(tokens) : null;

      // Log success metrics
      metricsService.logAIMetric({
        serviceName: 'polyvagalAI',
        operation: 'mapping',
        durationMs,
        tokens,
        cost,
        status: 'success',
        metadata: { state: this.currentState, field: this.currentField },
        userId
      });

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage
      });

      return assistantMessage;
    } catch (error) {
      const durationMs = Date.now() - startTime;

      // Log error metrics
      metricsService.logAIMetric({
        serviceName: 'polyvagalAI',
        operation: 'mapping',
        durationMs,
        status: 'error',
        metadata: { state: this.currentState, field: this.currentField, error: error.message },
        userId
      });

      metricsService.logError({
        serviceName: 'polyvagalAI',
        operation: 'mapping',
        errorType: error.name || 'APIError',
        errorMessage: error.message,
        stackTrace: error.stack,
        context: { state: this.currentState, field: this.currentField },
        userId
      });

      throw error;
    }
  }

  getFallbackResponse(userMessage, state, field) {
    // Store response
    if (state && field) {
      if (!this.responses[state]) {
        this.responses[state] = {};
      }
      this.responses[state][field] = userMessage;
    }

    const stateEmojis = {
      sympathetic: '⚡',
      dorsal: '🛡️',
      ventral: '💚'
    };

    const stateNames = {
      sympathetic: 'fight/flight',
      dorsal: 'shutdown',
      ventral: 'safe & social'
    };

    // Fallback responses by state and field
    const responses = {
      sympathetic: {
        memory: "Thank you for sharing when your nervous system goes into activation. That makes complete sense - your system is trying to mobilize to protect you. Now, what do you notice in your body during those moments?",
        body: "I hear those body sensations - that's your sympathetic nervous system at work, mobilizing energy. What kinds of thoughts run through your mind when you're in this activated state?",
        thoughts: "Those thought patterns are so common in fight/flight mode. The nervous system creates urgency and vigilance. You've mapped this state beautifully."
      },
      dorsal: {
        memory: "Thank you for identifying when you go into shutdown. Your system is conserving energy to protect you - it's adaptive. What do you notice in your body during those times?",
        body: "Those heavy, slow sensations are classic dorsal responses. Your system is pulling inward for protection. What thoughts tend to show up in this state?",
        thoughts: "Those hopeless, 'what's the point' thoughts make so much sense in shutdown. You're building valuable awareness of this state."
      },
      ventral: {
        memory: "Beautiful - you're identifying when your nervous system feels safe and connected. These are important anchor points. What do you notice in your body during these moments?",
        body: "Those relaxed, warm sensations are your ventral vagal system at work - the biological state of safety. What kinds of thoughts do you notice when you're here?",
        thoughts: "Those open, accepting thoughts reflect true nervous system safety. This is your regulation home base - remember these moments."
      }
    };

    // Get appropriate response
    if (state && field && responses[state] && responses[state][field]) {
      return responses[state][field];
    }

    // Generic encouraging response
    return `Thank you for sharing that about your ${stateNames[state]} state. You're building important self-awareness. ${stateEmojis[state]}`;
  }

  saveResponse(state, field, value) {
    if (!this.responses[state]) {
      this.responses[state] = {};
    }
    this.responses[state][field] = value;
  }

  getResponses() {
    return this.responses;
  }

  reset() {
    this.conversationHistory = [];
    this.currentState = null;
    this.currentField = null;
    this.responses = {
      sympathetic: {},
      dorsal: {},
      ventral: {}
    };
  }

  isUsingAI() {
    return this.isOnline;
  }
}

export default new PolyvagalAIService();
