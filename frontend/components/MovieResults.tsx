import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import React, { useRef, useState } from 'react';
import {
  Image,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../utils/cn';
import {
  getCardShadow,
  getImageOverlayColors,
  getSquircle,
  getSmallBorderRadius,
} from '../utils/designHelpers';
import AddToWatchlistButton from './AddToWatchlistButton';

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
  detailedInfo: { [key: number]: DetailedInfo };
  geminiResponse: string;
  onGoBack: () => void;
}

export default function MovieResults({
  movies,
  streamingProviders,
  credits,
  detailedInfo,
  geminiResponse,
  onGoBack,
}: MovieResultsProps) {
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const { t, country } = useLanguage();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Refs pour le scroll automatique
  const scrollViewRef = useRef<ScrollView>(null);
  const cardPositions = useRef<{ [key: number]: number }>({});

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

  const toggleCardExpansion = (movieId: number) => {
    const wasExpanded = expandedCards.has(movieId);

    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(movieId)) newSet.delete(movieId);
      else newSet.add(movieId);

      return newSet;
    });

    // Si on vient de fermer la carte, scroller vers elle après l'animation
    if (wasExpanded && cardPositions.current[movieId] !== undefined) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: cardPositions.current[movieId],
          animated: true,
        });
      }, 400); // Attendre la fin de l'animation de fermeture
    }
  };

  const isExpanded = (movieId: number) => expandedCards.has(movieId);

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
      </View>

      <ScrollView ref={scrollViewRef}>
        {/* Gemini Response Section */}
        {geminiResponse && (
          <View
            style={getSquircle(18)}
            className='mb-4 mt-4 border border-netflix-500/20 bg-netflix-500/10 p-4'
          >
            <View className='mb-2 flex-row items-center gap-2'>
              <Ionicons name='sparkles' size={20} color='#E50914' />
              <Text className='text-sm font-semibold text-netflix-500'>
                Assistant IA
              </Text>
            </View>

            <Text className='text-sm leading-5 text-light-text dark:text-dark-text'>
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

              const expanded = isExpanded(movie.id);

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
                  onLayout={event => {
                    cardPositions.current[movie.id] =
                      event.nativeEvent.layout.y;
                  }}
                  className='mb-4 overflow-hidden bg-light-card dark:bg-dark-card'
                  style={[getSquircle(18), getCardShadow(isDark)]}
                >
                  <TouchableOpacity
                    onPress={() => toggleCardExpansion(movie.id)}
                    activeOpacity={0.7}
                  >
                    {expanded ? (
                      /* ========== EXPANDED STATE: Hero Banner Layout ========== */
                      <>
                        {/* Hero Image Banner */}
                        <View
                          className='relative'
                          style={{
                            width: '100%',
                            height: 250,
                            borderTopLeftRadius: 18,
                            borderTopRightRadius: 18,
                            overflow: 'hidden',
                          }}
                        >
                          {movie.poster_path && (
                            <>
                              <Image
                                source={{
                                  uri: `https://image.tmdb.org/t/p/w780${movie.poster_path}`,
                                }}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                }}
                                resizeMode='cover'
                              />
                              {/* Gradient overlay - fade to bottom */}
                              <LinearGradient
                                colors={[
                                  'rgba(0, 0, 0, 0)',
                                  'rgba(0, 0, 0, 0.8)',
                                ]}
                                style={{
                                  position: 'absolute',
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  height: '60%',
                                }}
                              />
                              {/* Title and Rating overlaid on Hero */}
                              <View className='absolute bottom-4 left-4 right-4'>
                                <Text className='mb-2 text-2xl font-bold text-white'>
                                  {movie.title || movie.name}
                                </Text>
                                {movie.vote_average > 0 && (
                                  <View className='flex-row items-center gap-1'>
                                    <Ionicons
                                      name='star'
                                      size={16}
                                      color='#E50914'
                                    />
                                    <Text className='text-base font-semibold text-white'>
                                      {movie.vote_average.toFixed(1)}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            </>
                          )}
                        </View>

                        {/* Content Below Hero */}
                        <View className='p-4'>
                          {/* Overview */}
                          <Text className='mb-3 text-sm leading-relaxed text-light-textSecondary dark:text-dark-textSecondary'>
                            {movie.overview || t('movies.noDescription')}
                          </Text>

                          {/* Streaming platforms */}
                          {streamingProviders[movie.id] &&
                            streamingProviders[movie.id].length > 0 && (
                              <View className='mb-3 mt-4'>
                                <Text className='mb-2 text-sm font-semibold text-light-text dark:text-dark-text'>
                                  {t('movies.availableOn')}
                                </Text>
                                <View className='gap-1.5'>
                                  {streamingProviders[movie.id].map(
                                    (provider, idx) => {
                                      const badge = getAvailabilityBadge(
                                        provider.availability_type
                                      );
                                      return (
                                        <View
                                          key={`provider-${movie.id}-${idx}-${provider.provider_name}`}
                                          className='flex-row items-center py-0.5'
                                        >
                                          <Image
                                            source={{
                                              uri: `https://image.tmdb.org/t/p/w92${provider.logo_path}`,
                                            }}
                                            className='h-[30px] w-[30px] rounded-md bg-dark-surface p-1 dark:bg-light-surface'
                                            resizeMode='contain'
                                          />
                                          <Text className='ml-2.5 flex-1 text-sm font-medium text-light-text dark:text-dark-text'>
                                            {provider.provider_name}
                                          </Text>
                                          {badge && (
                                            <View
                                              className={cn(
                                                'flex-row items-center gap-1 rounded-full px-2 py-0.5',
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
                                    }
                                  )}
                                </View>
                              </View>
                            )}

                          {/* Main actors */}
                          {credits[movie.id] &&
                            credits[movie.id].length > 0 && (
                              <View className='my-3'>
                                <Text className='text-sm font-semibold text-light-text dark:text-dark-text'>
                                  {t('movies.mainActors')}
                                </Text>
                                <View className='px-3 py-2'>
                                  {credits[movie.id]
                                    .slice(0, 5)
                                    .map((actor, idx) => (
                                      <View
                                        key={`actor-${movie.id}-${idx}-${actor.name}`}
                                        className={cn(
                                          'flex-row items-center',
                                          idx <
                                            credits[movie.id].slice(0, 5)
                                              .length -
                                              1 && 'mb-1.5'
                                        )}
                                      >
                                        <View className='mr-2 h-1.5 w-1.5 rounded-full bg-light-secondary dark:bg-dark-secondary' />
                                        <Text className='flex-1 text-sm text-light-text dark:text-dark-text'>
                                          <Text className='font-medium'>
                                            {actor.name}
                                          </Text>
                                          <Text className='text-light-secondary dark:text-dark-secondary'>
                                            {' '}
                                            • {actor.character}
                                          </Text>
                                        </Text>
                                      </View>
                                    ))}
                                </View>
                              </View>
                            )}

                          {/* Additional information */}
                          <View className='my-3'>
                            {/* Content Type Badge */}
                            <View className='mb-2 flex-row items-center gap-2'>
                              <Ionicons
                                name='film'
                                size={16}
                                color={isDark ? '#ffffff' : '#0f172a'}
                              />
                              <Text className='text-sm font-semibold text-light-text dark:text-dark-text'>
                                {t('movies.contentType')}
                              </Text>
                              <View className='rounded-full bg-light-accent/20 px-2 py-1 dark:bg-dark-accent/20'>
                                <Text className='text-xs font-medium text-light-accent dark:text-dark-accent'>
                                  {movie.media_type === 'tv'
                                    ? t('movies.tvShow')
                                    : t('movies.movie')}
                                </Text>
                              </View>
                            </View>

                            {/* Genres */}
                            {detailedInfo[movie.id]?.genres &&
                              detailedInfo[movie.id].genres!.length > 0 && (
                                <View className='mb-2 flex-row items-center gap-2'>
                                  <Ionicons
                                    name='musical-notes'
                                    size={16}
                                    color={isDark ? '#ffffff' : '#0f172a'}
                                  />
                                  <Text className='text-sm font-semibold text-light-text dark:text-dark-text'>
                                    {detailedInfo[movie.id].genres!.length > 1
                                      ? t('movies.genres')
                                      : t('movies.genre')}
                                  </Text>
                                  <Text className='flex-1 text-sm text-light-text dark:text-dark-text'>
                                    {detailedInfo[movie.id]
                                      .genres!.map(genre => genre.name)
                                      .join(', ')}
                                  </Text>
                                </View>
                              )}

                            {/* Movie specific info */}
                            {movie.media_type === 'movie' && (
                              <>
                                {detailedInfo[movie.id]?.runtime && (
                                  <View className='mb-2 flex-row items-center gap-2'>
                                    <Ionicons
                                      name='time'
                                      size={16}
                                      color={isDark ? '#ffffff' : '#0f172a'}
                                    />
                                    <Text className='text-sm font-semibold text-light-text dark:text-dark-text'>
                                      {t('movies.duration')}
                                    </Text>
                                    <Text className='text-sm text-light-text dark:text-dark-text'>
                                      {detailedInfo[movie.id].runtime}{' '}
                                      {t('movies.minutes')}
                                    </Text>
                                  </View>
                                )}
                                {detailedInfo[movie.id]?.release_year && (
                                  <View className='mb-2 flex-row items-center gap-2'>
                                    <Ionicons
                                      name='calendar'
                                      size={16}
                                      color={isDark ? '#ffffff' : '#0f172a'}
                                    />
                                    <Text className='text-sm font-semibold text-light-text dark:text-dark-text'>
                                      {t('movies.year')}
                                    </Text>
                                    <Text className='text-sm text-light-text dark:text-dark-text'>
                                      {detailedInfo[movie.id].release_year}
                                    </Text>
                                  </View>
                                )}
                              </>
                            )}

                            {/* TV Show specific info */}
                            {movie.media_type === 'tv' && (
                              <>
                                {detailedInfo[movie.id]?.number_of_seasons && (
                                  <View className='mb-2 flex-row items-center gap-2'>
                                    <Ionicons
                                      name='tv'
                                      size={16}
                                      color={isDark ? '#ffffff' : '#0f172a'}
                                    />
                                    <Text className='text-sm font-semibold text-light-text dark:text-dark-text'>
                                      {t('movies.seasons')}
                                    </Text>
                                    <Text className='text-sm text-light-text dark:text-dark-text'>
                                      {detailedInfo[movie.id].number_of_seasons}
                                    </Text>
                                  </View>
                                )}
                                {detailedInfo[movie.id]?.number_of_episodes && (
                                  <View className='mb-2 flex-row items-center gap-2'>
                                    <Ionicons
                                      name='film'
                                      size={16}
                                      color={isDark ? '#ffffff' : '#0f172a'}
                                    />
                                    <Text className='text-sm font-semibold text-light-text dark:text-dark-text'>
                                      {t('movies.episodes')}
                                    </Text>
                                    <Text className='text-sm text-light-text dark:text-dark-text'>
                                      {
                                        detailedInfo[movie.id]
                                          .number_of_episodes
                                      }
                                    </Text>
                                  </View>
                                )}
                                {detailedInfo[movie.id]?.status && (
                                  <View className='mb-2 flex-row items-center gap-2'>
                                    <Ionicons
                                      name='stats-chart'
                                      size={16}
                                      color={isDark ? '#ffffff' : '#0f172a'}
                                    />
                                    <Text className='text-sm font-semibold text-light-text dark:text-dark-text'>
                                      {t('movies.status')}
                                    </Text>
                                    <Text className='text-sm text-light-text dark:text-dark-text'>
                                      {formatTvStatus(
                                        detailedInfo[movie.id].status!
                                      )}
                                    </Text>
                                  </View>
                                )}
                                {detailedInfo[movie.id]?.first_air_year && (
                                  <View className='mb-2 flex-row items-center gap-2'>
                                    <Ionicons
                                      name='calendar'
                                      size={16}
                                      color={isDark ? '#ffffff' : '#0f172a'}
                                    />
                                    <Text className='text-sm font-semibold text-light-text dark:text-dark-text'>
                                      {t('movies.year')}
                                    </Text>
                                    <Text className='text-sm text-light-text dark:text-dark-text'>
                                      {detailedInfo[movie.id].first_air_year}
                                    </Text>
                                  </View>
                                )}
                              </>
                            )}
                          </View>

                          {/* Action Buttons Row */}
                          <View className='mt-4 flex-row gap-2'>
                            {/* Add to Watchlist Button */}
                            <View className='flex-1'>
                              <AddToWatchlistButton
                                tmdbId={movie.id}
                                mediaType={movie.media_type === 'tv' ? 'tv' : 'movie'}
                                title={movie.title || movie.name || ''}
                                posterPath={movie.poster_path}
                                providers={(streamingProviders[movie.id] || []).map(p => ({
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

                            {/* TMDB CTA Button */}
                            <TouchableOpacity
                              onPress={() => {
                                const tmdbUrl =
                                  movie.media_type === 'tv'
                                    ? `https://www.themoviedb.org/tv/${movie.id}`
                                    : `https://www.themoviedb.org/movie/${movie.id}`;
                                Linking.openURL(tmdbUrl);
                              }}
                              className='flex-row items-center justify-center rounded-xl border-2 border-[#01d277] bg-[#01d277]/10 px-4 py-3'
                            >
                              <Ionicons
                                name='open-outline'
                                size={20}
                                color='#01d277'
                              />
                            </TouchableOpacity>
                          </View>

                          {/* See less button */}
                          <TouchableOpacity
                            onPress={() => toggleCardExpansion(movie.id)}
                            className='mt-3 self-center'
                          >
                            <Text className='text-sm font-semibold text-light-muted dark:text-dark-muted'>
                              {t('movies.seeLess')}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    ) : (
                      /* ========== COLLAPSED STATE: Side Image Layout ========== */
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
                            </>
                          )}
                        </View>

                        {/* RIGHT: Content */}
                        <View className='flex-1 p-4'>
                          <Text className='mb-2 text-xl font-semibold text-light-text dark:text-dark-text'>
                            {movie.title || movie.name}
                          </Text>
                          <Text className='mb-3 text-sm text-light-textSecondary dark:text-dark-textSecondary'>
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

                          {/* See more button */}
                          <TouchableOpacity
                            onPress={() => toggleCardExpansion(movie.id)}
                            className='mt-2 self-start'
                          >
                            <Text className='text-sm font-semibold text-netflix-500'>
                              {t('movies.seeMore')}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                </MotiView>
              );
            })
          )}
        </View>
      </ScrollView>
    </MotiView>
  );
}
