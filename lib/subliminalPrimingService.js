/**
 * Subliminal Priming Service
 *
 * Based on scientific research:
 * - Optimal duration: 40ms (below consciousness threshold)
 * - Effects last up to 25 minutes
 * - Backward masking strengthens effect
 *
 * Research sources:
 * - "Subliminal Priming—State of the Art" (PMC, 2018)
 * - "Emotional priming depends on degree of conscious experience" (2019)
 */

export const AFFIRMATION_THEMES = {
  SAFETY: 'safety',
  WORTH: 'worth',
  INTEGRATION: 'integration',
  PRESENCE: 'presence',
  HEALING: 'healing',
  CONNECTION: 'connection',
  TRUST: 'trust',
  RELEASE: 'release',
};

export const AFFIRMATION_LIBRARY = {
  [AFFIRMATION_THEMES.SAFETY]: [
    'I am safe',
    'I am here now',
    'My body is safe',
    'I am supported',
    'Safety is my birthright',
    'I am protected',
    'This moment is safe',
    'I can relax',
  ],

  [AFFIRMATION_THEMES.WORTH]: [
    'I am enough',
    'I am worthy',
    'I am loved',
    'I deserve healing',
    'I am valuable',
    'My existence matters',
    'I belong here',
    'I am whole',
  ],

  [AFFIRMATION_THEMES.INTEGRATION]: [
    'I trust the process',
    'I am integrating',
    'Wisdom is emerging',
    'I am transforming',
    'Integration is happening',
    'I am growing',
    'I embody my insights',
    'I am becoming',
  ],

  [AFFIRMATION_THEMES.PRESENCE]: [
    'I am present',
    'This moment is enough',
    'I breathe and release',
    'Now is all there is',
    'I am here',
    'Peace is my nature',
    'I am aware',
    'I am grounded',
  ],

  [AFFIRMATION_THEMES.HEALING]: [
    'I am healing',
    'My body knows how to heal',
    'Healing is my nature',
    'I am becoming whole',
    'Every cell is regenerating',
    'I trust my healing',
    'Wellness flows through me',
    'I am restored',
  ],

  [AFFIRMATION_THEMES.CONNECTION]: [
    'I am connected',
    'I belong',
    'Love surrounds me',
    'I am part of the whole',
    'Connection is natural',
    'I am not alone',
    'We are one',
    'I am held',
  ],

  [AFFIRMATION_THEMES.TRUST]: [
    'I trust myself',
    'I trust life',
    'I surrender to what is',
    'I let go',
    'Trust flows naturally',
    'I am guided',
    'All is well',
    'I trust my path',
  ],

  [AFFIRMATION_THEMES.RELEASE]: [
    'I release',
    'I let go',
    'I am free',
    'I breathe out what no longer serves',
    'Release is safe',
    'I soften',
    'I open',
    'I allow',
  ],
};

// 8 C's of Self-Leadership (for IFS work)
export const EIGHT_CS_AFFIRMATIONS = [
  'Calm',
  'Curious',
  'Clear',
  'Compassionate',
  'Confident',
  'Creative',
  'Courageous',
  'Connected',
];

// Polyvagal state-specific affirmations
export const POLYVAGAL_AFFIRMATIONS = {
  dorsal: [
    'I am waking up',
    'Energy is returning',
    'I am coming back online',
    'Life force flows through me',
    'I am mobilizing',
  ],
  sympathetic: [
    'I am safe',
    'I can slow down',
    'It is safe to rest',
    'My nervous system is calming',
    'Peace is available',
  ],
  ventral: [
    'I am connected',
    'I am enough',
    'Social engagement feels good',
    'I am safe to play',
    'Connection nourishes me',
  ],
};

class SubliminalPrimingService {
  constructor() {
    this.enabled = true; // Default enabled, but user can disable
    this.exposureCount = 0;
    this.sessionStart = null;
  }

  /**
   * Check if subliminal priming is enabled
   * Respects user's ethical preference
   */
  async isEnabled() {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const setting = await AsyncStorage.getItem('subliminal_priming_enabled');

      // Default to true if not set
      if (setting === null) return true;

      return setting === 'true';
    } catch (error) {
      console.error('Error checking subliminal setting:', error);
      return true; // Default to enabled
    }
  }

  /**
   * Toggle subliminal priming on/off
   */
  async setEnabled(enabled) {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('subliminal_priming_enabled', enabled.toString());
      this.enabled = enabled;
      return true;
    } catch (error) {
      console.error('Error setting subliminal preference:', error);
      return false;
    }
  }

  /**
   * Get random affirmation from theme(s)
   */
  getAffirmation(themes = [AFFIRMATION_THEMES.SAFETY]) {
    const allAffirmations = [];

    themes.forEach(theme => {
      if (AFFIRMATION_LIBRARY[theme]) {
        allAffirmations.push(...AFFIRMATION_LIBRARY[theme]);
      }
    });

    if (allAffirmations.length === 0) {
      return 'I am safe'; // Fallback
    }

    const randomIndex = Math.floor(Math.random() * allAffirmations.length);
    return allAffirmations[randomIndex];
  }

  /**
   * Get random affirmation for nervous system state
   */
  getPolyvagalAffirmation(state = 'ventral') {
    const affirmations = POLYVAGAL_AFFIRMATIONS[state] || POLYVAGAL_AFFIRMATIONS.ventral;
    const randomIndex = Math.floor(Math.random() * affirmations.length);
    return affirmations[randomIndex];
  }

  /**
   * Get random 8 C affirmation for IFS work
   */
  getEightCsAffirmation() {
    const randomIndex = Math.floor(Math.random() * EIGHT_CS_AFFIRMATIONS.length);
    return EIGHT_CS_AFFIRMATIONS[randomIndex];
  }

  /**
   * Track exposure count
   */
  recordExposure() {
    this.exposureCount++;
  }

  /**
   * Get session stats
   */
  getSessionStats() {
    const now = new Date();
    const duration = this.sessionStart
      ? Math.floor((now - this.sessionStart) / 1000)
      : 0;

    return {
      exposureCount: this.exposureCount,
      sessionDuration: duration,
      averageFrequency: duration > 0 ? this.exposureCount / (duration / 60) : 0,
    };
  }

  /**
   * Start new session
   */
  startSession() {
    this.sessionStart = new Date();
    this.exposureCount = 0;
  }

  /**
   * Reset session
   */
  reset() {
    this.sessionStart = null;
    this.exposureCount = 0;
  }

  /**
   * Calculate random interval between flashes (3-10 seconds)
   */
  getRandomInterval() {
    const minMs = 3000; // 3 seconds
    const maxMs = 10000; // 10 seconds
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  }

  /**
   * Get optimal flash duration (40ms based on research)
   */
  getFlashDuration() {
    return 40; // milliseconds - optimal for subliminal priming
  }
}

export default new SubliminalPrimingService();
