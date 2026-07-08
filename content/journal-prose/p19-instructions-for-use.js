/** "Instructions for Use" — baseline log instructions (source page 19). */
import { validateProsePage } from './schema';

export default validateProsePage({
  id: 'instructions-for-use',
  sourcePage: 19,
  blocks: [
    { type: 'heading', text: 'Instructions for Use' },
    { type: 'paragraph', text: 'Fill this out daily for 1-2 weeks before starting treatment. This creates your "before" snapshot that you can look back on to see how far you\'ve come. Be honest and gentle with yourself — this isn\'t about judgment, it\'s about creating an accurate starting point so you can celebrate your growth. There are no right or wrong answers — just document your current reality with compassion. Be as honest as possible: the more accurate your baseline, the more you\'ll appreciate your changes.' },
    { type: 'callout', style: 'emphasis', text: 'You deserve healing — every part of your current experience is worthy of compassion and care.' },
  ],
});
