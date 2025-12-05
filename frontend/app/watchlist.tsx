/**
 * Watchlist Screen - Full screen view of user's watchlist
 * Accessible from Profile section
 */

import { Ionicons } from '@expo/vector-icons';
import WatchlistItem from '@/components/WatchlistItem';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWatchlist } from '@/hooks/useWatchlist';
import { cn } from '@/utils/cn';
import { getButtonBorderRadius } from '@/utils/designHelpers';
import * as Sentry from '@sentry/react-native';
import { Redirect, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type FilterType = 'all' | 'movie' | 'tv';

export default function WatchlistScreen() {
  const { t } = useLanguage();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [filterType, setFilterType] = useState<FilterType>('all');
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

  const {
    items,
    count,
    isLoading,
    isRefreshingProviders,
    removeFromWatchlistAsync,
    refreshProviders,
    refetch,
  } = useWatchlist(filterType === 'all' ? undefined : filterType);

  const handleRemove = async (itemId: string) => {
    setRemovingItemId(itemId);
    try {
      await removeFromWatchlistAsync(itemId);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { context: 'watchlist-remove' },
        extra: { itemId },
      });
    } finally {
      setRemovingItemId(null);
    }
  };

  const handleRefresh = () => {
    refetch();
    refreshProviders();
  };

  // Show loading while checking authentication
  if (isAuthLoading) {
    return (
      <SafeAreaView className='flex-1 items-center justify-center bg-light-background dark:bg-dark-background'>
        <ActivityIndicator size='large' color='#E50914' />
      </SafeAreaView>
    );
  }

  // Redirect to auth screen if not authenticated
  if (!isAuthenticated) {
    return <Redirect href='/auth' />;
  }

  return (
    <SafeAreaView className='flex-1 bg-light-background dark:bg-dark-background'>
      {/* Header */}
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
        className='flex-row items-center justify-between border-b border-light-border px-4 py-3 dark:border-dark-border'
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name='chevron-back'
            size={28}
            color={isDark ? '#ffffff' : '#0f172a'}
          />
        </TouchableOpacity>
        <View className='flex-row items-center gap-2'>
          <Ionicons name='bookmark' size={20} color='#E50914' />
          <Text className='text-lg font-semibold text-light-text dark:text-dark-text'>
            {t('watchlist.title') || 'Watchlist'}
          </Text>
          {count > 0 && (
            <View className='rounded-full bg-netflix-500 px-2 py-0.5'>
              <Text className='text-xs font-bold text-white'>{count}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={handleRefresh}
          disabled={isRefreshingProviders}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isRefreshingProviders ? (
            <ActivityIndicator size='small' color='#E50914' />
          ) : (
            <Ionicons name='refresh' size={24} color='#E50914' />
          )}
        </TouchableOpacity>
      </MotiView>

      {/* Filter tabs */}
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 100, type: 'timing', duration: 400 }}
        className='flex-row gap-2 px-4 py-3'
      >
        {[
          { key: 'all', label: t('filters.all') || 'All' },
          { key: 'movie', label: t('filters.moviesOnly') || 'Movies' },
          { key: 'tv', label: t('filters.tvShowsOnly') || 'TV Shows' },
        ].map(option => (
          <TouchableOpacity
            key={option.key}
            onPress={() => setFilterType(option.key as FilterType)}
            style={getButtonBorderRadius()}
            className={cn(
              'flex-1 items-center border-2 py-2',
              filterType === option.key
                ? 'border-netflix-500 bg-netflix-500/10'
                : 'border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface'
            )}
          >
            <Text
              className={cn(
                'text-sm font-medium',
                filterType === option.key
                  ? 'text-netflix-500'
                  : 'text-light-text dark:text-dark-text'
              )}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </MotiView>

      {/* Content */}
      {isLoading ? (
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' color='#E50914' />
        </View>
      ) : items.length === 0 ? (
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 200, type: 'timing', duration: 400 }}
          className='flex-1 items-center justify-center px-8'
        >
          <Ionicons
            name='bookmark-outline'
            size={64}
            color='#a3a3a3'
            style={{ marginBottom: 16 }}
          />
          <Text className='mb-2 text-center text-lg font-semibold text-light-text dark:text-dark-text'>
            {t('watchlist.empty') || 'Your watchlist is empty'}
          </Text>
          <Text className='text-center text-sm text-light-muted dark:text-dark-muted'>
            {t('watchlist.emptyHint') ||
              'Save movies and TV shows to watch later by tapping the bookmark icon'}
          </Text>
        </MotiView>
      ) : (
        <ScrollView
          className='flex-1 px-4'
          contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              tintColor='#E50914'
            />
          }
        >
          {items.map((item, index) => (
            <MotiView
              key={item.id}
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: index * 50, type: 'timing', duration: 300 }}
            >
              <WatchlistItem
                item={item}
                onRemove={handleRemove}
                isRemoving={removingItemId === item.id}
              />
            </MotiView>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
