import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Linking,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { backendAPIService } from '@/services/backend-api.service';
import { useMovieRating, useRateMovie, useDeleteRating } from '@/hooks/useRating';
import { Skeleton } from '@/components/Skeleton';
import { cn } from '@/utils/cn';
import {
  getCardShadow,
  getSquircle,
  getSmallBorderRadius,
} from '@/utils/designHelpers';
import AddToWatchlistButton from '@/components/AddToWatchlistButton';
import * as Haptics from 'expo-haptics';

const HERO_HEIGHT = 300;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface StreamingProvider {
  provider_id?: number;
  provider_name: string;
  logo_path: string;
  display_priority?: number;
  availability_type?: 'flatrate' | 'rent' | 'buy' | 'ads';
}

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path?: string | null;
}

interface CrewMemberData {
  id: number;
  name: string;
  job: string;
  profile_path?: string | null;
}

interface DetailedInfoData {
  genres?: { id: number; name: string }[];
  runtime?: number;
  release_year?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
  first_air_year?: number;
  tagline?: string;
  budget?: number;
  revenue?: number;
  production_companies?: Array<{ id: number; name: string; logo_path: string | null }>;
  original_language?: string;
  original_title?: string;
  imdb_id?: string;
  belongs_to_collection?: { id: number; name: string; poster_path: string | null } | null;
  created_by?: Array<{ id: number; name: string; profile_path: string | null }>;
  networks?: Array<{ id: number; name: string; logo_path: string | null }>;
  last_episode_to_air?: { episode_number: number; season_number: number; name: string; air_date: string } | null;
  next_episode_to_air?: { episode_number: number; season_number: number; name: string; air_date: string } | null;
  in_production?: boolean;
  production_countries?: Array<{ iso_3166_1: string; name: string }>;
  spoken_languages?: Array<{ english_name: string; iso_639_1: string; name: string }>;
}

interface SimilarMovie {
  id: number;
  title: string;
  posterPath: string;
  mediaType: 'movie' | 'tv';
  voteAverage: number;
}

