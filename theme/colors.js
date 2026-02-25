/**
 * Psycheteleos Design System - Color Palette
 * Calm blue accent with soft gradient aesthetic
 */

export const colors = {
  // Primary Colors (Calm Blue)
  primary: '#5d86d6',        // Calm blue - Primary accent
  primaryDark: '#4a6fb8',    // Deeper blue
  primaryLight: '#7a9ee0',   // Lighter blue

  clay: '#C97B63',           // Secondary warm accent (legacy)
  sage: '#8B9D83',           // Calming sage green
  sand: '#E0E0E0',           // Light neutral borders

  // Secondary Colors (Modern Wellness)
  dustyRose: '#D4A5A5',      // Gentle, nurturing
  slate: '#6B7D8F',          // Professional depth
  cream: '#F5F5F5',          // Soft light backgrounds
  charcoal: '#3A3A3A',       // Text, grounding

  // Accent Colors
  golden: '#E6B17E',         // Golden hour highlights
  deepEarth: '#7A5C4D',      // Deep wisdom brown

  // Functional Colors
  success: '#7B9D6F',        // Success green
  warning: '#D4945C',        // Warning amber
  error: '#E57373',          // Error red (matches SOS button)
  info: '#5d86d6',           // Info blue

  // Neutrals
  white: '#FFFFFF',
  offWhite: '#F5F5F5',
  lightGray: '#E5E5E5',
  mediumGray: '#9CA3AF',
  darkGray: '#6B7280',
  almostBlack: '#3A3A3A',
  black: '#1F1F1F',
  disabled: '#E0E0E0',

  // Background Variations
  background: '#F5F5F5',     // Soft light
  backgroundAlt: '#EEEEEE',  // Slightly darker light
  surface: '#FFFFFF',
  surfaceAlt: 'rgba(255, 255, 255, 0.9)',

  // Text Colors
  text: '#3A3A3A',           // Charcoal
  textSecondary: '#6B7280',  // Medium gray
  textLight: '#9CA3AF',      // Light gray
  textInverse: '#FFFFFF',

  // Legacy mapping (for gradual migration)
  purple: {
    primary: '#5d86d6',      // Maps old purple to calm blue
    light: '#7a9ee0',
    dark: '#4a6fb8',
  },
  blue: {
    primary: '#5d86d6',      // Calm blue
    light: '#7a9ee0',
    dark: '#4a6fb8',
  }
};

export const gradients = {
  // Standard app gradient (top-right to bottom-left)
  standard: ['#fbffdf', '#7794b6'],
  // Direction props: start={{ x: 1.0, y: 0.0 }} end={{ x: 0.0, y: 1.0 }}
  standardStart: { x: 1.0, y: 0.0 },
  standardEnd: { x: 0.0, y: 1.0 },

  primary: ['#5d86d6', '#4a6fb8'],           // Blue gradient
  warm: ['#fbffdf', '#7794b6'],              // Same as standard (19 usages auto-fix)
  earth: ['#8B9D83', '#7A5C4D'],             // Sage to deep earth (legacy)
  sunset: ['#5d86d6', '#7794b6', '#fbffdf'], // Blue gradient variation
  calm: ['#fbffdf', '#7794b6'],              // Same as standard
  wellness: ['#7794b6', '#5d86d6'],          // Blue tones
};

export const shadows = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  strong: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  }
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 24,
  full: 9999,
};

export const typography = {
  // Font families (to be implemented with custom fonts)
  serif: 'System',  // Will be Merriweather or Lora
  sans: 'System',   // Will be Inter or Plus Jakarta Sans

  // Font sizes
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,

  // Line heights
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};

export default {
  colors,
  gradients,
  shadows,
  spacing,
  borderRadius,
  typography,
};
