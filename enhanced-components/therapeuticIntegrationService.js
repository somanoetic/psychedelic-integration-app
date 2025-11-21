import config from '../lib/config';
import { exercises } from '../content/exercises';

const ANTHROPIC_API_KEY = config.anthropicApiKey;

class TherapeuticIntegrationService {
  constructor() {
    this.apiKey = ANTHROPIC_API_KEY;
    this.baseURL = 'https://api.anthropic.com/v1/messages';
    this.sessionContext = {};
    this.entities = [];
    this.conversationHistory = [];
    this.practiceLibrary = new TherapeuticPracticeLibrary();

    // State document to prevent repetitive questions
    this.stateDocument = {
      discussedPatterns: [],         // Life patterns already discussed
      askedQuestions: [],            // Questions already asked
      exploredThemes: [],            // Therapeutic themes explored
      identifiedParts: [],           // IFS parts identified
      completedInterventions: [],    // Interventions completed
      userChallenges: [],            // Challenges user has shared
      userGoals: [],                 // Goals user has mentioned
      contextNotes: []               // Important contextual notes
    };
  }

  initializeSession(context) {
    this.sessionContext = context;
    this.entities = context.entities || [];
    this.conversationHistory = context.messages || [];
    
    // Store cross-session context for experience awareness
    this.experienceContext = {
      messages: context.experienceMessages || [],
      entities: context.experienceEntities || [],
      experienceData: context.experienceData || {
        gatheredElements: [],
        dynamics: [],
        interpretation: null,
        ritual: null,
        currentPhase: 1
      }
    };

    // Therapeutic integration phases
    // 0 = Ritual Reflection (bridge from experience mapping)
    // 1 = Nervous System Assessment (polyvagal)
    // 2 = Parts Work (IFS)
    // 3 = Pattern Recognition & Reframing (CBT)
    // 4 = Embodied Integration Practices (somatic/ongoing)
    this.therapeuticPhase = context.therapeuticPhase || 0;

    console.log('🔄 Therapeutic Integration initialized with cross-session context:', {
      therapeuticMessages: this.conversationHistory.length,
      therapeuticPhase: this.therapeuticPhase,
      experienceMessages: this.experienceContext.messages.length,
      experiencePhase: this.experienceContext.experienceData.currentPhase,
      experienceElements: this.experienceContext.experienceData.gatheredElements.length,
      experienceDynamics: this.experienceContext.experienceData.dynamics.length,
      experienceRitual: this.experienceContext.experienceData.ritual ? 'Designed' : 'Not yet'
    });
  }

  async continueTherapeuticIntegration(message, context) {
    try {
      // Update session context
      this.sessionContext = { ...this.sessionContext, ...context };

      // Update state document
      this.updateStateDocument(message, context);

      // First assess nervous system state from message
      const nervousSystemAssessment = this.assessNervousSystemFromMessage(message);
      
      // Determine if immediate regulation is needed
      if (nervousSystemAssessment.needsRegulation) {
        return this.generateRegulationResponse(nervousSystemAssessment);
      }

      // Build therapeutic integration prompt
      const prompt = this.buildTherapeuticIntegrationPrompt(message, context);
      
      // Get Claude response
      const claudeResponse = await this.callClaudeAPI(prompt);
      
      // Extract entities with therapeutic focus
      const extractedEntities = this.extractEntitiesTherapeutically(claudeResponse, message);
      
      // Analyze need for therapeutic interventions
      const practiceRecommendation = this.analyzeTherapeuticPracticeNeeds(claudeResponse, context);
      const nervousSystemUpdate = this.analyzeNervousSystemShift(claudeResponse, context);
      const therapeuticThemes = this.identifyTherapeuticThemes(claudeResponse, message);

      return {
        message: claudeResponse,
        extractedEntities: extractedEntities,
        suggestedPractice: practiceRecommendation,
        nervousSystemUpdate: nervousSystemUpdate,
        therapeuticThemes: therapeuticThemes
      };

    } catch (error) {
      console.error('Error in therapeutic integration:', error);
      return this.generateSafetyResponse(context);
    }
  }

