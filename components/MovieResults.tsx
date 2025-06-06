import { MotiView } from 'moti';
import React from 'react';
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
  const { t } = useLanguage();

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'timing',
        duration: 600,
      }}
    >
      <View className='flex-row items-center border-b border-neutral-200 bg-light-background px-6 py-4 dark:border-neutral-700 dark:bg-dark-background'>
        <TouchableOpacity onPress={onGoBack} className='mr-4 p-2'>
          <Text className='text-light-text dark:text-dark-text text-lg'>←</Text>
        </TouchableOpacity>
        <Text className='text-light-text dark:text-dark-text mr-10 flex-1 text-center text-lg font-semibold'>
          {t('movies.recommendations')}
        </Text>
      </View>

      <ScrollView className='flex-1'>
        <View className='px-6 pt-4'>
          {movies.length === 0 ? (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: 'timing',
                duration: 600,
                delay: 300,
              }}
              className='py-15 items-center justify-center'
            >
              <Text className='text-center text-lg font-medium leading-6 text-neutral-500 dark:text-neutral-400'>
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
                  key={movie.id}
                  from={{ opacity: 0, translateY: 30 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{
                    delay: index * 150,
                    type: 'timing',
                    duration: 500,
                  }}
                  className='mb-4 rounded-xl bg-light-background p-4 shadow-sm dark:bg-dark-surface'
                >
                  <View className='flex-row'>
                    {movie.poster_path && (
                      <MotiView
                        from={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: index * 150 + 200,
                          type: 'timing',
                          duration: 400,
                        }}
                        className='mr-3 rounded-lg bg-neutral-200 dark:bg-neutral-700'
                      >
                        <Image
                          source={{
                            uri: `https://image.tmdb.org/t/p/w300${movie.poster_path}`,
                          }}
                          className='w-15 h-22 rounded-lg'
                          resizeMode='cover'
                        />
                      </MotiView>
                    )}
                    <View className='flex-1'>
                      <Text className='text-light-text dark:text-dark-text mb-1 text-base font-semibold leading-5'>
                        {movie.title || movie.name}
                      </Text>

                      <Text className='mb-2 text-sm text-neutral-500 dark:text-neutral-400'>
                        {movie.overview
                          ? movie.overview.length > 100
                            ? movie.overview.substring(0, 100) + '...'
                            : movie.overview
                          : t('welcome.noDescription')}
                      </Text>

                      {streamingProviders[movie.id] &&
                        streamingProviders[movie.id].length > 0 && (
                          <View className='flex-row items-center gap-2'>
                            <View className='rounded bg-neutral-900 p-1 dark:bg-neutral-100'>
                              <Text className='text-xs font-semibold text-white dark:text-black'>
                                N
                              </Text>
                            </View>
                            <Text className='text-light-text dark:text-dark-text text-xs font-medium'>
                              {streamingProviders[movie.id][0]?.provider_name ||
                                'Netflix'}
                            </Text>
                          </View>
                        )}
                    </View>
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
