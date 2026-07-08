/** "Setting Intentions for Your Treatments — Goals vs Intentions" (source page 90). */
import { validateProsePage } from './schema';

export default validateProsePage({
  id: 'setting-intentions-goals-vs-intentions',
  sourcePage: 90,
  blocks: [
    { type: 'heading', text: 'Setting Intentions for Your Treatments' },
    { type: 'subheading', text: 'The Difference Between Goals and Intentions' },
    { type: 'leadGroup', lead: 'Goals are specific outcomes you want to achieve', items: ['"I want to stop feeling depressed"', '"I want to get over my trauma"', '"I want to never have anxiety again"', '"I want to have amazing visuals"'] },
    { type: 'leadGroup', lead: 'Intentions are qualities of being and approaching', items: ['"I want to be open to whatever emerges"', '"I want to meet my pain with compassion"', '"I want to listen to what my body needs"', '"I want to trust my healing process"'] },
    { type: 'subheading', text: 'Why Intentions Work Better Than Goals in Ketamine Therapy' },
    { type: 'leadGroup', lead: 'Goals can create pressure that actually works against healing', items: ['You might judge your experience as "successful" or "failed"', 'You might force outcomes rather than allowing natural unfolding', "You might miss important healing that doesn't match your expectations"] },
    { type: 'leadGroup', lead: 'Intentions create space for authentic healing', items: ['They invite curiosity rather than demand results', "They honor your system's timing and wisdom", 'They allow for surprise and unexpected gifts', 'They reduce performance pressure'] },
  ],
});
