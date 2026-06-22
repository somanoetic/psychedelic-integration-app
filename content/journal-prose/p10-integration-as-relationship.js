/** "Integration as Relationship with Your Healing" (source page 10, continues p.9). */
import { validateProsePage } from './schema';

export default validateProsePage({
  id: 'integration-as-relationship',
  sourcePage: 10,
  blocks: [
    { type: 'leadGroup', lead: 'Trauma Resolution and Nervous System Regulation', items: ['Trauma lives in the body and nervous system, not just the mind', 'Integration helps the nervous system learn new responses to old triggers', 'Somatic awareness developed during sessions needs daily practice to maintain', 'The window of tolerance gradually expands through consistent attention'] },
    { type: 'leadGroup', lead: 'Meaning-Making and Post-Traumatic Growth', items: ['The brain is constantly creating meaning from experience', 'Without conscious integration, the mind may minimize or forget profound experiences', 'Journaling and reflection help encode experiences into long-term memory', 'Integration transforms "something happened to me" into "I am capable of healing"'] },
    { type: 'subheading', text: 'Integration as Relationship with Your Healing' },
    { type: 'paragraph', text: 'Integration is fundamentally about developing a conscious relationship with your own healing process. It means:' },
    { type: 'bullets', items: [
      'Becoming curious about your inner world rather than afraid of it',
      'Learning the language of your nervous system and body wisdom',
      'Honoring the pace of healing rather than forcing outcomes',
      'Building capacity to hold difficult experiences with compassion',
      'Creating safety for all parts of yourself to be seen and welcomed',
    ] },
  ],
});
