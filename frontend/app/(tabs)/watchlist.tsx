/**
 * Watchlist Screen - Tab view of user's watchlist
 */

import { Ionicons } from '@expo/vector-icons';
import AuthGate from '@/components/AuthGate';
import WatchlistItem from '@/components/WatchlistItem';
import type { WatchlistItem as _WatchlistItemType } from '@/types/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useAvailabilityCheck } from '@/hooks/useAvailabilityCheck';
import { cn } from '@/utils/cn';
import { getButtonBorderRadius, getSquircle } from '@/utils/designHelpers';
import * as Sentry from '@sentry/react-native';
import { MotiView } from 'moti';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Share,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { trackScreenView, trackWatchlistShare, trackWatchlistRefresh, trackPullToRefresh } from '@/services/analytics';

type FilterType = 'all' | 'movie' | 'tv';
type ViewMode = 'toWatch' | 'watched' | 'all';

const EMPTY_PROVIDERS: string[] = [];

export default function WatchlistScreen() {
  const { t } = useLanguage();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [filterType, setFilterType] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('toWatch');
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [dismissedChanges, setDismissedChanges] = useState<Set<string>>(new Set());
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => { trackScreenView('watchlist'); }, []);

  const { changes: availabilityChanges, isChecking: isCheckingAvailability } =
    useAvailabilityCheck();

  const {
    items,
    count,
    isLoading,
    isRefreshingProviders,
    removeFromWatchlistAsync,
    refreshProviders,
    refetch,
  } = useWatchlist(filterType === 'all' ? undefined : filterType);

  // Filter items by view mode (to watch / watched / all)
  const filteredItems = useMemo(() => {
    if (viewMode === 'all') return items;
    if (viewMode === 'watched') {
      return items.filter(item => item.watched === 1);
    }
    // toWatch: items not watched
    return items.filter(item => !item.watched || item.watched === 0);
  }, [items, viewMode]);

  // Build a map of new provider names per watchlist item ID
  const newProvidersByItem = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const change of availabilityChanges) {
      if (change.newProviders.length > 0) {
        map[change.watchlistId] = change.newProviders.map((p) => p.name);
      }
    }
    return map;
  }, [availabilityChanges]);

  // Visible (non-dismissed) availability changes with new providers
  const visibleChanges = useMemo(() => {
    return availabilityChanges.filter(
      (c) => c.newProviders.length > 0 && !dismissedChanges.has(c.watchlistId)
    );
  }, [availabilityChanges, dismissedChanges]);

  const dismissChange = useCallback((watchlistId: string) => {
    setDismissedChanges((prev) => new Set(prev).add(watchlistId));
  }, []);

  const handleRemove = useCallback(async (itemId: string) => {
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
  }, [removeFromWatchlistAsync]);

  const handleRefresh = useCallback(() => {
    trackWatchlistRefresh();
    trackPullToRefresh('watchlist');
    refetch();
    refreshProviders();
  }, [refetch, refreshProviders]);

  const handleShare = useCallback(async () => {
    // Only share "to watch" items (not watched ones)
    const toWatchItems = items.filter(item => {
      return !item.watched || item.watched === 0;
    });

    if (toWatchItems.length === 0) return;

    const title = t('watchlist.shareTitle') || 'My FastFlix Watchlist';
    const footer = t('watchlist.shareFooter') || 'Discover what to watch with FastFlix!';

    const itemLines = toWatchItems
      .map((item, index) => `${index + 1}. ${item.title}`)
      .join('\n');

    const message = `\uD83C\uDFAC ${title}\n\n${itemLines}\n\n${footer}`;

    try {
      trackWatchlistShare(toWatchItems.length);
      await Share.share({ message });
    } catch {
      // User cancelled or share failed silently
    }
  }, [items, t]);

  // Show loading while checking authentication
  if (isAuthLoading) {
    return (
      <SafeAreaView className='flex-1 items-center justify-center bg-light-background dark:bg-dark-background'>
        <ActivityIndicator size='large' color='#E50914' />
      </SafeAreaView>
    );
  }

  // Guest mode: show sign-in prompt
  if (!isAuthenticated) {
    return (
      <SafeAreaView className='flex-1 bg-light-background dark:bg-dark-background'>
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 500 }}
          className='flex-1 items-center justify-center px-8'
        >
          <Ionicons
            name='bookmark-outline'
            size={64}
            color='#a3a3a3'
            style={{ marginBottom: 16 }}
          />
          <Text className='mb-2 text-center text-lg font-semibold text-light-text dark:text-dark-text'>
            {t('watchlist.signInTitle') || 'Sign in to use your watchlist'}
          </Text>
          <Text className='mb-6 text-center text-sm text-light-muted dark:text-dark-muted'>
            {t('watchlist.signInHint') ||
              'Save movies and TV shows to watch later. Your watchlist syncs across all your devices.'}
          </Text>
          <TouchableOpacity
            onPress={() => setShowAuthGate(true)}
            style={getSquircle(12)}
            className='bg-netflix-500 px-8 py-3'
          >
            <Text className='text-base font-semibold text-white'>
              {t('auth.signIn') || 'Sign In'}
            </Text>
          </TouchableOpacity>
        </MotiView>

        <AuthGate
          visible={showAuthGate}
          onClose={() => setShowAuthGate(false)}
        />
      </SafeAreaView>
    );
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
        <View className='flex-row items-center gap-3'>
          <TouchableOpacity
            onPress={handleShare}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel='Share watchlist'
            accessibilityRole='button'
          >
            <Ionicons name='share-outline' size={22} color='#E50914' />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleRefresh}
            disabled={isRefreshingProviders}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel='Refresh providers'
            accessibilityRole='button'
          >
            {isRefreshingProviders ? (
              <ActivityIndicator size='small' color='#E50914' />
            ) : (
              <Ionicons name='refresh' size={24} color='#E50914' />
            )}
          </TouchableOpacity>
        </View>
      </MotiView>

      {/* View mode toggle (To Watch / Watched / All) */}
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 50, type: 'timing', duration: 400 }}
        className='flex-row gap-2 px-4 pt-3'
      >
        {[
          {
            key: 'toWatch',
            label: t('watchlist.toWatch') || 'To Watch',
            icon: 'eye-outline' as const,
          },
          {
            key: 'watched',
            label: t('watchlist.watched') || 'Watched',
            icon: 'checkmark-circle-outline' as const,
          },
          {
            key: 'all',
            label: t('filters.all') || 'All',
            icon: 'list-outline' as const,
          },
        ].map(option => (
          <TouchableOpacity
            key={option.key}
            onPress={() => setViewMode(option.key as ViewMode)}
            style={getButtonBorderRadius()}
            accessibilityLabel={option.label}
            accessibilityRole='tab'
            accessibilityState={{ selected: viewMode === option.key }}
            className={cn(
              'flex-1 flex-row items-center justify-center gap-1 border-2 py-2',
              viewMode === option.key
                ? 'border-netflix-500 bg-netflix-500/10'
                : 'border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface'
            )}
          >
            <Ionicons
              name={option.icon}
              size={14}
              color={viewMode === option.key ? '#E50914' : '#a3a3a3'}
            />
            <Text
              className={cn(
                'text-sm font-medium',
                viewMode === option.key
                  ? 'text-netflix-500'
                  : 'text-light-text dark:text-dark-text'
              )}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </MotiView>

      {/* Content type filter tabs */}
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
            accessibilityLabel={`Filter: ${option.label}`}
            accessibilityRole='tab'
            accessibilityState={{ selected: filterType === option.key }}
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

      {/* Content - filtered by viewMode */}
      {isLoading ? (
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' color='#E50914' />
        </View>
      ) : filteredItems.length === 0 ? (
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
        <FlatList
          ref={flatListRef}
          className='flex-1 px-4'
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              tintColor='#E50914'
            />
          }
          data={filteredItems}
          keyExtractor={item => item.id}
          ListHeaderComponent={
            <>
              {/* Availability change banners */}
              {visibleChanges.map((change) => (
                <MotiView
                  key={`change-${change.watchlistId}`}
                  from={{ opacity: 0, translateX: -50 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'timing', duration: 400 }}
                  className='mb-3 flex-row items-center rounded-xl bg-green-500/10 border border-green-500/30 px-3 py-2.5'
                >
                  <Text className='mr-2 text-base'>🎉</Text>
                  <Text className='flex-1 text-sm font-medium text-green-700 dark:text-green-400' numberOfLines={2}>
                    {(t('availability.newProvider') || 'Now on {{provider}}!').replace(
                      '{{provider}}',
                      change.newProviders[0]?.name || ''
                    )}{' '}
                    <Text className='font-normal text-light-text dark:text-dark-text'>
                      {change.title}
                    </Text>
                  </Text>
                  <TouchableOpacity
                    onPress={() => dismissChange(change.watchlistId)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className='ml-2'
                  >
                    <Ionicons
                      name='close-circle'
                      size={20}
                      color={isDark ? '#6ee7b7' : '#16a34a'}
                    />
                  </TouchableOpacity>
                </MotiView>
              ))}
              {isCheckingAvailability && visibleChanges.length === 0 && (
                <MotiView
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className='mb-3 flex-row items-center justify-center gap-2 rounded-xl bg-light-surface px-3 py-2 dark:bg-dark-surface'
                >
                  <ActivityIndicator size='small' color='#a3a3a3' />
                  <Text className='text-xs text-light-muted dark:text-dark-muted'>
                    {t('availability.checkingProviders') || 'Checking availability...'}
                  </Text>
                </MotiView>
              )}
            </>
          }
          renderItem={({ item }) => (
            <WatchlistItem
              item={item}
              onRemove={handleRemove}
              isRemoving={removingItemId === item.id}
              newProviderNames={newProvidersByItem[item.id] || EMPTY_PROVIDERS}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
