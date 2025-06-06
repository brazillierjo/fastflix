import { MotiView } from 'moti';
import React, { useMemo, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../utils/cn';

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

interface MovieResultsProps {
  movies: Movie[];
  streamingProviders: { [key: number]: StreamingProvider[] };
  credits: { [key: number]: Cast[] };
  geminiResponse: string;
  onGoBack: () => void;
}

export default function MovieResults({
  movies,
  streamingProviders,
  credits,
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
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(movieId)) newSet.delete(movieId);
      else newSet.add(movieId);

      return newSet;
    });
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
              className='flex-row items-center justify-between rounded-lg border border-light-border bg-light-surface px-3 py-2 dark:border-dark-border dark:bg-dark-surface'
            >
              <Text className='text-sm text-light-text dark:text-dark-text'>
                {filters.sortBy === 'release_date'
                  ? '📅 Date de sortie'
                  : '⭐ Note'}
              </Text>
              <Text className='text-light-secondary dark:text-dark-secondary'>
                {showSortDropdown ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {showSortDropdown && (
              <View className='absolute top-12 z-10 w-full rounded-lg border border-light-border bg-light-background shadow-lg dark:border-dark-border dark:bg-dark-background'>
                <TouchableOpacity
                  onPress={() => handleSortChange('vote_average')}
                  className={cn(
                    'border-b border-light-border px-3 py-2 dark:border-dark-border',
                    filters.sortBy === 'vote_average' &&
                      'bg-light-accent/10 dark:bg-dark-accent/10'
                  )}
                >
                  <Text className='text-sm text-light-text dark:text-dark-text'>
                    ⭐ Note
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleSortChange('release_date')}
                  className={cn(
                    'px-3 py-2',
                    filters.sortBy === 'release_date' &&
                      'bg-light-accent/10 dark:bg-dark-accent/10'
                  )}
                >
                  <Text className='text-sm text-light-text dark:text-dark-text'>
                    📅 Date de sortie
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Provider Filter */}
          <View className='flex-1'>
            <TouchableOpacity
              onPress={() => setShowProviderDropdown(!showProviderDropdown)}
              className='flex-row items-center justify-between rounded-lg border border-light-border bg-light-surface px-3 py-2 dark:border-dark-border dark:bg-dark-surface'
            >
              <Text className='text-sm text-light-text dark:text-dark-text'>
                {filters.selectedProviders.size > 0
                  ? `${filters.selectedProviders.size} plateforme${filters.selectedProviders.size > 1 ? 's' : ''}`
                  : 'Toutes les plateformes'}
              </Text>
              <Text className='text-light-secondary dark:text-dark-secondary'>
                {showProviderDropdown ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {showProviderDropdown && (
              <View className='absolute top-12 z-10 max-h-48 w-full rounded-lg border border-light-border bg-light-background shadow-lg dark:border-dark-border dark:bg-dark-background'>
                <ScrollView className='max-h-48'>
                  {filters.selectedProviders.size > 0 && (
                    <TouchableOpacity
                      onPress={clearProviderFilters}
                      className='border-b border-light-border px-3 py-2 dark:border-dark-border'
                    >
                      <Text className='text-sm font-medium text-light-accent dark:text-dark-accent'>
                        Effacer les filtres
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
                          'bg-light-accent/10 dark:bg-dark-accent/10'
                      )}
                    >
                      <View
                        className={cn(
                          'mr-2 h-4 w-4 rounded border',
                          filters.selectedProviders.has(provider)
                            ? 'border-light-accent bg-light-accent dark:border-dark-accent dark:bg-dark-accent'
                            : 'border-light-border dark:border-dark-border'
                        )}
                      >
                        {filters.selectedProviders.has(provider) && (
                          <Text className='text-center text-xs leading-4 text-white'>
                            ✓
                          </Text>
                        )}
                      </View>
                      <Text className='text-sm text-light-text dark:text-dark-text'>
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

      <ScrollView onTouchStart={closeDropdowns}>
        {/* Gemini Response Section */}
        {geminiResponse && (
          <View className='mb-4 rounded-xl bg-light-accent/10 p-4 dark:bg-dark-accent/10'>
            <View className='mb-2 flex-row items-center'>
              <Text className='text-lg'>🤖</Text>
              <Text className='ml-2 text-sm font-medium text-light-accent dark:text-dark-accent'>
                Assistant IA
              </Text>
            </View>

            <Text className='text-sm leading-5 text-light-text dark:text-dark-text'>
              {geminiResponse}
            </Text>
          </View>
        )}

        <View className='pt-4'>
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
              <Text className='text-center text-lg font-medium leading-6 text-light-text-muted dark:text-dark-text-muted'>
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
                  key={movie.id}
                  from={{ opacity: 0, translateY: 30 }}
                  animate={{
                    opacity: 1,
                    translateY: 0,
                    height: expanded ? 'auto' : undefined,
                  }}
                  transition={{
                    delay: index * 150,
                    type: 'timing',
                    duration: 500,
                  }}
                  className='mb-4 rounded-xl bg-light-card dark:bg-dark-card'
                >
                  <View className='flex-row justify-between gap-4 p-4'>
                    {/* Left content */}
                    <View className='w-9/12'>
                      <Text className='mb-2 text-lg font-semibold text-light-text dark:text-dark-text'>
                        {movie.title || movie.name}
                      </Text>

                      <Text className='mb-3 text-sm text-light-secondary dark:text-dark-secondary'>
                        {expanded
                          ? movie.overview || t('movies.noDescription')
                          : movie.overview
                            ? movie.overview.length > 100
                              ? `${movie.overview.substring(0, 100)}...`
                              : movie.overview
                            : t('movies.noDescription')}
                      </Text>

                      {/* Streaming platforms */}
                      {streamingProviders[movie.id] &&
                        streamingProviders[movie.id].length > 0 && (
                          <View className={cn('mb-3', expanded && 'mt-4')}>
                            {expanded && (
                              <Text className='mb-2 text-sm font-semibold text-light-text dark:text-dark-text'>
                                {t('movies.availableOn')}
                              </Text>
                            )}

                            <View
                              className={cn(
                                expanded
                                  ? 'gap-1'
                                  : 'flex-row flex-wrap gap-1.5'
                              )}
                            >
                              {streamingProviders[movie.id]
                                .slice(0, expanded ? undefined : 4)
                                .map((provider, idx) => (
                                  <View
                                    key={idx}
                                    className={cn(
                                      'rounded-md',
                                      expanded
                                        ? 'flex-row items-center py-0.5'
                                        : 'bg-dark-surface dark:bg-light-surface'
                                    )}
                                  >
                                    <Image
                                      source={{
                                        uri: `https://image.tmdb.org/t/p/w92${provider.logo_path}`,
                                      }}
                                      className='h-[30px] w-[30px] rounded-md bg-dark-surface p-1 dark:bg-light-surface'
                                      resizeMode='contain'
                                    />

                                    {expanded && (
                                      <Text className='ml-2.5 text-sm font-medium text-light-text dark:text-dark-text'>
                                        {provider.provider_name}
                                      </Text>
                                    )}
                                  </View>
                                ))}
                            </View>
                          </View>
                        )}

                      {/* Main actors */}
                      {expanded &&
                        credits[movie.id] &&
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
                                    key={idx}
                                    className={cn(
                                      'flex-row items-center',
                                      idx <
                                        credits[movie.id].slice(0, 5).length -
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

                      {/* Additional information in expanded mode */}
                      {expanded && (
                        <View className='my-3'>
                          <View>
                            {(movie.release_date || movie.first_air_date) && (
                              <View
                                className={cn(
                                  'flex-row items-center gap-2',
                                  movie.vote_average > 0 && 'mb-1.5'
                                )}
                              >
                                <Text className='text-sm font-semibold text-light-text dark:text-dark-text'>
                                  📅 {t('movies.releaseDate')}
                                </Text>

                                <Text className='text-sm text-light-text dark:text-dark-text'>
                                  {new Date(
                                    movie.release_date ||
                                      movie.first_air_date ||
                                      ''
                                  ).toLocaleDateString()}
                                </Text>
                              </View>
                            )}

                            {movie.vote_average > 0 && (
                              <View className='flex-row items-center gap-2'>
                                <Text className='text-sm font-semibold text-light-text dark:text-dark-text'>
                                  ⭐ {t('movies.rating')}
                                </Text>

                                <View className='flex-row items-center'>
                                  <Text className='text-sm text-light-text dark:text-dark-text'>
                                    {movie.vote_average.toFixed(1)}
                                  </Text>

                                  <Text className='text-sm text-light-text dark:text-dark-text'>
                                    /10
                                  </Text>
                                </View>
                              </View>
                            )}
                          </View>
                        </View>
                      )}

                      {/* See more/less button */}
                      <TouchableOpacity
                        onPress={() => toggleCardExpansion(movie.id)}
                        className='self-start'
                      >
                        <Text className='text-sm font-medium text-light-accent dark:text-dark-accent'>
                          {expanded ? t('movies.seeLess') : t('movies.seeMore')}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Image on the right */}
                    {movie.poster_path && (
                      <View className='w-3/12'>
                        <Image
                          source={{
                            uri: `https://image.tmdb.org/t/p/w300${movie.poster_path}`,
                          }}
                          style={{
                            width: 80,
                            height: 120,
                            borderRadius: 8,
                          }}
                          resizeMode='cover'
                        />
                      </View>
                    )}
                  </View>
                </MotiView>
              );
            })
          )}
        </View>
      </ScrollView>
    </MotiView>
  );
}
