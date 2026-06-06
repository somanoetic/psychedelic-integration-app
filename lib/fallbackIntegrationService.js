import { callClaude } from '../lib/claudeAPI';
import { MODELS } from '../lib/aiModels';

class FallbackIntegrationService {
  constructor() {
    this.sessionContext = {};
    this.entities = [];
    this.conversationHistory = [];
    this.offlineMode = false;

    // State document to prevent repetitive questions
    this.stateDocument = {
      discussedTopics: [],      // Topics already discussed
      askedQuestions: [],       // Questions already asked
      sharedExperiences: [],    // Experiences user has shared
      contextNotes: []          // Important contextual notes
    };
  }

  async continueConversation(message, context) {
    try {
      // Update state document
      this.updateStateDocument(message, context);

      // Try Claude API first
      const prompt = this.buildPrompt(message, context);
      const response = await this.callClaudeAPIWithFallback(prompt);

      return {
        message: response,
        extractedEntities: this.extractEntitiesBasic(response, message),
        isOffline: this.offlineMode
      };

    } catch (error) {
      console.error('Integration service error:', error);
      return this.generateOfflineResponse(message, context);
    }
  }

  async callClaudeAPIWithFallback(prompt) {
    try {
      const response = await this.callClaudeAPI(prompt);
      this.offlineMode = false;
      return response;
    } catch (error) {
      console.log('Claude API failed, switching to offline mode');
      this.offlineMode = true;
      throw error;
    }
  }

