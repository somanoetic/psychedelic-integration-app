/** "The Art of Setting Healing Intentions" + "Categories of Healing Intentions" (source page 91). */
import { validateProsePage } from './schema';

export default validateProsePage({
  id: 'art-of-setting-healing-intentions',
  sourcePage: 91,
  blocks: [
    { type: 'heading', text: 'The Art of Setting Healing Intentions' },
    { type: 'leadGroup', lead: 'When setting intentions, try to connect with your', items: ['Curiosity', 'Compassion', 'Trust', 'Openness'] },
    { type: 'subheading', text: 'Categories of Healing Intentions' },
    { type: 'numbered', items: [
      { lead: 'Intentions for Presence and Openness', items: ['"I want to be present with whatever arises"', '"I want to approach my experience with curiosity"', '"I want to trust the wisdom of my system"', '"I want to be open to surprise and mystery"', '"I want to let go of needing to understand everything"'] },
      { lead: 'Intentions for Self-Compassion', items: ['"I want to meet any pain with gentleness"', '"I want to offer myself the love I would give a dear friend"', '"I want to practice patience with my healing process"', '"I want to forgive myself for any judgments that arise"', '"I want to honor all parts of myself with kindness"'] },
      { lead: 'Intentions for Body and Nervous System', items: ['"I want to listen to my body\'s wisdom"', '"I want to allow my nervous system to find its natural rhythm"', '"I want to trust the sensations and feelings that arise"', '"I want to honor my body\'s needs for safety and comfort"'] },
      { lead: 'Intentions for Connection and Relationship', items: ['"I want to explore how I relate to myself and others"', '"I want to experience healthy connection and boundaries"', '"I want to heal patterns that no longer serve me"', '"I want to feel worthy of love and belonging"', '"I want to trust in my capacity for healthy relationships"'] },
      { lead: 'Intentions for Release and Integration', items: ['"I want to let go of what I\'m ready to release"', '"I want to integrate what I learn into my daily life"', '"I want to honor both my strength and my vulnerability"', '"I want to embrace the full spectrum of my humanity"', '"I want to carry forward what serves my highest good"'] },
    ] },
  ],
});
