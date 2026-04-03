import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import PagerView from 'react-native-pager-view';
import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
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

  const pages: React.ReactElement[] = displayItems.map((item) => {
    const itemProviders = providers[item.tmdb_id] || [];
    const itemCredits = credits[item.tmdb_id] || [];
    const itemCrew = crew[item.tmdb_id] || [];
    const itemDetailedInfo = detailedInfo[item.tmdb_id] || ({} as DetailedInfo);

    return (
      <View key={String(item.tmdb_id)} style={styles.page} collapsable={false}>
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
          <Text style={styles.gateTitle}>{t('swipeDiscovery.upgradeCTA')}</Text>
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
