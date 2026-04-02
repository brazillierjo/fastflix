import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import PagerView from 'react-native-pager-view';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { trackSwipeToDetail } from '@/services/analytics';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/RevenueCatContext';
import SubscriptionModal from '@/components/SubscriptionModal';
import SwipeCard from './SwipeCard';
import SwipeActions from './SwipeActions';
import SwipeHeader from './SwipeHeader';
import type {
  MovieResult,
  StreamingProvider,
  Cast,
  CrewMember,
  DetailedInfo,
} from '@/services/backend-api.service';

const FREE_SWIPE_LIMIT = 5;
const SWIPE_LEFT_THRESHOLD = 100;
const { width: SCREEN_W } = Dimensions.get('window');

const TMDB_IMG = 'https://image.tmdb.org/t/p';
const HERO_H = 300;

interface SwipeLeftItem {
  title: string;
  poster_path: string | null;
  vote_average: number;
  media_type: 'movie' | 'tv';
  overview: string;
  release_date?: string;
  first_air_date?: string;
}

/**
 * Swipe left to reveal a movie-detail preview behind, then navigate.
 */
function SwipeLeftDetector({
  children,
  onSwipeLeft,
  item,
}: {
  children: React.ReactNode;
  onSwipeLeft: () => void;
  item: SwipeLeftItem;
}) {
  const pan = useRef(new Animated.Value(0)).current;
  const navigated = useRef(false);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, { dx, dy }) =>
          Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(dx) > 15,
        onPanResponderMove: (_evt, { dx }) => {
          if (dx < 0) pan.setValue(dx);
        },
        onPanResponderRelease: (_evt, { dx, vx }) => {
          if (
            !navigated.current &&
            (dx < -SWIPE_LEFT_THRESHOLD || (dx < -50 && vx < -0.5))
          ) {
            navigated.current = true;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Animated.timing(pan, {
              toValue: -SCREEN_W,
              duration: 200,
              useNativeDriver: true,
            }).start(() => {
              onSwipeLeft();
              setTimeout(() => {
                pan.setValue(0);
                navigated.current = false;
              }, 400);
            });
          } else {
            Animated.spring(pan, {
              toValue: 0,
              useNativeDriver: true,
              tension: 80,
              friction: 10,
            }).start();
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(pan, { toValue: 0, useNativeDriver: true }).start();
        },
      }),
    [onSwipeLeft, pan]
  );

  const posterUri = item.poster_path
    ? `${TMDB_IMG}/w780${item.poster_path}`
    : null;
  const year = item.release_date
    ? item.release_date.substring(0, 4)
    : item.first_air_date
      ? item.first_air_date.substring(0, 4)
      : '';

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {/* Detail preview behind — mimics movie-detail hero */}
      <View style={peekStyles.container} pointerEvents="none">
        {/* Hero image */}
        {posterUri && (
          <Image
            source={{ uri: posterUri }}
            style={peekStyles.heroImage}
            resizeMode="cover"
          />
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)', '#000']}
          locations={[0, 0.4, 0.75, 1]}
          style={peekStyles.heroGradient}
        />
        {/* Title + meta over the hero */}
        <View style={peekStyles.heroInfo}>
          <Text style={peekStyles.heroTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={peekStyles.heroMeta}>
            {item.vote_average > 0 && (
              <>
                <Ionicons name="star" size={14} color="#E50914" />
                <Text style={peekStyles.heroRating}>
                  {item.vote_average.toFixed(1)}
                </Text>
              </>
            )}
            {year ? <Text style={peekStyles.heroYear}>{year}</Text> : null}
            <View style={peekStyles.heroBadge}>
              <Text style={peekStyles.heroBadgeText}>
                {item.media_type === 'tv' ? 'TV' : 'Film'}
              </Text>
            </View>
          </View>
        </View>
        {/* Synopsis preview below hero */}
        <View style={peekStyles.synopsisArea}>
          <Text style={peekStyles.synopsisText} numberOfLines={4}>
            {item.overview}
          </Text>
        </View>
      </View>

      {/* Card that slides left */}
      <Animated.View style={{ flex: 1, transform: [{ translateX: pan }] }}>
        {children}
      </Animated.View>
    </View>
  );
}

const peekStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  heroImage: {
    width: '100%',
    height: HERO_H,
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HERO_H,
  },
  heroInfo: {
    position: 'absolute',
    top: HERO_H - 70,
    left: 16,
    right: 16,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroRating: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  heroYear: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  heroBadge: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  heroBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  synopsisArea: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  synopsisText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    lineHeight: 20,
  },
});

interface SwipeDiscoveryViewProps {
  items: MovieResult[];
  providers: Record<number, StreamingProvider[]>;
  credits: Record<number, Cast[]>;
  crew: Record<number, CrewMember[]>;
  detailedInfo: Record<number, DetailedInfo>;
  hasMore: boolean;
  onPageChanged?: (index: number) => void;
  hideHeader?: boolean;
  bottomInset?: number;
}

