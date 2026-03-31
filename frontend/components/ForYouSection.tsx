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
import { MotiView } from 'moti';
import { useQuery } from '@tanstack/react-query';
import { backendAPIService, MovieResult, StreamingProvider } from '@/services/backend-api.service';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
  hasProfile?: boolean;
}

/**
 * AI loading animation with pulsing sparkle and status text
 */
function ForYouAILoading({ isDark, t }: { isDark: boolean; t: (key: string) => string }) {
  return (
    <View
      style={[getSquircle(16), getCardShadow(isDark)]}
      className='items-center justify-center border border-netflix-500/20 bg-netflix-500/5 px-6 py-10 dark:bg-netflix-500/10'
    >
      <MotiView
        from={{ scale: 0.8, opacity: 0.4 }}
        animate={{ scale: 1.2, opacity: 1 }}
        transition={{
          type: 'timing',
          duration: 1200,
          loop: true,
        }}
      >
        <Ionicons name='sparkles' size={36} color='#E50914' />
      </MotiView>
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 600, delay: 300 }}
      >
        <Text className='mt-4 text-center text-sm font-semibold text-light-text dark:text-dark-text'>
          {t('forYou.loading')}
        </Text>
        <Text className='mt-1 text-center text-xs text-light-muted dark:text-dark-muted'>
          {t('forYou.loadingSubtitle')}
        </Text>
      </MotiView>
    </View>
  );
}

/**
 * ForYouSection component
 * Renders personalized recommendations or sign-in prompt for guests
 */
export default function ForYouSection() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { language, country } = useLanguage();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'movie' | 'tv'>('movie');

  const tmdbLanguage = language?.includes('-') ? language : `${language || 'en'}-${(country || 'US').toUpperCase()}`;
  const tmdbCountry = (country || 'US').toUpperCase();

  const {
    data,
    isLoading,
  } = useQuery<ForYouData>({
    queryKey: [FOR_YOU_QUERY_KEY, tmdbLanguage, tmdbCountry],
    queryFn: async (): Promise<ForYouData> => {
      const response = await backendAPIService.getForYou({
        language: tmdbLanguage,
        country: tmdbCountry,
      });
      if (response.success && response.data) {
        return response.data;
      }
      return { recommendations: [], streamingProviders: {}, hasProfile: false };
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  const allRecommendations = data?.recommendations ?? [];
  const streamingProviders = data?.streamingProviders ?? {};
  const hasProfile = data?.hasProfile ?? false;
  const filteredByTab = allRecommendations.filter(r => r.media_type === activeTab);
  // Show filtered results if available, otherwise show all to avoid empty state
  const recommendations = hasProfile
    ? (filteredByTab.length > 0 ? filteredByTab : allRecommendations)
    : [];

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
    <View
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

      {/* Movies / TV toggle */}
      {isAuthenticated && (
        <View className='mb-3 flex-row gap-2'>
          <TouchableOpacity
            onPress={() => { setActiveTab('movie'); setExpanded(false); }}
            style={getSquircle(10)}
            className={`px-4 py-1.5 ${activeTab === 'movie' ? 'bg-netflix-500' : isDark ? 'bg-white/10' : 'bg-black/5'}`}
          >
            <Text className={`text-sm font-medium ${activeTab === 'movie' ? 'text-white' : 'text-light-text dark:text-dark-text'}`}>
              {t('filters.moviesOnly') || 'Movies'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setActiveTab('tv'); setExpanded(false); }}
            style={getSquircle(10)}
            className={`px-4 py-1.5 ${activeTab === 'tv' ? 'bg-netflix-500' : isDark ? 'bg-white/10' : 'bg-black/5'}`}
          >
            <Text className={`text-sm font-medium ${activeTab === 'tv' ? 'text-white' : 'text-light-text dark:text-dark-text'}`}>
              {t('filters.tvShowsOnly') || 'TV Shows'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

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
        <ForYouAILoading isDark={isDark} t={t} />
      )}

      {/* Empty state with actionable CTA */}
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
          <TouchableOpacity
            onPress={() => router.push('/search' as never)}
            style={getSquircle(10)}
            className='mt-4 bg-netflix-500 px-5 py-2.5'
          >
            <Text className='text-sm font-semibold text-white'>
              {t('forYou.discover') || 'Discover movies'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Recommendations list */}
      {isAuthenticated && !isLoading && recommendations.length > 0 && (
        <View className='gap-3'>
          {recommendations.slice(0, expanded ? 15 : 3).map((item, _i) => (
            <View
              key={item.tmdb_id}
            >
              <TouchableOpacity
                onPress={() => navigateToDetail(item)}
                activeOpacity={0.7}
                style={[getSquircle(12), getCardShadow(isDark)]}
                className='overflow-hidden border border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface'
              >
                <View className='flex-row p-3'>
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
                          <Text className='text-xs font-medium text-light-textSecondary dark:text-dark-textSecondary'>
                            {item.vote_average.toFixed(1)}
                          </Text>
                        </View>
                      )}
                      <View
                        style={getSquircle(4)}
                        className='bg-netflix-500/15 px-1.5 py-0.5'
                      >
                        <Text className='text-[11px] font-semibold uppercase text-netflix-500'>
                          {item.media_type === 'tv' ? 'TV' : 'Film'}
                        </Text>
                      </View>
                    </View>

                    {/* Overview */}
                    {item.overview ? (
                      <Text
                        className='mt-1 text-xs leading-4 text-light-text dark:text-dark-text'
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
                </View>

                {/* AI reason — full width bottom */}
                {item.reason && (
                  <View className='flex-row items-start gap-1.5 bg-netflix-500/8 px-3 py-2'>
                    <Ionicons name='sparkles' size={11} color='#E50914' style={{ marginTop: 1 }} />
                    <Text className='flex-1 text-[11px] italic leading-4 text-light-textSecondary dark:text-dark-textSecondary'>
                      <Text className='font-semibold not-italic text-light-text dark:text-dark-text'>
                        {item.media_type === 'tv' ? t('forYou.whyThisShow') : t('forYou.whyThisMovie')}
                      </Text>
                      {' '}{item.reason}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ))}

          {/* Show more / Show less button */}
          {recommendations.length > 3 && (
            <View>
              <TouchableOpacity
                onPress={() => setExpanded(!expanded)}
                activeOpacity={0.7}
                className='mt-2 flex-row items-center justify-center gap-1 py-3'
              >
                <Text className='text-sm font-semibold text-netflix-500'>
                  {expanded
                    ? t('movies.seeLess') || 'See less'
                    : t('movies.seeMore') || 'See more'}
                </Text>
                <Ionicons
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color='#E50914'
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
