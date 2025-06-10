/**
 * FastFlix Pro Features Hook
 *
 * This hook provides a centralized way to check and manage FastFlix Pro features
 * throughout the application. It integrates with the subscription context
 * to determine which features are available to the user.
 */

import { useSubscription } from '@/contexts/RevenueCatContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export interface FastFlixProFeatures {
  // Core features
  unlimitedRecommendations: boolean;
  advancedFilters: boolean;
  offlineAccess: boolean;
  smartNotifications: boolean;

  // UI features
  removeAds: boolean;
  customThemes: boolean;
  exportWatchlist: boolean;

  // AI features
  enhancedAI: boolean;
  personalizedRecommendations: boolean;
}

export const useFastFlixProFeatures = () => {
  const { isSubscribed, isLoading } = useSubscription();
  const [monthlyPromptCount, setMonthlyPromptCount] = useState(0);
  const [promptCountLoading, setPromptCountLoading] = useState(true);

  // Load monthly prompt count on component mount
  useEffect(() => {
    loadMonthlyPromptCount();
  }, []);

  // Load monthly prompt count from storage
  const loadMonthlyPromptCount = async () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const storedData = await AsyncStorage.getItem('monthlyPromptData');

      if (storedData) {
        const { month, count } = JSON.parse(storedData);

        // Reset count if it's a new month
        if (month !== currentMonth) {
          await AsyncStorage.setItem(
            'monthlyPromptData',
            JSON.stringify({ month: currentMonth, count: 0 })
          );
          setMonthlyPromptCount(0);
        } else {
          setMonthlyPromptCount(count);
        }
      } else {
        // First time, initialize with current month and 0 count
        await AsyncStorage.setItem(
          'monthlyPromptData',
          JSON.stringify({ month: currentMonth, count: 0 })
        );
        setMonthlyPromptCount(0);
      }
    } catch (error) {
      console.error('Error loading monthly prompt count:', error);
      setMonthlyPromptCount(0);
    } finally {
      setPromptCountLoading(false);
    }
  };

  // Increment monthly prompt count
  const incrementPromptCount = async () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const newCount = monthlyPromptCount + 1;

      await AsyncStorage.setItem(
        'monthlyPromptData',
        JSON.stringify({ month: currentMonth, count: newCount })
      );
      setMonthlyPromptCount(newCount);

      return newCount;
    } catch (error) {
      console.error('Error incrementing prompt count:', error);
      return monthlyPromptCount;
    }
  };

  // Check if user can make a prompt (3 free per month for non-subscribers)
  const canMakePrompt = () => {
    // In development mode, allow unlimited prompts
    if (__DEV__) {
      return { allowed: true, reason: 'development-mode', remaining: Infinity };
    }

    if (isSubscribed) {
      return { allowed: true, reason: 'fastflix-pro', remaining: Infinity };
    }

    const freeMonthlyLimit = 3;
    const remaining = Math.max(0, freeMonthlyLimit - monthlyPromptCount);

    if (monthlyPromptCount >= freeMonthlyLimit) {
      return {
        allowed: false,
        reason: 'monthly_limit_reached',
        limit: freeMonthlyLimit,
        used: monthlyPromptCount,
        remaining: 0,
      };
    }

    return {
      allowed: true,
      reason: 'within_monthly_limit',
      limit: freeMonthlyLimit,
      used: monthlyPromptCount,
      remaining,
    };
  };

  // Define which features are available for FastFlix Pro users
  const fastFlixProFeatures: FastFlixProFeatures = {
    // Core features - available only to FastFlix Pro users
    unlimitedRecommendations: isSubscribed,
    advancedFilters: isSubscribed,
    offlineAccess: isSubscribed,
    smartNotifications: isSubscribed,

    // UI features
    removeAds: isSubscribed,
    customThemes: isSubscribed,
    exportWatchlist: isSubscribed,

    // AI features
    enhancedAI: isSubscribed,
    personalizedRecommendations: isSubscribed,
  };

  // Helper function to check if a specific feature is available
  const hasFeature = (feature: keyof FastFlixProFeatures): boolean => {
    return fastFlixProFeatures[feature];
  };

  // Helper function to get feature status with loading state
  const getFeatureStatus = (feature: keyof FastFlixProFeatures) => {
    return {
      available: fastFlixProFeatures[feature],
      loading: isLoading,
      requiresFastFlixPro: !fastFlixProFeatures[feature],
    };
  };

  // Check if user can perform an action (with usage limits for free users)
  const canPerformAction = (
    action: string,
    currentUsage?: number,
    limit?: number
  ) => {
    if (isSubscribed) {
      return { allowed: true, reason: 'fastflix-pro' };
    }

    // Define limits for free users
    const freeLimits = {
      dailyRecommendations: 5,
      savedMovies: 10,
      searchQueries: 20,
    };

    const actionLimit =
      limit || freeLimits[action as keyof typeof freeLimits] || 0;
    const usage = currentUsage || 0;

    if (usage >= actionLimit) {
      return {
        allowed: false,
        reason: 'limit_reached',
        limit: actionLimit,
        usage,
      };
    }

    return {
      allowed: true,
      reason: 'within_limit',
      limit: actionLimit,
      usage,
      remaining: actionLimit - usage,
    };
  };

  return {
    isSubscribed,
    isLoading: isLoading || promptCountLoading,
    features: fastFlixProFeatures,
    hasFeature,
    getFeatureStatus,
    canPerformAction,
    // New prompt limitation features
    monthlyPromptCount,
    canMakePrompt,
    incrementPromptCount,
  };
};

export default useFastFlixProFeatures;

// Backward compatibility alias
export const usePremiumFeatures = useFastFlixProFeatures;
