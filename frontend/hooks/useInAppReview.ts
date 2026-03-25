/**
 * Hook for managing in-app review prompts
 *
 * Triggers a review prompt after:
 * - 5th successful search
 * - 7 consecutive days of use
 * - 10 watchlist adds
 *
 * Only prompts once per user.
 *
 * IMPORTANT: Requires `expo-store-review` to be installed.
 * Run: npx expo install expo-store-review
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { useCallback } from 'react';

const KEYS = {
  REVIEW_PROMPTED: '@fastflix/review_prompted',
  SEARCH_COUNT: '@fastflix/search_count',
  FIRST_USE_DATE: '@fastflix/first_use_date',
  WATCHLIST_ADD_COUNT: '@fastflix/watchlist_add_count',
} as const;

const THRESHOLDS = {
  SEARCH_COUNT: 5,
  CONSECUTIVE_DAYS: 7,
  WATCHLIST_ADDS: 10,
} as const;

/**
 * Check if the review has already been prompted
 */
async function hasAlreadyPrompted(): Promise<boolean> {
  const prompted = await AsyncStorage.getItem(KEYS.REVIEW_PROMPTED);
  return prompted === 'true';
}

/**
 * Mark that a review prompt has been shown
 */
async function markAsPrompted(): Promise<void> {
  await AsyncStorage.setItem(KEYS.REVIEW_PROMPTED, 'true');
}

/**
 * Try to request a review if available
 */
async function tryRequestReview(): Promise<void> {
  try {
    const isAvailable = await StoreReview.isAvailableAsync();
    if (isAvailable) {
      await markAsPrompted();
      await StoreReview.requestReview();
    }
  } catch (error) {
    console.warn('Failed to request review:', error);
  }
}

/**
 * Check days since first use
 */
async function getDaysSinceFirstUse(): Promise<number> {
  const firstUse = await AsyncStorage.getItem(KEYS.FIRST_USE_DATE);
  if (!firstUse) {
    // Record first use date now
    await AsyncStorage.setItem(KEYS.FIRST_USE_DATE, new Date().toISOString());
    return 0;
  }
  const firstDate = new Date(firstUse);
  const now = new Date();
  const diffMs = now.getTime() - firstDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Hook for managing in-app review prompts
 */
export function useInAppReview() {
  /**
   * Call after a successful search to potentially trigger a review prompt
   */
  const trackSearch = useCallback(async () => {
    try {
      if (await hasAlreadyPrompted()) return;

      const currentCount = parseInt(
        (await AsyncStorage.getItem(KEYS.SEARCH_COUNT)) || '0',
        10
      );
      const newCount = currentCount + 1;
      await AsyncStorage.setItem(KEYS.SEARCH_COUNT, String(newCount));

      if (newCount >= THRESHOLDS.SEARCH_COUNT) {
        await tryRequestReview();
        return;
      }

      // Also check days since first use on each search
      const days = await getDaysSinceFirstUse();
      if (days >= THRESHOLDS.CONSECUTIVE_DAYS) {
        await tryRequestReview();
      }
    } catch (error) {
      console.warn('Failed to track search for review:', error);
    }
  }, []);

  /**
   * Call after adding an item to the watchlist to potentially trigger a review prompt
   */
  const trackWatchlistAdd = useCallback(async () => {
    try {
      if (await hasAlreadyPrompted()) return;

      const currentCount = parseInt(
        (await AsyncStorage.getItem(KEYS.WATCHLIST_ADD_COUNT)) || '0',
        10
      );
      const newCount = currentCount + 1;
      await AsyncStorage.setItem(KEYS.WATCHLIST_ADD_COUNT, String(newCount));

      if (newCount >= THRESHOLDS.WATCHLIST_ADDS) {
        await tryRequestReview();
      }
    } catch (error) {
      console.warn('Failed to track watchlist add for review:', error);
    }
  }, []);

  /**
   * Check on app start if the user meets the days-of-use threshold
   */
  const checkOnLaunch = useCallback(async () => {
    try {
      if (await hasAlreadyPrompted()) return;

      const days = await getDaysSinceFirstUse();
      if (days >= THRESHOLDS.CONSECUTIVE_DAYS) {
        await tryRequestReview();
      }
    } catch (error) {
      console.warn('Failed to check review on launch:', error);
    }
  }, []);

  return {
    trackSearch,
    trackWatchlistAdd,
    checkOnLaunch,
  };
}
