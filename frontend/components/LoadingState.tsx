import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { Text, useColorScheme, View } from 'react-native';

import { Skeleton, SkeletonCard, SkeletonRow } from './Skeleton';

interface LoadingStateProps {
  isSearching: boolean;
}

export default function LoadingState({ isSearching }: LoadingStateProps) {
  const { t } = useLanguage();

  return (
    <View className='flex-1 bg-light-background dark:bg-dark-background'>
      {isSearching ? (
        <SearchLoadingScreen />
      ) : (
        <HomeSkeleton message={t('welcome.generating')} />
      )}
    </View>
  );
}

// ============================================================================
// Search Loading - Engaging animated loading screen
// ============================================================================

const LOADING_STEPS = [
  { icon: 'sparkles' as const, key: 'analyzing' },
  { icon: 'film' as const, key: 'searching' },
  { icon: 'star' as const, key: 'ranking' },
  { icon: 'checkmark-circle' as const, key: 'finalizing' },
];

const FUN_FACTS = [
  'funFact1',
  'funFact2',
  'funFact3',
  'funFact4',
  'funFact5',
];

function SearchLoadingScreen() {
  const { t } = useLanguage();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [currentStep, setCurrentStep] = useState(0);
  const [currentFact, setCurrentFact] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Progress through steps
  useEffect(() => {
    const stepTimers = [
      setTimeout(() => setCurrentStep(1), 2000),
      setTimeout(() => setCurrentStep(2), 5000),
      setTimeout(() => setCurrentStep(3), 8000),
    ];
    return () => stepTimers.forEach(clearTimeout);
  }, []);

  // Rotate fun facts every 3s
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFact(prev => (prev + 1) % FUN_FACTS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Elapsed time counter
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const accentColor = '#E50914';

  return (
    <View className='flex-1 items-center justify-center px-8'>
      {/* Animated icon */}
      <MotiView
        from={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 12 }}
        className='mb-8'
      >
        <MotiView
          from={{ rotate: '0deg' }}
          animate={{ rotate: '360deg' }}
          transition={{ type: 'timing', duration: 3000, loop: true }}
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            borderWidth: 3,
            borderColor: accentColor,
            borderTopColor: 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              position: 'absolute',
              width: 80,
              height: 80,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name={LOADING_STEPS[currentStep].icon}
              size={32}
              color={accentColor}
            />
          </View>
        </MotiView>
      </MotiView>

      {/* Progress steps */}
      <View className='mb-6 w-full'>
        {LOADING_STEPS.map((step, index) => {
          const isActive = index === currentStep;
          const isDone = index < currentStep;
          return (
            <MotiView
              key={step.key}
              from={{ opacity: 0, translateX: -20 }}
              animate={{
                opacity: index <= currentStep ? 1 : 0.3,
                translateX: 0,
              }}
              transition={{ type: 'timing', duration: 400, delay: index * 200 }}
              className='mb-3 flex-row items-center gap-3'
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: isDone
                    ? '#34C759'
                    : isActive
                      ? accentColor
                      : isDark
                        ? '#333'
                        : '#e5e5e5',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isDone ? (
                  <Ionicons name='checkmark' size={14} color='#fff' />
                ) : isActive ? (
                  <MotiView
                    from={{ opacity: 0.3 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: 'timing', duration: 600, loop: true }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#fff',
                      }}
                    />
                  </MotiView>
                ) : null}
              </View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: isActive ? '600' : '400',
                  color: isActive
                    ? isDark ? '#fff' : '#000'
                    : isDark ? '#666' : '#999',
                }}
              >
                {t(`loading.${step.key}`) || step.key}
              </Text>
            </MotiView>
          );
        })}
      </View>

      {/* Fun fact */}
      <MotiView
        key={currentFact}
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
        className='mb-4 rounded-xl px-4 py-3'
        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
      >
        <Text className='text-center text-xs leading-4 text-light-muted dark:text-dark-muted'>
          {t(`loading.${FUN_FACTS[currentFact]}`) || 'Finding the perfect picks for you...'}
        </Text>
      </MotiView>

      {/* Elapsed time */}
      <Text className='text-xs text-light-muted/50 dark:text-dark-muted/50'>
        {elapsedSeconds}s
      </Text>

      {/* Skeleton cards at bottom */}
      <View className='mt-6 w-full flex-row gap-3'>
        {[0, 1, 2].map(i => (
          <MotiView
            key={i}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 0.5, translateY: 0 }}
            transition={{ delay: 500 + i * 150, type: 'timing', duration: 500 }}
            style={{ flex: 1 }}
          >
            <Skeleton width='100%' height={120} borderRadius={12} />
          </MotiView>
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// Home Skeleton - Header + horizontal row + vertical list
// ============================================================================

function HomeSkeleton({ message }: { message: string }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 500 }}
      style={{ flex: 1 }}
    >
      <View style={{ paddingHorizontal: 24, paddingTop: 56 }}>
        <Skeleton width='60%' height={28} borderRadius={8} />
        <Skeleton width='40%' height={14} borderRadius={6} style={{ marginTop: 8 }} />
      </View>
      <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
        <Skeleton width='100%' height={52} borderRadius={16} />
      </View>
      <View style={{ paddingHorizontal: 24, marginTop: 28 }}>
        <Skeleton width='35%' height={18} borderRadius={6} />
      </View>
      <View style={{ flexDirection: 'row', paddingHorizontal: 24, marginTop: 12, gap: 12 }}>
        {[0, 1, 2, 3].map(i => (
          <MotiView
            key={i}
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 400, delay: 200 + i * 100 }}
          >
            <Skeleton width={128} height={176} borderRadius={12} />
          </MotiView>
        ))}
      </View>
      <View style={{ paddingHorizontal: 24, marginTop: 28 }}>
        <Skeleton width='45%' height={18} borderRadius={6} />
      </View>
      <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
        {[0, 1, 2].map(i => (
          <MotiView
            key={i}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 400 + i * 100 }}
          >
            <SkeletonRow />
          </MotiView>
        ))}
      </View>
      <Text className='mt-4 text-center text-sm text-light-textMuted dark:text-dark-textMuted'>
        {message}
      </Text>
    </MotiView>
  );
}
