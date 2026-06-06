/**
 * Daily Check-In — Page 1: Morning Check-In
 *
 * One of five pages in the daily check-in worksheet set. Repeats indefinitely
 * (the journal templates days 1–14, but the user keeps using it after that).
 *
 * Source: The Integration Companion, "DAY N — Morning Check-In" pages.
 */
import { validateWorksheet } from './schema';

const DAILY_COLLECTION = {
  id: 'daily-checkin',
  title: 'Daily Check-In',
  description:
    'A five-page reflection for each day. Most people fill it out once in ' +
    'the morning and once in the evening — but use it however serves you.',
};

export default validateWorksheet({
  id: 'daily-morning-checkin',
  version: 1,
  title: 'Morning Check-In',
  subtitle: 'How you woke up today',
  description:
    'A short morning page — how you woke, sleep quality, first thoughts, ' +
    'energy level.',
  tracks: ['integration', 'regulating'],
  collection: { ...DAILY_COLLECTION, order: 10 },
  layout: 'letter-portrait',
  fields: [
    { id: 'date', label: 'Date', kind: 'date' },
    {
      id: 'how-i-woke-up',
      label: 'How I woke up today',
      kind: 'checkbox-list',
      allowOther: true,
      options: ['Refreshed', 'Tired', 'Anxious', 'Peaceful', 'Groggy', 'Energized'],
    },
    {
      id: 'sleep-quality',
      label: 'Quality of sleep last night',
      kind: 'scale',
      min: 1,
      max: 10,
      minLabel: 'Terrible',
      maxLabel: 'Excellent',
    },
    {
      id: 'first-thoughts',
      label: 'First thoughts / feelings upon waking',
      kind: 'free-text',
      lines: 4,
    },
    {
      id: 'energy-level',
      label: 'Energy level this morning',
      kind: 'scale',
      min: 1,
      max: 10,
      minLabel: 'Exhausted',
      maxLabel: 'Very energized',
    },
  ],
});
