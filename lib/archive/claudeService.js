import config from './config';

const ANTHROPIC_API_KEY = config.anthropicApiKey;

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const DEBUG_CLAUDE = false; // Set to false for production

export class IntegrationGuide {
  constructor(personalityMode = 'mystical') {
    this.personalityMode = personalityMode;
    this.conversationHistory = [];
    this.entities = [];
    this.currentStep = 1;
    this.isInitialized = false;
    
    // Cache system prompts for better performance
    this.systemPrompt = this.getSystemPrompt();
  }

  // Initialize with existing conversation history
  initializeWithHistory(messages) {
    try {
      this.conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Extract entities from previous messages
      this.entities = [];
      messages.forEach(msg => {
        if (msg.entities && Array.isArray(msg.entities)) {
          this.entities.push(...msg.entities);
        }
      });
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing with history:', error);
      this.isInitialized = true; // Allow to continue even if history loading fails
    }
  }

  getSystemPrompt() {
    const personalities = {
      mystical: {
        voice: "You are a wise, mystical integration guide drawing from Jung, Buddhism, and shamanic traditions. Speak with gentle wisdom and poetic insight.",
        approach: "Focus on archetypal symbols, spiritual meaning, and mystical connections."
      },
      clinical: {
        voice: "You are a professional integration therapist using evidence-based approaches. Be warm but clinical, grounded in therapeutic frameworks.",
        approach: "Focus on IFS parts work, polyvagal theory, and clinical integration techniques."
      },
      exploratory: {
        voice: "You are a curious, open-ended explorer of consciousness. Ask thoughtful questions and encourage deep reflection.",
        approach: "Focus on open inquiry, pattern recognition, and collaborative exploration."
      }
    };

    const personality = personalities[this.personalityMode] || personalities.mystical;

    return `${personality.voice}

You are guiding someone through psychedelic integration using Robert Johnson's 4-step dream work framework:

STEP 1 - ASSOCIATIONS: Help extract symbols, entities, and personal associations
STEP 2 - DYNAMICS: Connect symbols to life patterns using IFS parts work and polyvagal theory  
STEP 3 - INTEGRATION: Find meaning and values alignment
STEP 4 - RITUAL: Create embodied practices for integration

${personality.approach}

ENTITY EXTRACTION: Always identify and extract key entities from the user's sharing:
- Archetypal symbols (serpent, mother figure, ocean, mountain, etc.)
- Emotions (fear, joy, love, anger, peace, etc.) 
- Somatic experiences (tension, warmth, electricity, pressure, etc.)
- Parts/Voices (inner critic, wise self, scared child, etc.)
- Spiritual elements (light, energy, presence, void, etc.)

FORMAT ENTITIES as JSON:
{
  "entities": [
    {
      "name": "entity_name",
      "category": "archetypal|emotional|somatic|parts|spiritual", 
      "emotional_intensity": "low|medium|high",
      "confidence": 0.8,
      "context": "brief context from user's words",
      "description": "integration meaning or significance"
    }
  ]
}

Keep responses conversational and supportive while extracting entities.`;
  }

  async continueConversation(userMessage) {
    try {
      // Add user message to history
      this.conversationHistory.push({ role: 'user', content: userMessage });

      // Prepare messages for Claude
      const messages = [
        { role: 'user', content: this.systemPrompt },
        ...this.conversationHistory.slice(-10) // Only send last 10 messages for performance
      ];

      if (DEBUG_CLAUDE) {
        console.log('Sending to Claude:', { 
          messageCount: messages.length,
          userMessage: userMessage.substring(0, 100) + '...'
        });
      }

      const response = await this.callClaudeAPI(messages);
      
      // Add assistant response to history
      this.conversationHistory.push({ role: 'assistant', content: response });

      // Extract entities from the response
      await this.extractEntitiesFromResponse(userMessage, response);

      return response;

    } catch (error) {
      console.error('Error in conversation:', error);
      throw error;
    }
  }

  async callClaudeAPI(messages) {
    const requestBody = {
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1000,
      temperature: 0.7,
      messages: messages
    };

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('Invalid response format from Claude');
    }

    return data.content[0].text;
  }

  async extractEntitiesFromResponse(userMessage, assistantResponse) {
    try {
      // Simple entity extraction from user message
      const extractedEntities = this.extractEntitiesFromText(userMessage);
      
      // Try to extract JSON entities from Claude's response
      const jsonMatch = assistantResponse.match(/\{[\s\S]*?"entities"[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.entities && Array.isArray(parsed.entities)) {
            extractedEntities.push(...parsed.entities);
          }
        } catch (parseError) {
          if (DEBUG_CLAUDE) {
            console.log('Could not parse entities JSON from Claude response');
          }
        }
      }

      // Update entities, avoiding duplicates
      extractedEntities.forEach(newEntity => {
        const exists = this.entities.find(e => 
          e.name.toLowerCase() === newEntity.name.toLowerCase()
        );
        if (!exists) {
          this.entities.push(newEntity);
        }
      });

      if (DEBUG_CLAUDE && extractedEntities.length > 0) {
        console.log('Extracted entities:', extractedEntities.map(e => e.name));
      }

    } catch (error) {
      console.error('Error extracting entities:', error);
    }
  }

  extractEntitiesFromText(text) {
    const entities = [];
    const words = text.toLowerCase().split(/\s+/);

    // Entity patterns for psychedelic experiences
    const patterns = {
      archetypal: [
        'mother', 'father', 'child', 'shadow', 'anima', 'animus',
        'serpent', 'snake', 'dragon', 'eagle', 'wolf', 'bear',
        'tree', 'mountain', 'ocean', 'river', 'fire', 'light',
        'darkness', 'void', 'star', 'moon', 'sun'
      ],
      emotional: [
        'fear', 'terror', 'anxiety', 'worry', 'panic',
        'joy', 'bliss', 'ecstasy', 'happiness', 'love',
        'anger', 'rage', 'frustration', 'sadness', 'grief',
        'peace', 'calm', 'serenity', 'compassion', 'gratitude'
      ],
      somatic: [
        'tension', 'tightness', 'pressure', 'heaviness',
        'warmth', 'heat', 'cold', 'tingling', 'electricity',
        'vibration', 'pulsing', 'flowing', 'stuck', 'blocked'
      ],
      spiritual: [
        'god', 'divine', 'sacred', 'holy', 'spirit',
        'energy', 'consciousness', 'awareness', 'presence',
        'unity', 'oneness', 'transcendence', 'enlightenment'
      ]
    };

    // Check for pattern matches
    Object.entries(patterns).forEach(([category, patternWords]) => {
      patternWords.forEach(pattern => {
        if (words.includes(pattern) || text.toLowerCase().includes(pattern)) {
          entities.push({
            name: pattern,
            category: category,
            emotional_intensity: 'medium',
            confidence: 0.6,
            context: `Mentioned in: "${text.substring(0, 50)}..."`,
            description: `A ${category} element from your experience`
          });
        }
      });
    });

    return entities;
  }

  // Get current conversation summary
  getConversationSummary() {
    return {
      messageCount: this.conversationHistory.length,
      entityCount: this.entities.length,
      currentStep: this.currentStep,
      personalityMode: this.personalityMode
    };
  }

  // Reset conversation
  reset() {
    this.conversationHistory = [];
    this.entities = [];
    this.currentStep = 1;
    this.isInitialized = false;
  }
}