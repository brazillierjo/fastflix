/**
 * ForYouSection - Personalized recommendations section for the home screen
 * Shows AI-powered movie/TV recommendations based on user taste profile
 */

import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  getCardShadow,
  getSquircle,
  typography,
} from '@/utils/designHelpers';
import { useQuery } from '@tanstack/react-query';
import { backendAPIService, MovieResult, StreamingProvider } from '@/services/backend-api.service';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import {
  Image,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

const FOR_YOU_QUERY_KEY = ['forYou'];

interface ForYouData {
  recommendations: MovieResult[];
  streamingProviders: { [key: number]: StreamingProvider[] };
}

/**
 * Skeleton loading row placeholder
 */
function SkeletonRow({ isDark }: { isDark: boolean }) {
  return (
    <View
      style={[getSquircle(12), getCardShadow(isDark)]}
      className='flex-row border border-light-border bg-light-surface p-3 dark:border-dark-border dark:bg-dark-surface'
    >
      <View
        style={getSquircle(8)}
        className='h-28 w-20 bg-light-border dark:bg-dark-border'
      />
      <View className='ml-3 flex-1 justify-center'>
        <View className='mb-2 h-4 w-3/4 rounded bg-light-border dark:bg-dark-border' />
        <View className='mb-2 h-3 w-1/2 rounded bg-light-border dark:bg-dark-border' />
        <View className='h-3 w-full rounded bg-light-border dark:bg-dark-border' />
        <View className='mt-1 h-3 w-2/3 rounded bg-light-border dark:bg-dark-border' />
      </View>
    </View>
  );
}

/**
 * ForYouSection component
 * Renders personalized recommendations or sign-in prompt for guests
 */
export default function ForYouSection({ delay = 400 }: { delay?: number }) {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const {
    data,
    isLoading,
  } = useQuery<ForYouData>({
    queryKey: FOR_YOU_QUERY_KEY,
    queryFn: async (): Promise<ForYouData> => {
      const response = await backendAPIService.getForYou();
      if (response.success && response.data) {
        return response.data;
      }
      return { recommendations: [], streamingProviders: {} };
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });

  const recommendations = data?.recommendations ?? [];
  const streamingProviders = data?.streamingProviders ?? {};

  const navigateToDetail = (item: MovieResult) => {
    const itemProviders = streamingProviders[item.tmdb_id] || [];

    router.push({
      pathname: '/movie-detail' as never,
      params: {
        tmdbId: String(item.tmdb_id),
        mediaType: item.media_type,
        title: item.title || '',
        posterPath: item.poster_path || '',
        voteAverage: String(item.vote_average || 0),
        overview: item.overview || '',
        providersJson: JSON.stringify(itemProviders),
        creditsJson: JSON.stringify([]),
        detailedInfoJson: JSON.stringify({}),
      },
    });
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 15 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay, type: 'timing', duration: 600 }}
      className='mt-8 px-6'
    >
      <Text
        style={typography.title3}
        className='mb-1 text-light-text dark:text-dark-text'
      >
        {t('forYou.title')}
      </Text>
      <Text className='mb-3 text-sm text-light-muted dark:text-dark-muted'>
        {t('forYou.subtitle')}
      </Text>

      {/* Guest state: sign in prompt */}
      {!isAuthenticated && (
        <View
          style={[getSquircle(16), getCardShadow(isDark)]}
          className='items-center justify-center border border-light-border bg-light-surface px-6 py-8 dark:border-dark-border dark:bg-dark-surface'
        >
          <View className='mb-3 overflow-hidden opacity-40'>
            <View className='flex-row gap-2'>
              {[1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={getSquircle(8)}
                  className='h-28 w-20 bg-light-border dark:bg-dark-border'
                />
              ))}
            </View>
          </View>
          <Ionicons
            name='lock-closed-outline'
            size={24}
            color={isDark ? '#a3a3a3' : '#737373'}
          />
          <Text className='mt-2 text-center text-sm font-medium text-light-text dark:text-dark-text'>
            {t('forYou.signInPrompt')}
          </Text>
        </View>
      )}

      {/* Loading state */}
      {isAuthenticated && isLoading && (
        <View className='gap-3'>
          <Text className='text-xs text-light-muted dark:text-dark-muted'>
            {t('forYou.loading')}
          </Text>
          {[1, 2, 3].map((i) => (
            <MotiView
              key={i}
              from={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={{
                type: 'timing',
                duration: 800,
                loop: true,
              }}
            >
              <SkeletonRow isDark={isDark} />
            </MotiView>
          ))}
        </View>
      )}

      {/* Empty state */}
      {isAuthenticated && !isLoading && recommendations.length === 0 && (
        <View
          style={[getSquircle(16), getCardShadow(isDark)]}
          className='items-center justify-center border border-light-border bg-light-surface px-6 py-8 dark:border-dark-border dark:bg-dark-surface'
        >
          <Ionicons
            name='heart-outline'
            size={32}
            color={isDark ? '#525252' : '#a3a3a3'}
          />
          <Text className='mt-3 text-center text-sm text-light-muted dark:text-dark-muted'>
            {t('forYou.empty')}
          </Text>
        </View>
      )}

      {/* Recommendations list */}
      {isAuthenticated && !isLoading && recommendations.length > 0 && (
        <View className='gap-3'>
          {recommendations.slice(0, 10).map((item, i) => (
            <MotiView
              key={item.tmdb_id}
              from={{ opacity: 0, translateX: -10 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{
                delay: delay + i * 60,
                type: 'timing',
                duration: 400,
              }}
            >
              <TouchableOpacity
                onPress={() => navigateToDetail(item)}
                activeOpacity={0.7}
                style={[getSquircle(12), getCardShadow(isDark)]}
                className='flex-row border border-light-border bg-light-surface p-3 dark:border-dark-border dark:bg-dark-surface'
              >
                {/* Poster */}
                {item.poster_path ? (
                  <View style={getSquircle(8)} className='h-28 w-20 overflow-hidden'>
                    <Image
                      source={{
                        uri: `${TMDB_IMAGE_BASE}/w185${item.poster_path}`,
                      }}
                      className='h-full w-full'
                      resizeMode='cover'
                    />
                  </View>
                ) : (
                  <View
                    style={getSquircle(8)}
                    className='h-28 w-20 items-center justify-center bg-light-border dark:bg-dark-border'
                  >
                    <Ionicons
                      name='image-outline'
                      size={24}
                      color={isDark ? '#404040' : '#d4d4d4'}
                    />
                  </View>
                )}

                {/* Content */}
                <View className='ml-3 flex-1 justify-center'>
                  <Text
                    className='text-base font-bold text-light-text dark:text-dark-text'
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>

                  {/* Rating + Media type */}
                  <View className='mt-1 flex-row items-center gap-2'>
                    {item.vote_average > 0 && (
                      <View className='flex-row items-center gap-1'>
                        <Ionicons name='star' size={12} color='#fbbf24' />
                        <Text className='text-xs font-medium text-light-muted dark:text-dark-muted'>
                          {item.vote_average.toFixed(1)}
                        </Text>
                      </View>
                    )}
                    <View
                      style={getSquircle(4)}
                      className='bg-light-border px-1.5 py-0.5 dark:bg-dark-border'
                    >
                      <Text className='text-[10px] font-medium uppercase text-light-muted dark:text-dark-muted'>
                        {item.media_type === 'tv' ? 'TV' : 'Film'}
                      </Text>
                    </View>
                  </View>

                  {/* Overview snippet */}
                  {item.overview ? (
                    <Text
                      className='mt-1 text-xs leading-4 text-light-muted dark:text-dark-muted'
                      numberOfLines={2}
                    >
                      {item.overview}
                    </Text>
                  ) : null}
                </View>

                {/* Chevron */}
                <View className='justify-center pl-1'>
                  <Ionicons
                    name='chevron-forward'
                    size={16}
                    color={isDark ? '#525252' : '#a3a3a3'}
                  />
                </View>
              </TouchableOpacity>
            </MotiView>
          ))}
        </View>
      )}
    </MotiView>
  );
}
