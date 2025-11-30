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
 * Get glassmorphism style for BlurView containers
 *
 * Usage with BlurView:
 * ```tsx
 * <BlurView intensity={80} tint={isDark ? 'dark' : 'light'}>
 *   <View style={getGlassStyle(isDark)}>
 *     {content}
 *   </View>
 * </BlurView>
 * ```
 */
export const getGlassStyle = (isDark: boolean): ViewStyle => ({
  backgroundColor: isDark
    ? 'rgba(31, 31, 31, 0.7)'
    : 'rgba(255, 255, 255, 0.7)',
  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
  borderWidth: 1,
});

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

/**
 * Get button shadow based on theme
 */
export const getButtonShadow = (isDark: boolean): ViewStyle => {
  return isDark ? SHADOWS.button.dark : SHADOWS.button.light;
};

/**
 * Get platform-specific shadow for custom elevation values
 * Useful when you need a specific shadow that's not in the design system
 */
export const getPlatformShadow = (
  elevation: number,
  isDark: boolean = false
): ViewStyle => {
  const opacity = isDark ? 0.3 + elevation * 0.02 : 0.1 + elevation * 0.01;

  return Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: Math.floor(elevation / 2),
      },
      shadowOpacity: Math.min(opacity, 0.5),
      shadowRadius: elevation,
    },
    android: {
      elevation: elevation,
    },
    default: {},
  }) as ViewStyle;
};

// ============================================================================
// TEXT SHADOW HELPERS
// ============================================================================

/**
 * Get text shadow for better readability over images
 * Commonly used on text overlaid on movie posters
 */
export const getTextShadow = (isDark: boolean = true) => ({
  textShadowColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
});

/**
 * Get subtle text shadow for headings
 */
export const getHeadingTextShadow = () => ({
  textShadowColor: 'rgba(0, 0, 0, 0.1)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 2,
});

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
 * Get consistent squircle border radius for cards
 * Enhanced from 16 to 18 for Apple-style smoothness
 */
export const getCardBorderRadius = (): ViewStyle => getSquircle(18);

/**
 * Get squircle border radius for buttons
 * Enhanced from 12 to 14 for Apple-style smoothness
 */
export const getButtonBorderRadius = (): ViewStyle => getSquircle(14);

/**
 * Get squircle border radius for inputs
 * Enhanced from 12 to 14 for Apple-style smoothness
 */
export const getInputBorderRadius = (): ViewStyle => getSquircle(14);

/**
 * Get squircle border radius for small elements (badges, tags)
 * Enhanced from 8 to 10 for Apple-style smoothness
 */
export const getSmallBorderRadius = (): ViewStyle => getSquircle(10);

/**
 * Get squircle border radius for large containers (modals, sheets)
 */
export const getLargeBorderRadius = (): ViewStyle => getSquircle(24);

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

/**
 * Get scrim overlay color for modals/overlays
 */
export const getScrimColor = (isDark: boolean): string => {
  return isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)';
};

// ============================================================================
// SPACING HELPERS
// ============================================================================

/**
 * Get consistent padding for cards
 */
export const getCardPadding = (): ViewStyle => ({
  padding: 16,
});

/**
 * Get consistent padding for sections
 */
export const getSectionPadding = (): ViewStyle => ({
  padding: 24,
});

/**
 * Get consistent horizontal padding for screens
 */
export const getScreenPadding = (): ViewStyle => ({
  paddingHorizontal: 20,
});

// ============================================================================
// ANIMATION HELPERS
// ============================================================================

/**
 * Standard animation config for Moti
 */
export const getStandardAnimation = () => ({
  type: 'timing' as const,
  duration: 200,
});

/**
 * Smooth animation config for Moti
 */
export const getSmoothAnimation = () => ({
  type: 'timing' as const,
  duration: 300,
});

/**
 * Slow animation config for Moti
 */
export const getSlowAnimation = () => ({
  type: 'timing' as const,
  duration: 400,
});

/**
 * Spring animation config for Moti
 */
export const getSpringAnimation = () => ({
  type: 'spring' as const,
  damping: 15,
  stiffness: 150,
});

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
 * Get disabled state color based on theme
 */
export const getDisabledColor = (isDark: boolean): string => {
  return isDark ? '#525252' : '#d4d4d4';
};

/**
 * Convert hex color to rgba with opacity
 */
export const hexToRgba = (hex: string, opacity: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
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

/**
 * Get active/inactive button style
 */
export const getButtonStyle = (
  isActive: boolean,
  isDark: boolean
): ViewStyle => ({
  backgroundColor: isActive ? '#E50914' : isDark ? '#2a2a2a' : '#f5f5f5',
  opacity: isActive ? 1 : 0.8,
});
