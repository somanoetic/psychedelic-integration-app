# AI-Supported Components Guide

This document provides a comprehensive overview of all AI-powered components in the Psychetelia app, how they're configured, and how they work.

## Overview

The app uses Claude AI (Anthropic) to provide conversational, adaptive support for therapeutic exercises and self-discovery tools. All AI components have offline fallbacks, so the app remains functional even without internet connectivity.

---

## AI Services

### 1. IFS AI Service
**Location**: `lib/ifsAIService.js`

**Purpose**: Powers conversational guidance through IFS (Internal Family Systems) parts work using the "Six F's" methodology.

**Configuration**:
- **Model**: `claude-sonnet-4-5-20250929`
- **Max Tokens**: 300 (brief, focused responses)
- **System Prompt**: Trained on IFS methodology, the Six F's (Find, Focus, Flesh out, Feel toward, beFriend, Fear)
- **Conversation History**: Maintains full conversation context throughout session
- **Offline Fallback**: Rule-based responses validating user input

**Key Features**:
- Guides users through identifying and working with protective parts and exiles
- Validates all parts as protective (non-pathologizing)
- Helps users access Self-energy and curiosity
- Supports exploration of part's fears, needs, and origins

---

### 2. Polyvagal AI Service
**Location**: `lib/polyvagalAIService.js`

**Purpose**: Guides users through mapping their three nervous system states based on Polyvagal Theory.

**Configuration**:
- **Model**: `claude-sonnet-4-5-20250929`
- **Max Tokens**: 300
- **System Prompt**: Trained on Polyvagal Theory (Ventral Vagal, Sympathetic, Dorsal Vagal states)
- **State Tracking**: Tracks which state and field (memory/body/thoughts) being mapped
- **Offline Fallback**: State-specific validation responses

**Key Features**:
- Maps three nervous system states: Ventral Vagal (safety), Sympathetic (fight/flight), Dorsal Vagal (shutdown)
- Helps users identify what each state feels like for them specifically
- Explores situations/triggers, body sensations, and thought patterns
- Normalizes all states as adaptive protective responses

---

### 3. Triggers & Glimmers AI Service
**Location**: `lib/triggersGlimmersAIService.js`

**Purpose**: Helps users identify triggers (dysregulation cues) and glimmers (micro-moments of safety).

**Configuration**:
- **Model**: `claude-sonnet-4-5-20250929`
- **Max Tokens**: 300
- **System Prompt**: Trained on nervous system triggers and glimmers concept
- **Category Tracking**: Tracks sympathetic triggers, dorsal triggers, and glimmers separately
- **Offline Fallback**: Category-specific encouraging responses

**Key Features**:
- Identifies Fight/Flight triggers (sympathetic activation)
- Identifies Shutdown triggers (dorsal shutdown)
- Discovers glimmers - tiny safety cues that build regulation capacity
- Validates triggers as protective learned responses
- Celebrates glimmers as powerful resources

---

### 4. Regulating Resources AI Service
**Location**: `lib/regulatingResourcesAIService.js`

**Purpose**: Helps users build a toolkit of regulation resources - both individual (solo) and interactive (with others).

**Configuration**:
- **Model**: `claude-sonnet-4-5-20250929`
- **Max Tokens**: 300
- **System Prompt**: Trained on self-regulation and co-regulation concepts
- **Resource Tracking**: Tracks individual resources and interactive resources separately
- **Offline Fallback**: Resource-type specific validation responses

**Key Features**:
- Identifies individual resources (breathing, movement, nature, creative expression, etc.)
- Identifies interactive resources (connection, support, co-regulation with safe others)
- Emphasizes that both types are essential for resilience
- Validates whatever works for the user as legitimate
- Helps users build autonomy (individual) and connection (interactive)

---

## AI-Powered Widgets

### 1. IFS Parts Work Chat AI
**Component**: `enhanced-components/IFSPartsWorkChatAI.js`
**AI Service**: `ifsAIService.js`
**Topic ID**: `ifs_chat`

**User Experience**:
- Conversational interface with message bubbles
- AI guides through the Six F's process
- Real-time typing indicators
- Offline mode indicator when internet unavailable
- Full conversation history maintained
- 15-20 minute interactive session

**How It Works**:
1. User describes a part they're noticing
2. AI helps them Find and Focus on the part
3. Guided exploration: What does it look like? How does it feel? What does it want?
4. Explores user's feelings toward the part (accessing Self-energy)
5. Helps befriend the part and understand its fears/needs
6. Validates the part's protective role

---

### 2. Polyvagal Mapping Widget AI
**Component**: `enhanced-components/PolyvagalMappingWidgetAI.js`
**AI Service**: `polyvagalAIService.js`
**Topic ID**: `polyvagal_mapping`

**User Experience**:
- Step-by-step mapping of three nervous system states
- AI validates and reflects back user's responses
- Conversational guidance with message bubbles
- 10-15 minute interactive mapping

