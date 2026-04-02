import React, { useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = 60;

interface SwipeLeftToDetailProps {
  children: React.ReactNode;
  onSwipeLeft: () => void;
}

export default function SwipeLeftToDetail({
  children,
  onSwipeLeft,
}: SwipeLeftToDetailProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const navigated = useRef(false);

  const gesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-20, 20])
    .onUpdate((e) => {
      if (e.translationX < 0) translateX.setValue(e.translationX);
    })
    .onEnd((e) => {
      if (
        !navigated.current &&
        (e.translationX < -SWIPE_THRESHOLD ||
          (e.translationX < -30 && e.velocityX < -300))
      ) {
        navigated.current = true;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.timing(translateX, {
          toValue: -SCREEN_W,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          onSwipeLeft();
          setTimeout(() => {
            translateX.setValue(0);
            navigated.current = false;
          }, 400);
        });
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }).start();
      }
    })
    .onFinalize(() => {
      if (!navigated.current) {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    });

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.container}>
        <Animated.View
          style={[styles.container, { transform: [{ translateX }] }]}
        >
          {children}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
