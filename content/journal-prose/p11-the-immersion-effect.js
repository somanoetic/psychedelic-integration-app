/** "The Immersion Effect: Creating Rich Neural Networks" (source page 11). */
import { validateProsePage } from './schema';

export default validateProsePage({
  id: 'the-immersion-effect',
  sourcePage: 11,
  blocks: [
    { type: 'heading', text: 'The Immersion Effect: Creating Rich Neural Networks' },
    { type: 'paragraph', text: 'When you experience healing through multiple senses simultaneously:' },
    { type: 'bullets', items: [
      'Your brain creates more neural connections — the more pathways involved, the stronger the memory and learning become',
      'Integration happens across brain regions — different parts of your brain start communicating in new ways',
      'Emotional and somatic memories get processed — not just cognitive understanding, but felt-sense transformation',
      'New patterns become embodied — changes happen at a cellular and nervous system level',
    ] },
    { type: 'subheading', text: 'The Power of "As If" Experiences' },
    { type: 'paragraph', text: 'During ketamine sessions, your brain often experiences healing "as if" it\'s really happening in your body:' },
    { type: 'bullets', items: [
      "Your nervous system doesn't distinguish between vividly imagined and actually experienced events",
      'Healing visualizations create real physiological changes in stress hormones, heart rate, and brain chemistry',
      'Feeling safe in the ketamine space teaches your nervous system what safety actually feels like',
      'Experiencing love, connection, or peace creates neural templates for these states in daily life',
    ] },
  ],
});