**How It Works**:
1. **Sympathetic State**: User describes situations, body sensations, and thoughts when in fight/flight
2. **Dorsal State**: User describes shutdown experiences
3. **Ventral State**: User describes moments of safety and connection
4. AI helps notice patterns and connections between situations and states
5. Final summary shows complete nervous system map

---

### 3. Triggers & Glimmers Widget AI
**Component**: `enhanced-components/TriggersAndGlimmersWidgetAI.js`
**AI Service**: `triggersGlimmersAIService.js`
**Topic ID**: `triggers_glimmers`

**User Experience**:
- Conversational mapping of triggers and glimmers
- AI celebrates glimmers and normalizes triggers
- 10-12 minute interactive session
- Real-time feedback and validation

**How It Works**:
1. **Fight/Flight Triggers**: User identifies 2+ activation triggers
2. **Shutdown Triggers**: User identifies 2+ shutdown triggers
3. **Glimmers**: User identifies 3+ micro-moments of safety
4. AI validates each entry with compassionate, educational responses
5. Summary shows complete trigger/glimmer map

---

### 4. Regulating Resources Widget AI
**Component**: `enhanced-components/RegulatingResourcesWidgetAI.js`
**AI Service**: `regulatingResourcesAIService.js`
**Topic ID**: `regulating_resources`

**User Experience**:
- Conversational discovery of regulation resources
- AI celebrates resources and helps user get specific
- 8-10 minute interactive mapping
- Insight summary showing balance of resources

**How It Works**:
1. **Individual Resources**: User identifies 3+ solo regulation practices
2. **Interactive Resources**: User identifies 3+ co-regulation resources
3. AI validates and celebrates each resource
4. Final summary includes insight about having both types for flexibility

---

## Common AI Features

All AI widgets share these features:

### 1. **Offline Fallback**
- If Claude API is unavailable, widgets automatically use rule-based responses
- Offline indicator shown to user
- All functionality remains available - just without adaptive AI
- Fallback responses are category/state-specific and therapeutically sound

### 2. **Conversation History**
- Each AI service maintains conversation history throughout session
- Provides context for AI responses
- Reset when widget completes or user exits

### 3. **Real-Time Indicators**
- **Typing indicator**: Shows when AI is generating response
- **Offline banner**: Alerts user when using fallback mode
- **Timestamps**: Each AI message includes timestamp

### 4. **Response Validation**
- User must enter text before continuing
- Prompts user to reflect if attempting to skip without input
- All user responses saved for summary

### 5. **Progressive Disclosure**
- Step-by-step progression through exercises
- Info steps introduce concepts before prompting user
- AI messages clear between steps for fresh context

---

## API Configuration

### Environment Variables
**Location**: `.env` file (not committed to git)

```
ANTHROPIC_API_KEY=your_api_key_here
```

### API Endpoint
- **URL**: `https://api.anthropic.com/v1/messages`
- **Version**: `2023-06-01`
- **Headers**:
  - `Content-Type`: `application/json`
  - `x-api-key`: From environment variable
  - `anthropic-version`: `2023-06-01`

### Request Format
```json
{
  "model": "claude-sonnet-4-5-20250929",
  "max_tokens": 300,
  "system": "[System prompt with therapeutic guidance]",
  "messages": [
    { "role": "user", "content": "User message" },
    { "role": "assistant", "content": "AI response" }
  ]
}
```

---

## System Prompts Overview

All system prompts follow these principles:

### Therapeutic Approach
- **Non-pathologizing**: No diagnosis or "fixing" language
- **Normalizing**: All experiences, parts, and states are valid and adaptive
- **Compassionate**: Warm, validating, supportive tone
- **User-as-expert**: Facilitating self-discovery, not prescribing

### Response Guidelines
- **Brevity**: 2-3 sentences per response (max 300 tokens)
- **Validation first**: Acknowledge and validate user's sharing
- **Reflection**: Mirror back what was heard
- **Gentle guidance**: Help notice patterns or get more specific
- **Avoid jargon**: Use accessible therapeutic language

### Educational Elements
- Teach relevant concepts (polyvagal theory, IFS principles, etc.)
- Explain "why" behind patterns
- Normalize difficult experiences
- Celebrate insights and self-awareness

---

## Adding New AI Components

To create a new AI-powered widget:

### 1. Create AI Service (`lib/yourServiceAIService.js`)

```javascript
import { ANTHROPIC_API_KEY } from '@env';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

export class YourAIService {
  constructor() {
    this.conversationHistory = [];
    this.responses = {};
    this.isOnline = true;
  }

  getSystemPrompt() {
    return `Your therapeutic guidance system prompt here...`;
  }

  async sendMessage(userMessage, context) {
    try {
      const aiResponse = await this.getAIResponse(userMessage);
      return { response: aiResponse, isAI: true };
    } catch (error) {
      return {
        response: this.getFallbackResponse(userMessage, context),
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
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 300,
        system: this.getSystemPrompt(),
        messages: this.conversationHistory
      })
    });

    const data = await response.json();
    const assistantMessage = data.content[0].text;

    this.conversationHistory.push({
      role: 'assistant',
      content: assistantMessage
    });

    return assistantMessage;
  }

  getFallbackResponse(userMessage, context) {
    // Rule-based responses for offline mode
    return "Thank you for sharing. [Validation specific to your use case]";
  }
}

export default new YourAIService();
```

