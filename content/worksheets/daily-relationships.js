/**
 * Daily Check-In — Page 3: Relationships Today
 *
 * Two open-text reflections paired with an overall feel check and a
 * comfort-being-myself reading.
 *
 * Source: The Integration Companion, "DAY N — Relationships Today" pages.
 */
import { validateWorksheet } from './schema';

const DAILY_COLLECTION = {
  id: 'daily-checkin',
  title: 'Daily Check-In',
};

export default validateWorksheet({
  id: 'daily-relationships',
  version: 1,
  title: 'Relationships Today',
  subtitle: 'Connection, challenge, how you showed up',
  description:
    'Notice the relationships that brought connection today and the ones ' +
    'that felt challenging. Track how comfortable you felt being yourself ' +
    'around others.',
  tracks: ['integration', 'parts'],
  collection: { ...DAILY_COLLECTION, order: 30 },
  layout: 'letter-portrait',
  fields: [
    {
      id: 'most-connection-type',
      label: 'Relationships that brought me the most connection — Type',
      kind: 'free-text',
      lines: 1,
      hint: 'Family, friend, partner, coworker, pet, etc.',
    },
    {
      id: 'most-connection-what',
      label: 'What happened',
      kind: 'free-text',
      lines: 3,
    },
    {
      id: 'most-challenging-type',
      label: 'Relationship that felt most challenging — Type',
      kind: 'free-text',
      lines: 1,
    },
    {
      id: 'most-challenging-what',
      label: 'What happened',
      kind: 'free-text',
      lines: 3,
    },
    {
      id: 'relationships-overall',
      label: 'Overall, my relationships today felt',
      kind: 'checkbox-list',
      allowOther: true,
      options: ['Supportive', 'Draining', 'Distant', 'Connected', 'Conflicted', 'Loving'],
    },
    {
      id: 'comfort-being-myself',
      label: 'How comfortable I felt being myself around others',
      kind: 'checkbox-list',
      allowOther: true,
      options: [
        'Very comfortable',
        'Somewhat comfortable',
        'Guarded',
        'Hiding parts of myself',
        'Completely closed off',
      ],
    },
  ],
});
