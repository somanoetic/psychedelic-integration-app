/** "Transforming Experience into Wisdom" (source page 94). */
import { validateProsePage } from './schema';

export default validateProsePage({
  id: 'transforming-experience-into-wisdom',
  sourcePage: 94,
  blocks: [
    { type: 'heading', text: 'Transforming Experience into Wisdom' },
    { type: 'leadGroup', lead: 'Your purpose is not to analyze or judge what happens, but to', items: ['Capture the full spectrum of your experience beyond just visuals', 'Track patterns and themes that emerge across sessions', 'Connect symbolic experiences to your healing journey', 'Monitor your expanding capacity for regulation and self-compassion', 'Build a relationship with your inner wisdom'] },
    { type: 'subheading', text: 'Why Details Matter: Understanding the Language of Healing' },
    { type: 'paragraph', text: 'Ketamine experiences speak in the language of symbol, sensation, and metaphor. Your unconscious mind uses every available channel — visual, somatic, emotional, relational — to communicate what needs healing.' },
    { type: 'callout', style: 'emphasis', text: 'Nothing that emerges is random or meaningless.' },
    { type: 'subheading', text: 'The Multidimensional Nature of Ketamine Experiences' },
    { type: 'leadGroup', lead: 'Your brain processes healing information through multiple pathways simultaneously', items: ['Visual cortex creates imagery and symbols', 'Somatosensory system generates physical sensations and movements', 'Emotional processing centers release feelings and memories', 'Relational networks explore connection and attachment patterns', 'Pattern recognition systems reveal deeper structures and meanings'] },
  ],
});
