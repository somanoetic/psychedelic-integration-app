/**
 * "Sample Intention Templates" (source journal page 92).
 * Exercises lead-in groups of example wordings + an emphasis callout.
 * Note: this page is read-only teaching content (no fillable fields).
 */
import { validateProsePage } from './schema';

export default validateProsePage({
  id: 'sample-intentions',
  sourcePage: 92,
  blocks: [
    { type: 'heading', text: 'Sample Intention Templates' },
    {
      type: 'leadGroup',
      lead: 'For Anxiety and Overwhelm',
      items: [
        '“I want to trust that I can handle whatever emerges”',
        '“I want to find the calm, steady place within me”',
        '“I want to practice breathing with whatever arises”',
        "“I want to appreciate my nervous system's protection while also inviting ease”",
      ],
    },
    {
      type: 'leadGroup',
      lead: 'For Depression and Numbness',
      items: [
        '“I want to gently reconnect with my aliveness”',
        '“I want to welcome whatever feelings want to move”',
        '“I want to find the spark of hope within me”',
        '“I want to honor both my pain and my resilience”',
      ],
    },
    {
      type: 'leadGroup',
      lead: 'For Trauma and PTSD',
      items: [
        "“I want to move through this healing at my system's pace”",
        '“I want to complete anything that needs completing”',
        '“I want to reclaim parts of myself that got lost”',
        '“I want to transform survival responses into thriving responses”',
      ],
    },
    {
      type: 'leadGroup',
      lead: 'For Relationships and Connection',
      items: [
        '“I want to heal my capacity for healthy intimacy”',
        '“I want to understand my patterns in relationships”',
        '“I want to practice both giving and receiving love”',
        '“I want to strengthen my relationship with myself”',
      ],
    },
    {
      type: 'callout',
      style: 'emphasis',
      text:
        'Remember: Your intentions are invitations to your healing, not ' +
        'demands. Hold them lightly, trust deeply, and let your system ' +
        'surprise you with its wisdom.',
    },
  ],
});
