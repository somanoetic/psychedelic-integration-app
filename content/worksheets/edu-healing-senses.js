/**
 * Educational reflection — What does healing look/feel/sound like + where.
 *
 * Four-row reflection from the "How Your Nervous System Heals" section.
 * Invites the user to imagine healing across multiple senses and locate it
 * in their life.
 *
 * Source: The Integration Companion, page 5.
 */
import { validateWorksheet } from './schema';

const EDU_COLLECTION = {
  id: 'edu-reflections',
  title: 'Educational reflections',
};

export default validateWorksheet({
  id: 'edu-healing-senses',
  version: 1,
  title: 'What does healing feel like?',
  subtitle: 'Imagine healing through your senses',
  description:
    'Four short reflections — what healing looks like, feels like, sounds ' +
    'like, and where it happens (who supports it).',
  tracks: ['integration', 'regulating'],
  collection: { ...EDU_COLLECTION, order: 20 },
  layout: 'letter-portrait',
  fields: [
    {
      id: 'healing-looks-like',
      label: 'What does healing look like?',
      kind: 'free-text',
      lines: 3,
    },
    {
      id: 'healing-feels-like',
      label: 'What does healing feel like?',
      kind: 'free-text',
      lines: 3,
    },
    {
      id: 'healing-sounds-like',
      label: 'What does healing sound like?',
      kind: 'free-text',
      lines: 3,
    },
    {
      id: 'where-healing-happens',
      label: 'Where does healing happen — and who is your support?',
      kind: 'free-text',
      lines: 4,
    },
  ],
});
