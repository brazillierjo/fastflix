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
      {/* Header with back button and title */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 24,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#f0f0f0',
          backgroundColor: '#fff',
        }}
      >
        <TouchableOpacity
          onPress={onGoBack}
          style={{
            padding: 8,
            marginRight: 16,
          }}
        >
          <Text style={{ fontSize: 18, color: '#000' }}>←</Text>
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#000',
            flex: 1,
            textAlign: 'center',
            marginRight: 42,
          }}
        >
          {t('movies.recommendations')}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
          {movies.length === 0 ? (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: 'timing',
                duration: 600,
                delay: 300,
              }}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 60,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '500',
                  color: '#666',
                  textAlign: 'center',
                  lineHeight: 24,
                }}
              >
                {t('movies.noRecommendations')}
              </Text>
            </MotiView>
          ) : (
            movies.map((movie, index) => {
              // Security check
              if (!movie || !movie.id || (!movie.title && !movie.name)) {
                return null;
              }

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
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  <View style={{ flexDirection: 'row' }}>
                    {movie.poster_path && (
                      <MotiView
                        from={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: index * 150 + 200,
                          type: 'timing',
                          duration: 400,
                        }}
                        style={{
                          backgroundColor: '#f0f0f0',
                          borderRadius: 8,
                          marginRight: 12,
                        }}
                      >
                        <Image
                          source={{
                            uri: `https://image.tmdb.org/t/p/w300${movie.poster_path}`,
                          }}
                          style={{
                            width: 60,
                            height: 90,
                            borderRadius: 8,
                          }}
                          resizeMode='cover'
                        />
                      </MotiView>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: '#000',
                          marginBottom: 4,
                          lineHeight: 20,
                        }}
                      >
                        {movie.title || movie.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          color: '#666',
                          marginBottom: 8,
                        }}
                      >
                        {movie.overview
                          ? movie.overview.length > 100
                            ? movie.overview.substring(0, 100) + '...'
                            : movie.overview
                          : t('welcome.noDescription')}
                      </Text>
                      {streamingProviders[movie.id] &&
                        streamingProviders[movie.id].length > 0 && (
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 8,
                            }}
                          >
                            <View
                              style={{
                                backgroundColor: '#000',
                                padding: 4,
                                borderRadius: 4,
                              }}
                            >
                              <Text
                                style={{
                                  color: '#fff',
                                  fontSize: 10,
                                  fontWeight: '600',
                                }}
                              >
                                N
                              </Text>
                            </View>
                            <Text
                              style={{
                                fontSize: 12,
                                color: '#000',
                                fontWeight: '500',
                              }}
                            >
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
