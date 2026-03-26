/**
 * Design Helpers - Utility functions for Netflix-style design
 *
 * These helpers make it easy to apply glassmorphism, shadows, and other
 * design effects consistently across the application.
 */

import { Platform, ViewStyle } from 'react-native';
import { SHADOWS } from '@/constants/designSystem';

// ============================================================================
// GLASSMORPHISM HELPERS
// ============================================================================

/**
 * Get glassmorphism style for tab bar specifically
 * Slightly elevated from background for visibility
 */
export const getGlassTabStyle = (isDark: boolean): ViewStyle => ({
  backgroundColor: isDark
    ? 'rgba(42, 42, 42, 0.85)' // Lighter than background (#141414) for contrast
    : 'rgba(240, 240, 240, 0.85)', // Slightly darker than white background
  borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
  borderWidth: 1,
});

// ============================================================================
// SHADOW HELPERS
// ============================================================================

/**
 * Get card shadow based on theme
 * Works on both iOS and Android with proper fallbacks
 */
export const getCardShadow = (isDark: boolean): ViewStyle => {
  return isDark ? SHADOWS.card.dark : SHADOWS.card.light;
};

/**
 * Get glass/floating element shadow based on theme
 * Stronger shadow for elevated UI elements like tab bars
 */
export const getGlassShadow = (isDark: boolean): ViewStyle => {
  return isDark ? SHADOWS.glass.dark : SHADOWS.glass.light;
};

/**
 * Get Netflix red glow shadow for accent elements
 * Use sparingly for important CTAs or active states
 */
export const getNetflixGlow = (isDark: boolean): ViewStyle => {
  return isDark ? SHADOWS.netflix.dark : SHADOWS.netflix.light;
};

// ============================================================================
// BORDER RADIUS HELPERS - Apple Squircle Style
// ============================================================================

/**
 * Get Apple-style squircle border radius
 * Applies iOS continuous corners on iOS for smoother appearance
 *
 * @param radius - The base radius value
 * @returns ViewStyle with platform-specific continuous corners
 */
export const getSquircle = (radius: number): ViewStyle => {
  return {
    borderRadius: radius,
    ...Platform.select({
      ios: {
        // iOS 13+ supports continuous corners (squircle)
        borderCurve: 'continuous' as any,
      },
    }),
  };
};

/**
 * Get squircle border radius for buttons
 * Enhanced from 12 to 14 for Apple-style smoothness
 */
export const getButtonBorderRadius = (): ViewStyle => getSquircle(14);

/**
 * Get squircle border radius for small elements (badges, tags)
 * Enhanced from 8 to 10 for Apple-style smoothness
 */
export const getSmallBorderRadius = (): ViewStyle => getSquircle(10);

// ============================================================================
// OVERLAY HELPERS
// ============================================================================

/**
 * Get gradient overlay for images (e.g., movie posters)
 * To be used with LinearGradient component
 */
export const getImageOverlayColors = (
  isDark: boolean = true
): readonly [string, string] => {
  return isDark
    ? ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.6)']
    : ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.4)'];
};

// ============================================================================
// COLOR HELPERS
// ============================================================================

/**
 * Get Netflix red color (accent color)
 */
export const getNetflixRed = (): string => '#E50914';

/**
 * Get placeholder text color based on theme
 */
export const getPlaceholderColor = (isDark: boolean): string => {
  return isDark ? '#a3a3a3' : '#737373';
};

/**
 * Get muted icon color based on theme — consistent across the app
 */
export const getMutedIconColor = (isDark: boolean): string => {
  return isDark ? '#a3a3a3' : '#737373';
};

// ============================================================================
// CONDITIONAL STYLE HELPERS
// ============================================================================

/**
 * Get active/inactive tab style with squircle corners
 */
export const getTabStyle = (isActive: boolean, isDark: boolean): ViewStyle => ({
  backgroundColor: isActive ? '#E50914' : 'transparent',
  opacity: isActive ? 1 : 0.7,
  paddingVertical: 8,
  paddingHorizontal: 16,
  ...getSquircle(18), // Apple-style squircle corners
});

// ============================================================================
// iOS SYSTEM STYLE HELPERS
// ============================================================================

/**
 * iOS-style section header spacing
 */
export const getSectionStyle = (_isDark: boolean) => ({
  paddingHorizontal: 16,
  paddingTop: 24,
  paddingBottom: 8,
});

/**
 * Subtle card style - light shadow in light mode, flat in dark mode
 */
export const getSubtleCardStyle = (isDark: boolean): ViewStyle => ({
  backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
  borderRadius: 16,
  ...(isDark
    ? {}
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      }),
});

/**
 * iOS system background color
 */
export const getSystemBackground = (isDark: boolean): string =>
  isDark ? '#000000' : '#f2f2f7';

/**
 * iOS secondary background color (cards, grouped sections)
 */
export const getSecondaryBackground = (isDark: boolean): string =>
  isDark ? '#1c1c1e' : '#ffffff';

/**
 * iOS grouped table background color
 */
export const getGroupedBackground = (isDark: boolean): string =>
  isDark ? '#1c1c1e' : '#ffffff';

// ============================================================================
// iOS TYPOGRAPHY SCALE
// ============================================================================

/**
 * iOS-style typography scale (SF Pro is the system font, no need to load it)
 */
export const typography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
    letterSpacing: 0.37,
  },
  title1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: 0.36 },
  title2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: 0.35 },
  title3: { fontSize: 20, fontWeight: '600' as const, letterSpacing: 0.38 },
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
    letterSpacing: -0.41,
  },
  body: { fontSize: 17, fontWeight: '400' as const, letterSpacing: -0.41 },
  callout: { fontSize: 16, fontWeight: '400' as const, letterSpacing: -0.32 },
  subheadline: {
    fontSize: 15,
    fontWeight: '400' as const,
    letterSpacing: -0.24,
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400' as const,
    letterSpacing: -0.08,
  },
  caption1: { fontSize: 12, fontWeight: '400' as const, letterSpacing: 0 },
  caption2: { fontSize: 11, fontWeight: '400' as const, letterSpacing: 0.07 },
};

// ============================================================================
// iOS SYSTEM COLORS
// ============================================================================

export const iosColors = {
  // iOS System Colors
  systemRed: '#FF3B30',
  systemOrange: '#FF9500',
  systemYellow: '#FFCC00',
  systemGreen: '#34C759',
  systemTeal: '#5AC8FA',
  systemBlue: '#007AFF',
  systemIndigo: '#5856D6',
  systemPurple: '#AF52DE',
  systemPink: '#FF2D55',
  // Grays
  systemGray: '#8E8E93',
  systemGray2: '#AEAEB2',
  systemGray3: '#C7C7CC',
  systemGray4: '#D1D1D6',
  systemGray5: '#E5E5EA',
  systemGray6: '#F2F2F7',
  // Backgrounds
  light: {
    background: '#F2F2F7',
    secondaryBackground: '#FFFFFF',
    tertiaryBackground: '#F2F2F7',
    separator: '#C6C6C8',
    opaqueSeparator: '#C6C6C8',
  },
  dark: {
    background: '#000000',
    secondaryBackground: '#1C1C1E',
    tertiaryBackground: '#2C2C2E',
    separator: '#38383A',
    opaqueSeparator: '#38383A',
  },
};
