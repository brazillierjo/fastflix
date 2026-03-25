/**
 * AnimatedCheckmark - Animated checkmark overlay for watchlist add confirmation
 * Circle scales up, then checkmark strokes in. Auto-dismisses after 1.5s.
 */

import React, { useEffect, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { iosColors } from '@/utils/designHelpers';

interface AnimatedCheckmarkProps {
  visible: boolean;
  onDismiss: () => void;
  /** Auto-dismiss delay in ms (default 1500) */
  dismissDelay?: number;
}

export default function AnimatedCheckmark({
  visible,
  onDismiss,
  dismissDelay = 1500,
}: AnimatedCheckmarkProps) {
  const circleScale = useSharedValue(0);
  const checkmarkOpacity = useSharedValue(0);
  const checkmarkScale = useSharedValue(0.3);
  const containerOpacity = useSharedValue(0);

  const stableOnDismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    if (visible) {
      // Reset
      circleScale.value = 0;
      checkmarkOpacity.value = 0;
      checkmarkScale.value = 0.3;
      containerOpacity.value = 1;

      // Animate circle scale up
      circleScale.value = withSpring(1, {
        damping: 12,
        stiffness: 200,
      });

      // Animate checkmark in after circle
      checkmarkOpacity.value = withDelay(
        200,
        withTiming(1, { duration: 200 })
      );
      checkmarkScale.value = withDelay(
        200,
        withSpring(1, { damping: 10, stiffness: 180 })
      );

      // Auto-dismiss: fade out then call onDismiss
      containerOpacity.value = withDelay(
        dismissDelay,
        withTiming(0, { duration: 300 }, finished => {
          if (finished) {
            runOnJS(stableOnDismiss)();
          }
        })
      );
    }
  }, [
    visible,
    dismissDelay,
    stableOnDismiss,
    circleScale,
    checkmarkOpacity,
    checkmarkScale,
    containerOpacity,
  ]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
  }));

  const checkmarkStyle = useAnimatedStyle(() => ({
    opacity: checkmarkOpacity.value,
    transform: [{ scale: checkmarkScale.value }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, containerStyle]}>
      <Animated.View style={[styles.circle, circleStyle]}>
        <Animated.View style={checkmarkStyle}>
          <Ionicons name="checkmark" size={32} color="#FFFFFF" />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: iosColors.systemGreen,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: iosColors.systemGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
