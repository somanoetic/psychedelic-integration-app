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
 * Thought Experiments — Scenario-based explorations
 *
 * Classic philosophical thought experiments adapted for contemplative,
 * AI-guided exploration. Each `openingTheme` presents the scenario; the AI
 * then walks the person through the tensions it raises. Same conversation
 * machinery as `talkthroughTopics` (looked up by `getTopicById`), but
 * surfaced in a separate hub via the `category: 'thought_experiment'` tag.
 *
 * Source: Peg Tittle, "What If... Collected Thought Experiments in
 * Philosophy" (Routledge, 2016). Scenarios are faithful summaries of the
 * classic experiments, not verbatim quotations.
 */
export const thoughtExperiments = [
  {
    id: 'experience_machine',
    category: 'thought_experiment',
    title: 'The Experience Machine',
    emoji: '\u{1F50C}',
    icon: icons.insight,
    subtitle: "Nozick · what makes life worth living",
    description: 'A machine could give you any experience you wanted — indistinguishable from reality. Would you plug in for life?',
    estimatedTime: '15-25 min',
    source: 'Nozick, via Tittle, "What If..." (2016)',
    openingTheme: "Imagine a machine that could give you any experience you desired. Neuroscientists could stimulate your brain so you'd believe you were writing a great novel, making a friend, or falling in love — and you'd feel it all, completely real from the inside. Once plugged in, you wouldn't know you were in the tank; you'd think it was all actually happening. You can program your whole life in advance. Would you plug in? And if something in you hesitates — what is that hesitation pointing to?",
    guidingThemes: [
      'experience vs. reality',
      'what we want beyond pleasant feelings',
      'doing vs. merely feeling like we did',
      'contact with something real',
      'the value of authenticity',
      'how this lands after an expanded-state experience',
    ],
    journalPrompts: [
      'Would you plug in? Sit with your first honest answer before you justify it.',
      'What do you want that mere experience of it could not satisfy?',
      'Where in your real life are you tempted to choose the feeling over the thing itself?',
      'After your journey, did what felt real matter more, or less, than usual? Why?',
    ],
  },
  {
    id: 'ship_of_theseus',
    category: 'thought_experiment',
    title: 'The Ship of Theseus',
    emoji: '\u{1F6F3}️',
    icon: icons.puzzle,
    subtitle: 'Hobbes · identity through change',
    description: "If every plank of a ship is replaced over time, is it still the same ship? And if so — what are you, after all your cells have changed?",
    estimatedTime: '15-25 min',
    source: 'Hobbes, via Tittle, "What If..." (2016)',
    openingTheme: "A ship returns from many voyages. Over the years, every rotted plank is replaced, one by one, until not a single original piece remains. Is it still the same ship? Now imagine someone gathered all the discarded planks and rebuilt the original. Which one is the real ship? You are in the same situation: almost every cell in your body has been replaced since childhood, and your beliefs, moods, and memories have turned over too. So what makes you the same person you were?",
    guidingThemes: [
      'identity as continuity vs. substance',
      'what persists when everything changes',
      'the self as a process, not a thing',
      'memory and narrative as the thread',
      'who you were before vs. after a transformative experience',
      'sameness and change held together',
    ],
    journalPrompts: [
      'What about you has completely changed — and yet you still call it "you"?',
      'If none of your original "planks" remain, what makes you continuous with your younger self?',
      'After a journey that changed you, in what sense are you the same person — and in what sense not?',
      'Is the self a thing you have, or a story you keep telling? What changes if it is the latter?',
    ],
  },
  {
    id: 'teletransporter',
    category: 'thought_experiment',
    title: 'The Teletransporter',
    emoji: '\u{2728}',
    icon: icons.transcendence,
    subtitle: 'Parfit · survival and what matters',
    description: "A machine scans you, destroys you, and builds an exact copy on Mars. Does 'you' arrive — or does someone just like you wake up while you die?",
    estimatedTime: '15-25 min',
    source: 'Parfit, via Tittle, "What If..." (2016)',
    openingTheme: "You step into a teletransporter. It records the exact state of every cell in your body, destroys the original here on Earth, and transmits the information to Mars, where a perfect replica is assembled — same memories, same personality, certain it is you and that the trip was painless. Did you survive? Or did you die on Earth while a copy, who only thinks it's you, woke up on Mars? Parfit's unsettling suggestion: maybe the question of whether it's 'really you' isn't what matters most.",
    guidingThemes: [
      'survival vs. exact continuity',
      'what we actually fear about death',
      'is personal identity what truly matters?',
      'the copy that feels like you from the inside',
      'letting go of a fixed, indivisible self',
      'ego dissolution and the question of who survives',
    ],
    journalPrompts: [
      'Would you step in? What exactly are you afraid of losing?',
      'If a perfect copy carried on your life and relationships, what would still be missing — if anything?',
      'Parfit thought identity "is not what matters." What might matter more?',
      'Have you ever experienced a sense that "you" were not as solid or separate as you assumed? What did that feel like?',
    ],
  },
  {
    id: 'eternal_recurrence',
    category: 'thought_experiment',
    title: 'Eternal Recurrence',
    emoji: '\u{267E}️',
    icon: icons.balance,
    subtitle: 'Nietzsche · living with full affirmation',
    description: "What if you had to live this exact life — every joy and every pain — over and over, infinitely? Would that crush you, or could you say yes to it?",
    estimatedTime: '15-25 min',
    source: 'Nietzsche, via Tittle, "What If..." (2016)',
    openingTheme: "Nietzsche asks you to imagine a demon who comes to you in your loneliest moment and says: this life, as you have lived it and are living it now, you will have to live once more and countless times more — every pain and every joy, every thought and sigh, all in the same sequence, nothing new. Would you collapse in despair, or would you crave nothing more fervently than this confirmation? It's not a prediction. It's a test: how would you have to live so that you could say yes to all of it?",
    guidingThemes: [
      'affirmation vs. resignation',
      'amor fati — love of one’s fate',
      'living so the present is worth repeating',
      'meaning without an external reward',
      'facing the hard parts of your life',
      'how an expanded-state insight might change your "yes"',
    ],
    journalPrompts: [
      'If you had to relive your life exactly, what would you most dread repeating — and what does that tell you?',
      'What would you need to change so you could affirm your life, not just endure it?',
      'Is there something painful in your past you could imagine saying "yes" to? What would that take?',
      'How would you live this week if you knew you’d live it again forever?',
    ],
  },
  {
    id: 'marys_room',
    category: 'thought_experiment',
    title: "Mary's Room",
    emoji: '\u{1F308}',
    icon: icons.consciousness,
    subtitle: 'Jackson · the limits of knowing',
    description: "Mary knows every physical fact about color but has only ever seen black and white. The day she sees red — does she learn something new?",
    estimatedTime: '15-25 min',
    source: 'Jackson, via Tittle, "What If..." (2016)',
    openingTheme: "Mary is a brilliant scientist who knows everything there is to know about the physics and neuroscience of color — every wavelength, every brain process. But she has lived her entire life in a black-and-white room and has never actually seen color. One day she steps outside and sees a red rose for the first time. Does she learn something new? It seems she does — she learns what red looks like. But if she already knew all the physical facts, then experience itself carries knowledge that no description can give.",
    guidingThemes: [
      'knowing about vs. knowing from the inside',
      'the felt quality of experience',
      'why some things can’t be explained, only undergone',
      'the gap between concept and direct contact',
      'why expanded states resist being put into words',
      'humility before what description leaves out',
    ],
    journalPrompts: [
      'What do you "know" only because you lived it — that no explanation could have given you?',
      'Describe something from your own experience that words consistently fail to capture.',
      'When have you confused reading about something for actually knowing it?',
      'What did your own direct experience teach you that no one could have told you in advance?',
    ],
  },
  {
    id: 'veil_of_ignorance',
    category: 'thought_experiment',
    title: 'The Veil of Ignorance',
    emoji: '\u{2696}️',
    icon: icons.interconnectedness,
    subtitle: 'Rawls · fairness and the common good',
    description: "Design the rules of society without knowing who you'll be in it — rich or poor, gifted or struggling. What would you choose?",
    estimatedTime: '15-25 min',
    source: 'Rawls, via Tittle, "What If..." (2016)',
    openingTheme: "Imagine you must design the rules of a society — but from behind a 'veil of ignorance.' You don't know who you'll be once the veil lifts: your wealth, talents, health, race, or whether you'll be powerful or powerless. You could end up anyone. From that position, what rules would you choose? Rawls argued that only choices we'd accept without knowing our place are truly fair — because no one can rig the game in their own favor.",
    guidingThemes: [
      'fairness as impartiality',
      'designing for the least advantaged',
      'separating self-interest from justice',
      'compassion as enlightened self-interest',
      'how interconnection reframes "us vs. them"',
      'carrying a felt sense of shared humanity into daily choices',
    ],
    journalPrompts: [
      'What would you change about the world if you might wake up as anyone in it?',
      'Where do your current views quietly assume you’ll stay on the comfortable side?',
      'Who do you find easiest to forget when you think about fairness?',
      'If you truly felt your fate bound up with everyone’s, what would you do differently?',
    ],
  },
];

/**
 * Look up a talkthrough topic by ID. Searches both the contemplative
 * talkthroughs and the scenario-based thought experiments.
 * @param {string} id - Topic ID (e.g. 'who_am_i', 'experience_machine')
 * @returns {object|undefined}
 */
export const getTopicById = (id) =>
  talkthroughTopics.find(t => t.id === id) ||
  thoughtExperiments.find(t => t.id === id);
