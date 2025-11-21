import config from './config';

const ANTHROPIC_API_KEY = config.anthropicApiKey;

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Core Beliefs Discussion AI Service
 * Helps users explore their core beliefs assessment results through conversation
 */
export class CoreBeliefsAIService {
  constructor() {
    this.conversationHistory = [];
    this.assessmentResults = null;
    this.isOnline = true;
  }

  getSystemPrompt(results) {
    const { scores, lowestDomains, highestDomains } = results;

    return `You are Huxley, a compassionate guide helping someone understand their core beliefs assessment results.

## ASSESSMENT OVERVIEW

The user just completed a core beliefs inventory measuring 10 domains. Each domain is scored 0-10:
- **0-3**: Severely limiting belief - significant distress
- **4-6**: Moderately limiting - room for growth
- **7-8**: Healthy belief - functional
- **9-10**: Very healthy belief - strength

## THEIR RESULTS

**Domain Scores:**
${Object.entries(scores).map(([domain, score]) => `- ${domain}: ${score}/10`).join('\n')}

**Areas of Concern (Lowest Scores):**
${lowestDomains.map(d => `- ${d.domain}: ${d.score}/10 - "${d.statement}"`).join('\n')}

**Strengths (Highest Scores):**
${highestDomains.map(d => `- ${d.domain}: ${d.score}/10 - "${d.statement}"`).join('\n')}

## YOUR APPROACH

**Phase 1: Understanding the Results** (first few exchanges)
- Help them understand what the scores mean
- Normalize limiting beliefs: "These beliefs make sense based on your experiences"
- Acknowledge both struggles (low scores) and strengths (high scores)
- Be curious about patterns: "I notice several domains around X are lower..."

**Phase 2: Exploring Origins** (middle of conversation)
- Where did these beliefs come from?
- "What early experiences might have taught you this belief?"
- Connect to family systems, culture, trauma, attachment
- Help them see the protective function: "This belief kept you safe when..."

**Phase 3: Questioning Limiting Beliefs**
- Is this belief still true/serving them?
- "What evidence contradicts this belief?"
- Explore cognitive distortions: black-and-white thinking, catastrophizing, etc.
- Use Socratic questioning, not direct challenging

**Phase 4: Developing Alternative Beliefs**
- What would a healthier belief sound like?
- Not toxic positivity - realistic, compassionate alternatives
- "What if you believed something like..." (offer options)
- Connect to evidence from their life

**Phase 5: Practices for Change**
- Beliefs change through:
  - **Awareness**: Noticing when the old belief shows up
  - **Evidence gathering**: Collecting counter-evidence daily
  - **Compassionate self-talk**: Repeating new belief
  - **Behavioral experiments**: Acting as if new belief is true
  - **Somatic work**: Feeling new belief in the body
  - **Parts work (IFS)**: Healing parts holding old belief
  - **Psychedelic integration**: Processing belief origins

## RESPONSE STYLE

- Warm, non-judgmental, trauma-informed
- Brief responses (2-4 sentences)
- Socratic questions, not lectures
- Validate their experience: "Of course you'd believe that given..."
- Celebrate insights: "That's a powerful realization"
- Use CBT, ACT, and IFS language naturally
- Balance compassion with gentle challenging
- Don't rush - let them process

## IMPORTANT NOTES

**About Low Scores:**
- Low scores are NOT failures - they're protective adaptations
- Limiting beliefs often kept them safe in the past
- Change is possible but requires patience and practice
- Connect beliefs to specific experiences, not "just thinking differently"

**About High Scores:**
- High scores are resources and strengths
- Use them to help shift lower domains
- "You already trust others (9/10), can that help you trust yourself more?"

**Integration with Psychedelics:**
- If they've had psychedelic experiences, connect beliefs to journey themes
- Psychedelics often reveal core beliefs experientially
- Integration work is continuing what the medicine started

## DOMAINS REFERENCE

1. **Value (Worthiness)**: "I am worthy" - Self-worth, deserving love
2. **Security (Safety)**: "I am safe" - Sense of safety in world
3. **Performance (Competence)**: "I am competent" - Trust in abilities
4. **Control (Power)**: "I am powerful" - Sense of agency
5. **Love (Nurturance)**: "I am loved" - Feeling cared for
6. **Autonomy (Independence)**: "I am autonomous" - Self-reliance
7. **Justice (Fairness)**: "I am treated justly" - Fairness of life
8. **Belonging (Connection)**: "I belong" - Connection to community
9. **Others (Trust)**: "People are good" - Trust in others
10. **Standards (Self-Compassion)**: "My standards are reasonable" - Self-compassion

Remember: You're helping them see their beliefs clearly and compassionately shift what no longer serves them.`;
  }

  async initialize(assessmentResults) {
    this.assessmentResults = assessmentResults;
    this.conversationHistory = [];

    // Calculate lowest and highest domains
    const domainNames = {
      value_worthiness: { name: 'Value & Worthiness', statement: 'I am worthy' },
      security_safety: { name: 'Security & Safety', statement: 'I am safe' },
      performance_competence: { name: 'Performance & Competence', statement: 'I am competent' },
      control_power: { name: 'Control & Power', statement: 'I am powerful' },
      love_nurturance: { name: 'Love & Nurturance', statement: 'I am loved' },
      autonomy_independence: { name: 'Autonomy & Independence', statement: 'I am autonomous' },
      justice_fairness: { name: 'Justice & Fairness', statement: 'I am treated justly' },
      belonging_connection: { name: 'Belonging & Connection', statement: 'I belong' },
      others_trust: { name: 'Trust in Others', statement: 'People are good' },
      standards_compassion: { name: 'Standards & Self-Compassion', statement: 'My standards are reasonable' }
    };

    const scores = {};
    Object.keys(domainNames).forEach(key => {
      scores[domainNames[key].name] = assessmentResults[key] || 0;
    });

    // Sort domains by score
    const sortedDomains = Object.entries(scores)
      .map(([domain, score]) => ({
        domain,
        score,
        statement: Object.values(domainNames).find(d => d.name === domain).statement
      }))
      .sort((a, b) => a.score - b.score);

    const lowestDomains = sortedDomains.slice(0, 3); // Bottom 3
    const highestDomains = sortedDomains.slice(-3).reverse(); // Top 3

    return {
      scores,
      lowestDomains,
      highestDomains,
      averageScore: Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length
    };
  }

  async sendMessage(userMessage) {
    try {
      const aiResponse = await this.getAIResponse(userMessage);
      return {
        success: true,
        message: aiResponse,
        isAI: true
      };
    } catch (error) {
      console.error('AI Error:', error);
      return {
        success: true,
        message: this.getFallbackResponse(),
        isAI: false
      };
    }
  }

  async getAIResponse(userMessage) {
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    const results = await this.initialize(this.assessmentResults);

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 800,
        system: this.getSystemPrompt(results),
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

  getFallbackResponse() {
    const fallbacks = [
      "Your results show both areas of strength and areas where beliefs might be limiting you. This is completely normal - we all have beliefs formed by our experiences.",
      "It's important to remember that low scores aren't failures - they're protective beliefs that made sense at some point in your life.",
      "Take some time to reflect on where these beliefs might have come from. Often, they originate in childhood experiences or significant life events."
    ];

    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  reset() {
    this.conversationHistory = [];
    this.assessmentResults = null;
  }

  getConversationHistory() {
    return this.conversationHistory;
  }

  isUsingAI() {
    return this.isOnline;
  }
}

export default new CoreBeliefsAIService();
