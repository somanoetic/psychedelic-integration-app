import config from './config';
import huxleyKnowledgeBase from './huxleyKnowledgeBase';

const ANTHROPIC_API_KEY = config.anthropicApiKey;

class IntegrationGuideService {
  constructor() {
    this.apiKey = ANTHROPIC_API_KEY;
    this.baseURL = 'https://api.anthropic.com/v1/messages';
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

  async continueConversation(message, context) {
    try {
      // Update session context
      this.sessionContext = { ...this.sessionContext, ...context };
      
      // Assess nervous system state from message
      const nervousSystemAssessment = this.assessNervousSystemFromMessage(message);
      
      // Determine if immediate regulation is needed
      if (nervousSystemAssessment.needsRegulation) {
        return this.generateRegulationResponse(nervousSystemAssessment);
      }

      // Build comprehensive prompt
      const prompt = this.buildEnhancedPrompt(message, context);
      
      // Get Claude response
      const claudeResponse = await this.callClaudeAPI(prompt);
      
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
      return this.generateSafetyResponse(context);
    }
  }

  buildEnhancedPrompt(message, context) {
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

    return basePrompt;
  }

  async callClaudeAPI(prompt) {
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.content[0].text;

    } catch (error) {
      console.error('Claude API error:', error);
      throw error;
    }
  }

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