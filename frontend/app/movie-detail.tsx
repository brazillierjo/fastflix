import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React from 'react';
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
import { cn } from '@/utils/cn';
import {
  getCardShadow,
  getSquircle,
  getSmallBorderRadius,
} from '@/utils/designHelpers';
import AddToWatchlistButton from '@/components/AddToWatchlistButton';

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

interface DetailedInfoData {
  genres?: { id: number; name: string }[];
  runtime?: number;
  release_year?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
  first_air_year?: number;
}

interface SimilarMovie {
  id: number;
  title: string;
  posterPath: string;
  mediaType: 'movie' | 'tv';
  voteAverage: number;
}

// Placeholder similar movies for now
const PLACEHOLDER_SIMILAR: SimilarMovie[] = [
  {
    id: 0,
    title: 'Coming Soon',
    posterPath: '',
    mediaType: 'movie',
    voteAverage: 0,
  },
];

export default function MovieDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t, country } = useLanguage();

  const params = useLocalSearchParams<{
    tmdbId: string;
    mediaType: string;
    title: string;
    posterPath: string;
    voteAverage: string;
    overview: string;
    providersJson: string;
    creditsJson: string;
    detailedInfoJson: string;
  }>();

  const tmdbId = parseInt(params.tmdbId || '0', 10);
  const mediaType = (params.mediaType || 'movie') as 'movie' | 'tv';
  const title = params.title || '';
  const posterPath = params.posterPath || '';
  const voteAverage = parseFloat(params.voteAverage || '0');
  const overview = params.overview || '';

  // Parse JSON data passed via route params
  const providers: StreamingProvider[] = params.providersJson
    ? JSON.parse(params.providersJson)
    : [];
  const cast: CastMember[] = params.creditsJson
    ? JSON.parse(params.creditsJson)
    : [];
  const detailedInfo: DetailedInfoData = params.detailedInfoJson
    ? JSON.parse(params.detailedInfoJson)
    : {};

  const bgColor = isDark ? '#000000' : '#F2F2F7';

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
    if (similar.id === 0) return; // Placeholder
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
                  <Text className='text-sm text-white/80' style={{ textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>
                    {releaseYear}
                  </Text>
                )}
                <View className='rounded-full bg-white/20 px-2 py-0.5'>
                  <Text className='text-xs font-medium text-white'>
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
          {/* Action Buttons Row */}
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 100 }}
          >
            <View className='mb-6 mt-2 flex-row gap-2'>
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

              {/* Mark as Watched button */}
              <TouchableOpacity
                className='flex-row items-center justify-center rounded-xl border-2 border-light-border bg-light-surface px-4 py-3 dark:border-dark-border dark:bg-dark-surface'
              >
                <Ionicons
                  name='checkmark-circle-outline'
                  size={20}
                  color={isDark ? '#a3a3a3' : '#737373'}
                />
              </TouchableOpacity>

              {/* Share button */}
              <TouchableOpacity
                onPress={handleShare}
                className='flex-row items-center justify-center rounded-xl border-2 border-light-border bg-light-surface px-4 py-3 dark:border-dark-border dark:bg-dark-surface'
              >
                <Ionicons
                  name='share-outline'
                  size={20}
                  color={isDark ? '#a3a3a3' : '#737373'}
                />
              </TouchableOpacity>
            </View>
          </MotiView>

          {/* Synopsis Section */}
          {overview ? (
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

          {/* Cast Section */}
          {cast.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 300 }}
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
                    <View
                      key={`cast-${actor.id}-${idx}`}
                      className='items-center'
                      style={{ width: 80 }}
                    >
                      <View
                        style={[
                          { width: 64, height: 64, borderRadius: 32, overflow: 'hidden' },
                        ]}
                        className='mb-1.5 bg-light-surface dark:bg-dark-surface'
                      >
                        {actor.profile_path ? (
                          <Image
                            source={{
                              uri: `https://image.tmdb.org/t/p/w185${actor.profile_path}`,
                            }}
                            style={{ width: 64, height: 64 }}
                            resizeMode='cover'
                          />
                        ) : (
                          <View className='flex-1 items-center justify-center'>
                            <Ionicons
                              name='person'
                              size={28}
                              color={isDark ? '#555' : '#bbb'}
                            />
                          </View>
                        )}
                      </View>
                      <Text
                        className='text-center text-xs font-medium text-light-text dark:text-dark-text'
                        numberOfLines={2}
                      >
                        {actor.name}
                      </Text>
                      <Text
                        className='text-center text-xs text-light-textMuted dark:text-dark-textMuted'
                        numberOfLines={1}
                      >
                        {actor.character}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </MotiView>
          )}

          {/* Similar Movies Section */}
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 350 }}
          >
            <View className='mb-6'>
              <Text className='mb-3 text-lg font-semibold text-light-text dark:text-dark-text'>
                {t('movieDetail.similar')}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12 }}
              >
                {PLACEHOLDER_SIMILAR.map((similar, idx) => (
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
            </View>
          </MotiView>

          {/* TMDB Link Button */}
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 400 }}
          >
            <TouchableOpacity
              onPress={handleOpenTMDB}
              style={getSquircle(14)}
              className='mb-8 flex-row items-center justify-center gap-2 border-2 border-[#01d277] bg-[#01d277]/10 py-3.5'
            >
              <Ionicons name='open-outline' size={20} color='#01d277' />
              <Text className='text-base font-semibold text-[#01d277]'>
                {t('movieDetail.openTMDB')}
              </Text>
            </TouchableOpacity>
          </MotiView>
        </View>
      </Animated.ScrollView>
    </View>
  );
}
