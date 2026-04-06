/**
 * Mock Response Generator for Conversation Bot Tests
 *
 * Generates realistic Huxley-style responses based on the mode detected
 * from the system prompt. Used by the mocked claudeProxyService.
 */

let mockCallCount = 0;

function resetCallCount() {
  mockCallCount = 0;
}

function generateMockResponse(systemPrompt, userMessage) {
  mockCallCount++;
  const mode = detectMode(systemPrompt);
  const responses = getResponses(mode);
  const idx = Math.min(mockCallCount - 1, responses.length - 1);
  const displayMsg = responses[idx];

  const therapeuticData = {
    themes: getThemes(mode, mockCallCount),
    parts: mode === 'ifs' ? [{ name: 'Inner Critic', role: 'protector', notes: 'Harsh self-judgment pattern' }] : [],
    nervousSystemState: getNSState(mode, mockCallCount),
    exerciseRecommendation: mockCallCount >= 5 ? 'GR-001' : null,
    recommendationReason: mockCallCount >= 5 ? 'Grounding may help integration' : null,
  };

  return `${displayMsg}\n\n---THERAPEUTIC_DATA---\n${JSON.stringify(therapeuticData)}`;
}

function detectMode(systemPrompt) {
  if (systemPrompt.includes('IFS')) return 'ifs';
  if (systemPrompt.includes('Autonomic Mapping')) return 'nervous_system_mapping';
  if (systemPrompt.includes('journal') || systemPrompt.includes('Journal')) return 'journal';
  if (systemPrompt.includes('core belief') || systemPrompt.includes('Core Belief')) return 'core_beliefs';
  if (systemPrompt.includes('trigger') || systemPrompt.includes('glimmer')) return 'triggers_glimmers';
  if (systemPrompt.includes('regulating resource') || systemPrompt.includes('Regulation')) return 'regulating_resources';
  if (systemPrompt.includes('experience mapping') || systemPrompt.includes('Experience Processing')) return 'experience_mapping';
  if (systemPrompt.includes('intention') || systemPrompt.includes('Intention')) return 'intention';
  if (systemPrompt.includes('therapeutic integration') || systemPrompt.includes('Therapeutic Integration')) return 'therapeutic_integration';
  if (systemPrompt.includes('active imagination') || systemPrompt.includes('Active Imagination')) return 'active_imagination';
  return 'general';
}

