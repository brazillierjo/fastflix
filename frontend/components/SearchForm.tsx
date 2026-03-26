import { Ionicons } from '@expo/vector-icons';
import FiltersBottomSheet from '@/components/FiltersBottomSheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/RevenueCatContext';
import { cn } from '@/utils/cn';
import {
  getNetflixGlow,
  getPlaceholderColor,
  getSquircle,
  getButtonBorderRadius,
} from '@/utils/designHelpers';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

interface SearchFormProps {
  query: string;
  setQuery: (query: string) => void;
  onSearch: () => void;
  loading: boolean;
  onSubscriptionPress?: () => void;
}

// Typewriter speed in ms per character
const TYPEWRITER_SPEED = 35;
// Haptic feedback interval (every N characters)
const HAPTIC_INTERVAL = 3;

export default function SearchForm({
  query,
  setQuery,
  onSearch,
  loading,
  onSubscriptionPress,
}: SearchFormProps) {
  const { t, getRandomPlaceholder } = useLanguage();
  const { hasUnlimitedAccess, isTrialEligible } = useSubscription();
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Animation values
  const borderGlow = useSharedValue(0);
  const shimmerPosition = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  // Refs for "No idea" typewriter
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentIndexRef = useRef(0);
  const targetTextRef = useRef('');
  const currentTextRef = useRef('');

  // Animated placeholder typewriter (cycles through examples)
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState('');
  const placeholderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const placeholderIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const placeholderPhaseRef = useRef<'typing' | 'pause' | 'erasing'>('typing');
  const placeholderTextRef = useRef('');
  const placeholderTargetRef = useRef('');
  const placeholderIdxRef = useRef(0);

  useEffect(() => {
    // Don't animate if user has typed something or "No idea" is typing
    if (query || isTyping) {
      setAnimatedPlaceholder('');
      return;
    }

    let cancelled = false;
    placeholderTargetRef.current = getRandomPlaceholder();
    placeholderIdxRef.current = 0;
    placeholderTextRef.current = '';
    placeholderPhaseRef.current = 'typing';

    const tick = () => {
      if (cancelled) return;
      const phase = placeholderPhaseRef.current;
      const target = placeholderTargetRef.current;

      if (phase === 'typing') {
        if (placeholderIdxRef.current < target.length) {
          placeholderIdxRef.current++;
          placeholderTextRef.current = target.slice(0, placeholderIdxRef.current);
          setAnimatedPlaceholder(placeholderTextRef.current);
        } else {
          // Done typing — pause
          placeholderPhaseRef.current = 'pause';
          if (placeholderIntervalRef.current) clearInterval(placeholderIntervalRef.current);
          placeholderTimerRef.current = setTimeout(() => {
            if (cancelled) return;
            placeholderPhaseRef.current = 'erasing';
            placeholderIntervalRef.current = setInterval(tick, 20);
          }, 2000);
          return;
        }
      } else if (phase === 'erasing') {
        if (placeholderIdxRef.current > 0) {
          placeholderIdxRef.current--;
          placeholderTextRef.current = target.slice(0, placeholderIdxRef.current);
          setAnimatedPlaceholder(placeholderTextRef.current);
        } else {
          // Done erasing — pick new text and start typing
          if (placeholderIntervalRef.current) clearInterval(placeholderIntervalRef.current);
          placeholderTimerRef.current = setTimeout(() => {
            if (cancelled) return;
            placeholderTargetRef.current = getRandomPlaceholder();
            placeholderIdxRef.current = 0;
            placeholderPhaseRef.current = 'typing';
            placeholderIntervalRef.current = setInterval(tick, 35);
          }, 400);
          return;
        }
      }
    };

    // Start after a short delay
    placeholderTimerRef.current = setTimeout(() => {
      if (cancelled) return;
      placeholderIntervalRef.current = setInterval(tick, 35);
    }, 500);

    return () => {
      cancelled = true;
      if (placeholderTimerRef.current) clearTimeout(placeholderTimerRef.current);
      if (placeholderIntervalRef.current) clearInterval(placeholderIntervalRef.current);
    };
  }, [query, isTyping, getRandomPlaceholder]);

  // Cleanup "No idea" typewriter on unmount
  useEffect(() => {
    return () => {
      if (typewriterRef.current) {
        clearInterval(typewriterRef.current);
      }
    };
  }, []);

  // Animated border style for glow effect
  const animatedBorderStyle = useAnimatedStyle(() => {
    return {
      borderColor: isTyping
        ? `rgba(229, 9, 20, ${0.5 + borderGlow.value * 0.5})`
        : isDark
          ? '#404040'
          : '#e5e5e5',
      shadowColor: '#E50914',
      shadowOpacity: borderGlow.value * 0.6,
      shadowRadius: 8 + borderGlow.value * 8,
      shadowOffset: { width: 0, height: 0 },
    };
  });

  // Shimmer overlay style
  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shimmerPosition.value }],
      opacity: isTyping ? 0.3 : 0,
    };
  });

  // Button press animation
  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  // Start glow animation
  const startGlowAnimation = useCallback(() => {
    borderGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [borderGlow]);

  // Stop glow animation
  const stopGlowAnimation = useCallback(() => {
    cancelAnimation(borderGlow);
    borderGlow.value = withTiming(0, { duration: 300 });
  }, [borderGlow]);

  // Start shimmer animation
  const startShimmerAnimation = useCallback(() => {
    shimmerPosition.value = -200;
    shimmerPosition.value = withRepeat(
      withTiming(400, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );
  }, [shimmerPosition]);

  // Stop shimmer animation
  const stopShimmerAnimation = useCallback(() => {
    cancelAnimation(shimmerPosition);
    shimmerPosition.value = -200;
  }, [shimmerPosition]);

  // Typewriter effect with haptics
  const startTypewriter = useCallback(
    (text: string) => {
      // Clear any existing typewriter
      if (typewriterRef.current) {
        clearInterval(typewriterRef.current);
      }

      // Reset state
      currentIndexRef.current = 0;
      targetTextRef.current = text;
      currentTextRef.current = '';
      setQuery('');
      setIsTyping(true);

      // Start animations
      startGlowAnimation();
      startShimmerAnimation();

      // Initial haptic
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Type character by character
      typewriterRef.current = setInterval(() => {
        if (currentIndexRef.current < targetTextRef.current.length) {
          const nextChar = targetTextRef.current[currentIndexRef.current] || '';
          currentTextRef.current = currentTextRef.current + nextChar;
          setQuery(currentTextRef.current);

          // Haptic feedback every N characters
          if (currentIndexRef.current % HAPTIC_INTERVAL === 0) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }

          currentIndexRef.current++;
        } else {
          // Typing complete
          if (typewriterRef.current) {
            clearInterval(typewriterRef.current);
            typewriterRef.current = null;
          }
          setIsTyping(false);
          stopGlowAnimation();
          stopShimmerAnimation();

          // Success haptic
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }, TYPEWRITER_SPEED);
    },
    [
      setQuery,
      startGlowAnimation,
      startShimmerAnimation,
      stopGlowAnimation,
      stopShimmerAnimation,
    ]
  );

  // Handle "No idea" button press
  const handleNoIdea = useCallback(() => {
    // Button press animation
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    // Get random example and start typewriter
    const randomExample = getRandomPlaceholder();
    startTypewriter(randomExample);
  }, [buttonScale, getRandomPlaceholder, startTypewriter]);

  // Stop typewriter if user starts typing manually
  const handleManualInput = useCallback(
    (text: string) => {
      if (isTyping && typewriterRef.current) {
        clearInterval(typewriterRef.current);
        typewriterRef.current = null;
        setIsTyping(false);
        stopGlowAnimation();
        stopShimmerAnimation();
      }
      setQuery(text);
    },
    [isTyping, setQuery, stopGlowAnimation, stopShimmerAnimation]
  );

  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);

  const handleInputFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      textInputRef.current?.blur();
    },
  });

  // Get localized "No idea" button text
  const getNoIdeaText = () => {
    return t('welcome.noIdea') || 'No idea?';
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className='flex-1'
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        className='flex-1 bg-light-background dark:bg-dark-background'
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
        {...panResponder.panHandlers}
      >
        <View className='flex-1 justify-center px-6'>
          {/* Welcome Section */}
          <MotiView
            from={{ opacity: 0, translateY: -30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              type: 'timing',
              duration: 600,
            }}
            className='mb-8'
          >
            <Text className='mb-3 text-4xl font-bold text-light-text dark:text-dark-text'>
              {t('welcome.title')}
            </Text>
            <Text className='mb-3 text-base text-light-textSecondary dark:text-dark-textSecondary'>
              {t('welcome.subtitle')}
            </Text>
            <Text className='text-sm leading-relaxed text-light-textMuted dark:text-dark-textMuted'>
              {t('welcome.description')}
            </Text>
          </MotiView>

          {/* Search Input */}
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 200,
              type: 'timing',
              duration: 600,
            }}
            className='mb-5'
          >
            {/* Action Buttons Row */}
            <View className='mb-3 flex-row items-center justify-between'>
              {/* "No idea" Magic Button */}
              <Animated.View style={buttonAnimatedStyle}>
                <TouchableOpacity
                  onPress={handleNoIdea}
                  style={getSquircle(20)}
                  className={cn(
                    'flex-row items-center gap-2 px-4 py-2',
                    isTyping
                      ? 'bg-netflix-500/20'
                      : 'bg-gradient-to-r from-netflix-500/10 to-purple-500/10'
                  )}
                  disabled={loading || isTyping}
                >
                  <Ionicons
                    name={isTyping ? 'sparkles' : 'shuffle'}
                    size={16}
                    color='#E50914'
                  />
                  <Text className='text-sm font-semibold text-netflix-500'>
                    {isTyping
                      ? t('welcome.typing') || 'Typing...'
                      : getNoIdeaText()}
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              {/* Filters Button */}
              <TouchableOpacity
                onPress={() => setShowFiltersModal(true)}
                disabled={loading || isTyping}
                activeOpacity={0.7}
                style={getSquircle(20)}
                className='flex-row items-center gap-1.5 px-4 py-2'
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name='options-outline'
                  size={16}
                  color={isDark ? '#a3a3a3' : '#737373'}
                />
                <Text className='text-sm text-light-textSecondary dark:text-dark-textSecondary'>
                  {t('profile.defaultFilters')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Animated Input Container */}
            <View className='relative overflow-hidden rounded-[14px]'>
              {/* Shimmer overlay */}
              <Animated.View
                style={[
                  shimmerStyle,
                  {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: 100,
                    zIndex: 10,
                    pointerEvents: 'none',
                  },
                ]}
                className='bg-gradient-to-r from-transparent via-white to-transparent'
              >
                <View
                  style={{
                    width: 100,
                    height: '100%',
                    backgroundColor: isDark
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(229, 9, 20, 0.1)',
                  }}
                />
              </Animated.View>

              {/* Input with animated border */}
              <Animated.View style={animatedBorderStyle}>
                <View
                  className='border-2 bg-light-surface focus:border-netflix-500 dark:bg-dark-surface'
                  style={{
                    borderRadius: 14,
                    ...(Platform.OS === 'ios' && {
                      borderCurve: 'continuous' as const,
                    }),
                    borderColor: 'transparent',
                  }}
                >
                  <TextInput
                    ref={textInputRef}
                    value={query}
                    onChangeText={handleManualInput}
                    onFocus={handleInputFocus}
                    placeholder={animatedPlaceholder || ' '}
                    placeholderTextColor={getPlaceholderColor(isDark)}
                    className='pb-5 pl-5 pr-5 pt-5 text-base text-light-text dark:text-dark-text'
                    multiline
                    textAlignVertical='top'
                    scrollEnabled={false}
                    editable={!isTyping}
                    style={{ minHeight: 90, maxHeight: 130 }}
                  />
                </View>
              </Animated.View>
            </View>

            {/* Typing indicator */}
            {isTyping && (
              <MotiView
                from={{ opacity: 0, translateY: -5 }}
                animate={{ opacity: 1, translateY: 0 }}
                exit={{ opacity: 0 }}
                className='mt-2 flex-row items-center justify-center gap-2'
              >
                <View className='h-1.5 w-1.5 rounded-full bg-netflix-500' />
                <Text className='text-sm text-netflix-500'>
                  {t('welcome.magicHappening') ||
                    'Finding the perfect suggestion...'}
                </Text>
              </MotiView>
            )}
          </MotiView>

          {/* Generate Button */}
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 300,
              type: 'timing',
              duration: 600,
            }}
          >
            <TouchableOpacity
              onPress={
                !hasUnlimitedAccess && query.trim() && onSubscriptionPress
                  ? onSubscriptionPress
                  : onSearch
              }
              disabled={loading || isTyping}
              className={cn(
                'items-center px-6 py-5',
                loading || isTyping
                  ? 'bg-cinematic-600'
                  : 'bg-netflix-500 active:bg-netflix-600'
              )}
              style={[
                getButtonBorderRadius(),
                !loading && !isTyping ? getNetflixGlow(isDark) : undefined,
              ]}
            >
              <Text className='text-base font-semibold text-white'>
                {loading
                  ? t('welcome.generating')
                  : hasUnlimitedAccess
                    ? t('welcome.searchButton')
                    : query.trim()
                      ? isTrialEligible
                        ? t('subscription.startTrial')
                        : t('subscription.subscribe')
                      : t('welcome.searchButton')}
              </Text>
            </TouchableOpacity>
          </MotiView>
        </View>
      </ScrollView>

      {/* Filters Bottom Sheet */}
      <FiltersBottomSheet
        visible={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
      />
    </KeyboardAvoidingView>
  );
}
