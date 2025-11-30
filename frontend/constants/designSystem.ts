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
export const NETFLIX_RED = {
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

/**
 * Cinematic Grays - Netflix-inspired neutral palette
 * Provides depth and sophistication
 */
export const CINEMATIC_GRAY = {
  50: '#fafafa', // Almost white
  100: '#f5f5f5', // Light surface
  200: '#e8e8e8', // Light gray
  300: '#d4d4d4', // Medium light
  400: '#a3a3a3', // Medium
  500: '#737373', // True gray
  600: '#525252', // Dark gray
  700: '#3d3d3d', // Darker
  800: '#2a2a2a', // Netflix card dark
  850: '#1f1f1f', // Netflix surface dark
  900: '#141414', // Netflix background dark
  950: '#0a0a0a', // Almost black
};

/**
 * Semantic Colors
 */
export const SUCCESS = {
  50: '#f0fdf4',
  500: '#22c55e',
  700: '#15803d',
};

export const WARNING = {
  50: '#fffbeb',
  500: '#f59e0b',
  700: '#b45309',
};

export const ERROR = {
  50: '#fef2f2',
  500: '#ef4444',
  700: '#b91c1c',
};

/**
 * Light Theme Tokens
 */
export const LIGHT_THEME = {
  // Backgrounds
  background: '#ffffff',
  surface: '#fafafa',
  card: '#f5f5f5',
  cardHover: '#e8e8e8',

  // Borders
  border: '#e8e8e8',
  borderSubtle: '#f5f5f5',

  // Input
  input: '#fafafa',
  inputBorder: '#e8e8e8',
  inputFocus: NETFLIX_RED[500],

  // Text
  text: '#0f172a',
  textSecondary: '#525252',
  textMuted: '#737373',
  textInverse: '#ffffff',

  // Brand
  accent: NETFLIX_RED[500],
  accentHover: NETFLIX_RED[600],
  accentLight: NETFLIX_RED[100],

  // Glassmorphism
  glassBg: 'rgba(255, 255, 255, 0.7)',
  glassBlur: 'rgba(255, 255, 255, 0.3)',
  glassBorder: 'rgba(0, 0, 0, 0.1)',

  // Shadows
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowMedium: 'rgba(0, 0, 0, 0.15)',
  shadowStrong: 'rgba(0, 0, 0, 0.25)',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  scrim: 'rgba(0, 0, 0, 0.3)',
};

/**
 * Dark Theme Tokens
 */
export const DARK_THEME = {
  // Backgrounds
  background: '#141414', // Netflix signature
  surface: '#1f1f1f',
  card: '#2a2a2a',
  cardHover: '#3d3d3d',

  // Borders
  border: '#3d3d3d',
  borderSubtle: '#2a2a2a',

  // Input
  input: '#2a2a2a',
  inputBorder: '#3d3d3d',
  inputFocus: NETFLIX_RED[500],

  // Text
  text: '#ffffff',
  textSecondary: '#d4d4d4',
  textMuted: '#a3a3a3',
  textInverse: '#0f172a',

  // Brand
  accent: NETFLIX_RED[500],
  accentHover: NETFLIX_RED[400], // Lighter on dark
  accentLight: NETFLIX_RED[900],

  // Glassmorphism
  glassBg: 'rgba(31, 31, 31, 0.7)',
  glassBlur: 'rgba(31, 31, 31, 0.3)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',

  // Shadows
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowMedium: 'rgba(0, 0, 0, 0.5)',
  shadowStrong: 'rgba(0, 0, 0, 0.7)',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.7)',
  scrim: 'rgba(0, 0, 0, 0.5)',
};

/**
 * All Colors - For Tailwind config export
 */
export const COLORS = {
  // Brand colors
  netflix: NETFLIX_RED,
  cinematic: CINEMATIC_GRAY,

  // Semantic
  success: SUCCESS,
  warning: WARNING,
  error: ERROR,

  // Theme-specific tokens
  light: LIGHT_THEME,
  dark: DARK_THEME,
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================

/**
 * Font Families
 * Uses native system fonts (San Francisco on iOS, Roboto on Android)
 */
export const FONT_FAMILY = {
  sans: 'System',
  mono: 'Menlo',
};

/**
 * Font Sizes with Line Heights and Letter Spacing (Apple-style)
 */
export const FONT_SIZE = {
  xs: {
    size: 13, // Footnote
    lineHeight: 18,
    letterSpacing: 0.01,
  },
  sm: {
    size: 15, // Subhead
    lineHeight: 20,
    letterSpacing: 0.005,
  },
  base: {
    size: 17, // Body (Apple standard)
    lineHeight: 22,
    letterSpacing: -0.005,
  },
  lg: {
    size: 19, // Callout
    lineHeight: 24,
    letterSpacing: -0.01,
  },
  xl: {
    size: 22, // Title 3
    lineHeight: 28,
    letterSpacing: -0.015,
  },
  '2xl': {
    size: 28, // Title 2
    lineHeight: 34,
    letterSpacing: -0.02,
  },
  '3xl': {
    size: 34, // Title 1
    lineHeight: 41,
    letterSpacing: -0.025,
  },
  '4xl': {
    size: 40, // Large Title
    lineHeight: 48,
    letterSpacing: -0.03,
  },
  '5xl': {
    size: 52, // Display
    lineHeight: 60,
    letterSpacing: -0.035,
  },
};

/**
 * Font Weights
 */
export const FONT_WEIGHT = {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
};

// ============================================================================
// SPACING
// ============================================================================

/**
 * Spacing Scale
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
};

// ============================================================================
// BORDER RADIUS - Apple Squircle Style
// ============================================================================

/**
 * Apple-inspired continuous corner radii
 * Enhanced values that approximate iOS squircle aesthetics
 * Use with Platform-specific borderCurve: 'continuous' on iOS for best results
 */
export const BORDER_RADIUS = {
  xs: 6, // Very small elements, badges
  sm: 10, // Small buttons, chips (enhanced from 8)
  md: 14, // Default cards, inputs (enhanced from 12)
  lg: 18, // Large cards (enhanced from 16)
  xl: 24, // Modals, sheets (enhanced from 20)
  '2xl': 28, // Large containers (enhanced from 24)
  full: 9999, // Fully rounded (pills, circles)
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

// ============================================================================
// GRADIENTS
// ============================================================================

/**
 * Gradient Definitions
 * Note: For React Native, use expo-linear-gradient
 */
export const GRADIENTS = {
  netflixHero: {
    colors: ['rgba(20, 20, 20, 0)', 'rgba(20, 20, 20, 1)'],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  cardOverlay: {
    colors: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.6)'],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  redGlow: {
    colors: [NETFLIX_RED[500], NETFLIX_RED[400]],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  darkGlass: {
    colors: ['rgba(31, 31, 31, 0.8)', 'rgba(42, 42, 42, 0.6)'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  lightGlass: {
    colors: ['rgba(255, 255, 255, 0.8)', 'rgba(250, 250, 250, 0.6)'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

// ============================================================================
// ANIMATION TIMINGS
// ============================================================================

/**
 * Standard Animation Durations
 */
export const ANIMATION = {
  fast: 150,
  normal: 200,
  medium: 300,
  slow: 400,
  slower: 600,
};

/**
 * Animation Easings
 */
export const EASING = {
  easeInOut: 'ease-in-out',
  easeOut: 'ease-out',
  easeIn: 'ease-in',
  spring: 'spring',
};