function getResponses(mode) {
  const base = {
    ifs: [
      "Thank you for sharing that. A harsh inner voice that got louder after your session — that's significant. It sounds like the medicine may have amplified something that was already there. I'm curious — when you hear that critical voice, where do you notice it in your body?",
      "So it lives in your chest and jaw. That tightness and clenching — your body is telling us something important about this part. Let's get curious about it together. When you focus on that tightness, what do you notice about this critical part?",
      "Frustration with the critic — that makes so much sense. You're tired of being beaten up. I want to name something: that frustration might actually be another part of you, a protector that's had enough. Could you check — is there any space to get curious about what the critic is trying to do FOR you, even though it's painful?",
      "You're noticing something really important — that underneath the harshness, this part seems worried. It's trying to protect you from failure. That's actually a very caring intention, even though the method hurts. What is it like to see it that way?",
      "Since childhood... this part learned to criticize you before your dad could. That's a survival strategy, not a character flaw. This part has been working overtime for years. How does it feel to understand where it came from?",
      "That sadness is Self energy — your true self feeling compassion for a part that's been working so hard. This is exactly what healing looks like in IFS. Can you let this part know that you see how hard it's been working?",
      "That fear makes complete sense given the part's origin story. It learned that criticism equals safety. Now you're asking it to consider that you can be safe without constant self-judgment. That's a big ask. How does the part respond?",
      "Beautiful. You're offering this part something it may never have received — appreciation instead of rejection. That's radical. I notice you said you feel calmer — that spaciousness is Self energy expanding.",
      "What you've done today is really significant. You went from fighting with your critic to understanding it, and even appreciating it. That shift — from adversary to ally — is the heart of IFS work.",
      "You're very welcome. That space you're feeling between you and the critical voice — that IS integration. The voice may still show up, but now you have a relationship with it.",
    ],
    nervous_system_mapping: [
      "Thank you for knowing that about yourself. Activation and fight-or-flight is your 'home away from home.' Can you think of a specific recent time when you were solidly in that activated state?",
      "That emergency meeting — perfect example. Let's just dip a toe into that memory. What do you notice in your body right now?",
      "Shoulders up, shallow breath, sweaty hands — your body remembers clearly. What's the overall emotional feeling or tone when you're in that activated state?",
      "Urgency — your sympathetic nervous system mobilizing for action. When you're in this activated state, what do you tend to DO? What behaviors feel automatic?",
      "Over-preparing, list-making, compulsive email checking. How about communication? When you're activated, how does the way you connect with others change?",
      "Clipped, sharp, direct. That makes sense — your system prioritizes action over relationship when mobilized. What happens with your thinking in this state?",
      "Fifteen browser tabs — what a perfect image. Racing, unable to focus. How does this state affect your sleep?",
      "3am wake-ups with a racing mind — classic sympathetic activation. How does this state affect eating? Any substances or compulsive behaviors?",
      "Skipping meals, eating too fast. Now for the core beliefs — when you're in this activated state, complete: 'I am ____' and 'The world is ____'?",
      "I am not enough. The world is demanding. Powerful words. Let's move to shutdown. Think of a time you were solidly in that collapsed space.",
      "The weekend after the crisis — your system crashed. Let's dip just a toe in. What do you notice in your body?",
      "Heaviness, fog, heavy eyelids — your dorsal vagal system. What's the overall emotional tone?",
      "Emptiness, colorless. Not laziness, but protective shutdown. What do you DO in this state?",
      "Scrolling, binge-watching, can't decide. How does communication change?",
      "Silence, avoiding calls. Dorsal takes you offline. How about thinking?",
      "Mud-wading, slow, dull. Now: 'I am ____' and 'The world is ____'?",
      "I am broken. The world is gray. Now let's move to your safe state. Think of a time you felt truly safe and connected.",
      "You and your dog, morning coffee. Beautiful. Really let yourself BE there. What do you feel in your body?",
      "Warmth in your chest, easy breathing, 'enough.' Your ventral vagal system. Just being is enough. Let that soak in.",
      "I am whole. The world is beautiful and I belong. Those are your ventral core beliefs. You've mapped three complete states today. That's real self-knowledge.",
    ],
    journal: [
      "Thank you for bringing this to your journal. Processing something intense takes courage. What would you like to start with?",
      "Beautiful geometry turning into deep emotional territory — the medicine often shows beauty to build trust. What happened when it shifted?",
      "Being brought back to that memory — the medicine went right to a core wound. How was it to feel that grief as your adult self?",
      "Letting the grief move through with a facilitator holding space — that's exactly what integration looks like. Grief carried for twenty years needs witnesses.",
      "Connecting people-pleasing to that seven-year-old's logic. The insight is the seed; recognizing the pattern in real time is it starting to grow.",
      "Catching the pattern in real-time IS the integration. Awareness comes first, then choice. The over-apologizing will shift as you practice noticing it.",
      "Being gentle with yourself — exactly the right medicine right now. The ceremony cracked something open; tenderness helps it heal.",
      "That thread — abandonment to people-pleasing to over-apologizing — that's integration happening right now, in this journal. You're doing beautiful work.",
    ],
    core_beliefs: [
      "Thank you for naming that. 'Fundamentally flawed' — heavy words to carry. When did you first remember feeling that way?",
      "It shows up everywhere. That's how core beliefs work: they become the lens through which you see everything. The belief came first; the evidence seems to confirm it.",
      "An eight-year-old deciding their parents' divorce was their fault — heartbreaking and completely understandable. The belief was a survival strategy, not an accurate assessment.",
      "That's one of the gifts of ketamine — perspective shift where you see the belief as separate. The challenge is holding that clarity in daily life.",
      "The gap between ceremony clarity and daily reality — that's the integration challenge. It takes repetition, not just understanding, to rewire neural pathways.",
      "A sinking in your stomach when you receive a compliment — your body running the shame program. Noticing it is the first step to interrupting it.",
      "Worthy of love without earning it — your ventral vagal core belief trying to emerge. You're not creating something new; you're uncovering something that was always there.",
      "That new belief is grounded in truth. 'I was always enough' — notice that's not future tense. You WERE always enough. The divorce was never your fault.",
    ],
    triggers_glimmers: [
      "You're doing it exactly right just by paying attention. The noticing IS the practice. Tell me about a trigger you noticed this week.",
      "That flush of heat, clenched fists — your sympathetic system fired up instantly. What do you think that trigger is really about, underneath?",
      "Feeling unheard, voice doesn't matter — there's the root. The trigger isn't really your manager; it's the old story. Now tell me about a glimmer.",
      "Sun through trees, spontaneous peace — that's a textbook glimmer. Your ventral vagal system found a doorway back to safety through beauty.",
      "Your cat, warmth in your chest — co-regulation with an animal. Notice both glimmers involve presence and connection, not achievement.",
      "The text from your ex — instant tension and rehearsing responses. Your system went into preparation mode, protecting you.",
      "Triggers: powerlessness, being unseen. Glimmers: connection, beauty, presence. That's YOUR unique nervous system map. Sophisticated self-awareness.",
      "Breadcrumbs back to safety — I love that image. The more you notice glimmers, the more your nervous system learns to find them. Keep following those breadcrumbs.",
    ],
  };

  const general = [
    "Thank you for sharing that. I can hear how important this is. Tell me more about what's been coming up.",
    "I appreciate you going deeper. What you're describing makes sense given your journey. What are you noticing in your body?",
    "That's significant awareness. The fact that you can name this pattern means you're already in relationship with it.",
    "You're touching on something meaningful. Integration often works like this — we see the pattern, then we see it in action.",
    "I notice the strength in what you're sharing. Your willingness to look at this directly is courageous.",
    "That connection — between the experience and daily life — that IS integration. Not always dramatic; sometimes this quiet recognition.",
    "You're doing really important work. The insights from ceremony need this patient attention to take root.",
    "Thank you for this conversation. What you've shared shows real depth of self-understanding.",
    "That's a beautiful reframe. You're shifting from judgment to curiosity, which is exactly what integration asks of us.",
    "I'm here with you in this. What feels most important to carry forward from what we've explored today?",
  ];

  return base[mode] || general;
}

