/**
 * Onboarding Screen
 * A 4-screen swipeable onboarding flow shown before authentication
 */

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/utils/cn';
import { getNetflixGlow, getSquircle } from '@/utils/designHelpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ONBOARDING_KEY = '@fastflix/onboarding_complete';

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  subtitleKey: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    icon: 'film',
    titleKey: 'onboarding.screen1.title',
    subtitleKey: 'onboarding.screen1.subtitle',
  },
  {
    id: '2',
    icon: 'sparkles',
    titleKey: 'onboarding.screen2.title',
    subtitleKey: 'onboarding.screen2.subtitle',
  },
  {
    id: '3',
    icon: 'tv',
    titleKey: 'onboarding.screen3.title',
    subtitleKey: 'onboarding.screen3.subtitle',
  },
  {
    id: '4',
    icon: 'bookmark',
    titleKey: 'onboarding.screen4.title',
    subtitleKey: 'onboarding.screen4.subtitle',
  },
];

// Platform logos for screen 3
const PLATFORMS = [
  { name: 'Netflix', color: '#E50914' },
  { name: 'Prime', color: '#00A8E1' },
  { name: 'Disney+', color: '#113CCF' },
  { name: 'HBO', color: '#B41EBA' },
  { name: 'Apple TV+', color: '#555555' },
  { name: 'Hulu', color: '#1CE783' },
];

export default function OnboardingScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/setup' as never);
  }, [router]);

  const goToLogin = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    await AsyncStorage.setItem('@fastflix/setup_complete', 'true');
    router.replace('/auth' as never);
  }, [router]);

  const handleNext = useCallback(() => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
    } else {
      completeOnboarding();
    }
  }, [activeIndex, completeOnboarding]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => (
    <View style={{ width: SCREEN_WIDTH }} className="flex-1 items-center justify-center px-8">
      {/* Icon with glow animation */}
      <MotiView
        from={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 700, delay: 100 }}
        className="mb-10 items-center justify-center"
      >
        {/* Glow ring behind icon */}
        <MotiView
          from={{ opacity: 0.3, scale: 0.8 }}
          animate={{ opacity: 0.6, scale: 1.2 }}
          transition={{
            type: 'timing',
            duration: 2000,
            loop: true,
          }}
          style={[
            {
              position: 'absolute',
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: 'rgba(229, 9, 20, 0.15)',
            },
          ]}
        />
        <View
          style={[
            getSquircle(40),
            {
              width: 120,
              height: 120,
              backgroundColor: isDark
                ? 'rgba(229, 9, 20, 0.15)'
                : 'rgba(229, 9, 20, 0.1)',
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          {index === 2 ? (
            // Screen 3: Platform grid
            <View className="flex-row flex-wrap items-center justify-center" style={{ width: 80 }}>
              {PLATFORMS.map((platform, i) => (
                <MotiView
                  key={platform.name}
                  from={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    type: 'timing',
                    duration: 400,
                    delay: 200 + i * 100,
                  }}
                  style={[
                    {
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      backgroundColor: platform.color,
                      margin: 2,
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                  ]}
                >
                  <Ionicons name="checkmark" size={12} color="#fff" />
                </MotiView>
              ))}
            </View>
          ) : (
            <Ionicons name={item.icon} size={56} color="#E50914" />
          )}
        </View>
      </MotiView>

      {/* Title */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 600, delay: 300 }}
        className="mb-4"
      >
        <Text
          className={cn(
            'text-center text-3xl font-bold',
            'text-light-text dark:text-dark-text'
          )}
        >
          {t(item.titleKey)}
        </Text>
      </MotiView>

      {/* Subtitle */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 600, delay: 450 }}
        className="max-w-[320px]"
      >
        <Text
          className={cn(
            'text-center text-base leading-relaxed',
            'text-light-text/60 dark:text-dark-text/60'
          )}
        >
          {t(item.subtitleKey)}
        </Text>
      </MotiView>
    </View>
  );

  return (
    <SafeAreaView
      className={cn('flex-1 bg-light-background dark:bg-dark-background')}
    >
      {/* Skip button */}
      <View className="absolute right-6 top-14 z-10">
        <TouchableOpacity
          onPress={completeOnboarding}
          className="px-4 py-2"
          activeOpacity={0.7}
        >
          <Text className="text-base font-medium text-light-text/50 dark:text-dark-text/50">
            {t('onboarding.skip')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Bottom section: dots + button */}
      <View className="items-center pb-10">
        {/* Dot indicators */}
        <View className="mb-8 flex-row items-center justify-center gap-2">
          {SLIDES.map((_, index) => (
            <MotiView
              key={index}
              animate={{
                width: activeIndex === index ? 28 : 8,
                backgroundColor:
                  activeIndex === index
                    ? '#E50914'
                    : isDark
                      ? 'rgba(255, 255, 255, 0.25)'
                      : 'rgba(0, 0, 0, 0.2)',
              }}
              transition={{ type: 'timing', duration: 300 }}
              style={{
                height: 8,
                borderRadius: 99,
              }}
            />
          ))}
        </View>

        {/* Next / Get Started button */}
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.8}
          style={[
            getSquircle(16),
            getNetflixGlow(isDark),
            {
              backgroundColor: '#E50914',
              paddingVertical: 16,
              paddingHorizontal: 48,
              minWidth: 220,
            },
          ]}
        >
          <Text className="text-center text-lg font-bold text-white">
            {activeIndex === SLIDES.length - 1
              ? t('onboarding.getStarted')
              : t('onboarding.next')}
          </Text>
        </TouchableOpacity>

        {/* Already have an account */}
        <TouchableOpacity
          onPress={goToLogin}
          className="mt-4 px-4 py-2"
          activeOpacity={0.7}
        >
          <Text className="text-center text-sm font-medium text-light-text/50 dark:text-dark-text/50">
            {t('onboarding.alreadyHaveAccount')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
