import React, { useEffect } from 'react';
import { StyleSheet, useColorScheme, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

// ============================================================================
// Base Skeleton
// ============================================================================

interface SkeletonProps {
  width: number | string;
  height: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width,
  height,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height: height as number,
          borderRadius,
          backgroundColor: isDark ? '#2a2a2a' : '#e8e8e8',
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

// ============================================================================
// SkeletonCard - Movie poster card placeholder
// ============================================================================

interface SkeletonCardProps {
  style?: ViewStyle;
}

export function SkeletonCard({ style }: SkeletonCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
          borderColor: isDark ? '#3d3d3d' : '#e8e8e8',
        },
        style,
      ]}
    >
      <Skeleton width="100%" height={180} borderRadius={0} />
      <View style={styles.cardTextArea}>
        <Skeleton width="75%" height={16} borderRadius={6} />
        <Skeleton
          width="50%"
          height={12}
          borderRadius={4}
          style={{ marginTop: 8 }}
        />
      </View>
    </View>
  );
}

// ============================================================================
// SkeletonRow - Horizontal list item placeholder
// ============================================================================

interface SkeletonRowProps {
  style?: ViewStyle;
}

export function SkeletonRow({ style }: SkeletonRowProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
          borderColor: isDark ? '#3d3d3d' : '#e8e8e8',
        },
        style,
      ]}
    >
      <Skeleton width={60} height={90} borderRadius={8} />
      <View style={styles.rowTextArea}>
        <Skeleton width="70%" height={16} borderRadius={6} />
        <Skeleton
          width="40%"
          height={12}
          borderRadius={4}
          style={{ marginTop: 8 }}
        />
        <Skeleton
          width="55%"
          height={12}
          borderRadius={4}
          style={{ marginTop: 6 }}
        />
      </View>
    </View>
  );
}

// ============================================================================
// SkeletonCircle - Circular avatar/icon placeholder
// ============================================================================

interface SkeletonCircleProps {
  size?: number;
  style?: ViewStyle;
}

export function SkeletonCircle({ size = 48, style }: SkeletonCircleProps) {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
    />
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 16,
  },
  cardTextArea: {
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  rowTextArea: {
    flex: 1,
  },
});
