import { cn } from '@/utils/cn';
import { MotiView } from 'moti';
import React, { useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';

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
  onGoBack: () => void;
}

export default function MovieResults({
  movies,
  streamingProviders,
  credits,
  onGoBack,
}: MovieResultsProps) {
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const { t } = useLanguage();

  const toggleCardExpansion = (movieId: number) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(movieId)) newSet.delete(movieId);
      else newSet.add(movieId);

      return newSet;
    });
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
    >
      <View className='relative flex-row items-center justify-center border-b border-light-border bg-light-background pb-4 dark:border-dark-border dark:bg-dark-background'>
        <TouchableOpacity onPress={onGoBack} className='absolute left-4 z-10'>
          <Text className='text-lg text-light-text dark:text-dark-text'>←</Text>
        </TouchableOpacity>

        <Text className='text-center text-lg font-semibold text-light-text dark:text-dark-text'>
          {t('movies.recommendations')}
        </Text>
      </View>

      <ScrollView>
        <View className='pt-4'>
          {movies.length === 0 ? (
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
                  className='mb-4 rounded-xl bg-white shadow-sm dark:bg-dark-card'
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
