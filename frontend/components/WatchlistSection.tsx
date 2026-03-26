/**
 * WatchlistSection - "Ma liste" section for the home screen
 * Shows user's watchlist items as a horizontal scroll
 */

import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWatchlist } from '@/hooks/useWatchlist';
import {
  getCardShadow,
  getSquircle,
  typography,
} from '@/utils/designHelpers';
import { Skeleton } from '@/components/Skeleton';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export default function WatchlistSection({ delay = 350 }: { delay?: number }) {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { items, isLoading } = useWatchlist();

  if (!isAuthenticated) return null;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 15 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay, type: 'timing', duration: 600 }}
      className='mt-8'
    >
      <View className='mb-3 px-6'>
        <Text
          style={typography.title3}
          className='text-light-text dark:text-dark-text'
        >
          {t('watchlist.sectionTitle')}
        </Text>
      </View>

      {/* Empty state */}
      {!isLoading && items.length === 0 && (
        <View className='px-6'>
          <View
            style={[getSquircle(14)]}
            className='flex-row items-center gap-3 border border-dashed border-light-border bg-light-surface/50 px-4 py-4 dark:border-dark-border dark:bg-dark-surface/50'
          >
            <Ionicons name='bookmark-outline' size={24} color={isDark ? '#525252' : '#a3a3a3'} />
            <Text className='flex-1 text-sm text-light-muted dark:text-dark-muted'>
              {t('watchlist.emptyHome')}
            </Text>
          </View>
        </View>
      )}

      {isLoading ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
        >
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width={130} height={195} borderRadius={12} />
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
        >
          {items.map((item, i) => (
            <MotiView
              key={item.id}
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: delay + i * 60,
                type: 'timing',
                duration: 400,
              }}
            >
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/movie-detail' as never,
                    params: {
                      tmdbId: String(item.tmdb_id),
                      mediaType: item.media_type,
                      title: item.title || '',
                      posterPath: item.poster_path || '',
                      voteAverage: '0',
                      overview: '',
                      providersJson: JSON.stringify(item.providers || []),
                      creditsJson: '[]',
                      detailedInfoJson: '{}',
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
                      source={{
                        uri: `${TMDB_IMAGE_BASE}/w342${item.poster_path}`,
                      }}
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
                  {/* Watched badge */}
                  {item.watched === 1 && (
                    <View className='absolute right-1.5 top-1.5 rounded-full bg-green-500/90 p-1'>
                      <Ionicons name='checkmark' size={10} color='#fff' />
                    </View>
                  )}
                </View>
                <Text
                  className='mt-1.5 text-xs font-medium text-light-text dark:text-dark-text'
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                {item.providers?.length > 0 && (
                  <View className='mt-1 flex-row gap-1'>
                    {item.providers.slice(0, 3).map((p, pi) => (
                      <Image
                        key={pi}
                        source={{ uri: `${TMDB_IMAGE_BASE}/w45${p.logo_path}` }}
                        style={{ width: 16, height: 16, borderRadius: 4 }}
                      />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            </MotiView>
          ))}
        </ScrollView>
      )}
    </MotiView>
  );
}
