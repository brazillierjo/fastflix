/**
 * WatchlistItem - Individual item in the watchlist
 * Displays poster, title, providers, and action buttons
 */

import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { WatchlistItem as WatchlistItemType } from '@/types/api';
import { getSquircle, getSmallBorderRadius } from '@/utils/designHelpers';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

interface WatchlistItemProps {
  item: WatchlistItemType;
  onRemove: (itemId: string) => void;
  isRemoving?: boolean;
}

export default function WatchlistItem({
  item,
  onRemove,
  isRemoving = false,
}: WatchlistItemProps) {
  const { t } = useLanguage();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Check if providers are stale (> 24h)
  const isStale = () => {
    if (!item.last_provider_check) return true;
    const lastCheck = new Date(item.last_provider_check);
    const now = new Date();
    const diffHours = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60);
    return diffHours > 24;
  };

  return (
    <View
      style={getSquircle(16)}
      className='mb-3 overflow-hidden bg-light-card dark:bg-dark-card'
    >
      <View className='flex-row'>
        {/* Poster */}
        <View className='relative' style={{ width: 100, height: 150 }}>
          {item.poster_path ? (
            <Image
              source={{
                uri: `https://image.tmdb.org/t/p/w342${item.poster_path}`,
              }}
              style={{ width: '100%', height: '100%' }}
              resizeMode='cover'
            />
          ) : (
            <View className='flex-1 items-center justify-center bg-light-surface dark:bg-dark-surface'>
              <Ionicons
                name='film-outline'
                size={32}
                color={isDark ? '#a3a3a3' : '#737373'}
              />
            </View>
          )}

          {/* Media type badge */}
          <View
            style={getSmallBorderRadius()}
            className='absolute left-2 top-2 bg-black/70 px-2 py-1'
          >
            <Text className='text-xs font-medium text-white'>
              {item.media_type === 'tv' ? 'TV' : 'Film'}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View className='flex-1 p-3'>
          {/* Title */}
          <Text
            className='mb-1 text-base font-semibold text-light-text dark:text-dark-text'
            numberOfLines={2}
          >
            {item.title}
          </Text>

          {/* Added date */}
          <Text className='mb-2 text-xs text-light-muted dark:text-dark-muted'>
            {t('watchlist.addedOn') || 'Added'} {formatDate(item.added_at)}
          </Text>

          {/* Providers */}
          {item.providers && item.providers.length > 0 ? (
            <View className='mb-2'>
              <View className='flex-row flex-wrap gap-1'>
                {item.providers.slice(0, 4).map((provider, idx) => (
                  <View
                    key={`${item.id}-provider-${idx}`}
                    className='rounded-md bg-dark-surface dark:bg-light-surface'
                  >
                    <Image
                      source={{
                        uri: `https://image.tmdb.org/t/p/w92${provider.logo_path}`,
                      }}
                      className='h-7 w-7 rounded-md'
                      resizeMode='contain'
                    />
                  </View>
                ))}
                {item.providers.length > 4 && (
                  <View className='h-7 items-center justify-center rounded-md bg-light-surface px-2 dark:bg-dark-surface'>
                    <Text className='text-xs text-light-muted dark:text-dark-muted'>
                      +{item.providers.length - 4}
                    </Text>
                  </View>
                )}
              </View>
              {isStale() && (
                <View className='mt-1 flex-row items-center gap-1'>
                  <Ionicons name='alert-circle' size={12} color='#f59e0b' />
                  <Text className='text-xs text-amber-500'>
                    {t('watchlist.providersStale') || 'May be outdated'}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View className='mb-2 flex-row items-center gap-1'>
              <Ionicons name='close-circle' size={14} color='#a3a3a3' />
              <Text className='text-xs text-light-muted dark:text-dark-muted'>
                {t('watchlist.notAvailable') || 'Not available for streaming'}
              </Text>
            </View>
          )}

          {/* Remove button */}
          <TouchableOpacity
            onPress={() => onRemove(item.id)}
            disabled={isRemoving}
            className='mt-auto flex-row items-center justify-center gap-1 self-start rounded-lg bg-red-500/10 px-3 py-1.5'
          >
            {isRemoving ? (
              <ActivityIndicator size='small' color='#ef4444' />
            ) : (
              <>
                <Ionicons name='trash-outline' size={14} color='#ef4444' />
                <Text className='text-xs font-medium text-red-500'>
                  {t('watchlist.remove') || 'Remove'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
