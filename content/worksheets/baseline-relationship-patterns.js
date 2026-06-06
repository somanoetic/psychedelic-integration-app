/**
 * Baseline Log — Page 4: Current Relationship Patterns
 *
 * Five checkbox-list questions exploring how the user shows up in
 * relationships, handles conflict, talks to themselves, treats themselves
 * relative to others, and what they believe they deserve.
 *
 * Source: The Integration Companion, page 18.
 */
import { validateWorksheet } from './schema';

const BASELINE_COLLECTION = {
  id: 'baseline-log',
  title: 'Pre-Treatment Baseline Log',
};

export default validateWorksheet({
  id: 'baseline-relationship-patterns',
  version: 1,
  title: 'Current Relationship Patterns',
  subtitle: 'How you show up with others and with yourself',
  description:
    'Five short questions about your relationships, how you handle conflict, ' +
    'your inner voice, and what you believe you deserve. Honest answers ' +
    'here help track how these patterns shift over time.',
  tracks: ['integration', 'parts'],
  collection: { ...BASELINE_COLLECTION, order: 40 },
  layout: 'letter-portrait',
  fields: [
    {
      id: 'in-relationships-i-tend-to',
      label: 'In relationships, I tend to...',
      kind: 'checkbox-list',
      allowOther: true,
      options: [
        'Give too much',
        'Take too much',
        'Keep people at distance',
        'Be dependent',
        'Avoid conflict',
        'Create conflict',
        'People please',
        'Be authentic',
      ],
    },
    {
      id: 'when-someone-upset-with-me',
      label: 'When someone is upset with me, I...',
      kind: 'checkbox-list',
      allowOther: true,
      options: [
        'Panic and over-apologize',
        'Get defensive',
        'Shut down',
        'Try to fix it',
        'Blame them',
        'Talk it through calmly',
      ],
    },
    {
      id: 'inner-voice',
      label: 'My inner voice is typically...',
      kind: 'checkbox-list',
      allowOther: true,
      options: [
        'Very critical',
        'Sometimes critical',
        'Neutral',
        'Sometimes kind',
        'Very compassionate',
      ],
    },
    {
      id: 'treat-myself',
      label: 'I treat myself...',
      kind: 'checkbox-list',
      allowOther: true,
      options: [
        'Much worse than I treat others',
        'Somewhat worse than others',
        'About the same as others',
        'Better than others',
      ],
    },
    {
      id: 'i-deserve',
      label: 'I believe I deserve...',
      kind: 'checkbox-list',
      allowOther: false,
      options: [
        'Very little good in life',
        'Some good things',
        'The same as others',
        'Good things and happiness',
        'All the love and joy possible',
      ],
    },
  ],
});
