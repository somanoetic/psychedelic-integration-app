/**
 * Educational reflection — Your Unique Nervous System.
 *
 * Four-row "Write | Draw" table from "Understanding Your Unique Nervous
 * System". Each question renders writing lines plus an empty sketch box
 * (drawColumn: true) — print-only, matching the source journal. The drawn
 * ink is captured as part of the scan image.
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
      label: 'What helps YOU feel safe and regulated?',
      kind: 'free-text',
      lines: 4,
      drawColumn: true,
    },
    {
      id: 'early-warning-signs',
      label: 'What are YOUR early warning signs of activation or shutdown?',
      kind: 'free-text',
      lines: 4,
      drawColumn: true,
    },
    {
      id: 'window-of-tolerance',
      label: 'What does YOUR window of tolerance feel like?',
      kind: 'free-text',
      lines: 4,
      drawColumn: true,
    },
    {
      id: 'effective-regulation-tools',
      label: 'What are YOUR most effective regulation tools?',
      kind: 'free-text',
      lines: 4,
      drawColumn: true,
    },
  ],
});
