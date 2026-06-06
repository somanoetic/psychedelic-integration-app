/**
 * Daily Check-In — Page 4: Emotional + Physical Experience
 *
 * Combines the two body-and-feeling sections from the printed journal onto
 * one page so the page count stays at 5 per day. The user gets both an
 * emotions checklist and a body checklist plus open-text spaces for nuance.
 *
 * Source: The Integration Companion, "DAY N — Emotional Experience" and
 * "Physical Experience" sections (printed on the same page in the journal).
 */
import { validateWorksheet } from './schema';

const DAILY_COLLECTION = {
  id: 'daily-checkin',
  title: 'Daily Check-In',
};

export default validateWorksheet({
  id: 'daily-emotional-physical',
  version: 1,
  title: 'Emotional & Physical Experience',
  subtitle: 'What moved through your feelings and body today',
  description:
    'A combined check-in on emotions, how you handled difficult ones, and ' +
    'how your body felt — areas of tension, body-connection, physical ' +
    'activities, and how you cared for your body.',
  tracks: ['integration', 'somatic', 'regulating'],
  collection: { ...DAILY_COLLECTION, order: 40 },
  layout: 'letter-portrait',
  fields: [
    {
      id: 'emotions-today',
      label: 'Emotions I experienced most today',
      kind: 'checkbox-list',
      allowOther: true,
      options: [
        'Joy',
        'Sadness',
        'Anxiety',
        'Anger',
        'Peace',
        'Frustration',
        'Love',
        'Fear',
        'Numbness',
        'Excitement',
        'Shame',
        'Gratitude',
      ],
    },
    {
      id: 'handled-difficult-emotions',
      label: 'How well I handled difficult emotions',
      kind: 'checkbox-list',
      allowOther: true,
      options: [
        'Felt them and moved through them',
        'Got stuck in them',
        'Avoided them',
        'Was overwhelmed by them',
        'Numbed them',
      ],
    },
    {
      id: 'body-feels-today',
      label: 'How my body feels today',
      kind: 'checkbox-list',
      allowOther: true,
      options: [
        'Energized',
        'Tired',
        'Tense',
        'Relaxed',
        'Achy',
        'Strong',
        'Numb',
        'Alive',
        'Heavy',
        'Light',
      ],
    },
    {
      id: 'tension-or-discomfort',
      label: 'Areas of tension or discomfort',
      kind: 'free-text',
      lines: 2,
    },
    {
      id: 'body-connection',
      label: 'How connected I feel to my body',
      kind: 'checkbox-list',
      allowOther: true,
      options: [
        'Very connected',
        'Somewhat connected',
        'Disconnected',
        'Numb',
        'Uncomfortable',
      ],
    },
    {
      id: 'physical-activities',
      label: 'Physical activities today',
      kind: 'free-text',
      lines: 2,
    },
    {
      id: 'how-i-cared-for-body',
      label: 'How I cared for my body today',
      kind: 'free-text',
      lines: 2,
    },
  ],
});
