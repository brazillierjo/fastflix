/**
 * NewReleasesSection - Shows movies and TV released this week on user's platforms
 */

import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCardShadow, getSquircle, typography } from '@/utils/designHelpers';
import { useQuery } from '@tanstack/react-query';
import { backendAPIService } from '@/services/backend-api.service';
import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Skeleton } from '@/components/Skeleton';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

interface NewRelease {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  overview: string;
  media_type: 'movie' | 'tv';
  release_date?: string;
}

interface NewReleasesData {
  movies: NewRelease[];
  tvShows: NewRelease[];
  providers: Record<number, { provider_name: string; logo_path: string }[]>;
  dateRange: { from: string; to: string };
}

export default function NewReleasesSection() {
  const { t, language, country } = useLanguage();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [activeTab, setActiveTab] = useState<'movies' | 'tv'>('movies');

  const tmdbLanguage = language?.includes('-')
    ? language
    : `${language || 'en'}-${(country || 'US').toUpperCase()}`;
  const tmdbCountry = (country || 'US').toUpperCase();

  const { data, isLoading } = useQuery<NewReleasesData>({
    queryKey: ['newReleases', tmdbLanguage, tmdbCountry],
    queryFn: async () => {
      const response = await backendAPIService.getNewReleases({
        language: tmdbLanguage,
        country: tmdbCountry,
      });
      if (response.success && response.data) {
        return response.data as NewReleasesData;
      }
      return { movies: [], tvShows: [], providers: {}, dateRange: { from: '', to: '' } };
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const items = activeTab === 'movies' ? (data?.movies ?? []) : (data?.tvShows ?? []);
  const providers = data?.providers ?? {};

  if (!isAuthenticated || (items.length === 0 && !isLoading)) return null;

  return (
    <View
      className='mt-8'
    >
      {/* Header */}
      <View className='flex-row items-center justify-between px-6'>
        <View>
          <Text
            style={typography.title3}
            className='text-light-text dark:text-dark-text'
          >
            {t('newReleases.title') || 'New This Week'}
          </Text>
          <Text className='mt-0.5 text-xs text-light-muted dark:text-dark-muted'>
            {t('newReleases.subtitle') || 'On your platforms'}
          </Text>
        </View>
      </View>

      {/* Movies / TV toggle */}
      <View className='mt-3 flex-row gap-2 px-6'>
        <TouchableOpacity
          onPress={() => setActiveTab('movies')}
          style={getSquircle(10)}
          className={`px-4 py-1.5 ${activeTab === 'movies' ? 'bg-netflix-500' : isDark ? 'bg-white/10' : 'bg-black/5'}`}
        >
          <Text
            className={`text-sm font-medium ${activeTab === 'movies' ? 'text-white' : 'text-light-text dark:text-dark-text'}`}
          >
            {t('filters.moviesOnly') || 'Movies'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('tv')}
          style={getSquircle(10)}
          className={`px-4 py-1.5 ${activeTab === 'tv' ? 'bg-netflix-500' : isDark ? 'bg-white/10' : 'bg-black/5'}`}
        >
          <Text
            className={`text-sm font-medium ${activeTab === 'tv' ? 'text-white' : 'text-light-text dark:text-dark-text'}`}
          >
            {t('filters.tvShowsOnly') || 'TV Shows'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View className='mt-3 flex-row gap-3 px-6'>
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} width={130} height={195} borderRadius={12} />
          ))}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 12, paddingTop: 12 }}
        >
          {items.map((item, i) => {
            const itemProviders = providers[item.tmdb_id] || [];
            return (
              <View
                key={item.tmdb_id}
              >
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/movie-detail' as never,
                      params: {
                        tmdbId: String(item.tmdb_id),
                        mediaType: item.media_type,
                        title: item.title,
                        posterPath: item.poster_path || '',
                        voteAverage: String(item.vote_average || 0),
                        overview: item.overview || '',
                        providersJson: JSON.stringify(itemProviders),
                        creditsJson: JSON.stringify([]),
                        detailedInfoJson: JSON.stringify({}),
                      },
                    })
                  }
                  activeOpacity={0.7}
                  style={{ width: 130 }}
                >
                  <View
                    style={[getSquircle(12), getCardShadow(isDark)]}
                    className='h-[195px] overflow-hidden border border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface'
                  >
                    {item.poster_path ? (
                      <Image
                        source={{ uri: `${TMDB_IMAGE_BASE}/w342${item.poster_path}` }}
                        className='h-full w-full'
                        resizeMode='cover'
                      />
                    ) : (
                      <View className='flex-1 items-center justify-center'>
                        <Ionicons
                          name='image-outline'
                          size={28}
                          color={isDark ? '#404040' : '#d4d4d4'}
                        />
                      </View>
                    )}
                  </View>
                  <Text
                    className='mt-1.5 text-xs font-medium text-light-text dark:text-dark-text'
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  {/* Provider logos */}
                  {itemProviders.length > 0 && (
                    <View className='mt-1 flex-row gap-1'>
                      {itemProviders.slice(0, 3).map((p, pi) => (
                        <Image
                          key={pi}
                          source={{ uri: `${TMDB_IMAGE_BASE}/w45${p.logo_path}` }}
                          style={{ width: 16, height: 16, borderRadius: 4 }}
                        />
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
