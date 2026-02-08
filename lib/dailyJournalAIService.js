import config from './config';

const ANTHROPIC_API_KEY = config.anthropicApiKey;

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Daily Journal AI Service
 * Conversational journaling with optional AI discussion and insights
 */
export class DailyJournalAIService {
  constructor() {
    this.conversationHistory = [];
    this.phase = 'journaling'; // 'journaling', 'discussion', 'suggestions'
    this.journalData = {
      mood: '',
      emotions: [],
      themes: [],
      peopleMentioned: [],
      activities: [],
      insights: '',
      gratitude: [],
      challenges: [],
      goals: []
    };
    this.isOnline = true;
  }

  getSystemPrompt() {
    const basePrompt = `You are Huxley, a warm and empathetic journaling companion. Your role is to create a safe space for daily reflection and personal growth.

## YOUR APPROACH

**During Journaling Phase:**
- Start with a gentle, open invitation: "What's on your mind today?"
- Listen actively and reflect back what you hear
- Ask thoughtful follow-up questions to help them explore deeper
- Don't interrupt their flow - let them write/speak freely
- Recognize when they're done journaling naturally

**During Discussion Phase (if requested):**
- Offer compassionate reflections on what they shared
- Help them see patterns or connections they might have missed
- Provide gentle reframing of negative thought patterns
- Validate their emotions while offering new perspectives
- Reference their past journals if relevant patterns emerge

**When Offering Suggestions (if requested):**
- Suggest practical, actionable steps based on what they shared
- Offer therapeutic techniques (breathing, grounding, self-compassion)
- Recommend reflection questions for further exploration
- Suggest ways to build on insights or work through challenges

## THERAPEUTIC SKILLS

Use these when appropriate:
- **CBT**: Identify cognitive distortions, offer reframes
- **ACT**: Help with acceptance, values clarification, defusion
- **Self-Compassion**: Encourage kind self-talk
- **Somatic**: Notice body sensations and their meanings
- **Parts Work**: Reference IFS concepts if parts language emerges

## RESPONSE STYLE

- Warm, compassionate, non-judgmental
- Brief responses (2-4 sentences) during journaling phase
- More detailed during discussion phase
- Ask ONE question at a time
- Match their emotional tone while gently uplifting
- Use their name if they've shared it
- Reference specific details they mentioned to show you're listening

## DATA EXTRACTION

As you listen, quietly note (in your internal processing):
- **Mood**: Overall emotional state
- **Emotions**: Specific feelings mentioned
- **Themes**: Recurring topics or patterns
- **People**: Who they're discussing
- **Activities**: What they did or plan to do
- **Insights**: Realizations or "aha" moments
- **Gratitude**: What they appreciate
- **Challenges**: Problems or difficulties
- **Goals**: Intentions or things they want to do

## CONVERSATION FLOW

1. **Start**: Open invitation to journal
2. **Listen**: Brief reflections, gentle questions
3. **Recognize completion**: When they seem done, ask: "Is there anything else you'd like to explore today?"
4. **Offer discussion**: "Would you like to discuss any of this further?"
5. **If yes to discussion**: Provide insights, reflections, connections
6. **Offer suggestions**: "Would you like some suggestions or practices that might help?"
7. **If yes to suggestions**: Provide actionable guidance
8. **Close**: Acknowledge their work, encourage self-compassion

Remember: This is THEIR space. You're a supportive presence, not directing or analyzing them. Follow their lead.`;

    return basePrompt;
  }

  async sendMessage(userMessage, phase = 'journaling') {
    this.phase = phase;

    try {
      const aiResponse = await this.getAIResponse(userMessage);
      return {
        success: true,
        message: aiResponse,
        isAI: true,
        phase: this.phase
      };
    } catch (error) {
      console.error('AI Error:', error);
      // Fallback responses
      return {
        success: true,
        message: this.getFallbackResponse(phase),
        isAI: false,
        phase: this.phase
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
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        system: this.getSystemPrompt(),
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
      journaling: [
        "I'm listening. What else is on your mind?",
        "Tell me more about that.",
        "How does that feel for you?",
        "What comes up when you think about that?"
      ],
      discussion: [
        "Thank you for sharing that with me. It sounds like you're processing some important feelings.",
        "I hear the complexity in what you're describing. What stands out most to you?",
        "That's a meaningful insight. How might you carry that forward?"
      ],
      suggestions: [
        "One practice that might help is taking a few deep breaths and checking in with your body.",
        "Consider journaling about this again tomorrow - sometimes insights unfold over time.",
        "Be gentle with yourself as you navigate this. You're doing important work."
      ]
    };

    const options = fallbacks[phase] || fallbacks.journaling;
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Extract structured data from conversation
   * This runs in the background to populate the database
   */
  async extractStructuredData() {
    // Build a summary of the conversation
    const journalText = this.conversationHistory
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content)
      .join('\n\n');

    try {
      const extractionPrompt = `Based on this journal entry, extract the following information in JSON format:

Journal Entry:
${journalText}

Extract:
{
  "mood": "overall mood (1-2 words)",
  "emotions": ["array", "of", "emotions"],
  "themes": ["key", "themes"],
  "people_mentioned": ["names"],
  "activities": ["activities mentioned"],
  "insights": "key insight or realization",
  "gratitude": ["things they're grateful for"],
  "challenges": ["challenges mentioned"],
  "goals": ["intentions or goals"],
  "sentiment_score": 0.5 // -1 to 1, where -1 is very negative and 1 is very positive
}

Only include fields that have clear evidence in the text. Return ONLY valid JSON, no other text.`;

      const response = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022', // Use faster model for extraction
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: extractionPrompt
          }]
        })
      });

      if (!response.ok) {
        throw new Error('Extraction failed');
      }

      const data = await response.json();
      const jsonText = data.content[0].text;

      // Extract JSON from response (in case it's wrapped in markdown)
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Data extraction error:', error);
      // Return minimal data
      return {
        mood: '',
        emotions: [],
        themes: [],
        sentiment_score: 0
      };
    }
  }

  /**
   * Generate a title from the journal content
   */
  async generateTitle() {
    const journalText = this.conversationHistory
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content)
      .join(' ');

    try {
      const response = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 50,
          messages: [{
            role: 'user',
            content: `Generate a short, meaningful title (3-6 words) for this journal entry:\n\n${journalText.substring(0, 500)}\n\nTitle:`
          }]
        })
      });

      const data = await response.json();
      return data.content[0].text.trim().replace(/^["']|["']$/g, '');
    } catch (error) {
      console.error('Title generation error:', error);
      return `Journal Entry - ${new Date().toLocaleDateString()}`;
    }
  }

  reset() {
    this.conversationHistory = [];
    this.phase = 'journaling';
    this.journalData = {
      mood: '',
      emotions: [],
      themes: [],
      peopleMentioned: [],
      activities: [],
      insights: '',
      gratitude: [],
      challenges: [],
      goals: []
    };
  }

  getConversationHistory() {
    return this.conversationHistory;
  }

  isUsingAI() {
    return this.isOnline;
  }
}

export default new DailyJournalAIService();
