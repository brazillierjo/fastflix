/**
 * MyRatingsSection - "Déjà vus" section for the home screen
 * Shows movies/shows the user has watched, with poster + optional star ratings
 * Limited to 7 items with "See more" button linking to full list
 */

import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTasteProfile, useDeleteRating } from '@/hooks/useRating';
import { getCardShadow, getSquircle, typography } from '@/utils/designHelpers';
import { Skeleton } from '@/components/Skeleton';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
const MAX_ITEMS = 7;

function StarDisplay({ rating, size = 10 }: { rating: number; size?: number }) {
  if (rating <= 0) return null;
  return (
    <View className='flex-row gap-0.5'>
      {[1, 2, 3, 4, 5].map(star => (
        <Ionicons
          key={star}
          name={star <= rating ? 'star' : 'star-outline'}
          size={size}
          color={star <= rating ? '#E50914' : '#525252'}
        />
      ))}
    </View>
  );
}

export default function MyRatingsSection() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { ratedMovies, isLoading } = useTasteProfile();
  const { deleteRating } = useDeleteRating();

  if (!isAuthenticated) return null;

  // Most recent first
  const sortedItems = [...ratedMovies].reverse();
  const displayItems = sortedItems.slice(0, MAX_ITEMS);
  const hasMore = sortedItems.length > MAX_ITEMS;

  return (
    <View className='mt-8'>
      <View className='mb-3 flex-row items-center justify-between px-6'>
        <View className='flex-row items-center gap-2'>
          <Ionicons name='checkmark-circle' size={18} color='#E50914' />
          <Text
            style={typography.title3}
            className='text-light-text dark:text-dark-text'
          >
            {t('ratings.sectionTitle')}
          </Text>
        </View>
        {ratedMovies.length > 0 && (
          <TouchableOpacity
            onPress={() => router.push('/watched-list' as never)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text className='text-sm font-medium text-netflix-500'>
              {t('common.seeAll') || 'See all'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Empty state */}
      {!isLoading && ratedMovies.length === 0 && (
        <View className='px-6'>
          <View
            style={[getSquircle(14)]}
            className='flex-row items-center gap-3 border border-dashed border-light-border bg-light-surface/50 px-4 py-4 dark:border-dark-border dark:bg-dark-surface/50'
          >
            <Ionicons
              name='eye-outline'
              size={24}
              color={isDark ? '#525252' : '#a3a3a3'}
            />
            <Text className='flex-1 text-sm text-light-muted dark:text-dark-muted'>
              {t('ratings.emptyHome')}
            </Text>
          </View>
        </View>
      )}

      {isLoading ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
        >
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} width={130} height={195} borderRadius={12} />
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
        >
          {displayItems.map((item, i) => (
            <View key={`${item.tmdb_id}-${i}`}>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/movie-detail' as never,
                    params: {
                      tmdbId: String(item.tmdb_id),
                      mediaType: item.media_type || 'movie',
                      title: item.title || '',
                      posterPath: item.poster_path || '',
                      voteAverage: '0',
                      overview: '',
                      providersJson: '[]',
                      creditsJson: '[]',
                      detailedInfoJson: '{}',
                    },
                  })
                }
                onLongPress={() => {
                  Alert.alert(
                    t('ratings.removeTitle'),
                    t('ratings.removeMessage'),
                    [
                      { text: t('common.cancel'), style: 'cancel' },
                      {
                        text: t('common.remove'),
                        style: 'destructive',
                        onPress: () => deleteRating(item.tmdb_id),
                      },
                    ]
                  );
                }}
                activeOpacity={0.7}
                style={{ width: 130 }}
              >
                <View
                  style={[getSquircle(12), getCardShadow(isDark)]}
                  className='h-[195px] overflow-hidden border border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface'
                >
                  {item.poster_path ? (
                    <Image
                      source={{
                        uri: `${TMDB_IMAGE_BASE}/w342${item.poster_path}`,
                      }}
                      className='h-full w-full'
                      resizeMode='cover'
                    />
                  ) : (
                    <View className='flex-1 items-center justify-center'>
                      <Ionicons
                        name='film-outline'
                        size={28}
                        color={isDark ? '#404040' : '#d4d4d4'}
                      />
                    </View>
                  )}
                  {/* Rating badge */}
                  {item.rating > 0 ? (
                    <View className='absolute bottom-1.5 left-1.5 flex-row items-center gap-0.5 rounded-full bg-black/70 px-1.5 py-0.5'>
                      <StarDisplay rating={item.rating} size={8} />
                    </View>
                  ) : (
                    <View className='absolute right-1.5 top-1.5 rounded-full bg-green-500/90 p-1'>
                      <Ionicons name='checkmark' size={10} color='#fff' />
                    </View>
                  )}
                </View>
                <Text
                  className='mt-1.5 text-xs font-medium text-light-text dark:text-dark-text'
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* See more button */}
          {hasMore && (
            <TouchableOpacity
              onPress={() => router.push('/watched-list' as never)}
              activeOpacity={0.7}
              style={{ width: 130 }}
              className='items-center justify-center'
            >
              <View
                style={[getSquircle(12)]}
                className='h-[195px] w-full items-center justify-center border border-dashed border-light-border bg-light-surface/50 dark:border-dark-border dark:bg-dark-surface/50'
              >
                <Ionicons
                  name='chevron-forward-circle-outline'
                  size={32}
                  color={isDark ? '#525252' : '#a3a3a3'}
                />
                <Text className='mt-2 text-xs font-medium text-light-muted dark:text-dark-muted'>
                  {t('common.seeMore')}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}