### 2. Create AI Widget (`enhanced-components/YourWidgetAI.js`)

Follow the pattern from existing widgets:
- Import your AI service
- Use `useState` for step management and AI messages
- Include typing indicator and offline banner
- Implement step-by-step progression with 'info' and 'aiInput' types
- Show summary at the end

### 3. Add to EducationScreen

```javascript
// Import
import YourWidgetAI from '../enhanced-components/YourWidgetAI';

// Add handler in renderSelectedTopic
if (selectedTopic === 'your_topic_id') {
  return (
    <YourWidgetAI
      onComplete={handleEducationComplete}
      onSkip={handleEducationComplete}
    />
  );
}
```

### 4. Add to ConversationalEducation

Update the topic details in `components/ConversationalEducation.js`:

```javascript
your_topic_id: {
  title: 'Your Topic Title',
  emoji: '✨',
  description: 'Brief description of what this does',
  time: 'X-Y minutes',
  color: '#hexcolor'
}
```

---

## Testing AI Components

### With Internet (AI Mode)
1. Ensure `.env` file has valid `ANTHROPIC_API_KEY`
2. Navigate to the topic in the app
3. Verify AI responses are contextual and relevant
4. Check typing indicators appear
5. Verify responses complete within 2-5 seconds

### Without Internet (Offline Mode)
1. Disable network on device/simulator
2. Navigate to the topic
3. Verify offline banner appears
4. Verify fallback responses are appropriate
5. Verify all functionality still works

### Error Handling
1. Test with invalid API key (should fallback gracefully)
2. Test with network timeout (should fallback gracefully)
3. Test empty user inputs (should prompt for input)
4. Test rapid button clicking (should prevent duplicate requests)

---

## Summary of All AI Components

| Component | AI Service | Topic ID | Time | Purpose |
|-----------|------------|----------|------|---------|
| IFS Parts Work Chat | ifsAIService | ifs_chat | 15-20 min | Guide through Six F's process |
| Polyvagal Mapping | polyvagalAIService | polyvagal_mapping | 10-15 min | Map three nervous system states |
| Triggers & Glimmers | triggersGlimmersAIService | triggers_glimmers | 10-12 min | Identify triggers and safety cues |
| Regulating Resources | regulatingResourcesAIService | regulating_resources | 8-10 min | Build regulation toolkit |

**All components**:
- Use Claude Sonnet 4.5 model
- Have offline fallbacks
- Maintain conversation history
- Provide step-by-step guidance
- Show summaries at completion
- Are therapeutically sound and non-pathologizing

---

## Maintenance & Updates

### Updating System Prompts
- System prompts are in each AI service's `getSystemPrompt()` method
- Test thoroughly after changes - prompts affect all AI responses
- Keep therapeutic principles consistent across services

### Updating Model
- Model specified in each service's `getAIResponse()` method
- Current: `claude-sonnet-4-5-20250929`
- Update all services simultaneously for consistency

### Adding More Steps to Widgets
- Add steps to the `mappingSteps` array in widget component
- Ensure step IDs are unique
- Test offline fallbacks for new steps
- Update time estimates in ConversationalEducation

### Monitoring API Usage
- Claude API charges per token (input + output)
- Current max_tokens: 300 per response
- Average session: 10-15 API calls
- Monitor usage in Anthropic console

---

## Troubleshooting

### "Offline mode" showing despite internet connection
- Check `.env` file has valid API key
- Verify API key has credits/is active
- Check firewall isn't blocking `api.anthropic.com`
- Look for error messages in console

### AI responses seem generic or off-topic
- Review system prompt for clarity
- Check context being passed to AI
- Verify conversation history is maintained
- Test with more specific user inputs

### App crashes when opening AI widget
- Check all imports are correct
- Verify AI service is properly exported
- Check for syntax errors in widget
- Test with `console.log` in service methods

### Responses take too long
- Check network speed
- Consider reducing `max_tokens` (current: 300)
- Ensure not making duplicate requests
- Check Anthropic API status

---

## Future Enhancements

### Potential additions:
- Core Beliefs AI Service (CBT-based limiting beliefs work)
- Dream Work AI Service (Jungian active imagination)
- Integration Planning AI Service (post-session action planning)
- Parts Dialogue AI Service (facilitate dialogue between parts)
- Somatic Tracking AI Service (body-focused awareness)

### Optimization opportunities:
- Cache common responses for faster offline mode
- Implement streaming responses for real-time text display
- Add voice input/output for accessibility
- Save and resume incomplete sessions
- Export session transcripts

---

**Last Updated**: 2025-10-28
**Version**: 1.0
**Model**: Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)
