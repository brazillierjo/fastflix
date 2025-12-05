/**
 * WatchlistBottomSheet - Bottom sheet to display user's watchlist
 * Shows saved movies/TV shows with filters and actions
 */

import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWatchlist } from '@/hooks/useWatchlist';
import { cn } from '@/utils/cn';
import { getButtonBorderRadius } from '@/utils/designHelpers';
import * as Sentry from '@sentry/react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WatchlistItem from './WatchlistItem';

type FilterType = 'all' | 'movie' | 'tv';

interface WatchlistBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function WatchlistBottomSheet({
  visible,
  onClose,
}: WatchlistBottomSheetProps) {
  const { t } = useLanguage();
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

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
    >
      <SafeAreaView className='flex-1 bg-light-background dark:bg-dark-background'>
        {/* Header */}
        <View className='flex-row items-center justify-between border-b border-light-border px-4 py-3 dark:border-dark-border'>
          <TouchableOpacity onPress={onClose}>
            <Text className='text-base text-light-muted dark:text-dark-muted'>
              {t('common.close') || 'Close'}
            </Text>
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
          >
            {isRefreshingProviders ? (
              <ActivityIndicator size='small' color='#E50914' />
            ) : (
              <Ionicons name='refresh' size={20} color='#E50914' />
            )}
          </TouchableOpacity>
        </View>

        {/* Filter tabs */}
        <View className='flex-row gap-2 px-4 py-3'>
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
        </View>

        {/* Content */}
        {isLoading ? (
          <View className='flex-1 items-center justify-center'>
            <ActivityIndicator size='large' color='#E50914' />
          </View>
        ) : items.length === 0 ? (
          <View className='flex-1 items-center justify-center px-8'>
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
          </View>
        ) : (
          <ScrollView
            className='flex-1 px-4'
            contentContainerStyle={{ paddingBottom: 20 }}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={handleRefresh}
                tintColor='#E50914'
              />
            }
          >
            {items.map(item => (
              <WatchlistItem
                key={item.id}
                item={item}
                onRemove={handleRemove}
                isRemoving={removingItemId === item.id}
              />
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}
