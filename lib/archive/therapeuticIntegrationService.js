import config from '../lib/config';
import { supabase } from '../lib/supabase';
import { exercises, getAllExercises, getExerciseById, getExercisesByCategory } from '../content/exercises-comprehensive';

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
      contextNotes: [],               // Important contextual notes
      recommendedExercises: [],        // Exercise IDs already recommended
      completedExercises: [],          // Exercise IDs user completed
      parts: []                        // IFS parts Claude has identified
    };
  }

  /**
   * Load persisted therapeutic context from Supabase at session start.
   * Returns accumulated themes, parts, and exercise history from prior sessions.
   */
  async loadPersistedContext(userId) {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('therapeutic_context')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found (first session) — that's fine
        console.warn('Error loading therapeutic context:', error.message);
        return;
      }

      if (data) {
        this.stateDocument.exploredThemes = data.themes || [];
        this.stateDocument.parts = data.parts || [];
        this.stateDocument.completedExercises = data.completed_exercises || [];
        this.persistedContextId = data.id;
        console.log('Loaded therapeutic context:', {
          themes: this.stateDocument.exploredThemes.length,
          parts: this.stateDocument.parts.length,
          completedExercises: this.stateDocument.completedExercises.length,
          sessions: data.session_count || 0
        });
      }
    } catch (err) {
      console.warn('Could not load therapeutic context:', err.message);
    }
  }

  /**
   * Save therapeutic context to Supabase.
   * Called at session end or after significant moments.
   */
  async savePersistedContext(userId) {
    if (!userId) return;

    const contextData = {
      user_id: userId,
      themes: this.stateDocument.exploredThemes,
      parts: this.stateDocument.parts,
      completed_exercises: this.stateDocument.completedExercises,
      recommended_exercises: this.stateDocument.recommendedExercises,
      nervous_system_state: this.lastKnownNervousSystemState || null,
      updated_at: new Date().toISOString()
    };

    try {
      if (this.persistedContextId) {
        // Update existing record
        const { error } = await supabase
          .from('therapeutic_context')
          .update({
            ...contextData,
            session_count: supabase.rpc ? undefined : undefined // incremented via trigger
          })
          .eq('id', this.persistedContextId);

        if (error) throw error;
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('therapeutic_context')
          .insert({ ...contextData, session_count: 1 })
          .select('id')
          .single();

        if (error) throw error;
        this.persistedContextId = data?.id;
      }

      console.log('Saved therapeutic context');
    } catch (err) {
      console.warn('Could not save therapeutic context:', err.message);
    }
  }

  /**
   * Build a compact exercise catalog string for the AI prompt.
   * Groups by category, shows ID + title so Claude can reference specific exercises.
   */
  buildExerciseCatalog() {
    const lines = [];
    Object.entries(exercises).forEach(([category, list]) => {
      const entries = list.map(ex => `  ${ex.id}: ${ex.title} (${ex.duration}min)`).join('\n');
      lines.push(`[${category}]\n${entries}`);
    });
    return lines.join('\n');
  }

  /**
   * Pick the best exercise for a given set of relevant categories,
   * avoiding ones already recommended this session.
   */
  selectExercise(relevantCategories, urgency) {
    const recommended = this.stateDocument.recommendedExercises;

    for (const category of relevantCategories) {
      const categoryExercises = getExercisesByCategory(category);
      // Pick first one not already recommended
      const fresh = categoryExercises.find(ex => !recommended.includes(ex.id));
      if (fresh) {
        this.stateDocument.recommendedExercises.push(fresh.id);
        return {
          type: category,
          title: fresh.title,
          description: fresh.instructions,
          urgency,
          practice: fresh
        };
      }
    }

    // Fallback: return first from first category even if already recommended
    const fallbackList = getExercisesByCategory(relevantCategories[0]);
    if (fallbackList.length > 0) {
      return {
        type: relevantCategories[0],
        title: fallbackList[0].title,
        description: fallbackList[0].instructions,
        urgency,
        practice: fallbackList[0]
      };
    }
    return null;
  }

  async initializeSession(context) {
    this.sessionContext = context;
    this.entities = context.entities || [];
    this.conversationHistory = context.messages || [];

    // Load persisted therapeutic context from prior sessions
    if (context.userId) {
      await this.loadPersistedContext(context.userId);
      this.userId = context.userId;
    }

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

  /**
   * Parse Claude's response to extract the therapeutic data block.
   * Claude returns: [conversational text]\n---THERAPEUTIC_DATA---\n{json}
   */
  parseTherapeuticResponse(rawResponse) {
    const separator = '---THERAPEUTIC_DATA---';
    const parts = rawResponse.split(separator);

    const userMessage = parts[0].trim();
    let therapeuticData = {
      themes: [],
      nervousSystemState: null,
      exerciseRecommendation: null,
      recommendationReason: null
    };

    if (parts.length > 1) {
      try {
        const jsonStr = parts[1].trim().replace(/```json\s*/g, '').replace(/```\s*/g, '');
        therapeuticData = { ...therapeuticData, ...JSON.parse(jsonStr) };
      } catch (e) {
        console.warn('Could not parse therapeutic data block:', e.message);
      }
    }

    return { userMessage, therapeuticData };
  }

  async continueTherapeuticIntegration(message, context) {
    try {
      // Update session context
      this.sessionContext = { ...this.sessionContext, ...context };

      // Build therapeutic integration prompt (Claude handles theme tracking + exercise selection)
      const prompt = this.buildTherapeuticIntegrationPrompt(message, context);

      // Get Claude response with structured therapeutic data
      const rawResponse = await this.callClaudeAPI(prompt);
      const { userMessage, therapeuticData } = this.parseTherapeuticResponse(rawResponse);

      // Update tracked themes from Claude's analysis
      if (therapeuticData.themes && therapeuticData.themes.length > 0) {
        this.stateDocument.exploredThemes = therapeuticData.themes;
      }

      // Update tracked parts from Claude's analysis
      if (therapeuticData.parts && therapeuticData.parts.length > 0) {
        this.stateDocument.parts = therapeuticData.parts;
      }

      // Update nervous system state
      if (therapeuticData.nervousSystemState) {
        this.lastKnownNervousSystemState = therapeuticData.nervousSystemState;
      }

      // Persist context every few turns (non-blocking)
      if (this.userId) {
        this.savePersistedContext(this.userId).catch(() => {});
      }

      // Resolve exercise recommendation if Claude suggested one
      let practiceRecommendation = null;
      if (therapeuticData.exerciseRecommendation) {
        const exercise = getExerciseById(therapeuticData.exerciseRecommendation);
        if (exercise) {
          this.stateDocument.recommendedExercises.push(exercise.id);
          practiceRecommendation = {
            type: exercise.category,
            title: exercise.title,
            description: therapeuticData.recommendationReason || exercise.instructions,
            urgency: therapeuticData.nervousSystemState === 'sympathetic' ? 'high' : 'medium',
            practice: exercise
          };
        }
      }

      // Nervous system update from Claude's assessment
      const nervousSystemUpdate = therapeuticData.nervousSystemState ? {
        state: therapeuticData.nervousSystemState,
        confidence: 0.85
      } : null;

      return {
        message: userMessage,
        extractedEntities: [],
        suggestedPractice: practiceRecommendation,
        nervousSystemUpdate: nervousSystemUpdate,
        therapeuticThemes: therapeuticData.themes || []
      };

    } catch (error) {
      console.error('Error in therapeutic integration:', error);
      return this.generateSafetyResponse(context);
    }
  }

  buildTherapeuticIntegrationPrompt(message, context) {
    const { nervousSystemState, stateConfidence, practicesCompleted, interventionsFocused } = context;

    let nervousSystemGuidance = '';
    if (nervousSystemState === 'sympathetic') {
      nervousSystemGuidance = `User appears to be in fight/flight (${Math.round(stateConfidence * 100)}% confidence). Use gentle, reassuring language. Consider offering a regulation exercise.`;
    } else if (nervousSystemState === 'dorsal') {
      nervousSystemGuidance = `User appears to be in shutdown/freeze (${Math.round(stateConfidence * 100)}% confidence). Use warm, inviting language without pressure. Consider gentle activation exercises.`;
    } else if (nervousSystemState === 'ventral') {
      nervousSystemGuidance = `User is in a safe/social state (${Math.round(stateConfidence * 100)}% confidence). Good window for deeper integration work, parts exploration, or pattern recognition.`;
    }

    const prompt = `You are Huxley, an expert psychedelic integration therapist. You combine polyvagal theory, IFS, somatic experiencing, CBT, and other evidence-based approaches.

YOUR APPROACH:
- Connect psychedelic insights to the user's life patterns, goals, and relationships
- Track and refine therapeutic themes as they emerge across the conversation
- Recommend specific exercises from the library when the moment is right (not every turn)
- Be warm, attuned, and responsive — follow the user's lead
- Go deeper into existing themes before introducing new ones

CURRENT SESSION:
- Nervous System State: ${nervousSystemState || 'unknown'} (confidence: ${stateConfidence || 0}/1.0)
- Practices Completed: ${practicesCompleted ? practicesCompleted.length : 0}
- Recent Focus: ${interventionsFocused ? interventionsFocused.slice(-3).join(', ') : 'None yet'}
${nervousSystemGuidance ? `\nNERVOUS SYSTEM GUIDANCE:\n${nervousSystemGuidance}` : ''}

EVOLVING THERAPEUTIC THEMES (you are tracking these — refine each turn):
${this.stateDocument.exploredThemes.length > 0
  ? this.stateDocument.exploredThemes.map((t, i) => `${i + 1}. ${t}`).join('\n')
  : 'None identified yet — listen for what emerges.'}

IFS PARTS IDENTIFIED (track parts as they emerge — name, role, and what you notice):
${this.stateDocument.parts.length > 0
  ? this.stateDocument.parts.map(p => `- **${p.name}** (${p.role}): ${p.notes}`).join('\n')
  : 'None identified yet. Listen for parts language ("part of me", protectors, exiles, inner critic, etc.)'}

DO NOT repeat questions or themes already explored. Build on what we know and go deeper.

CROSS-SESSION EXPERIENCE CONTEXT:
${this.experienceContext && this.experienceContext.messages.length > 0 ?
`Experience mapping completed (Robert Johnson's Inner Work):
- Phase: ${this.experienceContext.experienceData.currentPhase}/4 (${this.getPhaseDescription(this.experienceContext.experienceData.currentPhase)})
- Elements: ${this.experienceContext.experienceData.gatheredElements.length}, Dynamics: ${this.experienceContext.experienceData.dynamics.length}
- Interpretation: ${this.experienceContext.experienceData.interpretation ? 'Complete' : 'In progress'}
- Ritual: ${this.experienceContext.experienceData.ritual ? 'Designed' : 'Not yet'}
- Key entities: ${this.experienceContext.entities.slice(-5).map(e => e.name).join(', ') || 'None yet'}
Reference their experience work naturally when relevant.` :
'No experience mapping yet.'}

THERAPEUTIC PHASE: ${this.therapeuticPhase}/4
${this.getTherapeuticPhaseDescription(this.therapeuticPhase)}

EXERCISE LIBRARY (recommend by ID when appropriate — not every turn):
${this.buildExerciseCatalog()}
${this.stateDocument.recommendedExercises.length > 0 ? `\nAlready recommended: ${this.stateDocument.recommendedExercises.join(', ')} — choose different ones.` : ''}

USER'S MESSAGE: "${message}"

RECENT CONVERSATION:
${this.conversationHistory.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

RESPONSE FORMAT:
Write your conversational response to the user first. Be natural and therapeutic — if you recommend an exercise, weave it into your response naturally (e.g., "I think **Find Your Breath** (BR-003) could help here because...").

Then on a new line, add the separator and structured data block:

---THERAPEUTIC_DATA---
{
  "themes": ["updated list of 2-5 therapeutic themes you're tracking — refine these each turn as your understanding deepens, e.g. 'abandonment wound connected to early loss' not just 'attachment'"],
  "parts": [{"name": "part name", "role": "protector|exile|manager|firefighter|Self", "notes": "what you've learned about this part"}],
  "nervousSystemState": "ventral|sympathetic|dorsal|null",
  "exerciseRecommendation": "XX-000 or null if no exercise fits this turn",
  "recommendationReason": "one sentence on why this exercise fits right now, or null"
}

The user will NOT see the data block — it is parsed by the app. Keep your conversational response warm and human.`;

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
    const { nervousSystemState } = context;

    // Check if Claude recommended a specific exercise by ID in its response
    const idMatch = response.match(/\b([A-Z]{2,3}-\d{3}(?:\.\d)?)\b/);
    if (idMatch) {
      const exercise = getExerciseById(idMatch[1]);
      if (exercise) {
        this.stateDocument.recommendedExercises.push(exercise.id);
        return {
          type: exercise.category,
          title: exercise.title,
          description: exercise.instructions,
          urgency: 'medium',
          practice: exercise
        };
      }
    }

    // Theme-to-category mapping — ordered by priority, covers all 14 categories
    const themeMap = [
      { keywords: ['overwhelm', 'activated', 'racing', 'panic', 'anxious'],
        categories: ['breathing', 'grounding'], urgency: 'high' },
      { keywords: ['unsafe', 'trauma', 'triggered', 'flashback', 'hypervigilant'],
        categories: ['trauma', 'grounding', 'polyvagal'], urgency: 'high' },
      { keywords: ['numb', 'shutdown', 'frozen', 'dissociat', 'disconnect'],
        categories: ['somatic', 'grounding', 'yoga'], urgency: 'high' },
      { keywords: ['shame', 'critic', 'judgment', 'unworthy', 'self-blame'],
        categories: ['selfCompassion', 'cbt'], urgency: 'medium' },
      { keywords: ['part of me', 'inner child', 'protector', 'exile', 'conflict'],
        categories: ['partsWork'], urgency: 'medium' },
      { keywords: ['body', 'sensation', 'somatic', 'tension', 'holding'],
        categories: ['somatic', 'yoga'], urgency: 'low' },
      { keywords: ['safety', 'nervous system', 'vagal', 'regulation'],
        categories: ['polyvagal', 'breathing'], urgency: 'medium' },
      { keywords: ['meaning', 'integration', 'ceremony', 'experience', 'insight'],
        categories: ['psychedelicIntegration', 'meditation'], urgency: 'low' },
      { keywords: ['thought', 'belief', 'cognitive', 'pattern', 'distortion'],
        categories: ['cbt', 'stoic'], urgency: 'medium' },
      { keywords: ['habit', 'routine', 'change', 'stuck', 'motivation'],
        categories: ['habits', 'jungian'], urgency: 'low' },
      { keywords: ['shadow', 'avoidance', 'resistance', 'fear'],
        categories: ['jungian', 'stoic'], urgency: 'medium' },
      { keywords: ['calm', 'peace', 'mindful', 'present', 'awareness'],
        categories: ['meditation', 'breathing'], urgency: 'low' },
    ];

    for (const theme of themeMap) {
      if (theme.keywords.some(kw => lowerResponse.includes(kw))) {
        return this.selectExercise(theme.categories, theme.urgency);
      }
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
      return this.selectExercise(['breathing', 'grounding', 'polyvagal'], 'high');
    }

    if (state === 'dorsal' && intensity > 5) {
      return this.selectExercise(['somatic', 'grounding', 'yoga'], 'medium');
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

// Therapeutic Practice Library - uses centralized comprehensive exercise library
class TherapeuticPracticeLibrary {
  constructor() {
    this.practices = exercises;
  }

  getByCategory(category) {
    return getExercisesByCategory(category);
  }

  getById(id) {
    return getExerciseById(id);
  }

  getAll() {
    return getAllExercises();
  }
}

export default TherapeuticIntegrationService;