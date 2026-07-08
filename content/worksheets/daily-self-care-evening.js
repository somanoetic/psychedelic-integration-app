/**
 * Daily Check-In — Page 5: Self Care + Evening Reflection
 *
 * Last page of the daily set. Combines self-care/coping with the evening
 * wrap-up: best/hardest moment, gratitude, and how the user is currently
 * feeling about treatment.
 *
 * Source: The Integration Companion, "DAY N — Self Care and Coping" and
 * "Evening Reflection" sections (printed on the same page in the journal).
 */
import { validateWorksheet } from './schema';

const DAILY_COLLECTION = {
  id: 'daily-checkin',
  title: 'Daily Check-In',
};

export default validateWorksheet({
  id: 'daily-self-care-evening',
  version: 1,
  title: 'Self Care & Evening Reflection',
  subtitle: 'Closing the day with kindness',
  description:
    'How you cared for yourself, what you reached for when things got hard, ' +
    'and a short evening wrap-up — best moment, hardest moment, gratitude, ' +
    'and how you feel about starting treatment.',
  tracks: ['integration', 'regulating'],
  collection: { ...DAILY_COLLECTION, order: 50 },
  layout: 'letter-portrait',
  fields: [
    {
      id: 'when-stressed-upset',
      label: 'When I felt stressed or upset, I...',
      kind: 'checkbox-list',
      allowOther: true,
      options: [
        'Talked to someone',
        'Exercised',
        'Rested',
        'Used substances',
        'Distracted myself',
        'Isolated',
        'Worked more',
      ],
    },
    {
      id: 'habits-today',
      label: 'Habits I engaged in today',
      kind: 'checkbox-list',
      allowOther: true,
      options: [
        'Healthy eating',
        'Exercise',
        'Adequate rest',
        'Time in nature',
        'Creative activities',
        'Social connection',
        'Screen time',
        'Substances',
      ],
    },
    {
      id: 'self-kindness',
      label: 'How kind I was to myself today',
      kind: 'scale',
      min: 1,
      max: 10,
      minLabel: 'Very critical',
      maxLabel: 'Very compassionate',
    },
    {
      id: 'today-overall',
      label: 'Overall, today felt',
      kind: 'scale',
      min: 1,
      max: 10,
      minLabel: 'Very difficult',
      maxLabel: 'Very good',
    },
    {
      id: 'self-care-was',
      label: 'My self-care was',
      kind: 'checkbox-list',
      allowOther: false,
      options: ['Excellent', 'Good', 'Adequate', 'Poor', 'Neglected myself'],
    },
    {
      id: 'best-moment',
      label: 'Best moment of my day',
      kind: 'free-text',
      lines: 2,
    },
    {
      id: 'hardest-moment',
      label: 'Most challenging moment of my day',
      kind: 'free-text',
      lines: 2,
    },
    {
      id: 'grateful-for',
      label: "What I'm grateful for today",
      kind: 'free-text',
      lines: 2,
    },
    {
      id: 'feeling-about-treatment',
      label: "How I'm feeling about starting ketamine treatment",
      kind: 'checkbox-list',
      allowOther: true,
      options: ['Excited', 'Nervous', 'Hopeful', 'Scared', 'Curious', 'Skeptical', 'Ready', 'Uncertain'],
    },
  ],
});
