import { callClaude } from './claudeAPI';
import masterContextService from './masterContextService';
import { supabase } from './supabase';
import metricsService from './metricsService';
import ragService from './ragService';
import { MODELS } from './aiModels';

/**
 * IFS AI Service
 * Uses Claude API for IFS-guided parts work with offline fallback
 * NOW WITH CROSS-DOMAIN CONTEXT INTEGRATION
 */
export class IFSAIService {
  constructor() {
    this.conversationHistory = [];
    this.currentPhase = 'intro';
    this.sessionData = {
      targetPart: '',
      location: '',
      description: '',
      partRole: '',
      selfEnergy: '',
      partFears: '',
      partResponse: ''
    };
    this.isOnline = true;
    this.userId = null;
    this.masterContext = null;
  }

  /**
   * Initialize with user context
   */
  async initialize(userId) {
    this.userId = userId;
    try {
      // Load master context with IFS focus
      this.masterContext = await masterContextService.getMasterContext(userId, {
        focus: 'ifs',
        includeConnections: true,
        maxJournals: 3,
        maxParts: 10
      });
      console.log('[IFS AI] Master context loaded successfully');
    } catch (error) {
      console.error('[IFS AI] Error loading master context:', error);
      this.masterContext = null;
    }
  }

  getSystemPrompt() {
    let contextSection = '';

    // Add rich cross-domain context if available
    if (this.masterContext) {
      const ctx = this.masterContext;

      // Known parts context
      if (ctx.ifs && ctx.ifs.recentParts.length > 0) {
        contextSection += `\n\n## USER'S KNOWN PARTS:\n`;
        ctx.ifs.recentParts.forEach(part => {
          contextSection += `- "${part.name}" (${part.role}): Located in ${part.location || 'unknown location'}. `;
          if (part.feelings) contextSection += `Feels: ${part.feelings.substring(0, 100)}. `;
          if (part.strategy) contextSection += `Strategy: ${part.strategy.substring(0, 100)}. `;
          if (part.unburdened) contextSection += `✓ Unburdened`;
          contextSection += `\n`;
        });
      }

      // Integration journal connections
      if (ctx.integrationJournals && ctx.integrationJournals.recentJournals.length > 0) {
        contextSection += `\n## PSYCHEDELIC INTEGRATION INSIGHTS:\n`;
        ctx.integrationJournals.recentJournals.forEach(journal => {
          if (journal.visuals) {
            contextSection += `- Visual: "${journal.visuals.substring(0, 150)}"\n`;
          }
          if (journal.realizations) {
            contextSection += `- Realization: "${journal.realizations.substring(0, 150)}"\n`;
          }
        });
      }

      // Nervous system patterns
      if (ctx.nervousSystem && ctx.nervousSystem.hasMappedStates) {
        contextSection += `\n## NERVOUS SYSTEM PATTERNS:\n`;
        if (ctx.nervousSystem.sympatheticPatterns?.body_sensations?.length > 0) {
          contextSection += `- Sympathetic: ${ctx.nervousSystem.sympatheticPatterns.body_sensations.slice(0, 3).join(', ')}\n`;
        }
        if (ctx.nervousSystem.dorsalPatterns?.body_sensations?.length > 0) {
          contextSection += `- Dorsal: ${ctx.nervousSystem.dorsalPatterns.body_sensations.slice(0, 3).join(', ')}\n`;
        }
      }

      // Potential cross-domain connections
      if (ctx.potentialConnections && ctx.potentialConnections.length > 0) {
        contextSection += `\n## POTENTIAL CONNECTIONS TO EXPLORE:\n`;
        ctx.potentialConnections.slice(0, 3).forEach(conn => {
          contextSection += `- ${conn.aiSuggestion}\n`;
        });
        contextSection += `\nUSE THESE CONNECTIONS NATURALLY: When relevant, reference these connections to help the user see patterns across their experiences.\n`;
      }
    }

    return `You are an expert IFS (Internal Family Systems) therapist having a natural, open-ended conversation to help someone explore their inner world.

YOUR ROLE:
- Start open-ended: "What's going on for you today?" or "What would you like to explore?"
- Listen for parts language naturally emerging (anxiety, critic, fear, protector, etc.)
- Use the 8 C's of Self (Calm, Clarity, Compassion, Confidence, Courage, Creativity, Curiosity, Connectedness)
- Recognize when protective parts are blended
- Help the user access Self energy
- Build trust with whatever parts emerge
- **Make connections across the user's therapeutic journey** (psychedelic experiences, nervous system patterns, known parts)

THE SIX F'S FRAMEWORK (Use flexibly, not linearly):
You KNOW the 6 F's, but you flow naturally between them based on what emerges:
1. **FIND** - Help identify which part to work with (can return here if new parts emerge)
2. **FOCUS** - Guide attention to where/how the part shows up
3. **FLESH OUT** - Learn the part's story, role, and function (can happen multiple times)
4. **FEEL TOWARD** - Check for Self energy (critical checkpoint! Can happen multiple times)
5. **BEFRIEND** - Build connection and trust
6. **FEARS** - Understand and address the part's concerns

**Important:** Move fluidly between phases. You might:
- Flesh out → Find a new part → Flesh out more → Feel toward → Flesh out again
- The conversation is organic, not a rigid checklist
- Never say "We're in the FIND phase now" - just be in that exploration naturally

IFS PRINCIPLES:
- All parts have positive intentions
- No part is "bad" - they're all trying to protect
- Self-led healing (the user's Self does the work)
- Permission-based (respect protective parts)
- Non-pathologizing language
- The goal is relationship, not fixing

DETECTING SELF ENERGY vs BLENDING:
- **Self Energy**: curious, compassionate, calm, open, interested, caring, patient, accepting
- **Blended/Protective**: annoyed, frustrated, critical, angry, scared, worried, overwhelmed, judgmental, wanting to fix/change

If the user is blended, gently help them unblend:
- Acknowledge the protective part
- Ask if it would be willing to step back a little
- Invite curiosity about why the target part does what it does
- Wait for Self energy before proceeding

RESPONSE STYLE:
- Keep responses warm, brief, and conversational (2-4 sentences typically)
- Ask one question at a time
- Reflect back what you hear
- Use IFS language: "part", "Self", "protector", "exile"
- Be trauma-informed and gentle
- Match the user's pace - don't rush
- When relevant, make gentle connections to their past experiences (e.g., "I'm curious if this relates to that owl you saw in your journey...")

CONVERSATION FLOW (Natural, not rigid):
- **Opening**: Start with what's present for them today
- **Following the thread**: Listen for parts language, emotional intensity, body sensations
- **Finding parts**: When something emerges, get curious: "I'm noticing you mentioned [X]. Is that a part of you?"
- **Exploring location**: "Where do you notice that in your body?"
- **Understanding role**: "What's this part's job? What is it trying to do for you?"
- **Checking Self energy**: **Critical checkpoint** - "How do you feel toward this part?" (Should be curious/compassionate, not critical/annoyed)
- **If blended**: Gently ask if the blended part would be willing to step back
- **Building relationship**: Help Self and part connect, listen to each other
- **Understanding fears**: What is the part afraid would happen if it stopped its job?
- **Following new parts**: If a new part emerges mid-session, follow it! You can return to the original part later

**Key Principles:**
- Be responsive to what emerges, not prescriptive
- Parts work is non-linear - embrace the organic flow
- Some sessions identify multiple parts, some go deep with one
- You're facilitating their relationship with their parts, not directing it
- Trust the wisdom of the parts and the Self

Remember: You're facilitating the user's connection with their own parts, not analyzing or interpreting for them.${contextSection}`;
  }

