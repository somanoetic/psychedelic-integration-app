/** "What Happens During Ketamine Sessions" (source page 6). */
import { validateProsePage } from './schema';

export default validateProsePage({
  id: 'what-happens-during-ketamine-sessions',
  sourcePage: 6,
  blocks: [
    { type: 'heading', text: 'What Happens During Ketamine Sessions' },
    { type: 'paragraph', text: "Ketamine temporarily quiets the brain's default mode network — the part responsible for our everyday sense of self and automatic thought patterns. This creates a unique neuroplastic window where:" },
    { type: 'bullets', items: [
      'Rigid neural pathways soften, allowing new connections to form',
      'Protective defenses relax, giving access to buried emotions and memories',
      'Expanded states of consciousness provide fresh perspectives on old wounds',
      'The nervous system can discharge trapped trauma energy',
      'Parts of yourself that have been silenced or exiled can finally be heard',
    ] },
    { type: 'subheading', text: 'How Ketamine Helps Your Nervous System Heal' },
    { type: 'paragraph', text: 'Ketamine creates a unique opportunity for nervous system healing by:' },
    { type: 'leadGroup', lead: 'Temporarily Quieting the Alarm System', items: ['Your overprotective responses can relax for a while', 'This gives you access to states you might not normally reach', 'You can experience safety in your body, often for the first time in years'] },
    { type: 'leadGroup', lead: 'Creating Neuroplastic Opportunities', items: ['Your brain becomes more flexible and open to new patterns', 'Old trauma responses can finally shift and change', 'New neural pathways for safety and connection can form'] },
    { type: 'leadGroup', lead: 'Accessing Your Natural Healing Wisdom', items: ['You can connect with parts of yourself that hold healing information', 'Your body can complete protective responses that got interrupted', 'You can experience what safety and connection feel like in your nervous system'] },
    { type: 'leadGroup', lead: 'Expanding Your Window of Tolerance', items: ['You can practice staying present with difficult feelings', "You can learn that intense experiences don't have to overwhelm you", "Your capacity to handle life's challenges gradually increases"] },
  ],
});
