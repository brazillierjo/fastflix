import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { useSwipeData } from '../contexts/SwipeDataContext';
import { useWatchlist } from '../hooks/useWatchlist';
import { ConversationMessage } from '../services/backend-api.service';
import {
  getCardShadow,
  getImageOverlayColors,
  getSquircle,
  getSmallBorderRadius,
} from '../utils/designHelpers';

interface Movie {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  media_type?: 'movie' | 'tv' | 'person';
  reason?: string;
  matchScore?: number;
}

interface StreamingProvider {
  provider_id?: number;
  provider_name: string;
  logo_path: string;
  display_priority?: number;
  availability_type?: 'flatrate' | 'rent' | 'buy' | 'ads';
}

interface Cast {
  id: number;
  name: string;
  character: string;
  profile_path?: string;
}

interface CrewMember {
  id: number;
  name: string;
  job: string;
  profile_path?: string;
}

interface DetailedInfo {
  genres?: { id: number; name: string }[];
  runtime?: number;
  release_year?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
  first_air_year?: number;
}

interface MovieResultsProps {
  movies: Movie[];
  streamingProviders: { [key: number]: StreamingProvider[] };
  credits: { [key: number]: Cast[] };
  crew: { [key: number]: CrewMember[] };
  detailedInfo: { [key: number]: DetailedInfo };
  geminiResponse: string;
  conversationHistory?: ConversationMessage[];
  onGoBack: () => void;
  onRefine?: (query: string, conversationHistory: ConversationMessage[]) => void;
  isRefining?: boolean;
}

