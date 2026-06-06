/**
 * Baseline Log — Page 3: Current Coping Strategies
 *
 * Three checkbox-list questions: what the user typically does when stressed,
 * sad, or anxious. Each allows multiple selections plus "Other".
 *
 * Source: The Integration Companion, page 17.
 */
import { validateWorksheet } from './schema';

const BASELINE_COLLECTION = {
  id: 'baseline-log',
  title: 'Pre-Treatment Baseline Log',
};

export default validateWorksheet({
  id: 'baseline-coping-strategies',
  version: 1,
  title: 'Current Coping Strategies',
  subtitle: 'What you typically do when feelings get big',
  description:
    'Three quick checklists — what you reach for when stressed, sad, or ' +
    'anxious. Check all that apply. No judgment; this is just a snapshot.',
  tracks: ['integration'],
  collection: { ...BASELINE_COLLECTION, order: 30 },
  layout: 'letter-portrait',
  fields: [
    {
      id: 'when-stressed',
      label: "When I'm stressed, I typically...",
      kind: 'checkbox-list',
      allowOther: true,
      options: [
        'Talk to friends/family',
        'Exercise',
        'Sleep',
        'Work more',
        'Use substances',
        'Watch TV / scroll',
        'Eat',
        'Isolate',
        'Get angry',
        'Shut down',
        'Clean / organize',
        'Creative activities',
      ],
    },
    {
      id: 'when-sad',
      label: "When I'm sad, I typically...",
      kind: 'checkbox-list',
      allowOther: true,
      options: [
        'Cry',
        'Talk to someone',
        'Sleep',
        'Avoid feelings',
        'Get busy',
        'Isolate',
        'Use substances',
        'Listen to music',
      ],
    },
    {
      id: 'when-anxious',
      label: "When I'm anxious, I typically...",
      kind: 'checkbox-list',
      allowOther: true,
      options: [
        'Worry / ruminate',
        'Avoid situations',
        'Talk through fears',
        'Exercise',
        'Use substances',
        'Clean / organize',
        'Seek reassurance',
      ],
    },
  ],
});
