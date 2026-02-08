import config from './config';
import huxleyKnowledgeBase from './huxleyKnowledgeBase';

const ANTHROPIC_API_KEY = config.anthropicApiKey;

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Conversational Routing Service
 * Interprets user intent and routes to appropriate features
 * Enhanced with clinical protocols from huxleyKnowledgeBase
 */
export class ConversationalRoutingService {
  constructor() {
    this.conversationHistory = [];
    this.isOnline = true;
    this.knowledgeBase = huxleyKnowledgeBase;
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
- NEVER lecture or explain features - just listen and route

## CLINICAL VOICE PRINCIPLES

- Warm but not saccharine - genuine care without performative positivity
- Curious, not knowing - ask before assuming
- Follow, don't lead - user's experience guides the conversation
- Brief and clear - no jargon unless they use it first
- Connect to body when possible - "Where do you feel that?"

## CRISIS DETECTION (HIGHEST PRIORITY)

If you detect ANY of these, route IMMEDIATELY to triggered_support:
- Suicidal ideation: "want to die", "end my life", "kill myself", "don't want to be here"
- Active self-harm: "hurting myself", "cutting"
- Severe panic: "can't breathe", "dying", "heart attack"

For crisis, say: "I hear you. That sounds really hard. Let me connect you with support right now. ROUTE: triggered_support"`;
  }

  /**
   * Get enhanced system prompt with scenario-specific protocols
   */
  getEnhancedSystemPrompt(userMessage) {
    const basePrompt = this.getSystemPrompt();

    // Detect scenarios from user message
    const detectedScenarios = this.knowledgeBase.detectScenarios(userMessage);

    if (detectedScenarios.length === 0) {
      return basePrompt;
    }

    // Add relevant protocols to prompt
    let enhancedPrompt = basePrompt;
    enhancedPrompt += '\n\n## DETECTED CONTEXT - USE THESE PROTOCOLS:\n';

    // Add top 2 matching protocols
    const topScenarios = detectedScenarios.slice(0, 2);
    for (const scenario of topScenarios) {
      const protocol = this.knowledgeBase.getProtocol(scenario.key);
      if (protocol) {
        enhancedPrompt += '\n' + protocol;
      }
    }

    return enhancedPrompt;
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

  // Alias for backward compatibility
  async routeMessage(userMessage) {
    const result = await this.sendMessage(userMessage);

    // Map route codes to navigation screen names
    const routeMap = {
      'triggered_support': 'TriggeredSupport',
      'daily_journal': 'DailyJournal',
      'post_session_journal': 'ExperienceMapping',
      'ifs_chat': 'IFSChat',
      'nervous_system_mapping': 'NervousSystemMapping',
      'triggers_glimmers': 'TriggersGlimmers',
      'regulating_resources': 'RegulatingResources',
      'core_beliefs': 'CoreBeliefs',
      'education': 'Education',
      'exercises': 'ExerciseLibrary',
    };

    const routeLabels = {
      'triggered_support': 'Support Tools',
      'daily_journal': 'Daily Journal',
      'post_session_journal': 'Experience Processing',
      'ifs_chat': 'Parts Work',
      'nervous_system_mapping': 'Nervous System',
      'triggers_glimmers': 'Triggers & Glimmers',
      'regulating_resources': 'Regulating Resources',
      'core_beliefs': 'Core Beliefs',
      'education': 'Learning',
      'exercises': 'Exercises',
    };

    return {
      message: result.message,
      route: result.route ? routeMap[result.route] : null,
      routeLabel: result.route ? routeLabels[result.route] : null,
    };
  }

  async getAIResponse(userMessage) {
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    // Use enhanced prompt with scenario-specific protocols
    const enhancedPrompt = this.getEnhancedSystemPrompt(userMessage);

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
        system: enhancedPrompt,
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
    if (lower.includes('trigger') || lower.includes('panic') || lower.includes('overwhelm') || lower.includes('crisis') || lower.includes('freaking out') || lower.includes('help')) {
      return "I'm here with you. Let me get you some support right now.";
    }

    // Psychedelic keywords
    if (lower.includes('psychedelic') || lower.includes('mushroom') || lower.includes('ketamine') || lower.includes('journey') || lower.includes('trip') || lower.includes('mdma') || lower.includes('lsd') || lower.includes('ceremony') || lower.includes('ayahuasca')) {
      return "Let's create space to process that experience.";
    }

    // Parts work keywords
    if (lower.includes('part') || lower.includes('critic') || lower.includes('voice') || lower.includes('ifs') || lower.includes('inner')) {
      return "Let's explore that part of you.";
    }

    // Nervous system keywords
    if (lower.includes('nervous') || lower.includes('body') || lower.includes('anxious') || lower.includes('anxiety') || lower.includes('calm') || lower.includes('relax')) {
      return "Let's check in with your nervous system.";
    }

    // Journal keywords
    if (lower.includes('journal') || lower.includes('write') || lower.includes('reflect') || lower.includes('thought') || lower.includes('feel')) {
      return "Let's open a space for you to journal.";
    }

    // Learn keywords
    if (lower.includes('learn') || lower.includes('what is') || lower.includes('teach') || lower.includes('understand') || lower.includes('explain')) {
      return "Let me share some helpful information with you.";
    }

    // Exercise/practice keywords
    if (lower.includes('exercise') || lower.includes('practice') || lower.includes('breath') || lower.includes('ground') || lower.includes('meditat')) {
      return "Let me show you some helpful practices.";
    }

    // Greeting responses
    if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey') || lower.includes('good morning') || lower.includes('good evening')) {
      return "Hey there! What's on your mind today?";
    }

    // How are you / checking in
    if (lower.includes('how are you') || lower.includes("what's up") || lower.includes('okay') || lower.includes('doing well') || lower.includes('i\'m good')) {
      return "I'm here for you. What would you like to explore today?";
    }

    // Emotional expressions
    if (lower.includes('sad') || lower.includes('depressed') || lower.includes('down') || lower.includes('lonely') || lower.includes('hurt')) {
      return "I hear you. Would you like to journal about what you're feeling, or would some support tools be helpful?";
    }

    if (lower.includes('angry') || lower.includes('frustrated') || lower.includes('mad') || lower.includes('annoyed')) {
      return "Those feelings are valid. Would you like to explore what's coming up, or try some regulation practices?";
    }

    // Default - more engaging
    return "I'm listening. Tell me more about what's going on for you, and I'll help point you in the right direction.";
  }

  getFallbackRoute(userMessage) {
    const lower = userMessage.toLowerCase();

    // Simple keyword matching for offline mode
    if (lower.includes('trigger') || lower.includes('panic') || lower.includes('crisis') || lower.includes('freaking out') || lower.includes('overwhelm')) {
      return 'triggered_support';
    }

    if (lower.includes('psychedelic') || lower.includes('mushroom') || lower.includes('ketamine') || lower.includes('journey') || lower.includes('trip') || lower.includes('ceremony') || lower.includes('mdma') || lower.includes('lsd') || lower.includes('ayahuasca')) {
      return 'post_session_journal';
    }

    if (lower.includes('part') || lower.includes('critic') || lower.includes('ifs') || lower.includes('inner voice')) {
      return 'ifs_chat';
    }

    if (lower.includes('nervous') || lower.includes('polyvagal') || lower.includes('dysregulated')) {
      return 'nervous_system_mapping';
    }

    if (lower.includes('glimmer')) {
      return 'triggers_glimmers';
    }

    if (lower.includes('belief') || lower.includes('worthy') || lower.includes('schema') || lower.includes('not good enough')) {
      return 'core_beliefs';
    }

    if (lower.includes('learn') || lower.includes('education') || lower.includes('teach') || lower.includes('what is') || lower.includes('explain')) {
      return 'education';
    }

    if (lower.includes('exercise') || lower.includes('practice') || lower.includes('breathing') || lower.includes('ground') || lower.includes('meditat')) {
      return 'exercises';
    }

    if (lower.includes('anxious') || lower.includes('anxiety') || lower.includes('calm') || lower.includes('relax') || lower.includes('body')) {
      return 'nervous_system_mapping';
    }

    if (lower.includes('journal') || lower.includes('write') || lower.includes('reflect')) {
      return 'daily_journal';
    }

    if (lower.includes('sad') || lower.includes('depressed') || lower.includes('down') || lower.includes('feel')) {
      return 'daily_journal';
    }

    // For greetings and general conversation - no route, just chat
    if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey') || lower.includes('how are you') || lower.includes('okay') || lower.includes('i\'m good')) {
      return null; // No route - continue conversation
    }

    // Default to null (no route) for general conversation
    return null;
  }

  reset() {
    this.conversationHistory = [];
  }

  getConversationHistory() {
    return this.conversationHistory;
  }
}

export default new ConversationalRoutingService();