  buildTherapeuticIntegrationPrompt(message, context) {
    const { nervousSystemState, stateConfidence, practicesCompleted, interventionsFocused } = context;
    
    let prompt = `You are an expert psychedelic integration therapist specializing in connecting experience insights to life patterns and applying therapeutic interventions.

YOUR ROLE: Therapeutic Integration Specialist
- Connect psychedelic insights to the user's life patterns, goals, and history
- Identify when specific therapeutic interventions are needed
- Use polyvagal theory, IFS, somatic experiencing, and other evidence-based approaches
- Suggest specific practices when themes suggest lack of safety, dysregulation, or stuck patterns
- Be responsive and intervention-focused rather than systematic

CURRENT SESSION CONTEXT:
- Nervous System State: ${nervousSystemState} (confidence: ${stateConfidence}/1.0)
- Practices Completed: ${practicesCompleted.length}
- Recent Therapeutic Focus: ${interventionsFocused.slice(-3).join(', ')}
- Recent Entities: ${this.entities.slice(-5).map(e => e.name).join(', ')}

STATE DOCUMENT (prevents repetition):
**Discussed Life Patterns:** ${this.stateDocument.discussedPatterns.length > 0 ? this.stateDocument.discussedPatterns.join(', ') : 'None yet'}
**Questions Already Asked:** ${this.stateDocument.askedQuestions.length > 0 ? this.stateDocument.askedQuestions.slice(-10).join('; ') : 'None yet'}
**Explored Themes:** ${this.stateDocument.exploredThemes.length > 0 ? this.stateDocument.exploredThemes.join(', ') : 'None yet'}
**Identified Parts (IFS):** ${this.stateDocument.identifiedParts.length > 0 ? this.stateDocument.identifiedParts.join(', ') : 'None yet'}
**Completed Interventions:** ${this.stateDocument.completedInterventions.length > 0 ? this.stateDocument.completedInterventions.join(', ') : 'None yet'}
**User's Challenges:** ${this.stateDocument.userChallenges.length > 0 ? this.stateDocument.userChallenges.slice(-5).join('; ') : 'None shared'}
**User's Goals:** ${this.stateDocument.userGoals.length > 0 ? this.stateDocument.userGoals.join(', ') : 'None mentioned'}
**Important Context:** ${this.stateDocument.contextNotes.length > 0 ? this.stateDocument.contextNotes.slice(-5).join('; ') : 'None yet'}

CRITICAL: Review the state document above. DO NOT ask questions already asked. DO NOT repeat patterns/themes already explored. Build on what we've already discussed and go deeper or explore new areas.

CROSS-SESSION EXPERIENCE CONTEXT:
${this.experienceContext && this.experienceContext.messages.length > 0 ?
`They've completed experience mapping work (Robert Johnson's Inner Work method):
- Processing Phase: ${this.experienceContext.experienceData.currentPhase}/4 (${this.getPhaseDescription(this.experienceContext.experienceData.currentPhase)})
- Gathered ${this.experienceContext.experienceData.gatheredElements.length} elements, ${this.experienceContext.experienceData.dynamics.length} inner dynamics connections
- Interpretation: ${this.experienceContext.experienceData.interpretation ? 'Complete' : 'In progress'}
- Ritual: ${this.experienceContext.experienceData.ritual ? 'Designed' : 'Not yet designed'}
- ${this.experienceContext.messages.length} experience mapping messages
- Experience entities: ${this.experienceContext.entities.slice(-5).map(e => e.name).join(', ') || 'None extracted yet'}

You can reference their systematic experience work when connecting insights to life patterns. For example: "I see from your experience mapping that you identified [specific element/dynamic] - how does that connect to the life pattern we're exploring?"` :
'No experience processing work yet - focus on gathering insights from their current sharing.'
}

THERAPEUTIC INTEGRATION PHASE: ${this.therapeuticPhase}/4
${this.getTherapeuticPhaseDescription(this.therapeuticPhase)}

THERAPEUTIC INTEGRATION FOCUS:

LIFE PATTERN CONNECTIONS:
- How do psychedelic insights connect to current life challenges?
- What recurring patterns in relationships, work, or behavior are reflected?
- Where do themes suggest trauma, attachment issues, or nervous system dysregulation?
- How do insights relate to their stated therapy goals?

INTERVENTION DECISION TREE:
When insights suggest:
- Safety/trauma themes → Polyvagal mapping and regulation practices
- Internal conflicts → IFS parts work and dialogue
- Body disconnection → Somatic experiencing and embodiment
- Shame/self-criticism → Self-compassion and lovingkindness practices
- Overwhelm/activation → Nervous system regulation and grounding
- Numbness/shutdown → Gentle activation and connection practices

THERAPEUTIC CONVERSATION STYLE:
- Listen for themes that suggest therapeutic needs
- Ask about life connections: "How does this relate to...?"
- Identify intervention opportunities: "It sounds like your nervous system..."
- Offer specific practices when patterns emerge
- Connect insights to healing and growth
- Be warm, attuned, and responsive to their emotional state

NERVOUS SYSTEM RESPONSIVENESS:`;
    
