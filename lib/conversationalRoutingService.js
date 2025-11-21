import config from './config';

const ANTHROPIC_API_KEY = config.anthropicApiKey;

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Conversational Routing Service
 * Interprets user intent and routes to appropriate features
 */
export class ConversationalRoutingService {
  constructor() {
    this.conversationHistory = [];
    this.isOnline = true;
  }

  getSystemPrompt() {
    return `You are Huxley, a warm and compassionate guide helping someone navigate their therapeutic journey.

## YOUR ROLE

You help users find the right tool or practice for what they're experiencing right now. You do this through brief, friendly conversation.

## AVAILABLE FEATURES

You can guide users to these features based on what they need:

1. **Triggered Support** - For immediate crisis/dysregulation
   - Keywords: triggered, overwhelmed, panic, crisis, help now, can't breathe, freaking out
   - Route: triggered_support

2. **Daily Journal** - General-purpose journaling and reflection
   - Keywords: journal, write, reflect, process thoughts, what happened today
   - Route: daily_journal

3. **Process Experience** - For processing non-ordinary consciousness (psychedelic, breathwork, meditation)
   - Keywords: psychedelic, mushrooms, ketamine, MDMA, LSD, ceremony, journey, trip, breathwork, deep meditation, altered state
   - Route: post_session_journal

4. **Integration** - For ongoing integration work after experiences
   - Keywords: integrate, integration, make sense of, understand experience, after journey
   - Route: post_session_journal

5. **Explore Parts (IFS)** - Internal Family Systems parts work
   - Keywords: parts, inner critic, IFS, voices inside, conflicted, part of me
   - Route: ifs_chat

6. **Nervous System** - Explore polyvagal states and body responses
   - Keywords: nervous system, body sensations, fight/flight, shutdown, vagus nerve, polyvagal, dysregulated
   - Route: nervous_system_mapping

7. **Triggers & Glimmers** - Map what dysregulates and regulates you
   - Keywords: triggers, what sets me off, what calms me, glimmers, regulate
   - Route: triggers_glimmers

8. **Regulating Resources** - Build personal regulation toolkit
   - Keywords: coping skills, self-care, regulation practices, what helps, resources
   - Route: regulating_resources

9. **Core Beliefs** - Explore limiting beliefs
   - Keywords: beliefs, not good enough, unworthy, core beliefs, schemas
   - Route: core_beliefs

10. **Learn/Education** - Psychoeducation content
    - Keywords: learn, teach me, education, understand theory, what is IFS, what is polyvagal
    - Route: education

11. **Exercises** - Structured practices and tools
    - Keywords: exercises, practices, techniques, breathing, grounding
    - Route: exercises

## YOUR APPROACH

**First Message:**
- Warm greeting: "Hey there! What's going on for you today?"
- OR if they seem urgent: "I'm here. What do you need right now?"

**Understanding Intent:**
- Ask 1-2 brief clarifying questions if needed
- Listen for emotional tone and urgency
- Match their energy (calm if they're calm, grounded if they're distressed)

**Routing:**
- When you're confident about where to route them, say:
  "Let me take you to [feature name]."
- Then output ONLY the route code (e.g., "ROUTE: daily_journal")

**Crisis Detection:**
- If someone is clearly in crisis (triggered, panicking, overwhelmed), route immediately to triggered_support
- Don't ask questions - get them help fast

## RESPONSE STYLE

- **Brief**: 1-3 sentences max
- **Warm**: Use their name if you know it, show genuine care
- **Clear**: No jargon unless they use it first
- **Responsive**: Match their energy and urgency
- **Non-judgmental**: All experiences and needs are valid

## EXAMPLES

**Example 1: Triggered**
User: "I'm freaking out"
You: "I'm here with you. Let me get you some support right now. ROUTE: triggered_support"

**Example 2: Journal**
User: "I just want to write about my day"
You: "Perfect. Let's open up a space for you to journal. ROUTE: daily_journal"

**Example 3: Needs Clarification**
User: "I had a weird experience"
You: "I'm listening. Was it a psychedelic journey, or something else?"
[Wait for response, then route appropriately]

**Example 4: Parts Work**
User: "There's this voice in my head that won't stop criticizing me"
You: "That sounds like a part of you. Let's explore that together. ROUTE: ifs_chat"

## IMPORTANT

- When you output a route, it MUST be in this exact format: "ROUTE: route_name"
- Only output route codes listed above
- If truly unclear after 2-3 exchanges, default to: "ROUTE: daily_journal"
- NEVER lecture or explain features - just listen and route`;
  }

  async sendMessage(userMessage) {
    try {
      const aiResponse = await this.getAIResponse(userMessage);

      // Check if AI provided a route
      const routeMatch = aiResponse.match(/ROUTE:\s*(\w+)/);

      if (routeMatch) {
        const route = routeMatch[1];
        // Remove route directive from visible message
        const cleanMessage = aiResponse.replace(/ROUTE:\s*\w+/, '').trim();

        return {
          success: true,
          message: cleanMessage,
          route: route,
          isAI: true
        };
      }

      return {
        success: true,
        message: aiResponse,
        route: null,
        isAI: true
      };
    } catch (error) {
      console.error('Routing AI Error:', error);
      return {
        success: true,
        message: this.getFallbackResponse(userMessage),
        route: this.getFallbackRoute(userMessage),
        isAI: false
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
        max_tokens: 300,
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

  getFallbackResponse(userMessage) {
    const lower = userMessage.toLowerCase();

    // Crisis keywords
    if (lower.includes('trigger') || lower.includes('panic') || lower.includes('overwhelm') || lower.includes('crisis')) {
      return "I'm here with you. Let me get you some support right now.";
    }

    // Psychedelic keywords
    if (lower.includes('psychedelic') || lower.includes('mushroom') || lower.includes('ketamine') || lower.includes('journey') || lower.includes('trip')) {
      return "Let's create space to process that experience.";
    }

    // Parts work keywords
    if (lower.includes('part') || lower.includes('critic') || lower.includes('voice')) {
      return "Let's explore that part of you.";
    }

    // Default
    return "Let's open up a space for you to reflect.";
  }

  getFallbackRoute(userMessage) {
    const lower = userMessage.toLowerCase();

    // Simple keyword matching for offline mode
    if (lower.includes('trigger') || lower.includes('panic') || lower.includes('crisis')) {
      return 'triggered_support';
    }

    if (lower.includes('psychedelic') || lower.includes('mushroom') || lower.includes('ketamine') || lower.includes('journey') || lower.includes('trip') || lower.includes('ceremony')) {
      return 'post_session_journal';
    }

    if (lower.includes('part') || lower.includes('critic') || lower.includes('ifs')) {
      return 'ifs_chat';
    }

    if (lower.includes('nervous') || lower.includes('body') || lower.includes('polyvagal')) {
      return 'nervous_system_mapping';
    }

    if (lower.includes('trigger') || lower.includes('glimmer')) {
      return 'triggers_glimmers';
    }

    if (lower.includes('belief') || lower.includes('worthy') || lower.includes('schema')) {
      return 'core_beliefs';
    }

    if (lower.includes('learn') || lower.includes('education') || lower.includes('teach')) {
      return 'education';
    }

    if (lower.includes('exercise') || lower.includes('practice') || lower.includes('breathing')) {
      return 'exercises';
    }

    // Default to journal
    return 'daily_journal';
  }

  reset() {
    this.conversationHistory = [];
  }

  getConversationHistory() {
    return this.conversationHistory;
  }
}

export default new ConversationalRoutingService();
