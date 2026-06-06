/**
 * Educational reflection — Common nervous-system patterns resonance check.
 *
 * Small embedded reflection from the polyvagal chapter ("Common Signs Your
 * Nervous System Learned to Be Extra Protective" — fight/flight, shutdown,
 * mixed). After reading the patterns, the user writes which ones resonate.
 *
 * Source: The Integration Companion, page 3.
 */
import { validateWorksheet } from './schema';

const EDU_COLLECTION = {
  id: 'edu-reflections',
  title: 'Educational reflections',
  description:
    'Short paper reflections tied to teaching moments — fill them out as ' +
    'they come up while reading.',
};

export default validateWorksheet({
  id: 'edu-patterns-resonance',
  version: 1,
  title: 'Which patterns resonate?',
  subtitle: 'After reading about fight/flight, shutdown, and mixed patterns',
  description:
    'A reflective check-in after reading about how nervous-system patterns ' +
    'show up. Note any that feel familiar — no judgment, just naming.',
  tracks: ['regulating', 'somatic'],
  collection: { ...EDU_COLLECTION, order: 10 },
  layout: 'letter-portrait',
  fields: [
    {
      id: 'patterns-that-resonate',
      label: 'Patterns I notice in myself',
      kind: 'free-text',
      lines: 10,
      hint: 'Fight/flight, shutdown, mixed — or your own words.',
    },
  ],
});
