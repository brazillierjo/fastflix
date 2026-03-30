import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { getSquircle } from '@/utils/designHelpers';
import { Skeleton } from '@/components/Skeleton';
import type { SimilarMovie } from './types';

interface SimilarSectionProps {
  similarMovies: SimilarMovie[];
  loading: boolean;
  currentMediaType: 'movie' | 'tv';
}

export default function SimilarSection({ similarMovies, loading, currentMediaType: _currentMediaType }: SimilarSectionProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useLanguage();

  const handlePress = (similar: SimilarMovie) => {
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

  return (
    <MotiView
      from={{ opacity: 0, translateY: 15 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400, delay: 350 }}
    >
      <View className='mb-6'>
        <Text className='mb-3 text-lg font-semibold text-light-text dark:text-dark-text'>
          {t('movieDetail.similar')}
        </Text>
        {loading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} width={120} height={180} borderRadius={12} />
            ))}
          </ScrollView>
        ) : similarMovies.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {similarMovies.map((similar, idx) => (
              <TouchableOpacity
                key={`similar-${similar.id}-${idx}`}
                onPress={() => handlePress(similar)}
                activeOpacity={0.7}
                style={{ width: 120 }}
                accessibilityLabel={`Similar: ${similar.title}`}
                accessibilityRole='button'
              >
                <View
                  style={[getSquircle(12), { width: 120, height: 180, overflow: 'hidden' }]}
                  className='mb-1.5 items-center justify-center bg-light-surface dark:bg-dark-surface'
                >
                  {similar.posterPath ? (
                    <Image
                      source={{ uri: `https://image.tmdb.org/t/p/w342${similar.posterPath}` }}
                      style={{ width: 120, height: 180 }}
                      resizeMode='cover'
                    />
                  ) : (
                    <View className='flex-1 items-center justify-center'>
                      <Ionicons name='film-outline' size={32} color={isDark ? '#555' : '#bbb'} />
                    </View>
                  )}
                </View>
                <Text className='text-xs font-medium text-light-text dark:text-dark-text' numberOfLines={2}>
                  {similar.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : null}
      </View>
    </MotiView>
  );
}
