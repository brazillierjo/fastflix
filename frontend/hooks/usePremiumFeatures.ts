/**
 * FastFlix Pro Features Hook - Simplified
 *
 * This hook provides access to subscription status and pro features.
 * NOTE: Prompt counting is now handled by the backend. Use usePromptLimit() from useBackendMovieSearch.ts
 */

import {
  useSubscription,
  SubscriptionStatus,
} from '@/contexts/RevenueCatContext';

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
  const {
    subscriptionStatus,
    hasUnlimitedAccess,
    isFreeUser,
    isLoading,
  } = useSubscription();

  // Define which features are available
  const fastFlixProFeatures: FastFlixProFeatures = {
    // All features available for users with unlimited access
    unlimitedRecommendations: hasUnlimitedAccess,
    advancedFilters: hasUnlimitedAccess,
    offlineAccess: hasUnlimitedAccess,
    smartNotifications: hasUnlimitedAccess,
    removeAds: hasUnlimitedAccess,
    customThemes: hasUnlimitedAccess,
    exportWatchlist: hasUnlimitedAccess,
    enhancedAI: hasUnlimitedAccess,
    personalizedRecommendations: hasUnlimitedAccess,
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

  return {
    // Subscription info
    subscriptionStatus,
    hasUnlimitedAccess,
    isFreeUser,
    isLoading,

    // Features
    features: fastFlixProFeatures,
    hasFeature,
    getFeatureStatus,

    // Backward compatibility
    isSubscribed: hasUnlimitedAccess,
  };
};

export default useFastFlixProFeatures;

// Backward compatibility alias
export const usePremiumFeatures = useFastFlixProFeatures;
