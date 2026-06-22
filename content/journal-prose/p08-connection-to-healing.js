/**
 * "The Connection to Your Healing Journey" (source journal page 8).
 * Exercises the full teaching vocabulary: heading, lead-in groups with
 * affirmation-style bullets, a subheading, a body paragraph, and a
 * "Remember" bullet list.
 */
import { validateProsePage } from './schema';

export default validateProsePage({
  id: 'connection-to-healing',
  sourcePage: 8,
  blocks: [
    { type: 'heading', text: 'The Connection to Your Healing Journey' },
    { type: 'paragraph', text: 'Understanding polyvagal theory helps you:' },
    {
      type: 'leadGroup',
      lead: 'Make Sense of Your Responses',
      items: [
        "“I'm not crazy or broken — my nervous system is doing what it learned to do”",
        '“My reactions make perfect sense given my experiences”',
        "“I can learn new responses now that I understand what's happening”",
      ],
    },
    {
      type: 'leadGroup',
      lead: 'Be Compassionate with Yourself',
      items: [
        '“My body has been trying so hard to protect me”',
        '“I can appreciate how hard my nervous system has been working”',
        '“I can be patient with myself as I learn new patterns”',
      ],
    },
    {
      type: 'leadGroup',
      lead: 'Work with Your System Instead of Against It',
      items: [
        '“What does my nervous system need right now?”',
        '“How can I help myself feel safer in this moment?”',
        '“What would support my healing today?”',
      ],
    },
    { type: 'subheading', text: 'Your Nervous System is Your Ally' },
    {
      type: 'paragraph',
      text:
        "Your nervous system isn't your enemy — it's been your protector all " +
        'along. Now, with understanding and compassion, you can work together ' +
        'with your nervous system to create more safety, connection, and ' +
        'healing in your life.',
    },
    {
      type: 'leadGroup',
      lead: 'Remember',
      items: [
        'You are not your nervous system — you have a relationship with it',
        'Your responses make sense given your experiences',
        'Healing is possible at any stage of life',
        'Small changes in nervous system regulation create big changes in life experience',
        'You have more influence over your nervous system than you might think',
      ],
    },
  ],
});
