/**
 * FavoriteActorsSection - Favorite actors section for the home screen
 * Shows actors as circular profile images in a horizontal scroll
 * Limited to 7 items with "See more" button linking to full list
 */

import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useFavoriteActors,
  useFavoriteActorToggle,
} from '@/hooks/useFavoriteActors';
import { getSquircle, typography } from '@/utils/designHelpers';
import { Skeleton } from '@/components/Skeleton';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
const MAX_ITEMS = 7;

export default function FavoriteActorsSection() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { favoriteActors, isLoading } = useFavoriteActors();
  const { removeFavorite } = useFavoriteActorToggle();

  if (!isAuthenticated) return null;

  const displayItems = favoriteActors.slice(0, MAX_ITEMS);
  const hasMore = favoriteActors.length > MAX_ITEMS;

  return (
    <View className='mt-8'>
      <View className='mb-3 flex-row items-center justify-between px-6'>
        <View className='flex-row items-center gap-2'>
          <Ionicons name='heart' size={18} color='#E50914' />
          <Text
            style={typography.title3}
            className='text-light-text dark:text-dark-text'
          >
            {t('favoriteActors.sectionTitle')}
          </Text>
        </View>
        {favoriteActors.length > 0 && (
          <TouchableOpacity
            onPress={() => router.push('/favorite-actors-list' as never)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text className='text-sm font-medium text-netflix-500'>
              {t('common.seeAll') || 'See all'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Empty state */}
      {!isLoading && favoriteActors.length === 0 && (
        <View className='px-6'>
          <View
            style={[getSquircle(14)]}
            className='flex-row items-center gap-3 border border-dashed border-light-border bg-light-surface/50 px-4 py-4 dark:border-dark-border dark:bg-dark-surface/50'
          >
            <Ionicons
              name='heart-outline'
              size={24}
              color={isDark ? '#525252' : '#a3a3a3'}
            />
            <Text className='flex-1 text-sm text-light-muted dark:text-dark-muted'>
              {t('favoriteActors.emptyHome')}
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
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={{ alignItems: 'center', width: 100 }}>
              <Skeleton width={100} height={100} borderRadius={50} />
              <Skeleton
                width={70}
                height={12}
                borderRadius={6}
                style={{ marginTop: 8 }}
              />
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
        >
          {displayItems.map((item, i) => (
            <View key={`${item.tmdb_id}-${i}`}>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/actor-detail' as never,
                    params: {
                      personId: String(item.tmdb_id),
                      personName: item.name,
                      personImage: item.profile_path || '',
                    },
                  })
                }
                onLongPress={() => {
                  Alert.alert(
                    t('favoriteActors.removeTitle'),
                    t('favoriteActors.removeMessage'),
                    [
                      { text: t('common.cancel'), style: 'cancel' },
                      {
                        text: t('common.remove'),
                        style: 'destructive',
                        onPress: () => removeFavorite(item.tmdb_id),
                      },
                    ]
                  );
                }}
                activeOpacity={0.7}
                style={{ width: 100, alignItems: 'center' }}
              >
                <View
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    overflow: 'hidden',
                    backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                  }}
                >
                  {item.profile_path ? (
                    <Image
                      source={{
                        uri: `${TMDB_IMAGE_BASE}/w185${item.profile_path}`,
                      }}
                      style={{ width: 100, height: 100 }}
                      resizeMode='cover'
                    />
                  ) : (
                    <View
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons
                        name='person-outline'
                        size={28}
                        color={isDark ? '#404040' : '#d4d4d4'}
                      />
                    </View>
                  )}
                </View>
                <Text
                  className='mt-1.5 text-xs font-medium text-light-text dark:text-dark-text'
                  numberOfLines={1}
                  style={{ textAlign: 'center', maxWidth: 100 }}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* See more button */}
          {hasMore && (
            <TouchableOpacity
              onPress={() => router.push('/favorite-actors-list' as never)}
              activeOpacity={0.7}
              style={{
                width: 100,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: isDark ? '#333' : '#d4d4d4',
                  backgroundColor: isDark
                    ? 'rgba(30,30,30,0.5)'
                    : 'rgba(245,245,245,0.5)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name='chevron-forward-circle-outline'
                  size={28}
                  color={isDark ? '#525252' : '#a3a3a3'}
                />
                <Text className='mt-1 text-xs font-medium text-light-muted dark:text-dark-muted'>
                  {t('common.seeMore')}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}
