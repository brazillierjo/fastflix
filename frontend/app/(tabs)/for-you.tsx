import { Ionicons } from '@expo/vector-icons';
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
import CinematicLoader from '@/components/CinematicLoader';
import SwipeDiscoveryView from '@/components/swipe-discovery/SwipeDiscoveryView';
import {
  trackScreenView,
  trackSwipeView,
  trackSwipeSession,
  trackFeedPageLoad,
} from '@/services/analytics';
import { getLanguageForTMDB } from '@/constants/languages';

const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 80 : 60;

type FeedState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      items: MovieResult[];
      providers: Record<number, StreamingProvider[]>;
      hasMore: boolean;
    };

export default function ForYouScreen() {
  const { t, language } = useLanguage();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [feed, setFeed] = useState<FeedState>({ status: 'loading' });
  const pageRef = useRef(1);
  const isFetchingRef = useRef(false);
  const sessionStart = useRef(Date.now());
  const maxPageViewed = useRef(0);

  const tmdbLanguage = getLanguageForTMDB(language);

  const fetchFeed = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setFeed({ status: 'loading' });

    try {
      const res = await backendAPIService.getFeed({
        page: 1,
        size: 10,
        language: tmdbLanguage,
      });

      if (!res.success) {
        setFeed({
          status: 'error',
          message: `${res.error?.message || 'API error'}`,
        });
        return;
      }

      const items = res.data?.items || [];
      if (items.length === 0) {
        setFeed({ status: 'error', message: 'No items returned' });
        return;
      }

      setFeed({
        status: 'ready',
        items,
        providers: res.data?.providers || {},
        hasMore: res.data?.hasMore ?? false,
      });
      pageRef.current = 1;
      trackFeedPageLoad(1, items.length);
    } catch (err) {
      setFeed({
        status: 'error',
        message: `${err instanceof Error ? err.message : 'Network error'}`,
      });
    } finally {
      isFetchingRef.current = false;
    }
  }, [tmdbLanguage]);

  const fetchNextPage = useCallback(async () => {
    if (feed.status !== 'ready' || isFetchingRef.current || !feed.hasMore)
      return;
    isFetchingRef.current = true;

    const nextPage = pageRef.current + 1;
    try {
      const res = await backendAPIService.getFeed({
        page: nextPage,
        size: 10,
        language: tmdbLanguage,
        exclude: feed.items.map(i => i.tmdb_id),
      });

      if (res.success && res.data?.items?.length) {
        const existingIds = new Set(feed.items.map(i => i.tmdb_id));
        const newItems = res.data.items.filter(
          i => !existingIds.has(i.tmdb_id)
        );

        setFeed(prev => {
          if (prev.status !== 'ready') return prev;
          return {
            ...prev,
            items: [...prev.items, ...newItems],
            providers: { ...prev.providers, ...(res.data?.providers || {}) },
            hasMore: res.data?.hasMore ?? false,
          };
        });
        pageRef.current = nextPage;
        trackFeedPageLoad(nextPage, newItems.length);
      }
    } catch {
      // Pagination failure is silent — don't break existing feed
    } finally {
      isFetchingRef.current = false;
    }
  }, [feed, tmdbLanguage]);

  // Fetch once when auth is ready — don't refetch on foreground resume
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return;
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    trackScreenView('for_you');
    fetchFeed();
  }, [isAuthLoading, isAuthenticated, fetchFeed]);

  // Session tracking
  useEffect(() => {
    const start = sessionStart.current;
    return () => {
      const seconds = Math.round((Date.now() - start) / 1000);
      if (maxPageViewed.current > 0) {
        trackSwipeSession(seconds, maxPageViewed.current + 1);
      }
    };
  }, []);

  const handlePageChanged = useCallback(
    (index: number) => {
      if (index > maxPageViewed.current) maxPageViewed.current = index;
      if (feed.status === 'ready') {
        if (feed.items[index]) {
          trackSwipeView(feed.items[index].tmdb_id, index, 'forYou');
        }
        if (feed.hasMore && index >= feed.items.length - 3) {
          fetchNextPage();
        }
      }
    },
    [feed, fetchNextPage]
  );

  // ── Loading ──
  if (feed.status === 'loading' || isAuthLoading) {
    return <CinematicLoader variant='fullscreen' />;
  }

  // ── Error — show what failed + retry ──
  if (feed.status === 'error') {
    return (
      <View style={styles.center}>
        <Ionicons
          name='alert-circle-outline'
          size={48}
          color='rgba(255,255,255,0.3)'
        />
        <Text style={styles.emptyText}>{t('swipeDiscovery.emptyFeed')}</Text>
        <Text style={styles.errorDetail}>{feed.message}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchFeed}
          activeOpacity={0.7}
        >
          <Text style={styles.retryText}>
            {t('common.retry') || 'Réessayer'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Feed ──
  return (
    <View style={styles.container}>
      <SwipeDiscoveryView
        items={feed.items}
        providers={feed.providers}
        credits={{}}
        crew={{}}
        detailedInfo={{}}
        hasMore={feed.hasMore}
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
  container: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
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
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  errorDetail: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 40,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  retryButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  retryText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  iconShadow: {
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});