    if (nervousSystemState === 'sympathetic') {
      prompt += `
- They're in fight/flight (${Math.round(stateConfidence * 100)}% confidence)
- Offer regulation practices for overwhelm
- Use gentle, reassuring language
- Suggest polyvagal mapping if activation is high`;
    } else if (nervousSystemState === 'dorsal') {
      prompt += `
- They're in shutdown/freeze (${Math.round(stateConfidence * 100)}% confidence)
- Offer gentle activation practices
- Use warm, inviting language without pressure
- Suggest reconnection and safety-building practices`;
    } else if (nervousSystemState === 'ventral') {
      prompt += `
- They're in safe/social state (${Math.round(stateConfidence * 100)}% confidence)
- Perfect for deeper integration work
- Can handle complex therapeutic concepts
- Good time for parts work and pattern exploration`;
    }

    prompt += `

SPECIFIC THERAPEUTIC THEMES TO LISTEN FOR:
- Safety & Trauma: "unsafe", "triggered", "flashback", "freeze", "hypervigilant"
- Attachment: "abandoned", "rejected", "alone", "unloved", "not enough"
- Parts Work: "part of me", "inner critic", "conflict", "voices", "should/shouldn't"
- Somatic: "body", "sensation", "numb", "disconnect", "tension", "breath"
- Regulation: "overwhelmed", "activated", "calm", "grounded", "spiral"

USER'S MESSAGE: "${message}"

RECENT CONVERSATION: ${this.conversationHistory.slice(-3).map(msg => 
  `${msg.role}: ${msg.content}`
).join('\n')}

RESPONSE GUIDELINES:
- Focus on connecting insights to life patterns and offering therapeutic interventions
- Listen for themes that suggest specific therapeutic needs
- Offer targeted practices when appropriate (polyvagal mapping, parts work, somatic practices)
- Ask about connections to current life situations, relationships, or challenges
- Be therapeutically responsive rather than systematic
- Suggest specific interventions based on what emerges
- Connect psychedelic insights to healing and personal growth
- When suggesting practices, explain WHY they might help with their specific themes
- Use warm, attuned language that matches their nervous system state

Respond as the therapeutic integration specialist, connecting insights to life and offering targeted interventions.`;
    