export default function SwipeDiscoveryView({
  items,
  providers,
  credits,
  crew,
  detailedInfo,
  hasMore,
  onPageChanged,
  hideHeader = false,
  bottomInset = 0,
}: SwipeDiscoveryViewProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const { hasUnlimitedAccess } = useSubscription();

  const pagerRef = useRef<PagerView>(null);
  const [activePage, setActivePage] = useState(0);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const showPremiumGate =
    !hasUnlimitedAccess && items.length > FREE_SWIPE_LIMIT;

  const handlePageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      const page = e.nativeEvent.position;
      setActivePage(page);
      onPageChanged?.(page);
    },
    [onPageChanged]
  );

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const displayItems = showPremiumGate
    ? items.slice(0, FREE_SWIPE_LIMIT)
    : items;

  const navigateToDetail = useCallback(
    (item: MovieResult) => {
      const itemProviders = providers[item.tmdb_id] || [];
      const itemCredits = credits[item.tmdb_id] || [];
      const itemCrew = crew[item.tmdb_id] || [];
      const itemDetailedInfo =
        detailedInfo[item.tmdb_id] || ({} as DetailedInfo);
      const mediaType = item.media_type === 'tv' ? 'tv' : 'movie';

      trackSwipeToDetail(item.tmdb_id);
      router.push({
        pathname: '/movie-detail' as never,
        params: {
          tmdbId: String(item.tmdb_id),
          mediaType,
          title: item.title,
          posterPath: item.poster_path || '',
          voteAverage: String(item.vote_average || 0),
          overview: item.overview || '',
          providersJson: JSON.stringify(itemProviders),
          creditsJson: JSON.stringify(itemCredits),
          crewJson: JSON.stringify(itemCrew),
          detailedInfoJson: JSON.stringify(itemDetailedInfo),
        },
      });
    },
    [providers, credits, crew, detailedInfo, router]
  );

  // Build pages array — PagerView crashes on null/false children
  const pages: React.ReactElement[] = displayItems.map((item) => {
    const itemProviders = providers[item.tmdb_id] || [];
    const itemCredits = credits[item.tmdb_id] || [];
    const itemCrew = crew[item.tmdb_id] || [];
    const itemDetailedInfo = detailedInfo[item.tmdb_id] || ({} as DetailedInfo);

    return (
      <View
        key={`card-${item.tmdb_id}`}
        style={styles.page}
        collapsable={false}
      >
        <SwipeLeftDetector
          onSwipeLeft={() => navigateToDetail(item)}
          item={item}
        >
          <SwipeCard
            item={item}
            providers={itemProviders}
            bottomInset={bottomInset}
          />
          <SwipeActions
            item={item}
            providers={itemProviders}
            credits={itemCredits}
            crew={itemCrew}
            detailedInfo={itemDetailedInfo}
          />
        </SwipeLeftDetector>
      </View>
    );
  });

  // Premium gate page
  if (showPremiumGate) {
    pages.push(
      <View key='premium-gate' style={styles.page} collapsable={false}>
        <LinearGradient
          colors={['#1a0000', '#000000', '#1a0000']}
          style={styles.gatePage}
        >
          <Ionicons name='sparkles' size={64} color='#fbbf24' />
          <Text style={styles.gateTitle}>
            {t('swipeDiscovery.upgradeCTA')}
          </Text>
          <Text style={styles.gateSubtitle}>
            {t('swipeDiscovery.upgradeSubtitle')}
          </Text>
          <TouchableOpacity
            style={styles.gateButton}
            onPress={() => setShowSubscriptionModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.gateButtonText}>
              {t('swipeDiscovery.upgradeButton')}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  // End of results page
  if (!hasMore && !showPremiumGate) {
    pages.push(
      <View key='end-of-results' style={styles.page} collapsable={false}>
        <View style={styles.endPage}>
          <Ionicons
            name='checkmark-circle-outline'
            size={64}
            color='rgba(255,255,255,0.4)'
          />
          <Text style={styles.endTitle}>
            {t('swipeDiscovery.endOfResults')}
          </Text>
          <Text style={styles.endSubtitle}>
            {t('swipeDiscovery.endOfResultsSubtitle')}
          </Text>
          <TouchableOpacity
            style={styles.endButton}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.endButtonText}>
              {t('swipeDiscovery.newSearch')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        orientation='vertical'
        onPageSelected={handlePageSelected}
      >
        {pages}
      </PagerView>

      {!hideHeader && (
        <SwipeHeader
          currentIndex={Math.min(activePage, displayItems.length - 1)}
          totalItems={displayItems.length}
          onClose={handleClose}
        />
      )}

      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSubscriptionSuccess={() => setShowSubscriptionModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  // Premium gate
  gatePage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  gateTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
  gateSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  gateButton: {
    backgroundColor: '#E50914',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
    marginTop: 16,
  },
  gateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // End of results
  endPage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
    backgroundColor: '#000',
  },
  endTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
  endSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  endButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 12,
  },
  endButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
