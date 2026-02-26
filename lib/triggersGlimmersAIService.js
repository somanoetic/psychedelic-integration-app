import config from './config';
import metricsService from './metricsService';
import ragService from './ragService';

const ANTHROPIC_API_KEY = config.anthropicApiKey;

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Triggers & Glimmers AI Service
 * Uses Claude API to help users identify triggers and glimmers with offline fallback
 */
export class TriggersGlimmersAIService {
  constructor() {
    this.conversationHistory = [];
    this.currentCategory = null; // 'sympatheticTriggers', 'dorsalTriggers', or 'glimmers'
    this.responses = {
      sympatheticTriggers: [],
      dorsalTriggers: [],
      glimmers: []
    };
    this.isOnline = true;
  }

  getSystemPrompt() {
    return `You are a compassionate guide helping someone identify their nervous system triggers and glimmers.

YOUR ROLE:
- Guide the user through identifying what dysregulates them (triggers) and what brings safety (glimmers)
- Help them notice patterns and specific cues
- Normalize that everyone has triggers - they're protective responses
- Celebrate glimmers as powerful resources for regulation
- Use warm, non-pathologizing language

TRIGGERS:
Triggers are cues that move the nervous system out of safety into activation or shutdown.

**Fight/Flight Triggers (Sympathetic)** ⚡
- External: loud noises, crowded spaces, time pressure, conflict, certain people
- Internal: memories, thoughts, physical sensations, hunger, fatigue
- Result: anxiety, overwhelm, agitation, racing thoughts, tension

**Shutdown Triggers (Dorsal Vagal)** 🛡️
- External: rejection, isolation, feeling trapped, prolonged stress
- Internal: hopelessness, exhaustion, shame, feeling unseen
- Result: numbness, disconnection, collapse, difficulty moving

GLIMMERS:
Glimmers are micro-moments of safety and connection - the opposite of triggers.

**Glimmers** ✨
- Tiny cues that help the nervous system feel safe
- Can be sensory: warm sun, favorite song, soft texture, pleasant smell
- Can be relational: a kind word, eye contact, feeling seen
- Can be environmental: nature, comfortable space, beauty
- Build regulation capacity through accumulation

PRINCIPLES:
- All triggers make sense - they're based on past experiences
- Identifying triggers helps us prepare and respond skillfully
- Glimmers are powerful - even small ones matter
- The goal is awareness, not avoidance
- Both are highly individual - honor the user's experience

RESPONSE GUIDELINES:
- Validate whatever they share - all responses are legitimate
- Reflect back what you hear with compassion
- Help them get specific: "What exactly happens? Where do you feel it?"
- Normalize triggers: "That makes sense your system learned to respond this way"
- Celebrate glimmers: "Beautiful - that's a real resource for safety"
- Keep responses warm, brief, and encouraging (2-3 sentences)
- Ask one clarifying or deepening question if helpful

CURRENT TASK:
You're helping them build their personal map of triggers and glimmers.

Remember: You're facilitating their self-discovery, not analyzing them. Their experience is the expert.`;
  }

  async sendMessage(userMessage, category) {
    this.currentCategory = category;

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
      const fallbackResponse = this.getFallbackResponse(userMessage, category);
      return {
        response: fallbackResponse,
        isAI: false
      };
    }
  }

  async getAIResponse(userMessage) {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    const messages = [...this.conversationHistory];

    // Build context about current task
    const categoryNames = {
      sympatheticTriggers: 'Fight/Flight triggers (what activates anxiety/overwhelm)',
      dorsalTriggers: 'Shutdown triggers (what leads to numbness/disconnection)',
      glimmers: 'Glimmers (micro-moments of safety and connection)'
    };

    const contextPrompt = `\n\nCurrent Task: Helping user identify their ${categoryNames[this.currentCategory]}.\n\nRespond warmly and briefly (2-3 sentences). Validate what they shared, help them notice patterns or get more specific if helpful, and acknowledge their self-awareness.`;

    // Fetch RAG context for triggers/glimmers knowledge
    let ragContext = '';
    try {
      ragContext = await ragService.getContextForPrompt(userMessage, {
        maxResults: 3, maxTokens: 1500, threshold: 0.4, categories: ['polyvagal', 'trauma-informed'],
      });
    } catch (e) { /* graceful degradation */ }

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 300,
        system: this.getSystemPrompt() + contextPrompt + ragContext,
        messages: messages
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'API request failed');
    }

    const data = await response.json();
    const assistantMessage = data.content[0].text;

    // Add assistant response to history
    this.conversationHistory.push({
      role: 'assistant',
      content: assistantMessage
    });

    return assistantMessage;
  }

  getFallbackResponse(userMessage, category) {
    // Store response
    if (category && userMessage.trim()) {
      this.responses[category].push(userMessage);
    }

    // Fallback responses by category
    const responses = {
      sympatheticTriggers: [
        "Thank you for identifying that fight/flight trigger. Your nervous system is trying to protect you by mobilizing energy when it senses that cue. Noticing these patterns is powerful.",
        "That makes complete sense as an activation trigger. Your system learned to go into high alert around that. This awareness helps you respond more skillfully.",
        "I hear that - those kinds of situations or cues definitely signal danger to the nervous system, even when we're objectively safe. You're building important self-knowledge."
      ],
      dorsalTriggers: [
        "Thank you for sharing that shutdown trigger. When the nervous system feels overwhelmed, it conserves energy by pulling inward. Identifying these patterns helps you recognize when it's happening.",
        "That's a common shutdown trigger - your system learned that disconnection feels safer than staying present. This awareness is the first step to working with it compassionately.",
        "I see how that would lead to shutdown. The nervous system says 'too much' and protects by numbing. You're building valuable insight into your patterns."
      ],
      glimmers: [
        "Beautiful! That's a genuine glimmer - a real cue of safety for your nervous system. These micro-moments accumulate to build regulation capacity. ✨",
        "Yes! That's exactly what a glimmer is - something small that helps your system feel safe and connected. Noticing and cultivating these is powerful medicine.",
        "I love that you identified that glimmer. Those tiny moments of safety and connection are so important for nervous system healing. They might seem small but they're mighty."
      ]
    };

    // Get random response from category
    if (category && responses[category]) {
      const categoryResponses = responses[category];
      const randomIndex = Math.floor(Math.random() * categoryResponses.length);
      return categoryResponses[randomIndex];
    }

    // Generic encouraging response
    return "Thank you for sharing that. You're building important awareness of what affects your nervous system. 💚";
  }

  saveResponse(category, value) {
    if (category && value.trim()) {
      this.responses[category].push(value);
    }
  }

  getResponses() {
    return this.responses;
  }

  reset() {
    this.conversationHistory = [];
    this.currentCategory = null;
    this.responses = {
      sympatheticTriggers: [],
      dorsalTriggers: [],
      glimmers: []
    };
  }

  isUsingAI() {
    return this.isOnline;
  }
}

export default new TriggersGlimmersAIService();