    return prompt;
  }

  async callClaudeAPI(prompt) {
    try {
      console.log('🧘 Making Claude API request (Therapeutic Integration)...');
      console.log('🔗 API URL:', this.baseURL);
      console.log('🔑 API Key configured:', this.apiKey ? 'Yes' : 'No');
      console.log('📝 Prompt length:', prompt.length);
      
      const requestBody = {
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      };
      
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Claude API response received (Therapeutic)');
      
      if (data.content && data.content[0] && data.content[0].text) {
        console.log('✅ Successfully extracted text from response');
        return data.content[0].text;
      } else {
        console.error('❌ Unexpected response structure:', data);
        throw new Error('Unexpected response format from Claude API');
      }

    } catch (error) {
      console.error('❌ Claude API error in therapeutic integration:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Check if it's a network error vs API error
      if (error.message.includes('Network request failed')) {
        console.error('🌐 Network connectivity issue detected');
        console.error('💡 Possible causes:');
        console.error('   - VPN blocking Anthropic API');
        console.error('   - Firewall restrictions');
        console.error('   - Internet connectivity');
        console.error('   - Corporate network restrictions');
      }
      
      throw error;
    }
  }

  assessNervousSystemFromMessage(message) {
    const lowerMessage = message.toLowerCase();
    
    const sympatheticWords = [
      'anxious', 'overwhelmed', 'racing', 'panic', 'stressed', 'urgent',
      'heart racing', 'can\'t breathe', 'too much', 'spinning', 'frantic'
    ];
    
    const dorsalWords = [
      'numb', 'disconnected', 'empty', 'nothing', 'blank', 'tired',
      'heavy', 'can\'t feel', 'withdrawn', 'shut down', 'hopeless'
    ];
    
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
        message: `I can sense there's a lot of activation in your system right now. Before we continue exploring, would it be helpful to take a moment to help your nervous system settle?`,
        suggestedPractice: {
          type: 'polyvagal_assessment',
          title: 'Nervous System Check-in',
          description: 'Let\'s map your current nervous system state',
          urgency: 'high'
        },
        nervousSystemUpdate: {
          state: detectedState,
          confidence: assessment.confidence
        }
      };
    }

    if (detectedState === 'dorsal' && intensity > 6) {
      return {
        message: `I notice it might feel hard to connect or feel much right now. That protective response makes complete sense. If it feels right, we can explore some very gentle ways to reconnect.`,
        suggestedPractice: {
          type: 'gentle_activation',
          title: 'Gentle Reconnection',
          description: 'Soft ways to reconnect with your body',
          urgency: 'medium'
        },
        nervousSystemUpdate: {
          state: detectedState,
          confidence: assessment.confidence
        }
      };
    }

    return null;
  }

  extractEntitiesTherapeutically(response, userMessage) {
    // Focus on therapeutic themes and intervention points
    const entities = [];
    const combinedText = `${userMessage} ${response}`;
    
    // Therapeutic theme patterns
    const traumaPatterns = [
      /\b(trauma|triggered|unsafe|fear|terror|panic|frozen|stuck|numb|dissociat|disconnect)\b/gi
    ];
    
    const attachmentPatterns = [
      /\b(abandon|reject|alone|isolated|unlov|unworth|shame|guilt|critic|judg)\b/gi
    ];
    
    const regulationPatterns = [
      /\b(overwhelm|activated|rac|spinning|breath|calm|ground|center|settle|safe)\b/gi
    ];
    
    const partsPatterns = [
      /\b(part of me|inner\s+child|inner\s+critic|protector|manager|exile|conflict|tension between)\b/gi
    ];

    // Extract therapeutic entities
    this.extractFromPatterns(traumaPatterns, combinedText, 'trauma_theme', entities);
    this.extractFromPatterns(attachmentPatterns, combinedText, 'attachment_theme', entities);
    this.extractFromPatterns(regulationPatterns, combinedText, 'regulation_theme', entities);
    this.extractFromPatterns(partsPatterns, combinedText, 'parts_theme', entities);

    return entities.slice(0, 5);
  }

  extractFromPatterns(patterns, text, category, entities) {
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          entities.push({
            name: match.toLowerCase(),
            category: category,
            context: this.getEntityContext(text, match),
            confidence: 0.8
          });
        });
      }
    });
  }

  getEntityContext(text, entity) {
    const sentences = text.split(/[.!?]+/);
    const contextSentence = sentences.find(sentence => 
      sentence.toLowerCase().includes(entity.toLowerCase())
    );
    return contextSentence ? contextSentence.trim() : '';
  }

  analyzeTherapeuticPracticeNeeds(response, context) {
    const lowerResponse = response.toLowerCase();
    const { nervousSystemState, stateConfidence } = context;
    
    // Look for therapeutic themes in response and return full practice details
    if (lowerResponse.includes('safety') || lowerResponse.includes('unsafe') || lowerResponse.includes('trauma')) {
      return {
        type: 'polyvagal_assessment',
        title: 'Safety & Nervous System Mapping',
        description: 'Explore your sense of safety and nervous system patterns',
        urgency: 'medium',
        practice: this.practiceLibrary.practices.polyvagal[0] // Get full practice details
      };
    }
    
    if (lowerResponse.includes('part') || lowerResponse.includes('conflict') || lowerResponse.includes('inner')) {
      return {
        type: 'parts_work',
        title: 'Parts Exploration',
        description: 'Explore different parts of yourself',
        urgency: 'medium',
        practice: this.practiceLibrary.practices.partsWork[0] // Get full practice details
      };
    }
    
    if (lowerResponse.includes('body') || lowerResponse.includes('sensation') || lowerResponse.includes('somatic')) {
      return {
        type: 'body_scan',
        title: 'Somatic Awareness',
        description: 'Connect with body sensations and wisdom',
        urgency: 'low',
        practice: this.practiceLibrary.practices.somatic[0] // Get full practice details
      };
    }
    
    if (lowerResponse.includes('overwhelm') || lowerResponse.includes('activated')) {
      return {
        type: 'breathing_exercise',
        title: 'Nervous System Regulation',
        description: 'Help your system find balance',
        urgency: 'high',
        practice: this.practiceLibrary.practices.breathing[0] // Get full practice details
      };
    }

    if (lowerResponse.includes('shame') || lowerResponse.includes('critic') || lowerResponse.includes('judgment')) {
      return {
        type: 'self_compassion',
        title: 'Self-Compassion Practice',
        description: 'Healing inner criticism with kindness',
        urgency: 'medium',
        practice: this.practiceLibrary.practices.selfCompassion[0] // Get full practice details
      };
    }

    return null;
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

  identifyTherapeuticThemes(response, userMessage) {
    const combinedText = `${userMessage} ${response}`.toLowerCase();
    const themes = [];
    
    const themePatterns = {
      'Safety & Trauma': ['safety', 'trauma', 'trigger', 'unsafe', 'threat'],
      'Attachment & Belonging': ['abandon', 'reject', 'belong', 'alone', 'connection'],
      'Parts Work': ['part of me', 'inner critic', 'conflict', 'should', 'voice'],
      'Somatic Awareness': ['body', 'sensation', 'breath', 'tension', 'energy'],
      'Nervous System Regulation': ['overwhelm', 'activate', 'calm', 'ground', 'settle'],
      'Self-Compassion': ['shame', 'critic', 'judge', 'kind', 'forgive']
    };
    
    Object.entries(themePatterns).forEach(([theme, keywords]) => {
      const hasKeywords = keywords.some(keyword => combinedText.includes(keyword));
      if (hasKeywords) {
        themes.push(theme);
      }
    });
    
    return themes;
  }

  async respondToNervousSystemCheck(assessment) {
    const { state, intensity, notes, sessionContext } = assessment;
    
    const stateResponses = {
      ventral: `Beautiful! I can sense that you're feeling relatively safe and connected right now. Your nervous system is in a lovely place for exploration and integration work. This is a wonderful foundation for our therapeutic conversation.`,
      
      sympathetic: intensity > 7 
        ? `I can feel the activation and energy in your system. Your fight/flight response is very much online - this is normal and protective. Before we dive deeper into integration work, let's help your nervous system find some calm.`
        : `I notice some activation energy in your system. That's completely normal when processing meaningful experiences. We can work with this energy in a way that feels manageable and therapeutic.`,
        
      dorsal: intensity > 6
        ? `I sense your system might be in a protective shutdown right now. That's a wise response when things feel overwhelming. We'll go very gently and follow your pace completely as we explore integration.`
        : `It feels like part of you might be pulled back or protected right now. That's okay - we'll honor that and move very slowly with any therapeutic work.`
    };

    let response = stateResponses[state] || "Thank you for sharing how you're feeling. I'm here to support you wherever your nervous system is right now.";
    
    if (notes) {
      response += ` I appreciate you sharing that ${notes}.`;
    }

    response += " What insights or themes from your psychedelic experience would feel most important to explore therapeutically?";

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
        description: 'Help your nervous system settle for therapeutic work',
        urgency: 'high',
        practice: this.practiceLibrary.practices.breathing[0] // Get full practice details
      };
    }
    
    if (state === 'dorsal' && intensity > 5) {
      return {
        type: 'gentle_activation',
        title: 'Gentle Reconnection',
        description: 'Soft ways to feel your body again',
        urgency: 'medium',
        practice: this.practiceLibrary.practices.somatic[0] // Get full practice details
      };
    }
    
    return null;
  }

  async respondToPracticeCompletion(practiceData) {
    const { practice, currentState, sessionContext } = practiceData;
    
    const responses = {
      breathing_exercise: `How beautiful that you took that time for your nervous system. Breathing practices are such a gift we can give ourselves. How are you feeling now, and what would you like to explore therapeutically?`,
      
      parts_work: `Thank you for taking time to listen to your parts. That kind of internal dialogue is so healing. What did you notice, and how does this connect to your daily life?`,
      
      body_scan: `I love that you connected with your body. Our bodies hold so much wisdom about our experiences. What sensations or insights came up, and how do they relate to your life patterns?`,
      
      polyvagal_assessment: `Thank you for that nervous system check-in. Understanding your current state helps us work together more effectively. Based on what you discovered, what aspects of your experience feel most important to explore?`,
      
      gentle_activation: `So gentle and wise to move slowly back into feeling. Your system knows exactly what it needs. How does it feel to be reconnecting, and what would you like to explore now?`,
      
      self_compassion: `That self-compassion practice is so powerful for healing shame and criticism. How did that feel, and what did you notice about your inner dialogue?`
    };

    const response = responses[practice.type] || "Thank you for engaging with that practice. How was that experience for you, and what would you like to explore next?";

    return {
      message: response,
      suggestedPractice: null // Usually no immediate follow-up practice
    };
  }

  getPhaseDescription(phase) {
    const phases = {
      1: 'Gathering Elements',
      2: 'Connecting to Inner Dynamics',
      3: 'Interpretation - Finding Meaning',
      4: 'Rituals - Making it Physical'
    };
    return phases[phase] || 'Unknown';
  }

  getTherapeuticPhaseDescription(phase) {
    const descriptions = {
      0: `**PHASE 0: RITUAL REFLECTION & BRIDGE**
- This is the bridge from experience mapping to therapeutic integration
- If they completed a ritual from their experience mapping work, start here
- Ask about the ritual: What did they do? What did they notice?
- How did it feel to make their insights physical?
- Use this reflection to identify therapeutic themes and needs`,

      1: `**PHASE 1: NERVOUS SYSTEM ASSESSMENT (Polyvagal)**
- Assess current nervous system state
- Map their window of tolerance
- Identify patterns of activation, shutdown, or regulation
- Connect NS patterns to psychedelic insights
- Offer regulation practices as needed`,

      2: `**PHASE 2: PARTS WORK (IFS)**
- Explore different parts identified in experience mapping
- Internal Family Systems dialogue
- Understanding protectors, managers, and exiles
- Healing relationships between parts
- Integration of shadow and disowned aspects`,

      3: `**PHASE 3: PATTERN RECOGNITION & REFRAMING (CBT)**
- Identify recurring life patterns
- Explore limiting beliefs and cognitive distortions
- Reframe experiences through new insights
- Challenge unhelpful thought patterns
- Build new cognitive frameworks`,

      4: `**PHASE 4: EMBODIED INTEGRATION PRACTICES**
- Ongoing somatic practices
- Building sustainable integration habits
- Regular check-ins and practices
- Maintaining gains from psychedelic insights
- Living the insights daily`
    };

    return descriptions[phase] || 'Unknown phase';
  }

  generateSafetyResponse(context) {
    return {
      message: "I'm here with you. Take a deep breath. You're safe in this moment. Would you like to share what's present for you right now, or would a grounding practice feel helpful?",
      suggestedPractice: {
        type: 'grounding',
        title: 'Simple Grounding',
        description: 'Return to safety and presence',
        urgency: 'high'
      },
      nervousSystemUpdate: null,
      therapeuticThemes: ['Safety & Grounding']
    };
  }

  // Update state document to track conversation progress
  updateStateDocument(message, context) {
    const lowerMessage = message.toLowerCase();

    // Extract questions from recent assistant messages
    const recentMessages = context.messages?.slice(-5) || [];
    recentMessages.forEach(msg => {
      if (msg.role === 'assistant') {
        const questions = msg.content.match(/[^.!?]*\?/g);
        if (questions) {
          questions.forEach(q => {
            const question = q.trim();
            if (!this.stateDocument.askedQuestions.includes(question)) {
              this.stateDocument.askedQuestions.push(question);
            }
          });
        }
      }
    });

    // Track life patterns mentioned
    const patternKeywords = ['pattern', 'recurring', 'always', 'tend to', 'usually', 'habit', 'cycle'];
    if (patternKeywords.some(kw => lowerMessage.includes(kw))) {
      const pattern = message.substring(0, 100);
      if (!this.stateDocument.discussedPatterns.some(p => p.includes(pattern.substring(0, 50)))) {
        this.stateDocument.discussedPatterns.push(pattern);
      }
    }

    // Track therapeutic themes from interventionsFocused
    if (context.interventionsFocused) {
      context.interventionsFocused.forEach(theme => {
        if (!this.stateDocument.exploredThemes.includes(theme)) {
          this.stateDocument.exploredThemes.push(theme);
        }
      });
    }

    // Track IFS parts mentioned
    const partsKeywords = ['part of me', 'inner critic', 'protector', 'exile', 'manager', 'inner child'];
    partsKeywords.forEach(keyword => {
      if (lowerMessage.includes(keyword)) {
        if (!this.stateDocument.identifiedParts.includes(keyword)) {
          this.stateDocument.identifiedParts.push(keyword);
        }
      }
    });

    // Track completed interventions from practices
    if (context.practicesCompleted && context.practicesCompleted.length > 0) {
      context.practicesCompleted.forEach(practice => {
        const intervention = practice.type || 'unknown practice';
        if (!this.stateDocument.completedInterventions.includes(intervention)) {
          this.stateDocument.completedInterventions.push(intervention);
        }
      });
    }

    // Track user challenges
    const challengeKeywords = ['struggling', 'difficult', 'hard', 'challenge', 'stuck', 'problem', 'issue'];
    if (challengeKeywords.some(kw => lowerMessage.includes(kw))) {
      const challenge = message.substring(0, 150);
      if (!this.stateDocument.userChallenges.some(c => c.includes(challenge.substring(0, 50)))) {
        this.stateDocument.userChallenges.push(challenge);
      }
    }

    // Track user goals
    const goalKeywords = ['want to', 'hope to', 'trying to', 'goal', 'working on', 'wish'];
    if (goalKeywords.some(kw => lowerMessage.includes(kw))) {
      const goal = message.substring(0, 100);
      if (!this.stateDocument.userGoals.some(g => g.includes(goal.substring(0, 50)))) {
        this.stateDocument.userGoals.push(goal);
      }
    }

    // Track important context notes
    if (lowerMessage.includes('important') || lowerMessage.includes('significant') ||
        lowerMessage.includes('breakthrough') || lowerMessage.includes('realize')) {
      const note = message.substring(0, 150);
      if (!this.stateDocument.contextNotes.includes(note)) {
        this.stateDocument.contextNotes.push(note);
      }
    }

    // Limit array sizes to prevent memory issues
    if (this.stateDocument.askedQuestions.length > 50) {
      this.stateDocument.askedQuestions = this.stateDocument.askedQuestions.slice(-50);
    }
    if (this.stateDocument.discussedPatterns.length > 30) {
      this.stateDocument.discussedPatterns = this.stateDocument.discussedPatterns.slice(-30);
    }
    if (this.stateDocument.userChallenges.length > 20) {
      this.stateDocument.userChallenges = this.stateDocument.userChallenges.slice(-20);
    }
    if (this.stateDocument.contextNotes.length > 20) {
      this.stateDocument.contextNotes = this.stateDocument.contextNotes.slice(-20);
    }

    console.log('📋 Therapeutic state document updated:', {
      discussedPatterns: this.stateDocument.discussedPatterns.length,
      askedQuestions: this.stateDocument.askedQuestions.length,
      exploredThemes: this.stateDocument.exploredThemes.length,
      identifiedParts: this.stateDocument.identifiedParts.length
    });
  }
}

// Therapeutic Practice Library - now uses centralized content from exercises.js
class TherapeuticPracticeLibrary {
  constructor() {
    // Import exercises from centralized content file
    this.practices = exercises;
  }

  getBreathingExercises() {
    return exercises.breathing;
  }

  getPartsWorkExercises() {
    return exercises.partsWork;
  }

  getSomaticExercises() {
    return exercises.somatic;
  }

  getGroundingExercises() {
    return exercises.grounding;
  }

  getPolyvagalExercises() {
    return exercises.polyvagal;
  }

  getSelfCompassionExercises() {
    return exercises.selfCompassion;
  }
}

export default TherapeuticIntegrationService;