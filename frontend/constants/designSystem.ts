/**
 * FastFlix Design System - Netflix Inspired
 *
 * Centralized design tokens for the entire application.
 * Single source of truth for colors, typography, spacing, and effects.
 */

// ============================================================================
// COLOR SYSTEM
// ============================================================================

/**
 * Netflix Red - Primary Brand Color
 * Used for accents, CTAs, and active states
 */
const NETFLIX_RED = {
  50: '#fff1f0',
  100: '#ffe0de',
  200: '#ffc7c2',
  300: '#ffa09a',
  400: '#ff6b66', // Light hover state
  500: '#E50914', // Netflix signature red
  600: '#c70000', // Dark hover state
  700: '#a00000',
  800: '#7a0000',
  900: '#5c0000',
  950: '#3d0000',
};

// ============================================================================
// SHADOWS & ELEVATION
// ============================================================================

/**
 * Shadow Styles for Cards
 */
export const SHADOWS = {
  card: {
    light: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 6,
    },
    dark: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
  },
  glass: {
    light: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 10,
    },
    dark: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 10,
    },
  },
  netflix: {
    light: {
      shadowColor: NETFLIX_RED[500],
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
    },
    dark: {
      shadowColor: NETFLIX_RED[500],
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
  },
  button: {
    light: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    dark: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 4,
    },
  },
};