export default function MovieResults({
  movies,
  streamingProviders,
  credits,
  crew,
  detailedInfo,
  geminiResponse,
  conversationHistory = [],
  onGoBack,
  onRefine,
  isRefining = false,
}: MovieResultsProps) {
  const { t } = useLanguage();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { setSwipeData } = useSwipeData();
  const { items: watchlistItems } = useWatchlist();
  const watchlistIds = useMemo(
    () => new Set((watchlistItems || []).map((w) => w.tmdb_id)),
    [watchlistItems]
  );

  const scrollViewRef = useRef<ScrollView>(null);
  const [refineQuery, setRefineQuery] = useState('');

  const navigateToDetail = useCallback(
    (movie: Movie) => {
      const movieProviders = streamingProviders[movie.id] || [];
      const movieCredits = credits[movie.id] || [];
      const movieCrew = crew[movie.id] || [];
      const movieDetailedInfo = detailedInfo[movie.id] || {};

      router.push({
        pathname: '/movie-detail' as never,
        params: {
          tmdbId: String(movie.id),
          mediaType: movie.media_type === 'tv' ? 'tv' : 'movie',
          title: movie.title || movie.name || '',
          posterPath: movie.poster_path || '',
          voteAverage: String(movie.vote_average || 0),
          overview: movie.overview || '',
          providersJson: JSON.stringify(movieProviders),
          creditsJson: JSON.stringify(movieCredits),
          crewJson: JSON.stringify(movieCrew),
          detailedInfoJson: JSON.stringify(movieDetailedInfo),
        },
      });
    },
    [streamingProviders, credits, crew, detailedInfo, router]
  );

  const handleRefine = () => {
    if (!refineQuery.trim() || !onRefine) return;
    onRefine(refineQuery.trim(), conversationHistory);
    setRefineQuery('');
  };

  const handleSwipeMode = useCallback(() => {
    const items = movies.map((m) => ({
      tmdb_id: m.id,
      title: m.title || m.name || '',
      media_type: (m.media_type === 'tv' ? 'tv' : 'movie') as 'movie' | 'tv',
      overview: m.overview || '',
      poster_path: m.poster_path || null,
      backdrop_path: null,
      vote_average: m.vote_average || 0,
      vote_count: 0,
      genre_ids: [],
      popularity: 0,
      reason: m.reason,
      matchScore: m.matchScore,
      release_date: m.release_date,
      first_air_date: m.first_air_date,
    }));

    const creditsMap: Record<number, { id: number; name: string; character: string; profile_path: string | null }[]> = {};
    const crewMap: Record<number, { id: number; name: string; job: string; profile_path: string | null }[]> = {};
    movies.forEach((m) => {
      creditsMap[m.id] = (credits[m.id] || []).map((c) => ({
        id: c.id,
        name: c.name,
        character: c.character,
        profile_path: c.profile_path || null,
      }));
      crewMap[m.id] = (crew[m.id] || []).map((c) => ({
        id: c.id,
        name: c.name,
        job: c.job,
        profile_path: c.profile_path || null,
      }));
    });

    setSwipeData({
      items,
      providers: streamingProviders as Record<number, { provider_id: number; provider_name: string; logo_path: string; display_priority: number; availability_type: 'flatrate' | 'rent' | 'buy' | 'ads' }[]>,
      credits: creditsMap,
      crew: crewMap,
      detailedInfo: detailedInfo as Record<number, import('@/services/backend-api.service').DetailedInfo>,
      source: 'search',
    });
    router.push('/swipe-discovery?source=search' as never);
  }, [movies, streamingProviders, credits, crew, detailedInfo, setSwipeData, router]);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'timing',
        duration: 600,
      }}
      className='px-4'
    >
      <View className='relative flex-row items-center justify-center border-b border-light-border bg-light-background pb-4 dark:border-dark-border dark:bg-dark-background'>
        <TouchableOpacity
          onPress={onGoBack}
          className='absolute left-0 z-10 h-12 w-12 items-center justify-center rounded-full'
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name='chevron-back'
            size={28}
            color={isDark ? '#ffffff' : '#0f172a'}
          />
        </TouchableOpacity>

        <Text className='text-center text-lg font-semibold text-light-text dark:text-dark-text'>
          {t('movies.recommendations')}
        </Text>

        <TouchableOpacity
          onPress={handleSwipeMode}
          className='absolute right-0 z-10 h-12 w-12 items-center justify-center rounded-full'
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name='phone-portrait-outline'
            size={22}
            color={isDark ? '#ffffff' : '#0f172a'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollViewRef}>
        {/* Gemini Response Section */}
        {geminiResponse && (
          <View
            style={getSquircle(18)}
            className='mb-4 mt-6 border border-netflix-500/20 bg-netflix-500/10 p-4'
          >
            <View className='mb-2 flex-row items-center gap-2'>
              <Ionicons name='sparkles' size={20} color='#E50914' />
              <Text className='text-base font-semibold text-netflix-500'>
                Assistant IA
              </Text>
            </View>

            <Text className='text-base leading-6 text-light-text dark:text-dark-text'>
              {geminiResponse}
            </Text>
          </View>
        )}

        <View className='pb-32 pt-4'>
          {movies.length === 0 ? (
            <MotiView
              className='items-center justify-center py-8'
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: 'timing',
                duration: 600,
                delay: 300,
              }}
            >
              <Ionicons
                name='film-outline'
                size={48}
                color={isDark ? '#a3a3a3' : '#737373'}
                style={{ marginBottom: 16 }}
              />
              <Text className='mb-4 text-center text-lg font-medium leading-6 text-light-textMuted dark:text-dark-textMuted'>
                {t('movies.noRecommendations')}
              </Text>
            </MotiView>
          ) : (
            movies.map((movie, index) => {
              // Security check
              if (!movie || !movie.id || (!movie.title && !movie.name))
                return null;

              return (
                <MotiView
                  key={`movie-${movie.id}-${index}`}
                  from={{ opacity: 0, translateY: 30 }}
                  animate={{
                    opacity: 1,
                    translateY: 0,
                  }}
                  transition={{
                    delay: index * 100,
                    type: 'timing',
                    duration: 400,
                  }}
                  className='mb-4 overflow-hidden bg-light-card dark:bg-dark-card'
                  style={[getSquircle(18), getCardShadow(isDark)]}
                >
                  <TouchableOpacity
                    onPress={() => navigateToDetail(movie)}
                    activeOpacity={0.7}
                    style={{ overflow: 'hidden' }}
                  >
                    {/* Card content */}
                    <View className='flex-row'>
                      {/* LEFT: Image */}
                      <View
                        className='relative'
                        style={{
                          width: '40%',
                          height: 200,
                        }}
                      >
                        {movie.poster_path && (
                          <>
                            <Image
                              source={{
                                uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
                              }}
                              style={{
                                width: '100%',
                                height: '100%',
                              }}
                              resizeMode='cover'
                            />
                            {/* Gradient overlay */}
                            <LinearGradient
                              colors={getImageOverlayColors(true)}
                              style={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                bottom: 0,
                                height: '50%',
                              }}
                            />
                            {/* Rating badge */}
                            {movie.vote_average > 0 && (
                              <View
                                style={getSmallBorderRadius()}
                                className='absolute right-3 top-3 flex-row items-center gap-1 bg-netflix-500 px-3 py-1.5'
                              >
                                <Ionicons
                                  name='star'
                                  size={14}
                                  color='#fff'
                                />
                                <Text className='text-sm font-bold text-white'>
                                  {movie.vote_average.toFixed(1)}
                                </Text>
                              </View>
                            )}
                            {/* Watchlist badge */}
                            {watchlistIds.has(movie.id) && (
                              <View className='absolute left-2 top-2 rounded-full bg-white/90 p-1 dark:bg-black/80'>
                                <Ionicons name='bookmark' size={14} color='#E50914' />
                              </View>
                            )}
                          </>
                        )}
                      </View>

                      {/* RIGHT: Content */}
                      <View className='flex-1 p-4'>
                        <View className='mb-1 flex-row items-center gap-2'>
                          <Text className='flex-1 text-xl font-semibold text-light-text dark:text-dark-text' numberOfLines={1}>
                            {movie.title || movie.name}
                          </Text>
                          {movie.matchScore != null && movie.matchScore > 0 && (
                            <View
                              style={getSmallBorderRadius()}
                              className={`px-2 py-0.5 ${
                                movie.matchScore >= 80
                                  ? 'bg-green-500/15'
                                  : movie.matchScore >= 50
                                    ? 'bg-orange-500/15'
                                    : 'bg-neutral-500/15'
                              }`}
                            >
                              <Text
                                className={`text-[11px] font-bold ${
                                  movie.matchScore >= 80
                                    ? 'text-green-600'
                                    : movie.matchScore >= 50
                                      ? 'text-orange-500'
                                      : 'text-neutral-500'
                                }`}
                              >
                                {movie.matchScore}%
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text className='mb-2 text-sm text-light-text dark:text-dark-text'>
                          {movie.overview
                            ? movie.overview.length > 80
                              ? `${movie.overview.substring(0, 80)}...`
                              : movie.overview
                            : t('movies.noDescription')}
                        </Text>

                        {/* Streaming platforms (collapsed - max 4) */}
                        {streamingProviders[movie.id] &&
                          streamingProviders[movie.id].length > 0 && (
                            <View className='mb-3'>
                              <View className='flex-row flex-wrap gap-1.5'>
                                {streamingProviders[movie.id]
                                  .slice(0, 4)
                                  .map((provider, idx) => (
                                    <View
                                      key={`provider-${movie.id}-${idx}-${provider.provider_name}`}
                                      className='rounded-md bg-dark-surface dark:bg-light-surface'
                                    >
                                      <Image
                                        source={{
                                          uri: `https://image.tmdb.org/t/p/w92${provider.logo_path}`,
                                        }}
                                        className='h-[30px] w-[30px] rounded-md bg-dark-surface p-1 dark:bg-light-surface'
                                        resizeMode='contain'
                                      />
                                    </View>
                                  ))}
                              </View>
                            </View>
                          )}

                        {/* See more indicator */}
                        <View className='mt-2 flex-row items-center gap-1 self-start'>
                          <Text className='text-sm font-semibold text-netflix-500'>
                            {t('movies.seeMore')}
                          </Text>
                          <Ionicons
                            name='chevron-forward'
                            size={14}
                            color='#E50914'
                          />
                        </View>
                      </View>
                    </View>

                    {/* AI reason — full width bottom with border-top */}
                    {movie.reason && (
                      <View className='flex-row items-start gap-1.5 border-t border-light-border px-4 py-2.5 dark:border-dark-border'>
                        <Ionicons name='sparkles' size={12} color='#E50914' style={{ marginTop: 1 }} />
                        <Text className='flex-1 text-xs italic leading-4 text-light-textSecondary dark:text-dark-textSecondary'>
                          <Text className='font-semibold not-italic text-light-text dark:text-dark-text'>
                            {movie.media_type === 'tv' ? t('forYou.whyThisShow') : t('forYou.whyThisMovie')}
                          </Text>
                          {' '}{movie.reason}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </MotiView>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Refine search input */}
      {onRefine && (
        <View className='border-t border-light-border px-4 pb-6 pt-3 dark:border-dark-border'>
          <View className='flex-row items-center gap-2'>
            <TextInput
              value={refineQuery}
              onChangeText={setRefineQuery}
              placeholder={t('movies.refineResults') || 'Refine your results...'}
              placeholderTextColor={isDark ? '#a3a3a3' : '#737373'}
              editable={!isRefining}
              onSubmitEditing={handleRefine}
              returnKeyType='send'
              className='flex-1 rounded-xl border border-light-border bg-light-surface px-4 py-3 text-base text-light-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
            />
            <TouchableOpacity
              onPress={handleRefine}
              disabled={!refineQuery.trim() || isRefining}
              className='h-12 w-12 items-center justify-center rounded-xl bg-netflix-500'
              style={{ opacity: !refineQuery.trim() || isRefining ? 0.5 : 1 }}
            >
              {isRefining ? (
                <ActivityIndicator size='small' color='#fff' />
              ) : (
                <Ionicons name='send' size={20} color='#fff' />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </MotiView>
  );
}
