/**
 * Educational reflection — Multisensory Integration of a chosen intention.
 *
 * The user picks a word/intention (calm, safety, joy, etc.) and explores
 * what that intention looks/sounds/feels/smells like and the emotions it
 * brings. This is the most reusable of the educational reflections — most
 * users will fill it out multiple times for different intentions.
 *
 * Source: The Integration Companion, page 12.
 */
import { validateWorksheet } from './schema';

const EDU_COLLECTION = {
  id: 'edu-reflections',
  title: 'Educational reflections',
};

export default validateWorksheet({
  id: 'edu-multisensory-integration',
  version: 1,
  title: 'Multisensory Integration',
  subtitle: 'Bring an intention to life across all your senses',
  description:
    'Choose a word or intention (calm, safety, joy, courage, ease...) and ' +
    'imagine what an accomplished version of it would look, sound, feel, ' +
    'and smell like — plus the emotions it brings up. Repeatable for ' +
    'different intentions.',
  tracks: ['regulating', 'integration', 'parts'],
  collection: { ...EDU_COLLECTION, order: 40 },
  layout: 'letter-portrait',
  fields: [
    {
      id: 'word-or-intention',
      label: 'Word',
      kind: 'free-text',
      lines: 1,
    },
    {
      id: 'visual',
      label: 'Visual — What does it look like?',
      kind: 'free-text',
      lines: 3,
      drawColumn: true,
    },
    {
      id: 'auditory',
      label: 'Auditory — What does it sound like?',
      kind: 'free-text',
      lines: 3,
      drawColumn: true,
    },
    {
      id: 'somatic',
      label: 'Somatic — What does it feel like?',
      kind: 'free-text',
      lines: 3,
      drawColumn: true,
    },
    {
      id: 'olfactory',
      label: 'Olfactory — What does it smell like?',
      kind: 'free-text',
      lines: 3,
      drawColumn: true,
    },
    {
      id: 'emotional',
      label: 'Emotional — What emotions do I feel when I think of it?',
      kind: 'free-text',
      lines: 3,
      drawColumn: true,
    },
  ],
});
