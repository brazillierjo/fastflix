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
