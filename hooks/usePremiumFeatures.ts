/**
 * FastFlix Pro Features Hook
 *
 * This hook provides a centralized way to check and manage FastFlix Pro features
 * throughout the application. It integrates with the subscription context
 * to determine which features are available to the user.
 */

import { useSubscription } from '@/contexts/RevenueCatContext';

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
    isLoading,
    features: fastFlixProFeatures,
    hasFeature,
    getFeatureStatus,
    canPerformAction,
  };
};

export default useFastFlixProFeatures;

// Backward compatibility alias
export const usePremiumFeatures = useFastFlixProFeatures;
