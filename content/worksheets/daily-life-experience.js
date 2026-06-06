/**
 * Daily Check-In — Page 2: Life Experience
 *
 * Captures how home and work felt today. The 1-10 stress scale gives a
 * quick number you can graph over time; the free-text fields give context.
 *
 * Source: The Integration Companion, "DAY N — Life Experience" pages.
 */
import { validateWorksheet } from './schema';

const DAILY_COLLECTION = {
  id: 'daily-checkin',
  title: 'Daily Check-In',
};

export default validateWorksheet({
  id: 'daily-life-experience',
  version: 1,
  title: 'Life Experience',
  subtitle: 'Home and work today',
  description:
    'Two short check-ins on how your living space and daily responsibilities ' +
    'felt today.',
  tracks: ['integration'],
  collection: { ...DAILY_COLLECTION, order: 20 },
  layout: 'letter-portrait',
  fields: [
    {
      id: 'living-space-today',
      label: 'How my living space feels today',
      kind: 'checkbox-list',
      allowOther: true,
      options: ['Peaceful', 'Chaotic', 'Stressful', 'Safe', 'Overwhelming', 'Comfortable'],
    },
    {
      id: 'home-environment-notes',
      label: 'What my home environment is like',
      kind: 'free-text',
      lines: 3,
    },
    {
      id: 'work-feel-today',
      label: 'How work / responsibilities feel today',
      kind: 'checkbox-list',
      allowOther: true,
      options: ['Manageable', 'Overwhelming', 'Stressful', 'Boring', 'Meaningful', 'Exhausting'],
    },
    {
      id: 'stress-level',
      label: 'My stress level during daily tasks',
      kind: 'scale',
      min: 1,
      max: 10,
      minLabel: 'No stress',
      maxLabel: 'Extremely stressed',
    },
    {
      id: 'handle-challenges',
      label: 'How I handled challenges today',
      kind: 'free-text',
      lines: 4,
    },
  ],
});
