/**
 * Educational reflection — Your Unique Nervous System.
 *
 * Four-row table from "Understanding Your Unique Nervous System". The
 * printed journal has both a Write column and a Draw column; on this
 * worksheet we render only a single free-text column per question (the
 * drawing column is implicit — users can sketch in the margin of the
 * printed page if they want, and that ink will be captured in the scan
 * alongside the writing).
 *
 * Source: The Integration Companion, page 7.
 */
import { validateWorksheet } from './schema';

const EDU_COLLECTION = {
  id: 'edu-reflections',
  title: 'Educational reflections',
};

export default validateWorksheet({
  id: 'edu-unique-ns',
  version: 1,
  title: 'Your Unique Nervous System',
  subtitle: 'Get curious about how YOUR system works',
  description:
    'Four short reflections — what helps you feel safe, your early warning ' +
    'signs, what your window of tolerance feels like, and your most ' +
    'effective regulation tools.',
  tracks: ['regulating', 'somatic'],
  collection: { ...EDU_COLLECTION, order: 30 },
  layout: 'letter-portrait',
  fields: [
    {
      id: 'helps-feel-safe',
      label: 'What helps me feel safe and regulated',
      kind: 'free-text',
      lines: 4,
    },
    {
      id: 'early-warning-signs',
      label: 'My early warning signs of activation or shutdown',
      kind: 'free-text',
      lines: 4,
    },
    {
      id: 'window-of-tolerance',
      label: 'What my window of tolerance feels like',
      kind: 'free-text',
      lines: 4,
    },
    {
      id: 'effective-regulation-tools',
      label: 'My most effective regulation tools',
      kind: 'free-text',
      lines: 4,
    },
  ],
});
