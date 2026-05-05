/**
 * Philosophical Talkthroughs — Topic Definitions
 *
 * 5 guided philosophical explorations delivered as Socratic,
 * AI-guided conversations through the Huxley service.
 */

import { icons } from '../lib/uiIcons';

export const talkthroughTopics = [
  {
    id: 'who_am_i',
    title: 'Who Am I?',
    emoji: '\u{1FA9E}',
    icon: icons.selfReflect,
    subtitle: 'Identity and self-inquiry',
    description: 'Explore the layers of identity — roles, stories, sensations — and discover what remains when they fall away.',
    estimatedTime: '15-25 min',
    openingTheme: 'The question "Who am I?" is not looking for a biography. It is an invitation to look at the one who is looking.',
    guidingThemes: [
      'self-inquiry',
      'witness consciousness',
      'identity layers',
      'the observing self',
      'roles vs. essence',
      'the space between thoughts',
    ],
    journalPrompts: [
      'What remains when you remove all labels and roles?',
      'Describe a moment when your sense of self dissolved or shifted.',
      'Who were you before your first memory?',
      'Write about the difference between who you think you are and who you experience yourself to be.',
    ],
  },
  {
    id: 'nature_of_consciousness',
    title: 'The Nature of Consciousness',
    emoji: '\u{2728}',
    icon: icons.consciousness,
    subtitle: 'Awareness exploring itself',
    description: 'What is this awareness that is reading these words right now? Turn attention toward attention itself.',
    estimatedTime: '15-25 min',
    openingTheme: 'Consciousness is the one thing we can never step outside of to examine. Yet here we are, aware that we are aware.',
    guidingThemes: [
      'awareness of awareness',
      'the hard problem',
      'subjective experience',
      'altered states as data',
      'the container vs. the contents',
      'consciousness and the body',
    ],
    journalPrompts: [
      'What is the difference between your thoughts and the awareness that notices them?',
      'Describe a moment when consciousness felt different than usual. What changed — and what stayed the same?',
      'If consciousness is like a mirror, what have you been mistaking for the mirror itself?',
      'Write about what you cannot doubt about your own experience right now.',
    ],
  },
  {
    id: 'unity_and_separation',
    title: 'Unity and Separation',
    emoji: '\u{267E}\uFE0F',
    icon: icons.wholenessInfinity,
    subtitle: 'Non-dual awareness',
    description: 'The experience of oneness is common in expanded states — but what does it mean for daily life? Explore the dance between unity and individuality.',
    estimatedTime: '15-25 min',
    openingTheme: 'Many people in expanded states experience a profound sense that separation is an illusion. And yet, here we are — apparently separate. Both seem true.',
    guidingThemes: [
      'non-duality',
      'interconnection',
      'the illusion of separation',
      'both/and thinking',
      'wave and ocean',
      'individuality within wholeness',
    ],
    journalPrompts: [
      'Describe a time you felt deeply connected to something larger than yourself.',
      'How does the experience of unity coexist with the experience of being a separate person?',
      'What changes in your daily life when you hold both separation and connection as true?',
      'Write a letter from the part of you that knows oneness to the part that feels alone.',
    ],
  },
  {
    id: 'healing_and_wholeness',
    title: 'Healing and Wholeness',
    emoji: '\u{1F331}',
    icon: icons.sprout,
    subtitle: 'Integration and becoming whole',
    description: 'What does it actually mean to heal? Explore whether healing is about fixing what is broken or remembering what was never lost.',
    estimatedTime: '15-25 min',
    openingTheme: 'We often approach healing as though something is wrong with us. But what if healing is not about becoming someone new — but about including everything you already are?',
    guidingThemes: [
      'wholeness vs. perfection',
      'including the wounded parts',
      'the paradox of acceptance and change',
      'kintsugi — golden repair',
      'integration as homecoming',
      'post-traumatic growth',
    ],
    journalPrompts: [
      'What part of yourself have you been trying to fix — and what would it mean to include it instead?',
      'Describe what "wholeness" feels like in your body, not just your mind.',
      'Write about a wound that became a source of wisdom or strength.',
      'If healing is a homecoming, what are you coming home to?',
    ],
  },
  {
    id: 'mystery_and_not_knowing',
    title: 'Mystery and Not-Knowing',
    emoji: '\u{1F30C}',
    icon: icons.mystery,
    subtitle: 'Embracing uncertainty',
    description: 'The mind craves answers. But some of the most profound experiences resist explanation. What opens up when you stop needing to know?',
    estimatedTime: '15-25 min',
    openingTheme: 'The most honest response to the deepest questions might be silence. Not the silence of having nothing to say — but the silence of standing before something too large for words.',
    guidingThemes: [
      'negative capability',
      'apophatic knowing',
      'beginner\'s mind',
      'the limits of language',
      'comfort with ambiguity',
      'mystery as invitation',
    ],
    journalPrompts: [
      'What question are you holding that you suspect has no answer — and what happens when you hold it anyway?',
      'Describe an experience that words cannot capture. Try anyway.',
      'What would change if you stopped needing to understand your experience and simply lived it?',
      'Write about something you used to be certain about that you now hold more loosely.',
    ],
  },
];

/**
 * Look up a talkthrough topic by ID.
 * @param {string} id - Topic ID (e.g. 'who_am_i')
 * @returns {object|undefined}
 */
export const getTopicById = (id) => talkthroughTopics.find(t => t.id === id);
