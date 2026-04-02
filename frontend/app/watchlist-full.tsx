import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWatchlist } from '@/hooks/useWatchlist';
import { WatchlistItem } from '@/types/api';
import {
  getCardShadow,
  getSquircle,
  typography,
  getSystemBackground,
  getSecondaryBackground,
} from '@/utils/designHelpers';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export default function WatchlistFullScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useLanguage();
  const { items, isLoading, removeFromWatchlist } = useWatchlist();

  const handlePress = useCallback(
    (item: WatchlistItem) => {
      router.push({
        pathname: '/movie-detail',
        params: {
          id: item.tmdb_id,
          title: item.title,
          media_type: item.media_type,
        },
      });
    },
    [router]
  );

  const handleLongPress = useCallback(
    (item: WatchlistItem) => {
      Alert.alert(t('watchlist.removeTitle'), t('watchlist.removeMessage'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: () => removeFromWatchlist(item.id),
        },
      ]);
    },
    [t, removeFromWatchlist]
  );

  const renderProviders = useCallback(
    (item: WatchlistItem) => {
      if (!item.providers || item.providers.length === 0) return null;
      return (
        <View style={styles.providersRow}>
          {item.providers.slice(0, 4).map(provider => (
            <Image
              key={provider.provider_id}
              source={{ uri: `${TMDB_IMAGE_BASE}/w45${provider.logo_path}` }}
              style={[styles.providerLogo, { borderRadius: 6 }]}
            />
          ))}
          {item.providers.length > 4 && (
            <Text
              style={[typography.caption1, { color: isDark ? '#888' : '#999' }]}
            >
              +{item.providers.length - 4}
            </Text>
          )}
        </View>
      );
    },
    [isDark]
  );

  const renderItem = useCallback(
    ({ item }: { item: WatchlistItem }) => (
      <TouchableOpacity
        style={[
          styles.card,
          getSquircle(12),
          getCardShadow(isDark),
          { backgroundColor: getSecondaryBackground(isDark) },
        ]}
        activeOpacity={0.7}
        onPress={() => handlePress(item)}
        onLongPress={() => handleLongPress(item)}
      >
        <Image
          source={
            item.poster_path
              ? { uri: `${TMDB_IMAGE_BASE}/w185${item.poster_path}` }
              : undefined
          }
          style={[styles.poster, { borderRadius: 8 }]}
          resizeMode='cover'
        />
        <View style={styles.cardContent}>
          <Text
            style={[typography.headline, { color: isDark ? '#fff' : '#000' }]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          {renderProviders(item)}
        </View>
        <Ionicons
          name='chevron-forward'
          size={18}
          color={isDark ? '#555' : '#ccc'}
          style={styles.chevron}
        />
      </TouchableOpacity>
    ),
    [isDark, handlePress, handleLongPress, renderProviders]
  );

  const keyExtractor = useCallback(
    (item: WatchlistItem) => `watchlist-${item.id}`,
    []
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: getSystemBackground(isDark) },
      ]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons
            name='chevron-back'
            size={28}
            color={isDark ? '#fff' : '#000'}
          />
        </TouchableOpacity>
        <Text
          style={[
            typography.title2,
            styles.headerTitle,
            { color: isDark ? '#fff' : '#000' },
          ]}
        >
          {t('watchlist.sectionTitle')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* List */}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name='bookmark-outline'
                size={48}
                color={isDark ? '#555' : '#ccc'}
              />
              <Text
                style={[
                  typography.body,
                  styles.emptyText,
                  { color: isDark ? '#888' : '#999' },
                ]}
              >
                {t('watchlist.emptyHome')}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 36,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    overflow: 'hidden',
  },
  poster: {
    width: 60,
    height: 90,
    backgroundColor: '#2a2a2a',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  providersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  providerLogo: {
    width: 24,
    height: 24,
  },
  chevron: {
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