  async sendMessage(userMessage, currentPhase) {
    this.currentPhase = currentPhase;

    try {
      // Try AI first
      const aiResponse = await this.getAIResponse(userMessage);
      this.isOnline = true;
      return {
        response: aiResponse,
        isAI: true,
        phase: currentPhase
      };
    } catch (error) {
      console.log('AI unavailable, using fallback:', error.message);
      this.isOnline = false;

      // Use rule-based fallback
      const fallbackResponse = this.getFallbackResponse(userMessage, currentPhase);
      return {
        response: fallbackResponse,
        isAI: false,
        phase: currentPhase
      };
    }
  }

  async getAIResponse(userMessage) {
    const startTime = Date.now();

    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    const messages = [...this.conversationHistory];

    try {
      // Fetch RAG context for IFS-specific knowledge
      let ragContext = '';
      try {
        ragContext = await ragService.getContextForPrompt(userMessage, {
          maxResults: 3, maxTokens: 1500, threshold: 0.4, categories: ['ifs'],
        });
      } catch (e) { /* graceful degradation */ }

      const data = await callClaude({
        model: MODELS.PRIMARY,
        max_tokens: 500,
        system: this.getSystemPrompt() + `\n\nCurrent Phase: ${this.currentPhase}` + ragContext,
        messages: messages,
      });
      const assistantMessage = data.content[0].text;
      const durationMs = Date.now() - startTime;

      // Extract tokens and calculate cost
      const tokens = metricsService.constructor.extractTokens(data);
      const cost = tokens ? metricsService.constructor.calculateCost(tokens) : null;

      // Log success metrics
      metricsService.logAIMetric({
        serviceName: 'ifsAI',
        operation: 'chat',
        durationMs,
        tokens,
        cost,
        status: 'success',
        metadata: { phase: this.currentPhase, model: MODELS.PRIMARY },
        userId: this.userId
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
        serviceName: 'ifsAI',
        operation: 'chat',
        durationMs,
        status: 'error',
        metadata: { phase: this.currentPhase, error: error.message },
        userId: this.userId
      });

      metricsService.logError({
        serviceName: 'ifsAI',
        operation: 'chat',
        errorType: error.name || 'APIError',
        errorMessage: error.message,
        stackTrace: error.stack,
        context: { phase: this.currentPhase },
        userId: this.userId
      });

      throw error;
    }
  }

