import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import React, { useMemo, useRef, useState } from 'react';
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

type SortOption = 'release_date' | 'vote_average';
type FilterState = {
  sortBy: SortOption;
  selectedProviders: Set<string>;
};

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
  provider_name: string;
  logo_path: string;
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
  const [filters, setFilters] = useState<FilterState>({
    sortBy: 'vote_average',
    selectedProviders: new Set(),
  });
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);

  const { t } = useLanguage();
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

  // Extract all available providers from the results
  const availableProviders = useMemo(() => {
    const providers = new Set<string>();
    Object.values(streamingProviders).forEach(providerList => {
      providerList.forEach(provider => {
        providers.add(provider.provider_name);
      });
    });
    return Array.from(providers).sort();
  }, [streamingProviders]);

  // Filter and sort movies based on current filters
  const filteredAndSortedMovies = useMemo(() => {
    let filtered = [...movies];

    // Filter by selected providers
    if (filters.selectedProviders.size > 0) {
      filtered = filtered.filter(movie => {
        const movieProviders = streamingProviders[movie.id] || [];
        return movieProviders.some(provider =>
          filters.selectedProviders.has(provider.provider_name)
        );
      });
    }

    // Sort movies
    filtered.sort((a, b) => {
      if (filters.sortBy === 'release_date') {
        const dateA = new Date(
          a.release_date || a.first_air_date || '1900-01-01'
        );
        const dateB = new Date(
          b.release_date || b.first_air_date || '1900-01-01'
        );
        return dateB.getTime() - dateA.getTime(); // Most recent first
      } else {
        return b.vote_average - a.vote_average; // Highest rating first
      }
    });

    return filtered;
  }, [movies, filters, streamingProviders]);

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

  const handleSortChange = (sortOption: SortOption) => {
    setFilters(prev => ({ ...prev, sortBy: sortOption }));
    setShowSortDropdown(false);
  };

  const toggleProvider = (providerName: string) => {
    setFilters(prev => {
      const newProviders = new Set(prev.selectedProviders);
      if (newProviders.has(providerName)) {
        newProviders.delete(providerName);
      } else {
        newProviders.add(providerName);
      }
      return { ...prev, selectedProviders: newProviders };
    });
  };

  const clearProviderFilters = () => {
    setFilters(prev => ({ ...prev, selectedProviders: new Set() }));
  };

  const closeDropdowns = () => {
    setShowSortDropdown(false);
    setShowProviderDropdown(false);
  };

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
        <TouchableOpacity onPress={onGoBack} className='absolute left-4 z-10'>
          <Text className='text-lg text-light-text dark:text-dark-text'>←</Text>
        </TouchableOpacity>

        <Text className='text-center text-lg font-semibold text-light-text dark:text-dark-text'>
          {t('movies.recommendations')}
        </Text>
      </View>

      {/* Filters Section */}
      <View className='bg-light-background py-3 dark:border-dark-border dark:bg-dark-background'>
        <View className='flex-row gap-3'>
          {/* Sort Filter */}
          <View className='flex-1'>
            <TouchableOpacity
              onPress={() => setShowSortDropdown(!showSortDropdown)}
              style={getSmallBorderRadius()}
              className='flex-row items-center justify-between border border-light-border bg-light-surface px-3 py-2 dark:border-dark-border dark:bg-dark-surface'
            >
              <View className='flex-row items-center gap-1.5'>
                <Ionicons
                  name={filters.sortBy === 'release_date' ? 'calendar' : 'star'}
                  size={14}
                  color={isDark ? '#ffffff' : '#0f172a'}
                />
                <Text className='text-sm text-light-text dark:text-dark-text'>
                  {filters.sortBy === 'release_date'
                    ? t('movies.sortByDate')
                    : t('movies.sortByRating')}
                </Text>
              </View>
              <Text className='text-light-secondary dark:text-dark-secondary'>
                {showSortDropdown ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {showSortDropdown && (
              <View
                style={getSmallBorderRadius()}
                className='absolute top-12 z-10 w-full border border-light-border bg-light-background shadow-lg dark:border-dark-border dark:bg-dark-background'
              >
                <TouchableOpacity
                  onPress={() => handleSortChange('vote_average')}
                  className={cn(
                    'border-b border-light-border px-3 py-2 dark:border-dark-border',
                    filters.sortBy === 'vote_average' && 'bg-netflix-500/10'
                  )}
                >
                  <View className='flex-row items-center gap-2'>
                    <Ionicons
                      name='star'
                      size={16}
                      color={
                        filters.sortBy === 'vote_average'
                          ? '#E50914'
                          : isDark
                            ? '#ffffff'
                            : '#0f172a'
                      }
                    />
                    <Text
                      className={cn(
                        'text-sm',
                        filters.sortBy === 'vote_average'
                          ? 'font-semibold text-netflix-500'
                          : 'text-light-text dark:text-dark-text'
                      )}
                    >
                      {t('movies.sortByRating')}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleSortChange('release_date')}
                  className={cn(
                    'px-3 py-2',
                    filters.sortBy === 'release_date' && 'bg-netflix-500/10'
                  )}
                >
                  <View className='flex-row items-center gap-2'>
                    <Ionicons
                      name='calendar'
                      size={16}
                      color={
                        filters.sortBy === 'release_date'
                          ? '#E50914'
                          : isDark
                            ? '#ffffff'
                            : '#0f172a'
                      }
                    />
                    <Text
                      className={cn(
                        'text-sm',
                        filters.sortBy === 'release_date'
                          ? 'font-semibold text-netflix-500'
                          : 'text-light-text dark:text-dark-text'
                      )}
                    >
                      {t('movies.sortByDate')}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Provider Filter */}
          <View className='flex-1'>
            <TouchableOpacity
              onPress={() => setShowProviderDropdown(!showProviderDropdown)}
              style={getSmallBorderRadius()}
              className='flex-row items-center justify-between border border-light-border bg-light-surface px-3 py-2 dark:border-dark-border dark:bg-dark-surface'
            >
              <Text className='text-sm text-light-text dark:text-dark-text'>
                {filters.selectedProviders.size > 0
                  ? `${filters.selectedProviders.size} ${filters.selectedProviders.size > 1 ? t('movies.platformsSelectedPlural') : t('movies.platformsSelected')}`
                  : t('movies.allPlatforms')}
              </Text>
              <Text className='text-light-secondary dark:text-dark-secondary'>
                {showProviderDropdown ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {showProviderDropdown && (
              <View
                style={getSmallBorderRadius()}
                className='absolute top-12 z-10 max-h-48 w-full border border-light-border bg-light-background shadow-lg dark:border-dark-border dark:bg-dark-background'
              >
                <ScrollView className='max-h-48'>
                  {filters.selectedProviders.size > 0 && (
                    <TouchableOpacity
                      onPress={clearProviderFilters}
                      className='border-b border-light-border px-3 py-2 dark:border-dark-border'
                    >
                      <Text className='text-sm font-medium text-netflix-500'>
                        {t('movies.clearFilters')}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {availableProviders.map(provider => (
                    <TouchableOpacity
                      key={provider}
                      onPress={() => toggleProvider(provider)}
                      className={cn(
                        'flex-row items-center border-b border-light-border px-3 py-2 dark:border-dark-border',
                        filters.selectedProviders.has(provider) &&
                          'bg-netflix-500/10'
                      )}
                    >
                      <View
                        className={cn(
                          'mr-2 h-4 w-4 rounded border',
                          filters.selectedProviders.has(provider)
                            ? 'border-netflix-500 bg-netflix-500'
                            : 'border-light-border dark:border-dark-border'
                        )}
                      >
                        {filters.selectedProviders.has(provider) && (
                          <Text className='text-center text-xs leading-4 text-white'>
                            ✓
                          </Text>
                        )}
                      </View>
                      <Text
                        className={cn(
                          'text-sm',
                          filters.selectedProviders.has(provider)
                            ? 'font-semibold text-netflix-500'
                            : 'text-light-text dark:text-dark-text'
                        )}
                      >
                        {provider}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView ref={scrollViewRef} onTouchStart={closeDropdowns}>
        {/* Gemini Response Section */}
        {geminiResponse && (
          <View
            style={getSquircle(18)}
            className='mb-4 border border-netflix-500/20 bg-netflix-500/10 p-4'
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
          {filteredAndSortedMovies.length === 0 ? (
            <MotiView
              className='py-15 items-center justify-center'
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: 'timing',
                duration: 600,
                delay: 300,
              }}
            >
              <Text className='text-light-text-muted dark:text-dark-text-muted text-center text-lg font-medium leading-6'>
                {movies.length === 0
                  ? t('movies.noRecommendations')
                  : 'Aucun film ne correspond aux filtres sélectionnés'}
              </Text>
            </MotiView>
          ) : (
            filteredAndSortedMovies.map((movie, index) => {
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
                                <View className='gap-1'>
                                  {streamingProviders[movie.id].map(
                                    (provider, idx) => (
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
                                        <Text className='ml-2.5 text-sm font-medium text-light-text dark:text-dark-text'>
                                          {provider.provider_name}
                                        </Text>
                                      </View>
                                    )
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

                            {/* External Links */}
                            <View className='flex-row items-center gap-2'>
                              <Ionicons
                                name='link'
                                size={16}
                                color={isDark ? '#ffffff' : '#0f172a'}
                              />
                              <Text className='text-sm font-semibold text-light-text dark:text-dark-text'>
                                {t('movies.externalLinks')}
                              </Text>
                              <TouchableOpacity
                                onPress={() => {
                                  const tmdbUrl =
                                    movie.media_type === 'tv'
                                      ? `https://www.themoviedb.org/tv/${movie.id}`
                                      : `https://www.themoviedb.org/movie/${movie.id}`;
                                  Linking.openURL(tmdbUrl);
                                }}
                                className='rounded-md bg-netflix-500/15 px-2 py-1'
                              >
                                <Text className='text-xs font-semibold text-netflix-500'>
                                  {t('movies.viewOnTMDB')}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>

                          {/* See less button */}
                          <TouchableOpacity
                            onPress={() => toggleCardExpansion(movie.id)}
                            className='mt-2 self-start'
                          >
                            <Text className='text-sm font-semibold text-netflix-500'>
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