// No more placeholders - similar movies are fetched from API

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

  // Parse JSON data passed via route params
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

  // Watched + Rating system (2-step: mark watched → optional stars)
  const { rating: savedRating, isWatched: savedIsWatched } = useMovieRating(tmdbId);
  const { rateMovie, isRating } = useRateMovie();
  const { deleteRating, isDeleting } = useDeleteRating();
  const [localRating, setLocalRating] = useState(0);
  const [isWatched, setIsWatched] = useState(false);
  const [ratingConfirmed, setRatingConfirmed] = useState(false);

  // Sync saved state
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
    // Save as watched (rating 0 = no rating yet)
    rateMovie(
      { tmdb_id: tmdbId, rating: 0, title, media_type: mediaType, poster_path: posterPath || undefined },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      }
    );
  };

  const handleUnmarkWatched = () => {
    if (isDeleting || !isAuthenticated) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    deleteRating(tmdbId, {
      onSuccess: () => {
        setIsWatched(false);
        setLocalRating(0);
      },
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

  const bgColor = isDark ? '#000000' : '#F2F2F7';

  const tmdbLanguage = langCode?.includes('-') ? langCode : `${langCode || 'en'}-${(country || 'US').toUpperCase()}`;
  const tmdbCountry = (country || 'US').toUpperCase();

  // Auto-fetch full details when opened with minimal data (any missing field triggers fetch)
  const needsDetails = !overview || !detailedInfo?.genres?.length || cast.length === 0;
  const hasFetchedDetails = React.useRef(false);

  useEffect(() => {
    if (tmdbId > 0 && needsDetails && !hasFetchedDetails.current) {
      hasFetchedDetails.current = true;
      setLoadingDetails(true);
      backendAPIService
        .getDetails({
          tmdbId,
          mediaType,
          language: tmdbLanguage,
          country: tmdbCountry,
        })
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
        .catch(() => {
          // Silent fail
        })
        .finally(() => {
          setLoadingDetails(false);
        });
    }
  }, [tmdbId, mediaType, needsDetails, tmdbLanguage, tmdbCountry]);

  // Fetch similar movies from API
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
        .catch(() => {
          // Silent fail
        })
        .finally(() => {
          setLoadingSimilar(false);
        });
    } else {
      setLoadingSimilar(false);
    }
  }, [tmdbId, mediaType]);

  // Scroll-driven animations
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Parallax effect for the hero image - moves at half the scroll speed
  const heroImageStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [-100, 0, HERO_HEIGHT],
          [-50, 0, HERO_HEIGHT * 0.4]
        ),
      },
    ],
  }));

  // Back button: frosted glass circle that fades slightly on scroll
  const backButtonStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, HERO_HEIGHT * 0.6, HERO_HEIGHT],
      [1, 0.7, 0.4]
    ),
  }));

  // Header opacity overlay that builds up as user scrolls past hero
  const headerOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, HERO_HEIGHT * 0.5, HERO_HEIGHT],
      [0, 0, 0.95]
    ),
  }));

  // Helper function to format TV show status
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

  // Helper function to get availability type badge info
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

  const handleShare = async () => {
    const tmdbUrl =
      mediaType === 'tv'
        ? `https://www.themoviedb.org/tv/${tmdbId}`
        : `https://www.themoviedb.org/movie/${tmdbId}`;
    try {
      await Share.share({
        message: `${title} - ${tmdbUrl}`,
        url: tmdbUrl,
      });
    } catch {
      // User cancelled share
    }
  };

  const handleOpenTMDB = () => {
    const tmdbUrl =
      mediaType === 'tv'
        ? `https://www.themoviedb.org/tv/${tmdbId}`
        : `https://www.themoviedb.org/movie/${tmdbId}`;
    Linking.openURL(tmdbUrl);
  };

  const handleSimilarPress = (similar: SimilarMovie) => {
    if (similar.id === 0) return;
    router.push({
      pathname: '/movie-detail' as never,
      params: {
        tmdbId: String(similar.id),
        mediaType: similar.mediaType,
        title: similar.title,
        posterPath: similar.posterPath,
        voteAverage: String(similar.voteAverage),
        overview: '',
        providersJson: '[]',
        creditsJson: '[]',
        detailedInfoJson: '{}',
      },
    });
  };

  // Derive director and key crew from crew data
  const director = crewMembers.find(c => c.job === 'Director');
  const keyCrew = crewMembers.filter(c =>
    ['Director', 'Writer', 'Screenplay', 'Producer'].includes(c.job)
  ).slice(0, 6);

  // Format budget/revenue as compact currency
  const formatCurrency = (amount: number): string => {
    if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(0)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
    return `$${amount}`;
  };

  // Format date according to app locale
  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString(langCode || 'en', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Language code to display name
  const getLanguageName = (code: string): string => {
    const map: { [k: string]: string } = {
      en: 'English', fr: 'French', es: 'Spanish', de: 'German',
      it: 'Italian', ja: 'Japanese', ko: 'Korean', zh: 'Chinese',
      pt: 'Portuguese', ru: 'Russian', ar: 'Arabic', hi: 'Hindi',
    };
    return map[code] || code.toUpperCase();
  };

  const releaseYear =
    mediaType === 'tv'
      ? detailedInfo.first_air_year
      : detailedInfo.release_year;

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
        {/* Hero Section */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 400 }}
        >
          <View style={{ width: SCREEN_WIDTH, height: HERO_HEIGHT, overflow: 'hidden' }}>
            <Animated.View style={[{ width: '100%', height: '120%' }, heroImageStyle]}>
              {posterPath ? (
                <Image
                  source={{
                    uri: `https://image.tmdb.org/t/p/w780${posterPath}`,
                  }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode='cover'
                />
              ) : (
                <View
                  style={{ width: '100%', height: '100%' }}
                  className='items-center justify-center bg-dark-surface'
                >
                  <Ionicons name='film-outline' size={64} color='#555' />
                </View>
              )}
            </Animated.View>
            {/* Gradient overlay fading to background color */}
            <LinearGradient
              colors={[
                'rgba(0,0,0,0)',
                'rgba(0,0,0,0.3)',
                isDark ? 'rgba(0,0,0,0.9)' : 'rgba(242,242,247,0.9)',
                bgColor,
              ]}
              locations={[0, 0.4, 0.75, 1]}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: '70%',
              }}
            />
            {/* Title + rating overlaid on hero */}
            <View className='absolute bottom-4 left-4 right-4'>
              <Text className='mb-1 text-2xl font-bold text-white' style={{ textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}>
                {title}
              </Text>
              <View className='flex-row items-center gap-2'>
                {voteAverage > 0 && (
                  <View className='flex-row items-center gap-1'>
                    <Ionicons name='star' size={16} color='#E50914' />
                    <Text className='text-base font-semibold text-white' style={{ textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>
                      {voteAverage.toFixed(1)}
                    </Text>
                  </View>
                )}
                {releaseYear && (
                  <Text className='text-sm font-medium text-white' style={{ textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}>
                    {releaseYear}
                  </Text>
                )}
                <View className='rounded-full bg-black/40 px-2.5 py-0.5 backdrop-blur-sm'>
                  <Text className='text-xs font-semibold text-white'>
                    {mediaType === 'tv' ? t('movies.tvShow') : t('movies.movie')}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </MotiView>

        {/* Back button floating over hero with frosted glass */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: insets.top + 8,
              left: 16,
              zIndex: 10,
            },
            backButtonStyle,
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              overflow: 'hidden',
            }}
          >
            <BlurView
              intensity={Platform.OS === 'ios' ? 60 : 40}
              tint='dark'
              style={{
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 18,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  ...Platform.select({
                    ios: {},
                    android: { backgroundColor: 'rgba(0,0,0,0.5)' },
                  }),
                  width: 36,
                  height: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name='chevron-back' size={22} color='#fff' />
              </View>
            </BlurView>
          </TouchableOpacity>
        </Animated.View>

        {/* Header overlay that appears on scroll */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: insets.top + 52,
              backgroundColor: bgColor,
              zIndex: 5,
            },
            headerOverlayStyle,
          ]}
          pointerEvents='none'
        />

        {/* Content below hero */}
        <View className='px-4'>
          {/* Action Buttons Row — Watchlist + Watched + Share all on one line */}
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 100 }}
          >
            <View className='mb-4 mt-2 flex-row gap-2'>
              {/* Watchlist button */}
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

              {/* Watched toggle button */}
              {isAuthenticated && (
                <TouchableOpacity
                  onPress={isWatched ? handleUnmarkWatched : handleMarkWatched}
                  disabled={isRating || isDeleting}
                  activeOpacity={0.7}
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
                    isWatched
                      ? 'text-green-500'
                      : 'text-light-textSecondary dark:text-dark-textSecondary'
                  }`}>
                    {isWatched ? t('movieDetail.watchedConfirm') : t('movieDetail.markWatched')}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Share button */}
              <TouchableOpacity
                onPress={handleShare}
                className='flex-row items-center justify-center rounded-xl border-2 border-light-border bg-light-surface px-3 py-3 dark:border-dark-border dark:bg-dark-surface'
              >
                <Ionicons
                  name='share-outline'
                  size={20}
                  color={isDark ? '#a3a3a3' : '#737373'}
                />
              </TouchableOpacity>
            </View>
          </MotiView>

          {/* Star Rating — slides in when watched */}
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
                    >
                      <Ionicons
                        name={star <= localRating ? 'star' : 'star-outline'}
                        size={26}
                        color={star <= localRating ? '#E50914' : isDark ? '#404040' : '#d4d4d4'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                {ratingConfirmed && (
                  <Ionicons name='checkmark' size={16} color='#22c55e' />
                )}
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

          {/* Synopsis Section */}
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

          {/* Info Section - Genres, duration, etc. */}
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 200 }}
          >
            <View className='mb-6'>
              {/* Genres as pills */}
              {detailedInfo.genres && detailedInfo.genres.length > 0 && (
                <View className='mb-3 flex-row flex-wrap gap-2'>
                  {detailedInfo.genres.map(genre => (
                    <View
                      key={genre.id}
                      style={getSmallBorderRadius()}
                      className='bg-light-surface px-3 py-1.5 dark:bg-dark-surface'
                    >
                      <Text className='text-sm font-medium text-light-text dark:text-dark-text'>
                        {genre.name}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Movie-specific info row */}
              <View className='flex-row flex-wrap gap-4'>
                {mediaType === 'movie' && detailedInfo.runtime ? (
                  <View className='flex-row items-center gap-1.5'>
                    <Ionicons
                      name='time'
                      size={16}
                      color={isDark ? '#a3a3a3' : '#737373'}
                    />
                    <Text className='text-sm text-light-textSecondary dark:text-dark-textSecondary'>
                      {detailedInfo.runtime} {t('movies.minutes')}
                    </Text>
                  </View>
                ) : null}

                {mediaType === 'tv' && detailedInfo.number_of_seasons ? (
                  <View className='flex-row items-center gap-1.5'>
                    <Ionicons
                      name='tv'
                      size={16}
                      color={isDark ? '#a3a3a3' : '#737373'}
                    />
                    <Text className='text-sm text-light-textSecondary dark:text-dark-textSecondary'>
                      {detailedInfo.number_of_seasons} {t('movies.seasons').replace(' :', '')}
                    </Text>
                  </View>
                ) : null}

                {mediaType === 'tv' && detailedInfo.number_of_episodes ? (
                  <View className='flex-row items-center gap-1.5'>
                    <Ionicons
                      name='film'
                      size={16}
                      color={isDark ? '#a3a3a3' : '#737373'}
                    />
                    <Text className='text-sm text-light-textSecondary dark:text-dark-textSecondary'>
                      {detailedInfo.number_of_episodes} {t('movies.episodes').replace(' :', '')}
                    </Text>
                  </View>
                ) : null}

                {releaseYear ? (
                  <View className='flex-row items-center gap-1.5'>
                    <Ionicons
                      name='calendar'
                      size={16}
                      color={isDark ? '#a3a3a3' : '#737373'}
                    />
                    <Text className='text-sm text-light-textSecondary dark:text-dark-textSecondary'>
                      {releaseYear}
                    </Text>
                  </View>
                ) : null}

                {mediaType === 'tv' && detailedInfo.status ? (
                  <View className='flex-row items-center gap-1.5'>
                    <Ionicons
                      name='stats-chart'
                      size={16}
                      color={isDark ? '#a3a3a3' : '#737373'}
                    />
                    <Text className='text-sm text-light-textSecondary dark:text-dark-textSecondary'>
                      {formatTvStatus(detailedInfo.status)}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </MotiView>

          {/* Streaming Section */}
          {loadingDetails && providers.length === 0 && (
            <View className='mb-6'>
              <Skeleton width={140} height={20} borderRadius={6} />
              <View style={{ marginTop: 12, gap: 10 }}>
                {[1, 2].map(i => (
                  <View key={i} className='flex-row items-center gap-3'>
                    <Skeleton width={34} height={34} borderRadius={8} />
                    <Skeleton width={120} height={14} borderRadius={4} />
                  </View>
                ))}
              </View>
            </View>
          )}
          {providers.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 250 }}
            >
              <View className='mb-6'>
                <Text className='mb-2 text-lg font-semibold text-light-text dark:text-dark-text'>
                  {t('movies.availableOn')}
                </Text>
                <View
                  style={[getSquircle(14), getCardShadow(isDark)]}
                  className='bg-light-card p-3 dark:bg-dark-card'
                >
                  <View className='gap-2'>
                    {providers.map((provider, idx) => {
                      const badge = getAvailabilityBadge(
                        provider.availability_type
                      );
                      return (
                        <View
                          key={`provider-${idx}-${provider.provider_name}`}
                          className='flex-row items-center py-0.5'
                        >
                          <Image
                            source={{
                              uri: `https://image.tmdb.org/t/p/w92${provider.logo_path}`,
                            }}
                            className='h-[34px] w-[34px] rounded-md bg-dark-surface p-1 dark:bg-light-surface'
                            resizeMode='contain'
                          />
                          <Text className='ml-3 flex-1 text-sm font-medium text-light-text dark:text-dark-text'>
                            {provider.provider_name}
                          </Text>
                          {badge && (
                            <View
                              className={cn(
                                'flex-row items-center gap-1 rounded-full px-2.5 py-1',
                                badge.bgColor
                              )}
                            >
                              <Ionicons
                                name={badge.icon}
                                size={12}
                                color={badge.iconColor}
                              />
                              <Text
                                className={cn(
                                  'text-xs font-medium',
                                  badge.textColor
                                )}
                              >
                                {badge.label}
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            </MotiView>
          )}

          {/* ═══════════ CAST ═══════════ */}
          {cast.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 270 }}
            >
              <View className='mb-6'>
                <Text className='mb-3 text-lg font-semibold text-light-text dark:text-dark-text'>
                  {t('movieDetail.cast')}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12 }}
                >
                  {cast.slice(0, 10).map((actor, idx) => (
                    <TouchableOpacity
                      key={`cast-${actor.id}-${idx}`}
                      activeOpacity={0.7}
                      onPress={() =>
                        router.push({
                          pathname: '/actor-detail' as never,
                          params: {
                            personId: String(actor.id),
                            name: actor.name,
                            profilePath: actor.profile_path || '',
                          },
                        })
                      }
                    >
                      <View className='items-center' style={{ width: 80 }}>
                        <View
                          style={{ width: 64, height: 64, borderRadius: 32, overflow: 'hidden' }}
                          className='mb-1.5 bg-light-surface dark:bg-dark-surface'
                        >
                          {actor.profile_path ? (
                            <Image
                              source={{ uri: `https://image.tmdb.org/t/p/w185${actor.profile_path}` }}
                              style={{ width: 64, height: 64 }}
                              resizeMode='cover'
                            />
                          ) : (
                            <View className='flex-1 items-center justify-center'>
                              <Ionicons name='person' size={28} color={isDark ? '#555' : '#bbb'} />
                            </View>
                          )}
                        </View>
                        <Text className='text-center text-xs font-medium text-light-text dark:text-dark-text' numberOfLines={2}>
                          {actor.name}
                        </Text>
                        <Text className='text-center text-xs text-light-textMuted dark:text-dark-textMuted' numberOfLines={1}>
                          {actor.character}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </MotiView>
          )}

          {/* ═══════════ CREW ═══════════ */}
          {keyCrew.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 280 }}
            >
              <View className='mb-6'>
                <Text className='mb-3 text-lg font-semibold text-light-text dark:text-dark-text'>
                  {t('movieDetail.crew') || 'Crew'}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12 }}
                >
                  {keyCrew.map((member, idx) => (
                    <TouchableOpacity
                      key={`crew-${member.id}-${idx}`}
                      activeOpacity={0.7}
                      onPress={() =>
                        router.push({
                          pathname: '/actor-detail' as never,
                          params: {
                            personId: String(member.id),
                            name: member.name,
                            profilePath: member.profile_path || '',
                          },
                        })
                      }
                    >
                      <View className='items-center' style={{ width: 80 }}>
                        <View
                          style={{ width: 64, height: 64, borderRadius: 32, overflow: 'hidden' }}
                          className='mb-1.5 bg-light-surface dark:bg-dark-surface'
                        >
                          {member.profile_path ? (
                            <Image
                              source={{ uri: `https://image.tmdb.org/t/p/w185${member.profile_path}` }}
                              style={{ width: 64, height: 64 }}
                              resizeMode='cover'
                            />
                          ) : (
                            <View className='flex-1 items-center justify-center'>
                              <Ionicons name='person' size={28} color={isDark ? '#555' : '#bbb'} />
                            </View>
                          )}
                        </View>
                        <Text className='text-center text-xs font-medium text-light-text dark:text-dark-text' numberOfLines={2}>
                          {member.name}
                        </Text>
                        <Text className='text-center text-xs text-light-textMuted dark:text-dark-textMuted' numberOfLines={1}>
                          {member.job}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </MotiView>
          )}

          {/* TV: Created By */}
          {mediaType === 'tv' && detailedInfo.created_by && detailedInfo.created_by.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 285 }}
            >
              <View className='mb-6'>
                <Text className='mb-2 text-lg font-semibold text-light-text dark:text-dark-text'>
                  {t('movieDetail.createdBy') || 'Created by'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                  {detailedInfo.created_by.map((creator, idx) => (
                    <TouchableOpacity
                      key={`creator-${creator.id}-${idx}`}
                      activeOpacity={0.7}
                      onPress={() => router.push({ pathname: '/actor-detail' as never, params: { personId: String(creator.id), name: creator.name, profilePath: creator.profile_path || '' } })}
                    >
                      <View className='items-center' style={{ width: 80 }}>
                        <View style={{ width: 64, height: 64, borderRadius: 32, overflow: 'hidden' }} className='mb-1.5 bg-light-surface dark:bg-dark-surface'>
                          {creator.profile_path ? (
                            <Image source={{ uri: `https://image.tmdb.org/t/p/w185${creator.profile_path}` }} style={{ width: 64, height: 64 }} resizeMode='cover' />
                          ) : (
                            <View className='flex-1 items-center justify-center'>
                              <Ionicons name='person' size={28} color={isDark ? '#555' : '#bbb'} />
                            </View>
                          )}
                        </View>
                        <Text className='text-center text-xs font-medium text-light-text dark:text-dark-text' numberOfLines={2}>{creator.name}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </MotiView>
          )}

          {/* ═══════════ TV: EPISODES ═══════════ */}
          {mediaType === 'tv' && (detailedInfo.next_episode_to_air || detailedInfo.last_episode_to_air) && (
            <MotiView
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 290 }}
            >
              <View className='mb-6'>
                <Text className='mb-2 text-lg font-semibold text-light-text dark:text-dark-text'>
                  {t('movieDetail.episodes') || 'Episodes'}
                </Text>
                <View style={[getSquircle(14), getCardShadow(isDark)]} className='bg-light-card p-3 dark:bg-dark-card'>
                  {detailedInfo.next_episode_to_air && (
                    <View className='mb-2 flex-row items-center gap-2'>
                      <View className='rounded-full bg-green-500/15 p-1'>
                        <Ionicons name='arrow-forward-circle' size={16} color='#22c55e' />
                      </View>
                      <View className='flex-1'>
                        <Text className='text-sm font-medium text-light-text dark:text-dark-text'>
                          {t('movieDetail.nextEpisode') || 'Next'}: S{detailedInfo.next_episode_to_air.season_number}E{detailedInfo.next_episode_to_air.episode_number}
                        </Text>
                        <Text className='text-xs text-light-textMuted dark:text-dark-textMuted'>
                          {detailedInfo.next_episode_to_air.name} - {formatDate(detailedInfo.next_episode_to_air.air_date)}
                        </Text>
                      </View>
                    </View>
                  )}
                  {detailedInfo.last_episode_to_air && (
                    <View className='flex-row items-center gap-2'>
                      <View className='rounded-full bg-blue-500/15 p-1'>
                        <Ionicons name='checkmark-circle' size={16} color='#3b82f6' />
                      </View>
                      <View className='flex-1'>
                        <Text className='text-sm font-medium text-light-text dark:text-dark-text'>
                          {t('movieDetail.lastEpisode') || 'Latest'}: S{detailedInfo.last_episode_to_air.season_number}E{detailedInfo.last_episode_to_air.episode_number}
                        </Text>
                        <Text className='text-xs text-light-textMuted dark:text-dark-textMuted'>
                          {detailedInfo.last_episode_to_air.name} - {formatDate(detailedInfo.last_episode_to_air.air_date)}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </MotiView>
          )}

          {/* ═══════════ SIMILAR ═══════════ */}
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 350 }}
          >
            <View className='mb-6'>
              <Text className='mb-3 text-lg font-semibold text-light-text dark:text-dark-text'>
                {t('movieDetail.similar')}
              </Text>
              {loadingSimilar ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12 }}
                >
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} width={120} height={180} borderRadius={12} />
                  ))}
                </ScrollView>
              ) : similarMovies.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12 }}
                >
                  {similarMovies.map((similar, idx) => (
                    <TouchableOpacity
                      key={`similar-${similar.id}-${idx}`}
                      onPress={() => handleSimilarPress(similar)}
                      activeOpacity={0.7}
                      style={{ width: 120 }}
                    >
                      <View
                        style={[
                          getSquircle(12),
                          { width: 120, height: 180, overflow: 'hidden' },
                        ]}
                        className='mb-1.5 items-center justify-center bg-light-surface dark:bg-dark-surface'
                      >
                        {similar.posterPath ? (
                          <Image
                            source={{
                              uri: `https://image.tmdb.org/t/p/w342${similar.posterPath}`,
                            }}
                            style={{ width: 120, height: 180 }}
                            resizeMode='cover'
                          />
                        ) : (
                          <View className='flex-1 items-center justify-center'>
                            <Ionicons
                              name='film-outline'
                              size={32}
                              color={isDark ? '#555' : '#bbb'}
                            />
                            <Text className='mt-2 text-xs text-light-textMuted dark:text-dark-textMuted'>
                              {t('movieDetail.similar')}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        className='text-xs font-medium text-light-text dark:text-dark-text'
                        numberOfLines={2}
                      >
                        {similar.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : null}
            </View>
          </MotiView>

          {/* ═══════════ DETAILS / METADATA ═══════════ */}
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 370 }}
          >
            <View
              style={[getSquircle(14)]}
              className='mb-6 border border-light-border bg-light-surface/50 p-4 dark:border-dark-border dark:bg-dark-surface/50'
            >
              {/* Original Title */}
              {detailedInfo.original_title && detailedInfo.original_title !== title && (
                <View className='mb-3 flex-row items-center gap-2'>
                  <Ionicons name='text-outline' size={15} color={isDark ? '#a3a3a3' : '#737373'} />
                  <Text className='flex-1 text-sm text-light-textSecondary dark:text-dark-textSecondary'>
                    {t('movieDetail.originalTitle') || 'Original title'}: {detailedInfo.original_title}
                  </Text>
                </View>
              )}

              {/* Original Language */}
              {detailedInfo.original_language && detailedInfo.original_language !== langCode?.slice(0, 2) && (
                <View className='mb-3 flex-row items-center gap-2'>
                  <Ionicons name='language-outline' size={15} color={isDark ? '#a3a3a3' : '#737373'} />
                  <Text className='flex-1 text-sm text-light-textSecondary dark:text-dark-textSecondary'>
                    {t('movieDetail.originalLanguage') || 'Original'}: {getLanguageName(detailedInfo.original_language)}
                  </Text>
                </View>
              )}

              {/* Spoken Languages */}
              {detailedInfo.spoken_languages && detailedInfo.spoken_languages.length > 0 && (
                <View className='mb-3 flex-row items-center gap-2'>
                  <Ionicons name='chatbubble-ellipses-outline' size={15} color={isDark ? '#a3a3a3' : '#737373'} />
                  <Text className='flex-1 text-sm text-light-textSecondary dark:text-dark-textSecondary'>
                    {t('movieDetail.spokenLanguages') || 'Languages'}: {detailedInfo.spoken_languages.map(l => l.name || l.english_name).join(', ')}
                  </Text>
                </View>
              )}

              {/* Production Countries */}
              {detailedInfo.production_countries && detailedInfo.production_countries.length > 0 && (
                <View className='mb-3 flex-row items-center gap-2'>
                  <Ionicons name='globe-outline' size={15} color={isDark ? '#a3a3a3' : '#737373'} />
                  <Text className='flex-1 text-sm text-light-textSecondary dark:text-dark-textSecondary'>
                    {detailedInfo.production_countries.map(c => c.name).join(', ')}
                  </Text>
                </View>
              )}

              {/* Budget / Revenue */}
              {mediaType === 'movie' && detailedInfo.budget && detailedInfo.budget > 0 && (
                <View className='mb-3 flex-row items-center gap-2'>
                  <Ionicons name='cash-outline' size={15} color={isDark ? '#a3a3a3' : '#737373'} />
                  <Text className='flex-1 text-sm text-light-textSecondary dark:text-dark-textSecondary'>
                    {formatCurrency(detailedInfo.budget)} {t('movieDetail.budget') || 'budget'}
                    {detailedInfo.revenue && detailedInfo.revenue > 0
                      ? ` · ${formatCurrency(detailedInfo.revenue)} ${t('movieDetail.boxOffice') || 'box office'}`
                      : ''}
                  </Text>
                </View>
              )}

              {/* Collection / Franchise */}
              {detailedInfo.belongs_to_collection && (
                <View className='mb-3 flex-row items-center gap-2'>
                  <Ionicons name='albums-outline' size={15} color={isDark ? '#a3a3a3' : '#737373'} />
                  <Text className='flex-1 text-sm text-light-textSecondary dark:text-dark-textSecondary'>
                    {t('movieDetail.partOf') || 'Part of'} {detailedInfo.belongs_to_collection.name}
                  </Text>
                </View>
              )}

              {/* TV: Networks */}
              {mediaType === 'tv' && detailedInfo.networks && detailedInfo.networks.length > 0 && (
                <View className='mb-3 flex-row items-center gap-2'>
                  <Ionicons name='tv-outline' size={15} color={isDark ? '#a3a3a3' : '#737373'} />
                  <Text className='flex-1 text-sm text-light-textSecondary dark:text-dark-textSecondary'>
                    {t('movieDetail.networks') || 'Networks'}: {detailedInfo.networks.map(n => n.name).join(', ')}
                  </Text>
                </View>
              )}

              {/* In Production badge (TV) */}
              {mediaType === 'tv' && detailedInfo.in_production && (
                <View className='flex-row items-center gap-2'>
                  <View className='h-2 w-2 rounded-full bg-green-500' />
                  <Text className='text-sm font-medium text-green-500'>
                    {t('movieDetail.inProduction') || 'Currently in production'}
                  </Text>
                </View>
              )}
            </View>
          </MotiView>

          {/* ═══════════ PRODUCTION COMPANIES (carousel) ═══════════ */}
          {detailedInfo.production_companies && detailedInfo.production_companies.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 380 }}
            >
              <View className='mb-6'>
                <Text className='mb-2 text-lg font-semibold text-light-text dark:text-dark-text'>
                  {t('movieDetail.production') || 'Production'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                  {detailedInfo.production_companies.map((company) => (
                    <View
                      key={`company-${company.id}`}
                      style={[getSquircle(10)]}
                      className='flex-row items-center gap-2 bg-light-surface px-3 py-2 dark:bg-dark-surface'
                    >
                      {company.logo_path ? (
                        <Image
                          source={{ uri: `https://image.tmdb.org/t/p/w92${company.logo_path}` }}
                          style={{ width: 24, height: 24 }}
                          resizeMode='contain'
                        />
                      ) : null}
                      <Text className='text-sm font-medium text-light-text dark:text-dark-text'>
                        {company.name}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </MotiView>
          )}

          {/* ═══════════ EXTERNAL LINKS ═══════════ */}
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 390 }}
          >
            <View className='mb-8 flex-row gap-3'>
              {detailedInfo.imdb_id && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`https://www.imdb.com/title/${detailedInfo.imdb_id}`)}
                  activeOpacity={0.7}
                  style={getSquircle(12)}
                  className='flex-1 flex-row items-center justify-center gap-2 border border-[#f5c518]/30 bg-[#f5c518]/10 py-3'
                >
                  <Ionicons name='open-outline' size={16} color='#f5c518' />
                  <Text className='text-sm font-semibold' style={{ color: '#f5c518' }}>IMDb</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleOpenTMDB}
                activeOpacity={0.7}
                style={getSquircle(12)}
                className='flex-1 flex-row items-center justify-center gap-2 border border-[#01d277]/30 bg-[#01d277]/10 py-3'
              >
                <Ionicons name='open-outline' size={16} color='#01d277' />
                <Text className='text-sm font-semibold' style={{ color: '#01d277' }}>TMDB</Text>
              </TouchableOpacity>
            </View>
          </MotiView>
        </View>
      </Animated.ScrollView>
    </View>
  );
}
