import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Linking,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { backendAPIService } from '@/services/backend-api.service';
import { useMovieRating, useRateMovie, useDeleteRating } from '@/hooks/useRating';
import { Skeleton } from '@/components/Skeleton';
import { getSmallBorderRadius, getSquircle } from '@/utils/designHelpers';
import AddToWatchlistButton from '@/components/AddToWatchlistButton';
import * as Haptics from 'expo-haptics';

import HeroSection from '@/components/movie-detail/HeroSection';
import CastSection from '@/components/movie-detail/CastSection';
import StreamingSection from '@/components/movie-detail/StreamingSection';
import SimilarSection from '@/components/movie-detail/SimilarSection';
import DetailsSection from '@/components/movie-detail/DetailsSection';
import EpisodesSection from '@/components/movie-detail/EpisodesSection';
import type {
  StreamingProvider,
  CastMember,
  CrewMemberData,
  DetailedInfoData,
  SimilarMovie,
} from '@/components/movie-detail/types';

export default function MovieDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t, language: langCode, country } = useLanguage();

  const params = useLocalSearchParams<{
    tmdbId: string;
    mediaType: string;
    title: string;
    posterPath: string;
    voteAverage: string;
    overview: string;
    providersJson: string;
    creditsJson: string;
    crewJson: string;
    detailedInfoJson: string;
  }>();

  const [similarMovies, setSimilarMovies] = useState<SimilarMovie[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const tmdbId = parseInt(params.tmdbId || '0', 10);
  const mediaType = (params.mediaType || 'movie') as 'movie' | 'tv';
  const [title, setTitle] = useState(params.title || '');
  const [posterPath, setPosterPath] = useState(params.posterPath || '');
  const [voteAverage, setVoteAverage] = useState(parseFloat(params.voteAverage || '0'));
  const [overview, setOverview] = useState(params.overview || '');

  const [providers, setProviders] = useState<StreamingProvider[]>(() => {
    try { return params.providersJson ? JSON.parse(params.providersJson) : []; }
    catch { return []; }
  });
  const [cast, setCast] = useState<CastMember[]>(() => {
    try { return params.creditsJson ? JSON.parse(params.creditsJson) : []; }
    catch { return []; }
  });
  const [crewMembers, setCrewMembers] = useState<CrewMemberData[]>(() => {
    try { return params.crewJson ? JSON.parse(params.crewJson) : []; }
    catch { return []; }
  });
  const [detailedInfo, setDetailedInfo] = useState<DetailedInfoData>(() => {
    try { return params.detailedInfoJson ? JSON.parse(params.detailedInfoJson) : {}; }
    catch { return {}; }
  });

  const { isAuthenticated } = useAuth();

  // Rating system
  const { rating: savedRating, isWatched: savedIsWatched } = useMovieRating(tmdbId);
  const { rateMovie, isRating } = useRateMovie();
  const { deleteRating, isDeleting } = useDeleteRating();
  const [localRating, setLocalRating] = useState(0);
  const [isWatched, setIsWatched] = useState(false);
  const [ratingConfirmed, setRatingConfirmed] = useState(false);

  useEffect(() => {
    if (savedIsWatched) {
      setIsWatched(true);
      if (savedRating > 0) setLocalRating(savedRating);
    }
  }, [savedIsWatched, savedRating]);

  const handleMarkWatched = () => {
    if (isRating || !isAuthenticated) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsWatched(true);
    rateMovie(
      { tmdb_id: tmdbId, rating: 0, title, media_type: mediaType, poster_path: posterPath || undefined },
      { onSuccess: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } }
    );
  };

  const handleUnmarkWatched = () => {
    if (isDeleting || !isAuthenticated) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    deleteRating(tmdbId, {
      onSuccess: () => { setIsWatched(false); setLocalRating(0); },
    });
  };

  const handleRate = (stars: number) => {
    if (isRating || !isAuthenticated) return;
    const newRating = stars === localRating ? 0 : stars;
    setLocalRating(newRating);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    rateMovie(
      { tmdb_id: tmdbId, rating: newRating, title, media_type: mediaType, poster_path: posterPath || undefined },
      {
        onSuccess: () => {
          if (newRating > 0) {
            setRatingConfirmed(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTimeout(() => setRatingConfirmed(false), 2000);
          }
        },
      }
    );
  };

  const tmdbLanguage = langCode?.includes('-') ? langCode : `${langCode || 'en'}-${(country || 'US').toUpperCase()}`;
  const tmdbCountry = (country || 'US').toUpperCase();

  // Auto-fetch full details
  const needsDetails = !overview || !detailedInfo?.genres?.length || cast.length === 0;
  const hasFetchedDetails = React.useRef(false);

  useEffect(() => {
    if (tmdbId > 0 && needsDetails && !hasFetchedDetails.current) {
      hasFetchedDetails.current = true;
      setLoadingDetails(true);
      backendAPIService
        .getDetails({ tmdbId, mediaType, language: tmdbLanguage, country: tmdbCountry })
        .then(res => {
          if (res.success && res.data) {
            const d = res.data;
            if (!overview && d.overview) setOverview(d.overview);
            if (d.title) setTitle(d.title);
            if (d.poster_path) setPosterPath(d.poster_path);
            if (d.vote_average) setVoteAverage(d.vote_average);
            if (providers.length === 0 && d.providers?.length > 0) setProviders(d.providers);
            if (cast.length === 0 && d.credits?.length > 0) setCast(d.credits);
            if (crewMembers.length === 0 && d.crew?.length > 0) setCrewMembers(d.crew);
            if (!detailedInfo?.genres?.length && d.detailedInfo && Object.keys(d.detailedInfo).length > 0) {
              setDetailedInfo(d.detailedInfo);
            }
          }
        })
        .catch(() => {})
        .finally(() => { setLoadingDetails(false); });
    }
  }, [tmdbId, mediaType, needsDetails, tmdbLanguage, tmdbCountry]);

  // Fetch similar movies
  useEffect(() => {
    if (tmdbId > 0) {
      setLoadingSimilar(true);
      backendAPIService
        .getSimilar(tmdbId, mediaType)
        .then(res => {
          if (res.success && res.data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rawData = res.data as any;
            const items = (Array.isArray(rawData) ? rawData : rawData?.items || [])
              .slice(0, 10)
              .map((item: { id?: number; tmdb_id?: number; title?: string; name?: string; poster_path?: string; media_type?: string; vote_average?: number }) => ({
                id: item.id || item.tmdb_id || 0,
                title: item.title || item.name || '',
                posterPath: item.poster_path || '',
                mediaType: (item.media_type || mediaType) as 'movie' | 'tv',
                voteAverage: item.vote_average || 0,
              }));
            setSimilarMovies(items);
          }
        })
        .catch(() => {})
        .finally(() => { setLoadingSimilar(false); });
    } else {
      setLoadingSimilar(false);
    }
  }, [tmdbId, mediaType]);

  // Scroll animation
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => { scrollY.value = event.contentOffset.y; },
  });

  const handleShare = async () => {
    const tmdbUrl = mediaType === 'tv'
      ? `https://www.themoviedb.org/tv/${tmdbId}`
      : `https://www.themoviedb.org/movie/${tmdbId}`;
    try { await Share.share({ message: `${title} - ${tmdbUrl}`, url: tmdbUrl }); }
    catch {}
  };

  // Helper: format TV status
  const formatTvStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'Returning Series': t('movies.statusReturning'),
      Ended: t('movies.statusEnded'),
      Canceled: t('movies.statusCanceled'),
      'In Production': t('movies.statusInProduction'),
      Planned: t('movies.statusPlanned'),
      Pilot: t('movies.statusPilot'),
    };
    return statusMap[status] || status;
  };

  const releaseYear = mediaType === 'tv' ? detailedInfo.first_air_year : detailedInfo.release_year;

  return (
    <View className='flex-1 bg-light-background dark:bg-dark-background'>
      <StatusBar barStyle='light-content' />
      <Animated.ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Hero */}
        <HeroSection
          title={title}
          posterPath={posterPath}
          voteAverage={voteAverage}
          releaseYear={releaseYear}
          mediaType={mediaType}
          isDark={isDark}
          scrollY={scrollY}
          insetsTop={insets.top}
          onBack={() => router.back()}
        />

        {/* Content */}
        <View className='px-4'>
          {/* Action Buttons */}
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 100 }}
          >
            <View className='mb-4 mt-2 flex-row gap-2'>
              <View className='flex-1'>
                <AddToWatchlistButton
                  tmdbId={tmdbId}
                  mediaType={mediaType}
                  title={title}
                  posterPath={posterPath || null}
                  providers={providers.map(p => ({
                    provider_id: p.provider_id ?? 0,
                    provider_name: p.provider_name || '',
                    logo_path: p.logo_path || '',
                    display_priority: p.display_priority ?? 0,
                    availability_type: p.availability_type || 'flatrate',
                  }))}
                  country={country || 'FR'}
                  variant='button'
                />
              </View>
              {isAuthenticated && (
                <TouchableOpacity
                  onPress={isWatched ? handleUnmarkWatched : handleMarkWatched}
                  disabled={isRating || isDeleting}
                  activeOpacity={0.7}
                  accessibilityLabel={isWatched ? t('movieDetail.watchedConfirm') : t('movieDetail.markWatched')}
                  accessibilityRole='button'
                  className={`flex-row items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-3 ${
                    isWatched
                      ? 'border-green-500/30 bg-green-500/10'
                      : 'border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface'
                  }`}
                >
                  <Ionicons
                    name={isWatched ? 'checkmark-circle' : 'eye-outline'}
                    size={20}
                    color={isWatched ? '#22c55e' : isDark ? '#a3a3a3' : '#737373'}
                  />
                  <Text className={`text-sm font-medium ${
                    isWatched ? 'text-green-500' : 'text-light-textSecondary dark:text-dark-textSecondary'
                  }`}>
                    {isWatched ? t('movieDetail.watchedConfirm') : t('movieDetail.markWatched')}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleShare}
                accessibilityLabel='Share'
                accessibilityRole='button'
                className='flex-row items-center justify-center rounded-xl border-2 border-light-border bg-light-surface px-3 py-3 dark:border-dark-border dark:bg-dark-surface'
              >
                <Ionicons name='share-outline' size={20} color={isDark ? '#a3a3a3' : '#737373'} />
              </TouchableOpacity>
            </View>
          </MotiView>

          {/* Star Rating */}
          {isAuthenticated && isWatched && (
            <MotiView
              from={{ opacity: 0, translateY: -8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 250 }}
              className='mb-6'
            >
              <View
                style={[getSquircle(12)]}
                className='flex-row items-center justify-between border border-light-border bg-light-surface/80 px-4 py-3 dark:border-dark-border dark:bg-dark-surface/80'
              >
                <Text className='text-sm text-light-textSecondary dark:text-dark-textSecondary'>
                  {t('movieDetail.rateThis')}
                </Text>
                <View className='flex-row items-center gap-2'>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => handleRate(star)}
                      disabled={isRating}
                      hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
                      activeOpacity={0.7}
                      accessibilityLabel={`Rate ${star} star${star > 1 ? 's' : ''}`}
                      accessibilityRole='button'
                    >
                      <Ionicons
                        name={star <= localRating ? 'star' : 'star-outline'}
                        size={26}
                        color={star <= localRating ? '#E50914' : isDark ? '#404040' : '#d4d4d4'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                {ratingConfirmed && <Ionicons name='checkmark' size={16} color='#22c55e' />}
              </View>
            </MotiView>
          )}

          {/* Tagline */}
          {detailedInfo.tagline ? (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 130 }}
            >
              <Text className='mb-4 text-base italic text-light-textSecondary dark:text-dark-textSecondary'>
                &ldquo;{detailedInfo.tagline}&rdquo;
              </Text>
            </MotiView>
          ) : null}

          {/* Synopsis */}
          {loadingDetails && !overview ? (
            <View className='mb-6'>
              <Skeleton width={100} height={20} borderRadius={6} />
              <Skeleton width='100%' height={14} borderRadius={4} style={{ marginTop: 12 }} />
              <Skeleton width='100%' height={14} borderRadius={4} style={{ marginTop: 6 }} />
              <Skeleton width='70%' height={14} borderRadius={4} style={{ marginTop: 6 }} />
            </View>
          ) : overview ? (
            <MotiView
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 150 }}
            >
              <View className='mb-6'>
                <Text className='mb-2 text-lg font-semibold text-light-text dark:text-dark-text'>
                  {t('movieDetail.synopsis')}
                </Text>
                <Text className='text-base leading-relaxed text-light-textSecondary dark:text-dark-textSecondary'>
                  {overview}
                </Text>
              </View>
            </MotiView>
          ) : null}

          {/* Info: genres, runtime, status */}
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 200 }}
          >
            <View className='mb-6'>
              {detailedInfo.genres && detailedInfo.genres.length > 0 && (
                <View className='mb-3 flex-row flex-wrap gap-2'>
                  {detailedInfo.genres.map(genre => (
                    <View key={genre.id} style={getSmallBorderRadius()} className='bg-light-surface px-3 py-1.5 dark:bg-dark-surface'>
                      <Text className='text-sm font-medium text-light-text dark:text-dark-text'>{genre.name}</Text>
                    </View>
                  ))}
                </View>
              )}
              <View className='flex-row flex-wrap gap-4'>
                {mediaType === 'movie' && detailedInfo.runtime ? (
                  <View className='flex-row items-center gap-1.5'>
                    <Ionicons name='time' size={16} color={isDark ? '#a3a3a3' : '#737373'} />
                    <Text className='text-sm text-light-textSecondary dark:text-dark-textSecondary'>
                      {detailedInfo.runtime} {t('movies.minutes')}
                    </Text>
                  </View>
                ) : null}
                {mediaType === 'tv' && detailedInfo.number_of_seasons ? (
                  <View className='flex-row items-center gap-1.5'>
                    <Ionicons name='tv' size={16} color={isDark ? '#a3a3a3' : '#737373'} />
                    <Text className='text-sm text-light-textSecondary dark:text-dark-textSecondary'>
                      {detailedInfo.number_of_seasons} {t('movies.seasons').replace(' :', '')}
                    </Text>
                  </View>
                ) : null}
                {mediaType === 'tv' && detailedInfo.number_of_episodes ? (
                  <View className='flex-row items-center gap-1.5'>
                    <Ionicons name='film' size={16} color={isDark ? '#a3a3a3' : '#737373'} />
                    <Text className='text-sm text-light-textSecondary dark:text-dark-textSecondary'>
                      {detailedInfo.number_of_episodes} {t('movies.episodes').replace(' :', '')}
                    </Text>
                  </View>
                ) : null}
                {releaseYear ? (
                  <View className='flex-row items-center gap-1.5'>
                    <Ionicons name='calendar' size={16} color={isDark ? '#a3a3a3' : '#737373'} />
                    <Text className='text-sm text-light-textSecondary dark:text-dark-textSecondary'>{releaseYear}</Text>
                  </View>
                ) : null}
                {mediaType === 'tv' && detailedInfo.status ? (
                  <View className='flex-row items-center gap-1.5'>
                    <Ionicons name='stats-chart' size={16} color={isDark ? '#a3a3a3' : '#737373'} />
                    <Text className='text-sm text-light-textSecondary dark:text-dark-textSecondary'>
                      {formatTvStatus(detailedInfo.status)}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </MotiView>

          {/* Streaming Providers */}
          <StreamingSection providers={providers} loadingDetails={loadingDetails} />

          {/* Cast & Crew */}
          <CastSection
            cast={cast}
            crew={crewMembers}
            createdBy={detailedInfo.created_by}
            mediaType={mediaType}
          />

          {/* TV Episodes */}
          {mediaType === 'tv' && (
            <EpisodesSection
              nextEpisode={detailedInfo.next_episode_to_air || null}
              lastEpisode={detailedInfo.last_episode_to_air || null}
            />
          )}

          {/* Similar Movies */}
          <SimilarSection
            similarMovies={similarMovies}
            loading={loadingSimilar}
            currentMediaType={mediaType}
          />

          {/* Details & External Links */}
          <DetailsSection
            detailedInfo={detailedInfo}
            title={title}
            mediaType={mediaType}
            tmdbId={tmdbId}
          />
        </View>
      </Animated.ScrollView>
    </View>
  );
}
