import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { backendAPIService } from '@/services/backend-api.service';
import {
  getCardShadow,
  getSquircle,
  typography,
} from '@/utils/designHelpers';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export default function BecauseYouWatchedSection() {
  const { t, language, country } = useLanguage();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const tmdbLanguage =
    language === 'fr'
      ? 'fr-FR'
      : language === 'es'
        ? 'es-ES'
        : language === 'de'
          ? 'de-DE'
          : language === 'it'
            ? 'it-IT'
            : language === 'ja'
              ? 'ja-JP'
              : 'en-US';

  const { data } = useQuery({
    queryKey: ['becauseYouWatched', tmdbLanguage, country],
    queryFn: async () => {
      const res = await backendAPIService.getBecauseYouWatched({
        language: tmdbLanguage,
        country,
      });
      if (res.success && res.data) return res.data;
      return { sourceTitle: null, items: [] };
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  if (!data || !data.sourceTitle || data.items.length === 0) return null;

  return (
    <View className="mt-8">
      <Text
        style={typography.title3}
        className="mb-3 px-6 text-light-text dark:text-dark-text"
      >
        {t('home.becauseYouWatched').replace('{{title}}', data.sourceTitle)}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
      >
        {data.items.map((item, i) => (
          <TouchableOpacity
            key={item.tmdb_id || i}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({
                pathname: '/movie-detail' as never,
                params: {
                  tmdbId: String(item.tmdb_id),
                  mediaType: item.media_type || 'movie',
                  title: item.title || '',
                  posterPath: item.poster_path || '',
                  voteAverage: String(item.vote_average || 0),
                  overview: '',
                  providersJson: JSON.stringify(item.providers || []),
                  creditsJson: JSON.stringify([]),
                  detailedInfoJson: JSON.stringify({}),
                },
              });
            }}
            activeOpacity={0.7}
            style={{ width: 130 }}
          >
            <View
              style={[getSquircle(12), getCardShadow(isDark)]}
              className="h-[195px] overflow-hidden border border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface"
            >
              {item.poster_path ? (
                <Image
                  source={{ uri: `${TMDB_IMAGE_BASE}/w342${item.poster_path}` }}
                  className="h-full w-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="h-full w-full items-center justify-center">
                  <Ionicons
                    name="film-outline"
                    size={32}
                    color={isDark ? '#555' : '#ccc'}
                  />
                </View>
              )}
            </View>
            <Text
              className="mt-1.5 text-xs font-medium text-light-text dark:text-dark-text"
              numberOfLines={2}
            >
              {item.title}
            </Text>
            <View className="mt-0.5 flex-row items-center gap-1">
              {item.vote_average > 0 && (
                <>
                  <Ionicons name="star" size={10} color="#fbbf24" />
                  <Text className="text-xs text-light-muted dark:text-dark-muted">
                    {item.vote_average.toFixed(1)}
                  </Text>
                </>
              )}
            </View>
            {item.providers && item.providers.length > 0 && (
              <View className="mt-1 flex-row gap-1">
                {item.providers.slice(0, 3).map((p, pi) => (
                  <Image
                    key={pi}
                    source={{ uri: `${TMDB_IMAGE_BASE}/w92${p.logo_path}` }}
                    style={{ width: 20, height: 20, borderRadius: 4 }}
                  />
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
