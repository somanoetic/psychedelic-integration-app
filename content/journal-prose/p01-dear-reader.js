/**
 * Cover letter — "Dear Reader" (source journal page 1).
 * Exercises: heading + subtitle paragraphs + signature block.
 */
import { validateProsePage } from './schema';

export default validateProsePage({
  id: 'dear-reader',
  sourcePage: 1,
  blocks: [
    { type: 'heading', text: 'The Integration Companion' },
    { type: 'subheading', text: 'Your Ketamine Therapy Guide and Journal' },
    {
      type: 'paragraph',
      text:
        "You're here. That's significant. Taking this step—reaching out for " +
        'help, exploring new treatment options, and committing to healing—takes ' +
        'tremendous courage. This journey is yours, and this guide is designed ' +
        'to support you wherever you are in your treatment.',
    },
    {
      type: 'paragraph',
      text:
        "If you're reading this, you've likely been struggling for some time. " +
        "Maybe you've tried other treatments that haven't quite worked, or " +
        "perhaps you're feeling exhausted by the weight of depression, anxiety, " +
        'PTSD, or chronic pain that seems impossible to shake. Your pain is real, ' +
        'your struggle is valid, and your decision to try something new is a ' +
        'powerful act of self-care and hope.',
    },
    {
      type: 'callout',
      style: 'emphasis',
      text:
        'You deserve to feel better. You deserve hope, healing, and the ' +
        'possibility of transformation.',
    },
    {
      type: 'paragraph',
      text:
        'This journal is designed to be your companion through this process. ' +
        'Use it to track your experiences, document insights, notice patterns, ' +
        'and maintain continuity across sessions. Approach this process with ' +
        'openness and self-compassion. There\'s no "right" way to experience ' +
        'ketamine therapy—this journey is uniquely yours.',
    },
    { type: 'signature', lines: ['Sincerely,', 'Becky Hadfield and Neil Hadfield, MD'] },
  ],
});
