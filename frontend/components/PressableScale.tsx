/**
 * PressableScale — iOS-style press feedback with spring physics
 *
 * Replaces TouchableOpacity for a premium feel:
 * - Scale down on press (spring physics, not linear)
 * - Spring back on release
 * - Optional haptic feedback
 * - Runs on UI thread (60/120fps)
 */

import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { SPRING_TAP, PRESS_SCALE_BUTTON, PRESS_SCALE_CARD } from '@/utils/animations';

interface PressableScaleProps {
  onPress: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
  /** Scale preset: 'button' (0.97) or 'card' (0.98) */
  scale?: 'button' | 'card';
  /** Enable haptic feedback on press */
  haptic?: boolean;
  /** Disable the component */
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link' | 'tab';
}

export default function PressableScale({
  onPress,
  children,
  style,
  className,
  scale = 'button',
  haptic = false,
  disabled = false,
  accessibilityLabel,
  accessibilityRole = 'button',
}: PressableScaleProps) {
  const scaleValue = useSharedValue(1);
  const pressScale = scale === 'card' ? PRESS_SCALE_CARD : PRESS_SCALE_BUTTON;

  const doHaptic = useCallback(() => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [haptic]);

  const doPress = useCallback(() => {
    onPress();
  }, [onPress]);

  const gesture = Gesture.Tap()
    .enabled(!disabled)
    .onBegin(() => {
      'worklet';
      scaleValue.value = withSpring(pressScale, SPRING_TAP);
    })
    .onFinalize(() => {
      'worklet';
      scaleValue.value = withSpring(1, SPRING_TAP);
    })
    .onEnd(() => {
      'worklet';
      if (haptic) runOnJS(doHaptic)();
      runOnJS(doPress)();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[animatedStyle, style]}
        className={className}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
