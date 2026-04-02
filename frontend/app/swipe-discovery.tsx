import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { StatusBar, View } from 'react-native';
import { useSwipeData } from '@/contexts/SwipeDataContext';
import SwipeDiscoveryView from '@/components/swipe-discovery/SwipeDiscoveryView';
import {
  trackScreenView,
  trackSwipeView,
  trackSwipeSession,
} from '@/services/analytics';

export default function SwipeDiscoveryScreen() {
  const params = useLocalSearchParams<{ source?: string }>();
  const source = (params.source as 'search' | 'forYou' | 'feed') || 'search';
  const router = useRouter();
  const { swipeData, clearSwipeData } = useSwipeData();

  // Session tracking
  const sessionStart = useRef(Date.now());
  const maxPageViewed = useRef(0);

  useEffect(() => {
    trackScreenView('swipe_discovery');
    const startTime = sessionStart.current;

    return () => {
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      trackSwipeSession(durationSeconds, maxPageViewed.current + 1);
      clearSwipeData();
    };
  }, [clearSwipeData]);

  const handlePageChanged = (index: number) => {
    if (index > maxPageViewed.current) {
      maxPageViewed.current = index;
    }
    if (swipeData?.items[index]) {
      trackSwipeView(swipeData.items[index].tmdb_id, index, source);
    }
  };

  if (!swipeData || swipeData.items.length === 0) {
    router.back();
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar hidden />
      <SwipeDiscoveryView
        items={swipeData.items}
        providers={swipeData.providers}
        credits={swipeData.credits}
        crew={swipeData.crew}
        detailedInfo={swipeData.detailedInfo}
        hasMore={false}
        onPageChanged={handlePageChanged}
      />
    </View>
  );
}
