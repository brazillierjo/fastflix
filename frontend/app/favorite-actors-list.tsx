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
import { useFavoriteActors, useFavoriteActorToggle } from '@/hooks/useFavoriteActors';
import {
  getCardShadow,
  getSquircle,
  typography,
  getSystemBackground,
  getSecondaryBackground,
} from '@/utils/designHelpers';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

interface FavoriteActor {
  tmdb_id: number;
  name: string;
  profile_path?: string | null;
  known_for_department?: string | null;
}

export default function FavoriteActorsListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useLanguage();
  const { favoriteActors, isLoading } = useFavoriteActors();
  const { removeFavorite } = useFavoriteActorToggle();

  const handlePress = useCallback(
    (item: FavoriteActor) => {
      router.push({
        pathname: '/actor-detail',
        params: {
          personId: String(item.tmdb_id),
          personName: item.name,
          personImage: item.profile_path || '',
        },
      });
    },
    [router]
  );

  const handleLongPress = useCallback(
    (item: FavoriteActor) => {
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
    },
    [t, removeFavorite]
  );

  const renderItem = useCallback(
    ({ item }: { item: FavoriteActor }) => (
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
        <View style={styles.avatarContainer}>
          {item.profile_path ? (
            <Image
              source={{ uri: `${TMDB_IMAGE_BASE}/w185${item.profile_path}` }}
              style={styles.avatar}
              resizeMode='cover'
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: isDark ? '#2a2a2a' : '#e5e5e5' }]}>
              <Ionicons
                name='person-outline'
                size={24}
                color={isDark ? '#555' : '#aaa'}
              />
            </View>
          )}
        </View>
        <View style={styles.cardContent}>
          <Text
            style={[
              typography.headline,
              { color: isDark ? '#fff' : '#000' },
            ]}
            numberOfLines={2}
          >
            {item.name}
          </Text>
          {item.known_for_department && (
            <Text
              style={[
                typography.footnote,
                styles.departmentText,
                { color: isDark ? '#888' : '#999' },
              ]}
              numberOfLines={1}
            >
              {item.known_for_department}
            </Text>
          )}
        </View>
        <Ionicons
          name='chevron-forward'
          size={18}
          color={isDark ? '#555' : '#ccc'}
          style={styles.chevron}
        />
      </TouchableOpacity>
    ),
    [isDark, handlePress, handleLongPress]
  );

  const keyExtractor = useCallback(
    (item: FavoriteActor) => `fav-actor-${item.tmdb_id}`,
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
          {t('favoriteActors.sectionTitle')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* List */}
      <FlatList
        data={favoriteActors}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name='heart-outline'
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
                {t('favoriteActors.emptyHome')}
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
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  departmentText: {
    marginTop: 4,
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