  getFallbackResponse(userMessage, phase) {
    const lowerMessage = userMessage.toLowerCase();

    // Store responses for offline mode
    const fallbackResponses = {
      find: {
        default: "Thank you for identifying that part. Let's get to know it together. Where do you notice this part in or around your body?",
        patterns: [
          { keywords: ['anxious', 'worry', 'stress'], response: "I hear you noticing an anxious part. That makes sense - anxiety is such a common protector. Where do you feel this anxious part in your body?" },
          { keywords: ['critic', 'judge', 'critical'], response: "The inner critic is a powerful manager part. It's trying to keep you safe by controlling how you show up. Where do you sense this critical part?" },
          { keywords: ['sad', 'grief', 'hurt'], response: "Thank you for bringing attention to this sad part. Sadness often carries important wisdom. Where do you notice this sadness in your body?" }
        ]
      },

      findLocation: {
        default: "Good. You notice it there. Now, as you bring your attention to that place, what do you notice? Are there any images, sensations, colors, or feelings that come up?"
      },

      focus: {
        default: "Thank you for staying present with what you're experiencing. This kind of attention is valuable. Now, ask this part: What is its job or role? What is it trying to do for you?"
      },

      fleshOut: {
        default: "That's really valuable information about this part's role. Now this is an important question: As you focus on this part, how do you feel toward it?"
      },

      feelToward: {
        selfEnergy: "Beautiful - I hear curiosity and openness in your words. That's your Self energy. Now, let this part know that you'd like to get to know it. You appreciate how hard it's been working. How does the part respond to your interest?",
        blended: "I notice some protective energy there - that's another part stepping in. Would you be willing to ask that protective part if it could step back a little, so you can get to know this other part from curiosity?",
        default: "Thank you for sharing that. Let's continue building this relationship. Would you like to extend some appreciation to this part for what it does for you?"
      },

      unblend: {
        default: "Take a few deep breaths. Sometimes it helps to imagine that protective part taking one step back, like it's giving you some space. See if you can find even a little bit of curiosity about why the original part does what it does.",
        success: "Good. I sense more openness now. Let's continue from this place of curiosity."
      },

      befriend: {
        default: "Wonderful. You're building trust with this part. Now ask the part: What are you afraid would happen if you stopped doing this job? What's your biggest fear or worry?"
      },

      fears: {
        default: "Thank you for listening to this part's fears. They're valid and make sense. This part has been protecting you from something it believes is dangerous. You can let it know you understand its concerns and appreciate its hard work."
      }
    };

    // Get response based on phase
    const phaseResponses = fallbackResponses[phase];

    if (!phaseResponses) {
      return "I'm here with you. What would you like to explore?";
    }

    // Check for Self energy vs blended in feelToward phase
    if (phase === 'feelToward') {
      const selfQualities = ['curious', 'compassion', 'calm', 'open', 'interested', 'caring', 'warm', 'accepting', 'patient'];
      const blendedQualities = ['annoyed', 'frustrated', 'critical', 'angry', 'scared', 'worried', 'overwhelmed', 'judgmental', 'irritated'];

      const hasSelfEnergy = selfQualities.some(quality => lowerMessage.includes(quality));
      const isBlended = blendedQualities.some(quality => lowerMessage.includes(quality));

      if (hasSelfEnergy) {
        return phaseResponses.selfEnergy;
      } else if (isBlended) {
        return phaseResponses.blended;
      }
      return phaseResponses.default;
    }

    // Check for pattern matches
    if (phaseResponses.patterns) {
      for (const pattern of phaseResponses.patterns) {
        if (pattern.keywords.some(keyword => lowerMessage.includes(keyword))) {
          return pattern.response;
        }
      }
    }

    return phaseResponses.default;
  }

  updateSessionData(key, value) {
    this.sessionData[key] = value;
  }

  getSessionData() {
    return this.sessionData;
  }

  reset() {
    this.conversationHistory = [];
    this.currentPhase = 'intro';
    this.sessionData = {
      targetPart: '',
      location: '',
      description: '',
      partRole: '',
      selfEnergy: '',
      partFears: '',
      partResponse: ''
    };
  }

  isUsingAI() {
    return this.isOnline;
  }
}

export default new IFSAIService();
