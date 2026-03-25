import { useLanguage } from '@/contexts/LanguageContext';
import { MotiView } from 'moti';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Skeleton, SkeletonCard, SkeletonRow } from './Skeleton';

interface LoadingStateProps {
  isSearching: boolean;
}

export default function LoadingState({ isSearching }: LoadingStateProps) {
  const { t } = useLanguage();

  return (
    <View className='flex-1 bg-light-background dark:bg-dark-background'>
      {isSearching ? (
        <SearchSkeleton message={t('welcome.searching')} />
      ) : (
        <HomeSkeleton message={t('welcome.generating')} />
      )}
    </View>
  );
}

// ============================================================================
// Search Skeleton - Vertical card list
// ============================================================================

function SearchSkeleton({
  message,
}: {
  message: string;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 500 }}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      >
        <Text
          className='mb-4 text-center text-sm text-light-textMuted dark:text-dark-textMuted'
        >
          {message}
        </Text>
        {[0, 1, 2, 3].map(i => (
          <MotiView
            key={i}
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              type: 'timing',
              duration: 400,
              delay: i * 120,
            }}
          >
            <SkeletonCard />
          </MotiView>
        ))}
      </ScrollView>
    </MotiView>
  );
}

// ============================================================================
// Home Skeleton - Header + horizontal row + vertical list
// ============================================================================

function HomeSkeleton({
  message,
}: {
  message: string;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 500 }}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Header skeleton */}
        <View style={{ paddingHorizontal: 24, paddingTop: 56 }}>
          <Skeleton width="60%" height={28} borderRadius={8} />
          <Skeleton
            width="40%"
            height={14}
            borderRadius={6}
            style={{ marginTop: 8 }}
          />
        </View>

        {/* Search bar skeleton */}
        <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
          <Skeleton width="100%" height={52} borderRadius={16} />
        </View>

        {/* Section title */}
        <View style={{ paddingHorizontal: 24, marginTop: 28 }}>
          <Skeleton width="35%" height={18} borderRadius={6} />
        </View>

        {/* Horizontal card row */}
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 24,
            marginTop: 12,
            gap: 12,
          }}
        >
          {[0, 1, 2, 3].map(i => (
            <MotiView
              key={i}
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: 'timing',
                duration: 400,
                delay: 200 + i * 100,
              }}
            >
              <Skeleton width={128} height={176} borderRadius={12} />
            </MotiView>
          ))}
        </View>

        {/* Section title */}
        <View style={{ paddingHorizontal: 24, marginTop: 28 }}>
          <Skeleton width="45%" height={18} borderRadius={6} />
        </View>

        {/* Vertical list rows */}
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          {[0, 1, 2].map(i => (
            <MotiView
              key={i}
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: 'timing',
                duration: 400,
                delay: 400 + i * 100,
              }}
            >
              <SkeletonRow />
            </MotiView>
          ))}
        </View>

        <Text
          className='mt-4 text-center text-sm text-light-textMuted dark:text-dark-textMuted'
        >
          {message}
        </Text>
      </ScrollView>
    </MotiView>
  );
}
