import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/RevenueCatContext';
import {
  backendAPIService,
  type MovieResult,
  type StreamingProvider,
} from '@/services/backend-api.service';
import SwipeDiscoveryView from '@/components/swipe-discovery/SwipeDiscoveryView';
import {
  trackScreenView,
  trackSwipeView,
  trackSwipeSession,
} from '@/services/analytics';

const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 80 : 60;

export default function ForYouScreen() {
  const { t, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { hasUnlimitedAccess } = useSubscription();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<MovieResult[]>([]);
  const [providers, setProviders] = useState<
    Record<number, StreamingProvider[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const sessionStart = useRef(Date.now());
  const maxPageViewed = useRef(0);

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

  const fetchFeed = useCallback(async () => {
    setIsLoading(true);
    setError(false);

    try {
      // Premium: AI-powered personalized recommendations
      if (isAuthenticated && hasUnlimitedAccess) {
        const res = await backendAPIService.getForYou({
          language: tmdbLanguage,
        });
        if (
          res.success &&
          res.data &&
          res.data.recommendations &&
          res.data.recommendations.length > 0
        ) {
          setItems(res.data.recommendations);
          setProviders(res.data.streamingProviders || {});
          setIsLoading(false);
          return;
        }
      }

      // Free/guest: trending feed
      const res = await backendAPIService.getTrending({
        language: tmdbLanguage,
      });
      if (res.success && res.data) {
        interface TrendingRaw {
          tmdb_id: number;
          title: string;
          media_type?: 'movie' | 'tv';
          poster_path?: string | null;
          vote_average?: number;
          genre_ids?: number[];
        }
        const trendingItems: MovieResult[] = (
          res.data as TrendingRaw[]
        ).map((item) => ({
            tmdb_id: item.tmdb_id,
            title: item.title,
            media_type: item.media_type || 'movie',
            overview: '',
            poster_path: item.poster_path || null,
            backdrop_path: null,
            vote_average: item.vote_average || 0,
            vote_count: 0,
            genre_ids: item.genre_ids || [],
            popularity: 0,
          })
        );
        setItems(trendingItems);
        setProviders({});
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, hasUnlimitedAccess, tmdbLanguage]);

  useEffect(() => {
    trackScreenView('for_you');
    fetchFeed();
  }, [fetchFeed]);

  // Session tracking on unmount
  useEffect(() => {
    const startTime = sessionStart.current;
    return () => {
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      if (maxPageViewed.current > 0) {
        trackSwipeSession(durationSeconds, maxPageViewed.current + 1);
      }
    };
  }, []);

  const handlePageChanged = useCallback(
    (index: number) => {
      if (index > maxPageViewed.current) {
        maxPageViewed.current = index;
      }
      if (items[index]) {
        trackSwipeView(items[index].tmdb_id, index, 'forYou');
      }
    },
    [items]
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <MotiView
          from={{ scale: 0.8, opacity: 0.4 }}
          animate={{ scale: 1.2, opacity: 1 }}
          transition={{ type: 'timing', duration: 1200, loop: true }}
        >
          <Ionicons name="sparkles" size={40} color="#E50914" />
        </MotiView>
        <Text style={styles.loadingText}>
          {t('swipeDiscovery.loading')}
        </Text>
      </View>
    );
  }

  // Error / empty state
  if (error || items.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="film-outline" size={48} color="rgba(255,255,255,0.3)" />
        <Text style={styles.emptyText}>
          {t('swipeDiscovery.emptyFeed')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SwipeDiscoveryView
        items={items}
        providers={providers}
        credits={{}}
        crew={{}}
        detailedInfo={{}}
        hasMore={false}
        onPageChanged={handlePageChanged}
        hideHeader
        bottomInset={TAB_BAR_HEIGHT}
      />
      <TouchableOpacity
        style={[styles.searchButton, { top: insets.top + 8 }]}
        onPress={() => router.push('/search' as never)}
        activeOpacity={0.6}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name="search"
          size={24}
          color="#fff"
          style={{
            textShadowColor: 'rgba(0,0,0,0.7)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 6,
          }}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  searchButton: {
    position: 'absolute',
    right: 14,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    fontWeight: '500',
    marginTop: 8,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
});
