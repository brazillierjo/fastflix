/**
 * WatchlistItem - Individual item in the watchlist
 * Displays poster, title, providers, and action buttons
 * Expandable to show more details and TMDB link
 */

import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { WatchlistItem as WatchlistItemType } from '@/types/api';
import { getSquircle, getSmallBorderRadius } from '@/utils/designHelpers';
import { MotiView } from 'moti';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
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
  const [isExpanded, setIsExpanded] = useState(false);

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

  // Open TMDB page
  const openTMDB = () => {
    const tmdbUrl =
      item.media_type === 'tv'
        ? `https://www.themoviedb.org/tv/${item.tmdb_id}`
        : `https://www.themoviedb.org/movie/${item.tmdb_id}`;
    Linking.openURL(tmdbUrl);
  };

  // Get availability type badge info
  const getAvailabilityBadge = (availabilityType?: string) => {
    switch (availabilityType) {
      case 'flatrate':
        return {
          label: t('availability.subscription') || 'Subscription',
          bgColor: 'bg-green-500/20',
          textColor: 'text-green-500',
          icon: 'checkmark-circle' as const,
          iconColor: '#22c55e',
        };
      case 'rent':
        return {
          label: t('availability.rent') || 'Rent',
          bgColor: 'bg-blue-500/20',
          textColor: 'text-blue-500',
          icon: 'time' as const,
          iconColor: '#3b82f6',
        };
      case 'buy':
        return {
          label: t('availability.buy') || 'Buy',
          bgColor: 'bg-amber-500/20',
          textColor: 'text-amber-500',
          icon: 'cart' as const,
          iconColor: '#f59e0b',
        };
      case 'ads':
        return {
          label: t('availability.ads') || 'Free (Ads)',
          bgColor: 'bg-purple-500/20',
          textColor: 'text-purple-500',
          icon: 'play-circle' as const,
          iconColor: '#a855f7',
        };
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
      onPress={() => setIsExpanded(!isExpanded)}
      activeOpacity={0.8}
    >
      <MotiView
        animate={{
          scale: isExpanded ? 1.02 : 1,
        }}
        transition={{
          type: 'timing',
          duration: 200,
        }}
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

            {/* Expand indicator */}
            <View className='flex-row items-center gap-1'>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={isDark ? '#a3a3a3' : '#737373'}
              />
              <Text className='text-xs text-light-muted dark:text-dark-muted'>
                {isExpanded
                  ? t('watchlist.showLess') || 'Show less'
                  : t('watchlist.showMore') || 'Show more'}
              </Text>
            </View>
          </View>
        </View>

        {/* Expanded content */}
        {isExpanded && (
          <MotiView
            from={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{
              type: 'timing',
              duration: 200,
            }}
            className='border-t border-light-border px-4 py-3 dark:border-dark-border'
          >
            {/* Providers with details */}
            {item.providers && item.providers.length > 0 && (
              <View className='mb-3'>
                <Text className='mb-2 text-xs font-semibold uppercase text-light-muted dark:text-dark-muted'>
                  {t('movies.streamingAvailability') || 'Streaming Availability'}
                </Text>
                <View className='flex-row flex-wrap gap-2'>
                  {item.providers.map((provider, idx) => {
                    const badge = getAvailabilityBadge(provider.availability_type);
                    return (
                      <View
                        key={`${item.id}-provider-detail-${idx}`}
                        className='flex-row items-center gap-2 rounded-lg bg-light-surface p-2 dark:bg-dark-surface'
                      >
                        <Image
                          source={{
                            uri: `https://image.tmdb.org/t/p/w92${provider.logo_path}`,
                          }}
                          className='h-8 w-8 rounded-md'
                          resizeMode='contain'
                        />
                        <View>
                          <Text
                            className='text-xs font-medium text-light-text dark:text-dark-text'
                            numberOfLines={1}
                          >
                            {provider.provider_name}
                          </Text>
                          {badge && (
                            <View className='flex-row items-center gap-1'>
                              <Ionicons
                                name={badge.icon}
                                size={10}
                                color={badge.iconColor}
                              />
                              <Text className={`text-[10px] ${badge.textColor}`}>
                                {badge.label}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View className='flex-row gap-2'>
              {/* TMDB Button */}
              <TouchableOpacity
                onPress={openTMDB}
                className='flex-1 flex-row items-center justify-center gap-2 rounded-xl border-2 border-light-border bg-light-surface px-4 py-3 dark:border-dark-border dark:bg-dark-surface'
              >
                <Ionicons
                  name='information-circle-outline'
                  size={20}
                  color={isDark ? '#a3a3a3' : '#737373'}
                />
                <Text className='text-sm font-semibold text-light-text dark:text-dark-text'>
                  {t('movies.viewOnTMDB') || 'View on TMDB'}
                </Text>
              </TouchableOpacity>

              {/* Remove button */}
              <TouchableOpacity
                onPress={() => onRemove(item.id)}
                disabled={isRemoving}
                className='flex-row items-center justify-center gap-2 rounded-xl border-2 border-red-500/30 bg-red-500/10 px-4 py-3'
              >
                {isRemoving ? (
                  <ActivityIndicator size='small' color='#ef4444' />
                ) : (
                  <>
                    <Ionicons name='trash-outline' size={20} color='#ef4444' />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </MotiView>
        )}
      </MotiView>
    </TouchableOpacity>
  );
}
