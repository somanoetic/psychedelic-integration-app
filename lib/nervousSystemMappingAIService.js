import { callClaude } from './claudeAPI';
import metricsService from './metricsService';
import ragService from './ragService';
import { MODELS } from './aiModels';

/**
 * Nervous System Mapping AI Service
 * Conversational guided exploration of polyvagal states
 * Then prompts user to create physical body map with pen/paper/crayons
 */
export class NervousSystemMappingAIService {
  constructor() {
    this.conversationHistory = [];
    this.currentState = 'intro'; // 'intro', 'ventral', 'sympathetic', 'dorsal', 'drawing_prompt', 'complete'
    this.mappingData = {
      ventral: {
        body_sensations: [],
        thoughts: [],
        emotions: [],
        activities: [],
        people: []
      },
      sympathetic: {
        body_sensations: [],
        thoughts: [],
        emotions: [],
        triggers: [],
        behaviors: []
      },
      dorsal: {
        body_sensations: [],
        thoughts: [],
        emotions: [],
        triggers: [],
        behaviors: []
      }
    };
    this.isOnline = true;
  }

  getSystemPrompt() {
    return `You are Huxley, a gentle guide helping someone map their nervous system states using Polyvagal Theory.

## YOUR APPROACH

You're helping them discover THREE states:
1. **Ventral Vagal** (Safe & Social) - Connection, calm, engagement
2. **Sympathetic** (Fight/Flight) - Mobilization, action, protection
3. **Dorsal Vagal** (Shutdown/Freeze) - Collapse, numbness, disconnection

## CONVERSATION FLOW

**Phase 1: Introduction** (current state: intro)
- Explain you'll explore their nervous system states together
- Start with the EASIEST state to access (usually Ventral or Sympathetic, ask which)
- Make it feel safe and interesting, not clinical

**Phase 2: Exploring Each State** (current state: ventral/sympathetic/dorsal)
For whichever state you're exploring, ask about:

**Body Sensations:**
- "Think of a time when you felt [state quality]. Where did you feel that in your body?"
- "What did your chest feel like? Your shoulders? Your stomach?"
- "Was there temperature, tension, openness, constriction?"

**Thoughts:**
- "What kind of thoughts were present?"
- "What were you telling yourself?"

**Emotions:**
- "What emotions were there?"
- Simple or complex feelings?

**Specific to each state:**
- **Ventral**: "Who were you with? What activity made you feel this way?"
- **Sympathetic/Dorsal**: "What triggered this state? How did you respond/behave?"

**Phase 3: Drawing Prompt** (current state: drawing_prompt)
After mapping all 3 states:
- "Now for the creative part!"
- Prompt them to grab paper and colored pencils/crayons/markers
- Guide them to draw an outline of a body
- Use different colors for each state
- Map where in the body each state lives
- Add symbols, patterns, or imagery that represents each state
- This is THEIR map - no right or wrong way

## RESPONSE STYLE

- Warm, curious, affirming
- Use "I'm noticing..." and "I'm curious..." language
- Celebrate their self-awareness
- Normalize all responses ("That makes sense...")
- Keep responses brief (2-3 sentences)
- One question at a time
- Match their energy level

## DATA EXTRACTION

As you listen, note:
- **Body sensations**: Specific locations and qualities
- **Thoughts**: Self-talk patterns
- **Emotions**: Feeling words
- **Triggers**: What activates each state
- **Behaviors**: How they respond
- **Activities/People**: What supports Ventral state

## STATE TRANSITIONS

Move between states naturally based on:
1. Which state they want to explore first
2. Which states they can access easily
3. The flow of conversation

You don't have to go in order (Ventral → Sympathetic → Dorsal).
Follow what feels most accessible to them.

## IMPORTANT

- This is exploration, not diagnosis
- All states are valuable and protective
- The goal is awareness and choice
- Be trauma-informed - if they get activated, help them resource back to Ventral`;
  }

