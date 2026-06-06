/**
 * Post-Session Integration worksheet (v1)
 *
 * Short-form reflection page meant to be filled out within 24 hours of a
 * session, by hand, on a single sheet of paper. Intentionally distilled —
 * the in-app PostSessionIntegrationJournal covers 13 categories for users
 * who want to type a thorough reflection. This is the paper companion: 4
 * focused prompts that fit on one page and don't ask the user to write a
 * book post-session when their system may still be settling.
 *
 * Glyph: MT-post-session-integration-v1
 */
import { validateWorksheet } from './schema';

export default validateWorksheet({
  id: 'post-session-integration',
  version: 1,
  title: 'Post-Session Integration',
  subtitle: 'A short reflection on what came up',
  description:
    'A one-page handwritten reflection for the day after a session. Four ' +
    'prompts: what showed up in your body, which parts of you were present, ' +
    'and what you want to carry with you. Fill it out by hand, then scan it ' +
    'back in when you\'re ready.',
  tracks: ['integration'],
  layout: 'letter-portrait',
  fields: [
    {
      id: 'date',
      label: 'Date',
      kind: 'date',
    },
    {
      id: 'body-sensations',
      label: 'What did I notice in my body?',
      kind: 'free-text',
      lines: 6,
      hint: 'Sensations, temperature, where you held tension, where you softened.',
      promptForClaude:
        'Transcribe what the user wrote about somatic experience. Preserve ' +
        'their own words; do not summarize or interpret.',
    },
    {
      id: 'parts-present',
      label: 'Parts that showed up',
      kind: 'list',
      maxItems: 5,
      hint: 'You might name them, describe how they felt, or note what they wanted.',
      promptForClaude:
        'Transcribe any parts the user named or described. Use a comma- or ' +
        'newline-separated list as written. Do not infer parts that were not ' +
        'explicitly mentioned.',
    },
    {
      id: 'taking-with-me',
      label: 'One thing I\'m taking with me',
      kind: 'free-text',
      lines: 3,
      hint: 'A phrase, an image, a felt sense — whatever wants to come along.',
      promptForClaude:
        'Transcribe the single takeaway the user wrote. Often short — a ' +
        'phrase or sentence. Preserve their voice exactly.',
    },
  ],
});
