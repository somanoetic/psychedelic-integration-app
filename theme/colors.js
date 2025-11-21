/**
 * Psycheteleos Design System - Color Palette
 * Blending warm/earthy with modern wellness aesthetics
 */

export const colors = {
  // Primary Colors (Warm & Earthy)
  primary: '#D4725C',        // Terra Cotta - Primary accent, warm grounding
  primaryDark: '#C76B5C',    // Deeper terra cotta
  primaryLight: '#E09580',   // Lighter terra cotta

  clay: '#C97B63',           // Secondary warm accent
  sage: '#8B9D83',           // Calming sage green
  sand: '#E8DCC4',           // Warm sand backgrounds

  // Secondary Colors (Modern Wellness)
  dustyRose: '#D4A5A5',      // Gentle, nurturing
  slate: '#6B7D8F',          // Professional depth
  cream: '#F5F1E8',          // Soft cream backgrounds
  charcoal: '#3A3A3A',       // Text, grounding

  // Accent Colors
  golden: '#E6B17E',         // Golden hour highlights
  deepEarth: '#7A5C4D',      // Deep wisdom brown

  // Functional Colors
  success: '#7B9D6F',        // Success green
  warning: '#D4945C',        // Warning amber
  error: '#C76B5C',          // Error terra
  info: '#8B9D83',           // Info sage

  // Neutrals
  white: '#FFFFFF',
  offWhite: '#F5F1E8',
  lightGray: '#E5E5E5',
  mediumGray: '#9CA3AF',
  darkGray: '#6B7280',
  almostBlack: '#3A3A3A',
  black: '#1F1F1F',

  // Background Variations
  background: '#F5F1E8',     // Soft cream
  backgroundAlt: '#E8DCC4',  // Warm sand
  surface: '#FFFFFF',
  surfaceAlt: '#F9F6F1',

  // Text Colors
  text: '#3A3A3A',           // Charcoal
  textSecondary: '#6B7280',  // Medium gray
  textLight: '#9CA3AF',      // Light gray
  textInverse: '#FFFFFF',

  // Legacy mapping (for gradual migration)
  purple: {
    primary: '#D4725C',      // Maps old purple to terra cotta
    light: '#E09580',
    dark: '#C76B5C',
  },
  blue: {
    primary: '#6B7D8F',      // Maps old blue to slate
    light: '#8B9DAF',
    dark: '#5B6D7F',
  }
};

export const gradients = {
  primary: ['#D4725C', '#C97B63'],           // Terra cotta to clay
  warm: ['#E6B17E', '#D4725C'],              // Golden to terra cotta
  earth: ['#8B9D83', '#7A5C4D'],             // Sage to deep earth
  sunset: ['#D4725C', '#D4945C', '#E6B17E'], // Sunset gradient
  calm: ['#8B9D83', '#D4A5A5'],              // Sage to dusty rose
  wellness: ['#6B7D8F', '#8B9D83'],          // Slate to sage
};

export const shadows = {
  soft: {
    shadowColor: '#7A5C4D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: '#7A5C4D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  strong: {
    shadowColor: '#7A5C4D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
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
  lg: 16,
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
