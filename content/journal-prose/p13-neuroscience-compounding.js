/** "The Neuroscience Behind Why This Works" + "The Compounding Effect" (source page 13). */
import { validateProsePage } from './schema';

export default validateProsePage({
  id: 'neuroscience-compounding',
  sourcePage: 13,
  blocks: [
    { type: 'heading', text: 'The Neuroscience Behind Why This Works: Strengthening Positive Neural Networks' },
    { type: 'paragraph', text: 'When you repeatedly engage multiple senses in healing experiences:' },
    { type: 'bullets', items: [
      'Default Mode Network Changes: Your brain\'s "default" patterns shift from trauma-based to healing-based neural highways',
      'Cross-Modal Integration: Different brain regions learn to work together in healthier ways',
      'Embodied Memory: New experiences of safety, love, and connection become stored in your nervous system',
      'Neuroplastic Reinforcement: Each multisensory healing experience strengthens the neural pathways for resilience and wellbeing',
    ] },
    { type: 'subheading', text: 'The Compounding Effect of Consistent Integration' },
    { type: 'paragraph', text: 'Like compound interest, integration builds on itself:' },
    { type: 'defList', rows: [
      { term: 'Week 1', desc: 'You notice patterns and begin tracking responses' },
      { term: 'Month 1', desc: 'New awareness starts shifting automatic reactions' },
      { term: 'Month 3', desc: 'Healthier patterns become more natural than old ones' },
      { term: 'Month 6', desc: 'Integration becomes a way of life, not just post-session work' },
      { term: 'Year 1', desc: "You've literally rewired your brain for resilience and well-being" },
    ] },
    { type: 'subheading', text: 'Your Integration Practice: A Sacred Responsibility' },
    { type: 'paragraph', text: "Your integration practice is not homework or obligation — it's a valuable responsibility to your own healing. Every moment you spend in conscious relationship with your experience:" },
    { type: 'bullets', items: [
      'Honors the courage it took to begin this healing journey',
      "Maximizes the investment you're making in ketamine therapy",
      'Sends a message to your nervous system that healing is safe and supported',
      'Creates ripples of healing that extend to your relationships and community',
      'Becomes a gift to your future self',
    ] },
    { type: 'subheading', text: 'The Ripple Effect: Beyond Personal Healing' },
    { type: 'paragraph', text: "When you commit to integration, you're not just healing yourself:" },
    { type: 'bullets', items: [
      'Your nervous system regulation affects everyone around you',
      'Your increased capacity allows you to show up differently in relationships',
      'Your healing gives others permission to heal',
      "Your integration models what's possible for others on similar journeys",
      'Your transformation contributes to collective healing',
    ] },
  ],
});
