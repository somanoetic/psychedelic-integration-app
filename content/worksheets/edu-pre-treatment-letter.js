/**
 * Educational reflection — Letter to yourself before treatment.
 *
 * Single large free-text page. The user writes a letter to themselves
 * before their first treatment, which they (or the app) can surface back
 * later — at month-3, month-6, or whenever — to see how far they've come.
 *
 * Source: The Integration Companion, page 14.
 */
import { validateWorksheet } from './schema';

const EDU_COLLECTION = {
  id: 'edu-reflections',
  title: 'Educational reflections',
};

export default validateWorksheet({
  id: 'edu-pre-treatment-letter',
  version: 1,
  title: 'Letter to myself before treatment',
  subtitle: 'A message to your future self',
  description:
    'Write a letter to yourself before you start treatment — what you hope ' +
    'for, what you\'re afraid of, what you want to remember. We\'ll bring ' +
    'this back to you later so you can see how far you\'ve come.',
  tracks: ['integration'],
  collection: { ...EDU_COLLECTION, order: 50 },
  layout: 'letter-portrait',
  fields: [
    {
      id: 'letter',
      label: 'Dear me, before treatment...',
      kind: 'free-text',
      lines: 22,
    },
  ],
});
