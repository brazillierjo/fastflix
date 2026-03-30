/**
 * Shared animation configs — iOS premium feel
 * Uses physics-based springs (not linear/timing) for natural motion.
 */

import { WithSpringConfig, WithTimingConfig, Easing } from 'react-native-reanimated';

// ============================================================================
// Spring presets (physics-based, 60/120fps on UI thread)
// ============================================================================

/** Snappy response for taps — fast settle, no overshoot */
export const SPRING_TAP: WithSpringConfig = {
  damping: 15,
  stiffness: 300,
  mass: 0.8,
  overshootClamping: true,
};

/** Gentle bounce for enters — slight overshoot, natural feel */
export const SPRING_ENTER: WithSpringConfig = {
  damping: 18,
  stiffness: 180,
  mass: 1,
  overshootClamping: false,
};

/** Soft spring for modals/sheets — slow, elegant */
export const SPRING_MODAL: WithSpringConfig = {
  damping: 20,
  stiffness: 120,
  mass: 1,
  overshootClamping: false,
};

// ============================================================================
// Timing presets (for opacity, color fades)
// ============================================================================

/** Quick fade (150ms) — button highlights, subtle state changes */
export const TIMING_QUICK: WithTimingConfig = {
  duration: 150,
  easing: Easing.out(Easing.cubic),
};

/** Standard transition (250ms) — most UI changes */
export const TIMING_STANDARD: WithTimingConfig = {
  duration: 250,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1), // iOS ease-in-out
};

/** Slow, premium feel (400ms) — page transitions, hero animations */
export const TIMING_SLOW: WithTimingConfig = {
  duration: 400,
  easing: Easing.bezier(0.22, 1, 0.36, 1), // ease-out-quint
};

// ============================================================================
// Press scale values
// ============================================================================

/** Subtle press scale for buttons */
export const PRESS_SCALE_BUTTON = 0.97;

/** Lighter press scale for cards */
export const PRESS_SCALE_CARD = 0.98;

/** Minimal press scale for list items */
export const PRESS_SCALE_LIST = 0.99;