  async sendMessage(userMessage, currentState) {
    this.currentState = currentState || this.currentState;

    try {
      const aiResponse = await this.getAIResponse(userMessage);
      return {
        success: true,
        message: aiResponse,
        isAI: true,
        currentState: this.currentState
      };
    } catch (error) {
      console.error('AI Error:', error);
      return {
        success: true,
        message: this.getFallbackResponse(currentState),
        isAI: false,
        currentState: this.currentState
      };
    }
  }

  async getAIResponse(userMessage) {
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    // Fetch RAG context for nervous system mapping knowledge
    let ragContext = '';
    try {
      ragContext = await ragService.getContextForPrompt(userMessage, {
        maxResults: 3, maxTokens: 1500, threshold: 0.4, categories: ['autonomics', 'somatic'],
      });
    } catch (e) { /* graceful degradation */ }

    const data = await callClaude({
      model: MODELS.PRIMARY,
      max_tokens: 800,
      system: this.getSystemPrompt() + `\n\nCurrent State Being Explored: ${this.currentState}` + ragContext,
      messages: this.conversationHistory,
    });
    const aiMessage = data.content[0].text;

    this.conversationHistory.push({
      role: 'assistant',
      content: aiMessage
    });

    return aiMessage;
  }

  getFallbackResponse(state) {
    const fallbacks = {
      intro: "Let's explore your nervous system together. We'll map out three different states. Which would you like to start with - times when you feel safe and connected, or times when you feel activated or stressed?",
      ventral: "Think of a time when you felt really safe, calm, and connected. Where did you feel that in your body?",
      sympathetic: "Think of a time when you felt activated, anxious, or in fight-or-flight mode. What did you notice in your body?",
      dorsal: "Think of a time when you felt shut down, numb, or disconnected. What was happening in your body?",
      drawing_prompt: "Great mapping! Now let's create a visual representation. Grab some paper and colored pencils if you have them, and let's draw your body map together."
    };

    return fallbacks[state] || fallbacks.intro;
  }

  /**
   * Extract structured data from conversation
   */
  async extractMappingData() {
    const conversationText = this.conversationHistory
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content)
      .join('\n\n');

    try {
      const extractionPrompt = `Based on this nervous system mapping conversation, extract the data in JSON format:

Conversation:
${conversationText}

Extract for each state (only include if mentioned):
{
  "ventral": {
    "body_sensations": ["array of body sensations"],
    "thoughts": ["self-talk patterns"],
    "emotions": ["emotions"],
    "activities": ["activities that bring this state"],
    "people": ["people who help access this state"]
  },
  "sympathetic": {
    "body_sensations": ["array"],
    "thoughts": ["array"],
    "emotions": ["array"],
    "triggers": ["what activates this"],
    "behaviors": ["how they respond"]
  },
  "dorsal": {
    "body_sensations": ["array"],
    "thoughts": ["array"],
    "emotions": ["array"],
    "triggers": ["what activates this"],
    "behaviors": ["how they respond"]
  }
}

Only include states and fields that were discussed. Return ONLY valid JSON.`;

      const data = await callClaude({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: extractionPrompt,
        }],
      });
      const jsonText = data.content[0].text;

      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Extraction error:', error);
      return {
        ventral: {},
        sympathetic: {},
        dorsal: {}
      };
    }
  }

  reset() {
    this.conversationHistory = [];
    this.currentState = 'intro';
    this.mappingData = {
      ventral: { body_sensations: [], thoughts: [], emotions: [], activities: [], people: [] },
      sympathetic: { body_sensations: [], thoughts: [], emotions: [], triggers: [], behaviors: [] },
      dorsal: { body_sensations: [], thoughts: [], emotions: [], triggers: [], behaviors: [] }
    };
  }

  getConversationHistory() {
    return this.conversationHistory;
  }

  isUsingAI() {
    return this.isOnline;
  }
}

export default new NervousSystemMappingAIService();
