/**
 * Baseline Log — Page 1: My Life Right Now
 *
 * Open-text "before" snapshot. Filled out once in the 1-2 weeks before
 * starting treatment. Pairs with the other 3 baseline pages.
 *
 * Source: The Integration Companion, page 15.
 */
import { validateWorksheet } from './schema';

const BASELINE_COLLECTION = {
  id: 'baseline-log',
  title: 'Pre-Treatment Baseline Log',
  description:
    'A "before" snapshot of your life. Fill these four pages out once in the ' +
    '1–2 weeks before your first treatment — you\'ll come back to them later ' +
    'to see how far you\'ve come.',
};

export default validateWorksheet({
  id: 'baseline-life-now',
  version: 1,
  title: 'My Life Right Now',
  subtitle: 'A snapshot of where you are before treatment',
  description:
    'Open-ended reflection on daily life, challenges, coping, relationships, ' +
    'body, energy, and what you hope ketamine therapy will help with.',
  tracks: ['integration'],
  collection: { ...BASELINE_COLLECTION, order: 10 },
  layout: 'letter-portrait',
  fields: [
    {
      id: 'three-words',
      label: 'Three words that describe my daily life',
      kind: 'list',
      maxItems: 3,
      promptForClaude:
        'Three short single-word or short-phrase entries. Preserve as written.',
    },
    {
      id: 'biggest-challenges',
      label: 'My biggest daily challenges are',
      kind: 'free-text',
      lines: 3,
    },
    {
      id: 'cope-difficult-emotions',
      label: 'How I typically cope with difficult emotions',
      kind: 'free-text',
      lines: 3,
    },
    {
      id: 'relationships-general',
      label: 'What my relationships are generally like',
      kind: 'free-text',
      lines: 3,
    },
    {
      id: 'body-most-days',
      label: 'How I feel in my body most days',
      kind: 'free-text',
      lines: 3,
    },
    {
      id: 'energy-motivation',
      label: 'My energy and motivation levels are',
      kind: 'free-text',
      lines: 3,
    },
    {
      id: 'hope-ketamine-helps',
      label: 'What I hope ketamine therapy will help with',
      kind: 'free-text',
      lines: 3,
    },
    {
      id: 'life-after-treatment',
      label: 'What I want my life to look like after treatment',
      kind: 'free-text',
      lines: 3,
    },
  ],
});
