/**
 * UI Icons Registry
 *
 * Single source of truth for the v2 illustrated icon set.
 * Import { icons } and reference by semantic name (e.g. icons.droplet).
 * Files live in assets/images/icons/ and are 128x128 PNGs with transparent backgrounds.
 */

export const icons = {
  // Nervous system states
  droplet: require('../assets/images/icons/droplet.png'),         // safe & social
  steam: require('../assets/images/icons/steam.png'),             // fight / flight
  iceberg: require('../assets/images/icons/iceberg.png'),         // shutdown / freeze
  blended: require('../assets/images/icons/blended.png'),         // mixed / blended
  transcendence: require('../assets/images/icons/transcendence.png'),

  // IFS parts
  manager: require('../assets/images/icons/manager_refined.png'),
  firefighter: require('../assets/images/icons/firefighter_refined.png'),
  softness: require('../assets/images/icons/softness.png'),       // exile (gentle inner child)
  exile: require('../assets/images/icons/exile_refined.png'),
  selfEnergy: require('../assets/images/icons/self_energy.png'),
  repairedHeart: require('../assets/images/icons/repaired_heart.png'),
  brokenHeart: require('../assets/images/icons/broken_heart.png'),

  // Session status
  newBeginning: require('../assets/images/icons/new_beginning.png'),  // new session
  trailProgress: require('../assets/images/icons/trail_progress.png'), // in progress
  journal: require('../assets/images/icons/journal_refined.png'),     // processed
  integration: require('../assets/images/icons/integration.png'),     // integrated

  // Practice types
  breath: require('../assets/images/icons/breath.png'),
  bodyScan: require('../assets/images/icons/body_scan_1.png'),
  bodyScanAlt: require('../assets/images/icons/body_scan_2.png'),
  grounding: require('../assets/images/icons/grounding.png'),
  sprout: require('../assets/images/icons/sprout.png'),
  meditate: require('../assets/images/icons/meditate.png'),
  compassion: require('../assets/images/icons/compassion.png'),

  // Glimmers / triggers
  glimmerCaptured: require('../assets/images/icons/glimmer_captured.png'),
  glimmerHigh: require('../assets/images/icons/glimmer_high.png'),
  glimmerMedium: require('../assets/images/icons/glimmer_medium.png'),
  glimmerLow: require('../assets/images/icons/glimmer_low.png'),
  trigger: require('../assets/images/icons/trigger.png'),
  trigger2: require('../assets/images/icons/trigger2.png'),

  // Philosophical
  selfReflect: require('../assets/images/icons/self-reflect.png'),
  consciousness: require('../assets/images/icons/consciousness.png'),
  wholenessInfinity: require('../assets/images/icons/wholeness_infinty.png'),
  mystery: require('../assets/images/icons/mystery.png'),
  philosophical: require('../assets/images/icons/philosophical.png'),
  philosophicalAlt: require('../assets/images/icons/philosophical_2.png'),
  stoic: require('../assets/images/icons/stoic.png'),

  // Library
  library: require('../assets/images/icons/library.png'),

  // Healing / flow
  integrationCycle: require('../assets/images/icons/integration_cycle.png'),
  flow: require('../assets/images/icons/flow.png'),
  emotion: require('../assets/images/icons/emotion.png'),

  // Education / community
  educationProgress: require('../assets/images/icons/education_progress.png'),
  community: require('../assets/images/icons/community.png'),
  group: require('../assets/images/icons/group.png'),
  chat: require('../assets/images/icons/chat.png'),
  thoughtCloud: require('../assets/images/icons/thought_cloud.png'),
  tools: require('../assets/images/icons/tools.png'),

  // Goals / scheduling
  goals: require('../assets/images/icons/goals.png'),
  intention: require('../assets/images/icons/intention.png'),
  dailyCal: require('../assets/images/icons/daily_cal.png'),
  guidance: require('../assets/images/icons/guidance.png'),

  // Inner / creative
  gratitude: require('../assets/images/icons/gratitude.png'),
  creativity: require('../assets/images/icons/creativity.png'),
  insight: require('../assets/images/icons/insight.png'),
  intensity: require('../assets/images/icons/intensity.png'),

  // Tracking / measurement
  checklist: require('../assets/images/icons/checklist.png'),
  balance: require('../assets/images/icons/balance.png'),

  // States / actions
  play: require('../assets/images/icons/play.png'),
  uncertainState: require('../assets/images/icons/uncertain_state.png'),
  rest: require('../assets/images/icons/rest.png'),
  movement: require('../assets/images/icons/movement.png'),
  roles: require('../assets/images/icons/roles.png'),

  // Body / nature
  lungs: require('../assets/images/icons/lungs.png'),
  dna: require('../assets/images/icons/dna.png'),
  observation: require('../assets/images/icons/observation.png'),
  sensation: require('../assets/images/icons/sensation.png'),
  nature: require('../assets/images/icons/nature.png'),
  gift: require('../assets/images/icons/gift.png'),
  interconnectedness: require('../assets/images/icons/interconnectedness.png'),
  foldedMap: require('../assets/images/icons/folded_map.png'),
  nsMap: require('../assets/images/icons/ns_map.png'),
  triggerGlimmerMap: require('../assets/images/icons/trigger_glimmer_map.png'),
  regulatingResources: require('../assets/images/icons/regulating_resources.png'),
  coreBeliefs: require('../assets/images/icons/core_beliefs.png'),
  activeImagination: require('../assets/images/icons/active_imagination.png'),

  // Brand
  multitudesLogo: require('../assets/images/icons/multitudes-logo.png'),

  // Home tile aliases (already used by GridHomeScreen via icon-* files,
  // but exposed here as v2 equivalents for screens that want them)
  home: require('../assets/images/icons/home.png'),
  track: require('../assets/images/icons/track.png'),
  innerWork: require('../assets/images/icons/inner_work.png'),
  practice: require('../assets/images/icons/practice.png'),
  puzzle: require('../assets/images/icons/puzzle.png'),
  singlePuzzlePiece: require('../assets/images/icons/single_puzzle_piece.png'),
  map: require('../assets/images/icons/map.png'),
  mapRefined: require('../assets/images/icons/map_refined.png'),
};

export default icons;
