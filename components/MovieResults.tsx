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

interface MovieResultsProps {
  movies: Movie[];
  streamingProviders: { [key: number]: StreamingProvider[] };
  onGoBack: () => void;
}

export default function MovieResults({
  movies,
  streamingProviders,
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
                          <View className='mb-3'>
                            <View className='flex-row flex-wrap gap-2'>
                              {streamingProviders[movie.id]
                                .slice(0, expanded ? undefined : 4)
                                .map((provider, idx) => (
                                  <View
                                    key={idx}
                                    className='rounded-lg bg-light-surface p-1 dark:bg-dark-surface'
                                  >
                                    <Image
                                      source={{
                                        uri: `https://image.tmdb.org/t/p/w92${provider.logo_path}`,
                                      }}
                                      style={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: 4,
                                      }}
                                      resizeMode='contain'
                                    />
                                  </View>
                                ))}
                            </View>
                          </View>
                        )}

                      {/* Additional information in expanded mode */}
                      {expanded && (
                        <View className='mb-3 space-y-2'>
                          {(movie.release_date || movie.first_air_date) && (
                            <View className='flex-row'>
                              <Text className='font-medium text-light-text dark:text-dark-text'>
                                {t('movies.releaseDate')}:
                              </Text>
                              <Text className='text-light-secondary dark:text-dark-secondary'>
                                {new Date(
                                  movie.release_date ||
                                    movie.first_air_date ||
                                    ''
                                ).toLocaleDateString()}
                              </Text>
                            </View>
                          )}
                          {movie.vote_average > 0 && (
                            <View className='flex-row'>
                              <Text className='font-medium text-light-text dark:text-dark-text'>
                                {t('movies.rating')}:
                              </Text>
                              <Text className='text-light-secondary dark:text-dark-secondary'>
                                {movie.vote_average.toFixed(1)}/10
                              </Text>
                            </View>
                          )}
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
