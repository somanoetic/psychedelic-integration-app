/** "Understanding Your Healing System with Polyvagal Theory" (source page 2). */
import { validateProsePage } from './schema';

export default validateProsePage({
  id: 'understanding-healing-system-polyvagal',
  sourcePage: 2,
  blocks: [
    { type: 'heading', text: 'Understanding Your Healing System with Polyvagal Theory' },
    { type: 'subheading', text: 'The Wisdom of Your Body and Mind Working Together' },
    { type: 'paragraph', text: "Your healing journey isn't about fixing what's broken — it's about understanding and reconnecting with the incredible wisdom already within you. One powerful framework that helps us understand how your system naturally works to protect and heal is Polyvagal Theory. When combined with ketamine therapy, this approach creates a comprehensive map for understanding and supporting your healing process." },
    { type: 'subheading', text: 'Polyvagal Theory' },
    { type: 'paragraph', text: "Your nervous system has been working 24/7 since before you were born, keeping you alive and trying to keep you safe. It's like having an incredibly sophisticated security system that's constantly scanning your environment and your body, making split-second decisions about safety and danger." },
    { type: 'paragraph', text: "Here's the amazing part: Your nervous system isn't broken, even when it feels like it's working against you. It's actually doing exactly what it's designed to do — protect you based on everything it has learned from your life experiences." },
    { type: 'subheading', text: 'Understanding Your Three Neural Pathways' },
    { type: 'paragraph', text: 'Your nervous system has three main pathways that evolved to keep you safe and connected:' },
    { type: 'numbered', items: [
      { lead: 'Ventral Vagal: Your Social Connection System', items: ['When active: You feel calm, curious, and connected', 'Capacity for: Learning, playing, loving, creating, healing', 'Body signals: Relaxed muscles, easy breathing, warm heart', 'This is your natural healing state'] },
      { lead: 'Sympathetic: Your Mobilization System', items: ['When active: Fight or flight responses engage', 'Purpose: Mobilize energy to face challenges or escape danger', 'Body signals: Racing heart, tight muscles, rapid breathing, hypervigilance', 'Adaptive when: Facing real threats or needing energy for action'] },
      { lead: 'Dorsal Vagal: Your Protection Through Shutdown System', items: ['When active: Freeze, collapse, or dissociation responses', 'Purpose: Protect you when fighting or fleeing isn\'t possible', 'Body signals: Numbness, fatigue, disconnection, "checking out"', 'Adaptive when: Overwhelm is too much to process'] },
    ] },
  ],
});
