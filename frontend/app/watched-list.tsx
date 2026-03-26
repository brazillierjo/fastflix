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
import { useTasteProfile, useDeleteRating } from '@/hooks/useRating';
import {
  getCardShadow,
  getSquircle,
  typography,
  getSystemBackground,
  getSecondaryBackground,
} from '@/utils/designHelpers';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

interface RatedMovie {
  tmdb_id: number;
  rating: number;
  title: string;
  media_type?: 'movie' | 'tv';
  poster_path?: string | null;
}

export default function WatchedListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useLanguage();
  const { ratedMovies, isLoading } = useTasteProfile();
  const { deleteRating } = useDeleteRating();

  const handlePress = useCallback(
    (item: RatedMovie) => {
      router.push({
        pathname: '/movie-detail',
        params: {
          id: item.tmdb_id,
          title: item.title,
          media_type: item.media_type || 'movie',
        },
      });
    },
    [router]
  );

  const handleLongPress = useCallback(
    (item: RatedMovie) => {
      Alert.alert(
        t('ratings.removeTitle'),
        t('ratings.removeMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.remove'),
            style: 'destructive',
            onPress: () => deleteRating(item.tmdb_id),
          },
        ]
      );
    },
    [t, deleteRating]
  );

  const renderStars = useCallback(
    (rating: number) => {
      if (rating === 0) {
        return (
          <View style={styles.watchedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#34C759" />
            <Text style={[styles.watchedText, { color: '#34C759' }]}>
              {t('movieDetail.watchedConfirm')}
            </Text>
          </View>
        );
      }
      return (
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= rating ? 'star' : 'star-outline'}
              size={14}
              color={star <= rating ? '#FFD700' : (isDark ? '#555' : '#ccc')}
            />
          ))}
        </View>
      );
    },
    [isDark, t]
  );

  const renderItem = useCallback(
    ({ item }: { item: RatedMovie }) => (
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
          resizeMode="cover"
        />
        <View style={styles.cardContent}>
          <Text
            style={[
              typography.headline,
              { color: isDark ? '#fff' : '#000' },
            ]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <View style={styles.ratingContainer}>
            {renderStars(item.rating)}
          </View>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={isDark ? '#555' : '#ccc'}
          style={styles.chevron}
        />
      </TouchableOpacity>
    ),
    [isDark, handlePress, handleLongPress, renderStars]
  );

  const keyExtractor = useCallback(
    (item: RatedMovie) => `watched-${item.tmdb_id}`,
    []
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: getSystemBackground(isDark) }]}
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
            name="chevron-back"
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
          {t('ratings.sectionTitle')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* List */}
      <FlatList
        data={ratedMovies}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="eye-outline"
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
                {t('ratings.emptyHome')}
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
  ratingContainer: {
    marginTop: 6,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  watchedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  watchedText: {
    ...typography.footnote,
    fontWeight: '600',
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
