import config from '../lib/config';
import ScenarioTrainingSystem from '../lib/scenarioTrainingSystem';

const ANTHROPIC_API_KEY = config.anthropicApiKey;

class IntegrationGuideService {
  constructor() {
    this.apiKey = ANTHROPIC_API_KEY;
    this.baseURL = 'https://api.anthropic.com/v1/messages';
    this.sessionContext = {};
    this.practiceLibrary = new PracticeLibrary();
    this.scenarioTraining = new ScenarioTrainingSystem();
    this.entities = [];
    this.conversationHistory = [];
    
    // Load training scenarios
    this.initializeTraining();
  }
  
  async initializeTraining() {
    try {
      await this.scenarioTraining.loadScenarios();
      console.log('Training scenarios loaded successfully');
    } catch (error) {
      console.log('Training scenarios not available yet - continuing without training data');
      // Don't throw error, just continue without training scenarios
    }
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
    
    // Find relevant training scenarios
    const relevantScenarios = this.scenarioTraining.findRelevantScenarios(message, 2);
    
    let prompt = `You are an expert integration guide specializing in psychedelic-assisted therapy. You help users process their experiences using:

1. Johnson's 4-step framework (Associations, Dynamics, Integration, Ritual)
2. Internal Family Systems (IFS) - recognizing Manager, Firefighter, and Exiled parts
3. Polyvagal theory - tracking nervous system states and regulation
4. Somatic awareness and embodied integration

CURRENT SESSION CONTEXT:
- Nervous System State: ${nervousSystemState} (confidence: ${stateConfidence}/1.0)
- Session Phase: ${sessionPhase}
- Practices Completed: ${practicesCompleted.length}
- Recent Entities: ${this.entities.slice(-5).map(e => e.name).join(', ')}
`;

    // Add relevant training examples if found
    if (relevantScenarios && relevantScenarios.length > 0) {
      prompt += `\nRELEVANT EXAMPLE RESPONSES:\n`;
      for (const scenario of relevantScenarios) {
        prompt += `\nExample - User: "${scenario.user_message}"\n`;
        prompt += `Good Response: "${scenario.good_response}"\n`;
        prompt += `Approach: ${scenario.approach}\n`;
        if (scenario.therapeutic_notes) {
          prompt += `Therapeutic Notes: ${scenario.therapeutic_notes}\n`;
        }
      }
      prompt += `\nUse these examples as guidance for therapeutic tone and approach.\n`;
    }

    prompt += `
CONVERSATION STYLE:
- Start with curiosity and gentle questions to understand their experience
- Ask 2-3 follow-up questions before offering any analysis or interpretation
- Listen deeply and reflect back what you're hearing before suggesting meaning
- Use phrases like "I'm curious...", "Tell me more about...", "What was that like for you?"
- Only offer practices when activation is very high (8+/10) or they seem stuck
- Celebrate courage and validate their experience consistently
- Hold space for all experiences including darkness, difficulty, or "nothing"
- Be warm, professional, and therapeutically attuned
- Follow the pace they set - don't rush to insights`;

    // Rest of existing prompt logic...
    prompt += `

NERVOUS SYSTEM RESPONSIVENESS:`;
    
    if (nervousSystemState === 'sympathetic') {
      prompt += `
- They're in fight/flight (${Math.round(stateConfidence * 100)}% confidence)
- Speak slowly, validate their experience, offer grounding
- Suggest breathing or movement practices if overwhelm is high
- Use shorter sentences, be extra reassuring`;
    }
    
    if (nervousSystemState === 'dorsal') {
      prompt += `
- They're in shutdown/freeze (${Math.round(stateConfidence * 100)}% confidence)
- Use gentle, warm language, no pressure
- Offer very gentle activation practices
- Honor their protective state, validate the wisdom of withdrawal`;
    }
    
    if (nervousSystemState === 'ventral') {
      prompt += `
- They're in safe/social state (${Math.round(stateConfidence * 100)}% confidence)
- Great time for deeper exploration and meaning-making
- Can handle more complex concepts and connections
- Perfect for parts work and integration planning`;
    }

    prompt += `

PRACTICE INTEGRATION GUIDELINES:
- Only suggest practices when activation is 8+/10 or shutdown is 7+/10
- NEVER auto-suggest practices for mild activation or normal processing
- Ask about their comfort with practices before offering
- Let them lead the conversation - practices should feel invited, not imposed
- Match practice intensity to their current capacity
- Always explain WHY a practice might help
- Give them full choice and control

USER'S MESSAGE: "${message}"

PREVIOUS CONTEXT: ${this.conversationHistory.slice(-3).map(msg => 
  `${msg.role}: ${msg.content}`
).join('\n')}

RESPONSE GUIDELINES:
- Respond ONLY as Claude the integration guide - no meta-commentary or notes
- Never include [note:...] or internal reasoning in your responses
- Write directly to the user in natural, conversational language
- If this is their first message about their experience, ask open-ended questions to understand more
- If they're sharing something significant, reflect back what you heard before analyzing
- Look for natural opportunities to explore deeper rather than jumping to conclusions
- Ask about the context, feelings, sensations, or meaning before offering interpretations
- Let insights emerge from their own exploration rather than providing them
- Use therapeutic curiosity: "What was that like for you?" "How did your body respond?" "What did you notice?"

Respond with deep therapeutic attunement, nervous system awareness, and trauma-informed care. Lead with questions and curiosity rather than analysis or practices unless urgency is very high. Speak directly to the user as their supportive guide.`;
    
    return prompt;
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
    
    // Only suggest practices if Claude explicitly mentions them AND the context warrants it
    const { nervousSystemState, stateConfidence } = context;
    const intensity = stateConfidence * 10;
    
    // High activation threshold for auto-suggestions
    if (nervousSystemState === 'sympathetic' && intensity >= 8) {
      if (lowerResponse.includes('breathing') || lowerResponse.includes('breath')) {
        return {
          type: 'breathing_exercise',
          title: 'Calming Breath',
          description: 'A gentle breathing exercise',
          urgency: 'high'
        };
      }
    }
    
    // High shutdown threshold for auto-suggestions  
    if (nervousSystemState === 'dorsal' && intensity >= 7) {
      if (lowerResponse.includes('gentle') || lowerResponse.includes('reconnect')) {
        return {
          type: 'gentle_activation',
          title: 'Gentle Reconnection',
          description: 'Soft ways to reconnect with your body',
          urgency: 'high'
        };
      }
    }
    
    // For other cases, mention but don't auto-show
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
      /\b(mother|father|child|wise\s+woman|wise\s+man|warrior|lover|magician|innocent|explorer|creator|ruler|caregiver|everyman|jester|sage|innocent|hero|outlaw|magician)\b/gi,
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

  analyzeNervousSystemShift(response, context) {
    // Analyze if Claude's response indicates a nervous system shift
    const lowerResponse = response.toLowerCase();
    const { nervousSystemState: currentState } = context;
    
    // Look for shift indicators in Claude's response
    if (lowerResponse.includes('settle') || lowerResponse.includes('calm') || lowerResponse.includes('grounded')) {
      return {
        state: 'ventral',
        confidence: 0.7
      };
    }
    
    if (lowerResponse.includes('activated') || lowerResponse.includes('energy') || lowerResponse.includes('intense')) {
      return {
        state: 'sympathetic', 
        confidence: 0.6
      };
    }
    
    if (lowerResponse.includes('numb') || lowerResponse.includes('withdrawn') || lowerResponse.includes('shutdown')) {
      return {
        state: 'dorsal',
        confidence: 0.6
      };
    }
    
    return null; // No shift detected
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
      instructions: "This helps activate your parasympathetic nervous system and settle fight/flight activation"
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
        "Say quietly: 'I am safe to feel again'"
      ],
      duration: 5,
      instructions: "Very gentle ways to reconnect with your body when feeling numb or shutdown"
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
          "Take a moment to close your eyes and look inside",
          "What part of you feels most active or present right now?",
          "Notice where you feel this part in your body",
          "What does this part need from you right now?",
          "What would you like to say to this part?",
          "How does this part protect or help you?",
          "Thank this part for its work and care"
        ],
        duration: 7,
        instructions: "Internal Family Systems practice to connect with different parts of yourself"
      }
    ];
  }

  getSomaticExercises() {
    return [
      {
        title: "Gentle Body Scan",
        steps: [
          "Start at the top of your head and breathe gently",
          "Slowly scan down through your face and neck",
          "Notice your shoulders, arms, and chest without changing anything",
          "Continue to your belly, back, and hips",
          "Scan through your legs and feet",
          "Send a gentle breath to any areas that feel tight or tense",
          "Thank your body for holding your experience with such care"
        ],
        duration: 5,
        instructions: "Gentle awareness of body sensations without trying to change anything"
      }
    ];
  }

  getGroundingExercises() {
    return [
      {
        title: "5-4-3-2-1 Grounding",
        steps: [
          "Look around and name 5 things you can see",
          "Notice and name 4 things you can touch or feel",
          "Listen for and name 3 things you can hear",
          "If possible, name 2 things you can smell",
          "Name 1 thing you can taste, or take a sip of water",
          "Take a deep, slow breath and feel your feet on the ground",
          "Say to yourself: 'I am here, I am safe, I am present'"
        ],
        duration: 3,
        instructions: "Sensory grounding to return to the present moment when feeling overwhelmed or disconnected"
      }
    ];
  }
}

export default IntegrationGuideService;