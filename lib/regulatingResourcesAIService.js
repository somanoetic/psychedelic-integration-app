import config from './config';

const ANTHROPIC_API_KEY = config.anthropicApiKey;

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Regulating Resources AI Service
 * Uses Claude API to help users identify regulation resources with offline fallback
 */
export class RegulatingResourcesAIService {
  constructor() {
    this.conversationHistory = [];
    this.phase = 'intro'; // 'intro', 'individual', 'interactive', 'complete'
    this.extractedData = {
      sensory: [],
      movement: [],
      connection: [],
      creative: [],
      spiritual: [],
      cognitive: []
    };
    this.isOnline = true;
  }

  getSystemPrompt() {
    return `You are Huxley, a warm and encouraging guide helping someone discover their personal regulation toolkit.

## YOUR APPROACH

You're helping them identify **what actually helps them regulate** - not generic self-care advice, but their specific, real resources.

## CONVERSATION FLOW

**Phase 1: Introduction** (phase: intro)
- Introduce the concept of regulating resources
- Explain you'll explore things they do alone AND with others
- Ask which they'd like to start with, or suggest starting with easier one
- Make it feel collaborative, not clinical

**Phase 2: Individual Resources** (phase: individual)
Explore what they do ALONE to regulate:

**Sensory Resources** (5 senses)
- "What do you see, hear, smell, taste, touch that helps you feel grounded?"
- Nature, music, pleasant smells, textures, favorite foods
- Warmth, cold, specific environments

**Movement Resources**
- "How does your body like to move when you need regulation?"
- Walking, dancing, stretching, exercise, yoga, shaking
- Gentle or vigorous - honor their preference

**Creative Resources**
- "What creative things help you process and regulate?"
- Writing, art, music, crafting, cooking, gardening
- Expression and creation as regulation

**Spiritual/Meaning-Making Resources**
- "What connects you to something larger?"
- Prayer, meditation, nature, rituals, practices
- Whatever brings meaning and perspective

**Cognitive Resources**
- "What mental practices help you?"
- Journaling, reframing, affirmations, reading
- Ways of thinking that support regulation

**Phase 3: Interactive Resources** (phase: interactive)
Explore co-regulation with others:

**Connection Resources**
- "Who are the people that help you feel safe?"
- Specific people, pets, communities
- What about being with them helps?

**Physical Co-Regulation**
- "What kinds of physical connection help?"
- Hugs, touch, proximity, eye contact
- Being near safe others

**Support Resources**
- "How do you reach out when you need help?"
- Asking for support, receiving care, being held
- Ways people help you regulate

**Play and Joy**
- "Who makes you laugh? What activities bring lightness?"
- Shared humor, play, lightness
- Co-regulation through joy

## RESPONSE STYLE

- Warm, curious, specific
- Celebrate whatever they share: "That's a real resource!"
- Help them get specific: "What exactly about that helps?"
- No generic advice - draw out THEIR resources
- Brief responses (2-3 sentences)
- One category at a time, let them lead pace
- Normalize needing both solo and with-others resources

## DATA EXTRACTION

As you listen, mentally note which resources fit into:
- Sensory, Movement, Creative, Spiritual, Cognitive (individual)
- Connection, Physical, Support, Play (interactive)

## IMPORTANT

- This is discovery, not prescription
- What works for them IS what works - period
- Both individual and interactive resources are essential
- Build a rich, specific, personalized toolkit
- Co-regulation is primary, but solo resources give autonomy

Remember: You're facilitating THEIR wisdom, not teaching them yours.`;
  }

  async sendMessage(userMessage, currentPhase) {
    this.phase = currentPhase || this.phase;

    try {
      const aiResponse = await this.getAIResponse(userMessage);
      return {
        success: true,
        message: aiResponse,
        isAI: true,
        currentPhase: this.phase
      };
    } catch (error) {
      console.error('AI Error:', error);
      return {
        success: true,
        message: this.getFallbackResponse(currentPhase),
        isAI: false,
        currentPhase: this.phase
      };
    }
  }

  async getAIResponse(userMessage) {
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 600,
        system: this.getSystemPrompt() + `\n\nCurrent Phase: ${this.phase}`,
        messages: this.conversationHistory
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.content[0].text;

    this.conversationHistory.push({
      role: 'assistant',
      content: aiMessage
    });

    return aiMessage;
  }

  getFallbackResponse(phase) {
    const fallbacks = {
      intro: "Let's build your regulation toolkit together. We'll explore what helps you - both things you do alone and ways you co-regulate with others. Which would you like to start with?",
      individual: "Think about times when you've been stressed and found your way back to feeling okay on your own. What did you do? What helped?",
      interactive: "Now let's think about the people and connections that help you feel safe. Who are the people that help you regulate? What about being with them helps?",
    };

    return fallbacks[phase] || fallbacks.intro;
  }

  /**
   * Extract structured resources from conversation
   */
  async extractResourcesData() {
    const conversationText = this.conversationHistory
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content)
      .join('\n\n');

    try {
      const extractionPrompt = `Based on this regulation resources conversation, extract the data in JSON format:

Conversation:
${conversationText}

Extract resources mentioned into categories (only include if mentioned):
{
  "sensory": ["array of sensory resources - things seen, heard, felt, smelled, tasted"],
  "movement": ["movement and body-based resources"],
  "connection": ["people, pets, communities that help"],
  "creative": ["creative activities and expression"],
  "spiritual": ["spiritual practices, meaning-making, connection to larger"],
  "cognitive": ["mental practices, reframing, journaling"]
}

Only include categories with actual resources mentioned. Return ONLY valid JSON.`;

      const response = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 800,
          messages: [{
            role: 'user',
            content: extractionPrompt
          }]
        })
      });

      const data = await response.json();
      const jsonText = data.content[0].text;

      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Extraction error:', error);
      return {
        sensory: [],
        movement: [],
        connection: [],
        creative: [],
        spiritual: [],
        cognitive: []
      };
    }
  }

  reset() {
    this.conversationHistory = [];
    this.phase = 'intro';
    this.extractedData = {
      sensory: [],
      movement: [],
      connection: [],
      creative: [],
      spiritual: [],
      cognitive: []
    };
  }

  getConversationHistory() {
    return this.conversationHistory;
  }

  isUsingAI() {
    return this.isOnline;
  }
}

export default new RegulatingResourcesAIService();
