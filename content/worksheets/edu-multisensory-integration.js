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
      label: 'Word or intention',
      kind: 'free-text',
      lines: 1,
    },
    {
      id: 'visual',
      label: 'What does it look like?',
      kind: 'free-text',
      lines: 3,
    },
    {
      id: 'auditory',
      label: 'What does it sound like?',
      kind: 'free-text',
      lines: 3,
    },
    {
      id: 'somatic',
      label: 'What does it feel like in your body?',
      kind: 'free-text',
      lines: 3,
    },
    {
      id: 'olfactory',
      label: 'What does it smell like?',
      kind: 'free-text',
      lines: 3,
    },
    {
      id: 'emotional',
      label: 'What emotions arise when you think of it?',
      kind: 'free-text',
      lines: 3,
    },
  ],
});
