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
  trackFeedPageLoad,
} from '@/services/analytics';
import { getLanguageForTMDB } from '@/constants/languages';

const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 80 : 60;

export default function ForYouScreen() {
  const { t, language } = useLanguage();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<MovieResult[]>([]);
  const [providers, setProviders] = useState<
    Record<number, StreamingProvider[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(false);

  const pageRef = useRef(1);
  const isFetchingRef = useRef(false);
  const sessionStart = useRef(Date.now());
  const maxPageViewed = useRef(0);

  const tmdbLanguage = getLanguageForTMDB(language);

  const fetchPage = useCallback(
    async (page: number, existingItems: MovieResult[]) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      try {
        const exclude = existingItems.map(i => i.tmdb_id);
        const res = await backendAPIService.getFeed({
          page,
          size: 10,
          language: tmdbLanguage,
          exclude: page > 1 ? exclude : undefined,
        });
        if (res.success && res.data && (res.data.items?.length ?? 0) > 0) {
          const newItems = res.data.items;
          if (page === 1) {
            setItems(newItems);
            setProviders(res.data.providers || {});
          } else {
            setItems(prev => {
              const existingIds = new Set(prev.map(i => i.tmdb_id));
              const unique = newItems.filter(i => !existingIds.has(i.tmdb_id));
              return [...prev, ...unique];
            });
            setProviders(prev => ({ ...prev, ...(res.data.providers || {}) }));
          }
          setHasMore(res.data.hasMore);
          pageRef.current = page;
          trackFeedPageLoad(page, newItems.length);
        }
      } catch {
        if (page === 1) setError(true);
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    },
    [tmdbLanguage]
  );

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return;
    trackScreenView('for_you');
    fetchPage(1, []);
  }, [isAuthLoading, isAuthenticated, fetchPage]);

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
      // Prefetch next page when approaching the end
      if (hasMore && index >= items.length - 3) {
        fetchPage(pageRef.current + 1, items);
      }
    },
    [items, hasMore, fetchPage]
  );

  if (isLoading || isAuthLoading) {
    return (
      <View style={styles.centerContainer}>
        <MotiView
          from={{ scale: 0.8, opacity: 0.4 }}
          animate={{ scale: 1.2, opacity: 1 }}
          transition={{ type: 'timing', duration: 1200, loop: true }}
        >
          <Ionicons name='sparkles' size={40} color='#E50914' />
        </MotiView>
        <Text style={styles.loadingText}>{t('swipeDiscovery.loading')}</Text>
      </View>
    );
  }

  if (error || items.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name='film-outline' size={48} color='rgba(255,255,255,0.3)' />
        <Text style={styles.emptyText}>{t('swipeDiscovery.emptyFeed')}</Text>
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
        hasMore={hasMore}
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
          name='search'
          size={24}
          color='#fff'
          style={styles.iconShadow}
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
  iconShadow: {
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});