function getThemes(mode, turn) {
  const themes = {
    ifs: ['self-criticism', 'inner critic', 'childhood patterns', 'self-compassion'],
    nervous_system_mapping: ['autonomic patterns', 'activation responses', 'shutdown patterns', 'safety cues'],
    journal: ['grief', 'abandonment', 'people-pleasing', 'self-compassion'],
    core_beliefs: ['fundamental flaw belief', 'childhood origin', 'shame', 'worthiness'],
    triggers_glimmers: ['feeling unheard', 'nervous system regulation', 'beauty as safety', 'co-regulation'],
    regulating_resources: ['self-regulation', 'somatic awareness', 'co-regulation needs'],
    experience_mapping: ['ego dissolution', 'being held', 'surrender', 'playfulness'],
    intention: ['self-abandonment', 'giving and receiving', 'preparation'],
    therapeutic_integration: ['control patterns', 'surrender', 'small changes'],
    active_imagination: ['threshold imagery', 'neglected self', 'creativity'],
    general: ['integration plateau', 'patience', 'daily practice'],
  };
  return (themes[mode] || themes.general).slice(0, Math.min(turn, 4));
}

function getNSState(mode, turn) {
  if (mode === 'nervous_system_mapping') {
    if (turn <= 10) return 'sympathetic';
    if (turn <= 17) return 'dorsal';
    return 'ventral';
  }
  if (turn <= 2) return null;
  if (turn <= 5) return 'sympathetic';
  return 'ventral';
}

module.exports = {
  generateMockResponse,
  resetCallCount,
};