  async callClaudeAPI(prompt) {
    const data = await callClaude({
      model: MODELS.PRIMARY,
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    if (data.content && data.content[0] && data.content[0].text) {
      return data.content[0].text;
    } else {
      throw new Error('Unexpected response format from Claude API');
    }
  }

  buildPrompt(message, context) {
    return `You are a psychedelic integration guide. Help the user process their experience thoughtfully and safely.

STATE DOCUMENT (prevents repetition):
**Discussed Topics:** ${this.stateDocument.discussedTopics.length > 0 ? this.stateDocument.discussedTopics.join(', ') : 'None yet'}
**Questions Asked:** ${this.stateDocument.askedQuestions.length > 0 ? this.stateDocument.askedQuestions.slice(-5).join('; ') : 'None yet'}
**Shared Experiences:** ${this.stateDocument.sharedExperiences.length > 0 ? this.stateDocument.sharedExperiences.slice(-3).join('; ') : 'None yet'}

CRITICAL: Review the state document. DO NOT ask questions already asked. Build on what's been discussed.

Recent conversation:
${this.conversationHistory.slice(-2).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

User message: "${message}"

Respond with empathy and helpful guidance for integration.`;
  }

  generateOfflineResponse(message, context) {
    const lowerMessage = message.toLowerCase();
    
    // Pattern-based responses for common themes
    if (lowerMessage.includes('anxious') || lowerMessage.includes('scared') || lowerMessage.includes('overwhelm')) {
      return {
        message: `I can sense there's some activation in your system right now. That's completely understandable and normal when processing meaningful experiences.

While I'm having connectivity issues, here are some immediate grounding techniques:

**5-4-3-2-1 Grounding:**
- 5 things you can see
- 4 things you can touch
- 3 things you can hear
- 2 things you can smell
- 1 thing you can taste

**Breathing:**
- Breathe in for 4 counts
- Hold for 4 counts
- Exhale for 6 counts
- Repeat 5 times

You're safe in this moment. When connectivity returns, we can explore this experience more deeply together.

What feels most present for you right now?`,
        extractedEntities: [{ name: 'anxiety', category: 'emotional', confidence: 0.8 }],
        isOffline: true
      };
    }

    if (lowerMessage.includes('vision') || lowerMessage.includes('saw') || lowerMessage.includes('visual')) {
      return {
        message: `Thank you for sharing about the visual aspects of your experience. Visual elements in psychedelic journeys often carry deep symbolic meaning.

While I'm experiencing connectivity issues, I can still help you explore this:

**Questions to reflect on:**
- What colors stood out most to you?
- How did the visuals make you feel emotionally?
- Did any shapes, patterns, or beings appear?
- What was the overall quality of light or darkness?

You might want to:
- Draw or sketch what you remember
- Write down any words that come to mind
- Notice how these visuals connect to your current life

When my connection returns, we can dive deeper into the symbolic meanings and patterns.

What visual element felt most significant to you?`,
        extractedEntities: [{ name: 'visuals', category: 'visual', confidence: 0.9 }],
        isOffline: true
      };
    }

    if (lowerMessage.includes('body') || lowerMessage.includes('felt') || lowerMessage.includes('sensation')) {
      return {
        message: `Body sensations and somatic experiences are such an important part of psychedelic integration. Your body holds wisdom about the experience.

While I'm having connectivity issues, here's how you can continue this exploration:

**Body Awareness Practice:**
- Place your hands on your heart
- Take a few deep breaths
- Notice where in your body you still feel echoes of the experience
- Send breath and appreciation to those areas

**Reflection questions:**
- What physical sensations were strongest during your journey?
- How does your body feel different now?
- What areas of your body felt most alive or present?
- Were there any areas of tension or release?

Your body is an incredible integration tool. When connectivity returns, we can explore how these somatic experiences connect to your healing and growth.

What body sensation feels most important to explore?`,
        extractedEntities: [{ name: 'body sensations', category: 'somatic', confidence: 0.9 }],
        isOffline: true
      };
    }

    // Default offline response
    return {
      message: `I'm currently experiencing connectivity issues, but I'm still here to support your integration process.

While we work on reconnecting, you can continue your integration work:

**Document Your Experience:**
- Write down whatever comes to mind about your journey
- Note any symbols, colors, emotions, or sensations
- Record any insights or realizations
- Describe any beings or presences you encountered

**Self-Care Practices:**
- Stay hydrated and nourished
- Get gentle movement or rest as needed
- Connect with nature if possible
- Reach out to trusted friends or support people

**Integration Questions:**
- What felt most meaningful about your experience?
- How does it connect to your current life situation?
- What would you like to remember from this journey?
- What practices might help you embody these insights?

I'll be back online soon to explore your experience more deeply together. You're doing important work by taking time to process and integrate.

What aspect of your experience feels most alive for you right now?`,
      extractedEntities: this.extractEntitiesBasic(message, message),
      isOffline: true
    };
  }

  extractEntitiesBasic(response, userMessage) {
    const entities = [];
    const text = `${userMessage} ${response}`.toLowerCase();

    // Basic pattern matching for key themes
    const patterns = {
      'anxiety': /\b(anxious|scared|overwhelm|panic|fear)\b/gi,
      'love': /\b(love|heart|connection|warmth)\b/gi,
      'light': /\b(light|bright|glow|golden|silver)\b/gi,
      'nature': /\b(tree|forest|ocean|mountain|earth)\b/gi,
      'peace': /\b(peace|calm|serene|still)\b/gi,
      'energy': /\b(energy|vibrat|flow|current)\b/gi
    };

    Object.entries(patterns).forEach(([name, pattern]) => {
      if (pattern.test(text)) {
        entities.push({
          name: name,
          category: 'general',
          confidence: 0.7,
          context: 'offline extraction'
        });
      }
    });

    return entities.slice(0, 3);
  }

  // Update state document to track conversation progress
  updateStateDocument(message, context) {
    const lowerMessage = message.toLowerCase();

    // Track topics from message
    const topicKeywords = ['anxiety', 'fear', 'love', 'connection', 'visuals', 'body', 'sensation',
                           'insight', 'meaning', 'pattern', 'relationship', 'healing'];
    topicKeywords.forEach(topic => {
      if (lowerMessage.includes(topic)) {
        if (!this.stateDocument.discussedTopics.includes(topic)) {
          this.stateDocument.discussedTopics.push(topic);
        }
      }
    });

    // Track experiences shared
    if (lowerMessage.includes('saw') || lowerMessage.includes('felt') ||
        lowerMessage.includes('experienced') || lowerMessage.includes('happened')) {
      const experience = message.substring(0, 100);
      if (!this.stateDocument.sharedExperiences.some(e => e.includes(experience.substring(0, 30)))) {
        this.stateDocument.sharedExperiences.push(experience);
      }
    }

    // Track important notes
    if (lowerMessage.includes('important') || lowerMessage.includes('significant') ||
        lowerMessage.includes('powerful')) {
      const note = message.substring(0, 100);
      if (!this.stateDocument.contextNotes.includes(note)) {
        this.stateDocument.contextNotes.push(note);
      }
    }

    // Limit sizes
    if (this.stateDocument.discussedTopics.length > 20) {
      this.stateDocument.discussedTopics = this.stateDocument.discussedTopics.slice(-20);
    }
    if (this.stateDocument.sharedExperiences.length > 10) {
      this.stateDocument.sharedExperiences = this.stateDocument.sharedExperiences.slice(-10);
    }
    if (this.stateDocument.contextNotes.length > 10) {
      this.stateDocument.contextNotes = this.stateDocument.contextNotes.slice(-10);
    }
  }
}

export default FallbackIntegrationService;