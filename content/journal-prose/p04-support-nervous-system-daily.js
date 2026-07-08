/** "Practical Ways to Support Your Nervous System Daily" (source page 4). */
import { validateProsePage } from './schema';

export default validateProsePage({
  id: 'support-nervous-system-daily',
  sourcePage: 4,
  blocks: [
    { type: 'heading', text: 'Practical Ways to Support Your Nervous System Daily' },
    { type: 'subheading', text: "For Fight/Flight (When You're Above Your Window)" },
    { type: 'leadGroup', lead: 'Calm the System Down', items: ['Long, slow exhale breathing (breathe in for 4, out for 8)', 'Cold water on your wrists or face', 'Gentle movement like walking or stretching'] },
    { type: 'leadGroup', lead: 'Ground Yourself', items: ['Feel your feet on the floor', 'Name 5 things you see, 4 things you hear, 3 things you feel', 'Hold something with texture (stress ball, soft blanket)', 'Remind yourself: "I am safe right now"'] },
    { type: 'subheading', text: "For Shutdown (When You're Below Your Window)" },
    { type: 'leadGroup', lead: 'Gently Energize', items: ['Take some deep breaths to get oxygen flowing', 'Gentle movement (stretch, walk, dance)', 'Warm drink or warm shower', 'Listen to uplifting music'] },
    { type: 'leadGroup', lead: 'Reconnect', items: ['Look in the mirror and say something kind to yourself', 'Touch your heart and feel it beating', 'Go outside if possible', 'Do something small that makes you feel accomplished'] },
    { type: 'subheading', text: 'For Building Your Window of Tolerance' },
    { type: 'leadGroup', lead: 'Daily Practices', items: ['Check in with your body several times a day: "How am I feeling right now?"', 'Practice breathing exercises for 5-10 minutes', 'Spend time in nature when possible', 'Connect with people who help you feel calm and safe', 'Move your body in ways that feel good', 'Practice gratitude for small moments of peace or joy'] },
    { type: 'leadGroup', lead: 'Weekly Practices', items: ['Review what helped you feel regulated this week', 'Notice patterns in what triggers your fight/flight or shutdown responses', 'Celebrate moments when you stayed in your window during difficulty', 'Plan activities that help you feel safe and connected'] },
  ],
});
