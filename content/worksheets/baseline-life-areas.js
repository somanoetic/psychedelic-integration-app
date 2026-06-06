/**
 * Baseline Log — Page 2: Life Areas Rating
 *
 * Ten life-domain 1–10 ratings. Same scale across all rows so the user can
 * see the overall shape at a glance.
 *
 * Source: The Integration Companion, page 16 (the 1-10 rating grid).
 */
import { validateWorksheet } from './schema';

const BASELINE_COLLECTION = {
  id: 'baseline-log',
  title: 'Pre-Treatment Baseline Log',
};

const RATING = {
  kind: 'scale',
  min: 1,
  max: 10,
  minLabel: 'Really struggling',
  maxLabel: 'Thriving',
};

export default validateWorksheet({
  id: 'baseline-life-areas',
  version: 1,
  title: 'Life Areas',
  subtitle: 'Rate each area of your life from 1 (struggling) to 10 (thriving)',
  description:
    'A ten-domain snapshot — home, work, relationships, friendships, coping, ' +
    'emotional wellbeing, self care, joy, physical health, and life ' +
    'satisfaction. Circle a number for each.',
  tracks: ['integration'],
  collection: { ...BASELINE_COLLECTION, order: 20 },
  layout: 'letter-portrait',
  fields: [
    { id: 'home-environment',    label: 'Home / Living Environment',     ...RATING },
    { id: 'work-responsibilities', label: 'Work / Daily Responsibilities', ...RATING },
    { id: 'family-relationships', label: 'Family / Relationships',        ...RATING },
    { id: 'friendships',         label: 'Friendships',                   ...RATING },
    { id: 'coping-strategies',   label: 'Coping Strategies',             ...RATING },
    { id: 'emotional-wellbeing', label: 'Emotional Wellbeing',           ...RATING },
    { id: 'self-care',           label: 'Self Care',                     ...RATING },
    { id: 'joy-creativity',      label: 'Joy / Creativity',              ...RATING },
    { id: 'physical-health',     label: 'Physical Health',               ...RATING },
    { id: 'life-satisfaction',   label: 'Life Satisfaction',             ...RATING },
  ],
});
