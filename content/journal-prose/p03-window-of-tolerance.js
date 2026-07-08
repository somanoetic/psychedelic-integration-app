/** "Your Window of Tolerance" (source page 3, prose body; bottom prompt is a worksheet). */
import { validateProsePage } from './schema';

export default validateProsePage({
  id: 'window-of-tolerance',
  sourcePage: 3,
  blocks: [
    { type: 'heading', text: 'Your Window of Tolerance' },
    { type: 'paragraph', text: 'Imagine your nervous system capacity as a window:' },
    { type: 'bullets', items: [
      'Inside the window: You can handle stress and emotions while staying present',
      'Above the window: Hyperactivated (fight/flight) — too much energy, anxiety, panic',
      'Below the window: Hypoactivated (freeze/shutdown) — too little energy, depression, numbness',
    ] },
    { type: 'subheading', text: 'How Trauma Affects Your Nervous System' },
    { type: 'paragraph', text: "When difficult or scary things happen (especially repeatedly or when you're young), your nervous system learns to be extra protective. It's like your security system becomes more sensitive, triggering alarms for things that might not actually be dangerous now." },
    { type: 'callout', style: 'emphasis', text: "Trauma isn't what happened to you — trauma is what happens inside your nervous system when it can't complete its natural protective responses." },
    { type: 'subheading', text: 'Common Signs Your Nervous System Learned to Be Extra Protective' },
    { type: 'leadGroup', lead: 'Fight/Flight Patterns', items: ['Getting anxious or angry "out of nowhere"', 'Feeling like you always have to be doing something', 'Having trouble sitting still or relaxing', 'Reacting strongly to small things', 'Feeling like you\'re always "on" or alert'] },
    { type: 'leadGroup', lead: 'Shutdown Patterns', items: ['Going numb when things get difficult', 'Feeling disconnected from your body or emotions', 'Having trouble caring about things you used to enjoy', "Feeling exhausted even when you haven't done much", 'Spacing out or feeling "not really here"'] },
    { type: 'leadGroup', lead: 'Mixed Patterns', items: ['Going back and forth between anxiety and numbness', 'Feeling wired and tired at the same time', 'Having intense emotions followed by feeling nothing at all'] },
  ],
});
