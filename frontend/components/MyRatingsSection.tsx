/**
 * MyRatingsSection - "Déjà vus" section for the home screen
 * Shows movies/shows the user has watched, with optional star ratings
 */

import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTasteProfile } from '@/hooks/useRating';
import {
  getCardShadow,
  getSquircle,
  typography,
} from '@/utils/designHelpers';
import { Skeleton } from '@/components/Skeleton';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

function StarDisplay({ rating, size = 10 }: { rating: number; size?: number }) {
  if (rating <= 0) return null;
  return (
    <View className='flex-row gap-0.5'>
      {[1, 2, 3, 4, 5].map((star) => (
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

export default function MyRatingsSection({ delay = 375 }: { delay?: number }) {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { ratedMovies, isLoading } = useTasteProfile();

  if (!isAuthenticated) return null;

  // Most recent first
  const sortedItems = [...ratedMovies].reverse();

  return (
    <MotiView
      from={{ opacity: 0, translateY: 15 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay, type: 'timing', duration: 600 }}
      className='mt-8 px-6'
    >
      <Text
        style={typography.title3}
        className='mb-3 text-light-text dark:text-dark-text'
      >
        {t('ratings.sectionTitle')}
      </Text>

      {/* Empty state */}
      {!isLoading && ratedMovies.length === 0 && (
        <View
          style={[getSquircle(14)]}
          className='flex-row items-center gap-3 border border-dashed border-light-border bg-light-surface/50 px-4 py-4 dark:border-dark-border dark:bg-dark-surface/50'
        >
          <Ionicons name='eye-outline' size={24} color={isDark ? '#525252' : '#a3a3a3'} />
          <Text className='flex-1 text-sm text-light-muted dark:text-dark-muted'>
            {t('ratings.emptyHome')}
          </Text>
        </View>
      )}

      {isLoading ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 }}
        >
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width={160} height={72} borderRadius={12} />
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10 }}
        >
          {sortedItems.map((item, i) => (
            <MotiView
              key={`${item.tmdb_id}-${i}`}
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: delay + i * 50,
                type: 'timing',
                duration: 400,
              }}
            >
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/movie-detail' as never,
                    params: {
                      tmdbId: String(item.tmdb_id),
                      mediaType: item.media_type || 'movie',
                      title: item.title || '',
                      posterPath: '',
                      voteAverage: '0',
                      overview: '',
                      providersJson: '[]',
                      creditsJson: '[]',
                      detailedInfoJson: '{}',
                    },
                  })
                }
                activeOpacity={0.7}
                style={[getSquircle(12), getCardShadow(isDark), { width: 160 }]}
                className='border border-light-border bg-light-surface p-3 dark:border-dark-border dark:bg-dark-surface'
              >
                <Text
                  className='text-sm font-semibold text-light-text dark:text-dark-text'
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
                <View className='mt-2 flex-row items-center gap-2'>
                  {item.rating > 0 ? (
                    <StarDisplay rating={item.rating} size={12} />
                  ) : (
                    <View className='flex-row items-center gap-1'>
                      <Ionicons name='checkmark-circle' size={12} color='#22c55e' />
                      <Text className='text-xs text-green-500'>
                        {t('movieDetail.watchedConfirm')}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </MotiView>
          ))}
        </ScrollView>
      )}
    </MotiView>
  );
}
