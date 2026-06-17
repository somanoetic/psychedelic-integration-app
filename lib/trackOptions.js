/**
 * Track Hub options — the five "check in & log a moment" trackers.
 *
 * Single source of truth shared by the home-screen Track block
 * (components/GridHomeScreen.js) and the global Huxley FAB launcher
 * (components/GlobalHuxleyFab.js), so the menu can't drift between them.
 *
 * Icons are passed in by the caller (they live in each screen's local icon
 * map), keeping this module free of asset requires.
 */

export const TRACK_OPTIONS = [
  { id: 'nervous', title: 'Nervous System Check-in', description: 'How is your nervous system right now?', route: 'NervousSystemCheckin' },
  { id: 'glimmer', title: 'Glimmer Tracker', description: 'Log a positive moment', route: 'GlimmerTracker' },
  { id: 'trigger', title: 'Trigger Tracker', description: 'Log when you were triggered', route: 'TriggerTracker' },
  { id: 'parts', title: 'Parts Check-in', description: 'Check in with your inner parts', route: 'PartsCheckin' },
  { id: 'habits', title: 'Habit Tracker', description: 'Track your daily practices', route: 'HabitTracker' },
];

/**
 * Attach icons (by option id) to the base list. Each screen owns its own
 * icon map, so it passes a { [id]: iconSource } lookup here.
 */
export function withTrackIcons(iconsById) {
  return TRACK_OPTIONS.map((opt) => ({ ...opt, icon: iconsById[opt.id] }));
}
