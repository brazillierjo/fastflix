/**
 * New FastFlix Pro Features Hook - Simplified
 *
 * This hook now uses the new RevenueCat context which handles:
 * - Persistent prompt counting via RevenueCat attributes (no more AsyncStorage)
 * - Proper subscription status detection
 * - Clean separation of concerns
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

export interface PromptStatus {
  allowed: boolean;
  reason: string;
  remaining?: number;
  limit?: number;
  used?: number;
}

export const useFastFlixProFeatures = () => {
  const {
    subscriptionStatus,
    hasUnlimitedAccess,
    isFreeUser,
    isLoading,
    monthlyPromptCount,
    maxFreePrompts,
    remainingPrompts,
    incrementPromptCount,
    refreshUserData,
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

  // Check if user can make a prompt with detailed status
  const getPromptStatus = (): PromptStatus => {
    // Users with unlimited access (active subscribers or in grace period)
    if (hasUnlimitedAccess) {
      const reason =
        subscriptionStatus === SubscriptionStatus.ACTIVE
          ? 'active-subscription'
          : 'grace-period-access';

      return {
        allowed: true,
        reason,
        remaining: Infinity,
      };
    }

    // Free users with prompt limits
    if (isFreeUser) {
      const used = monthlyPromptCount;
      const limit = maxFreePrompts;
      const remaining = Math.max(0, limit - used);

      if (used >= limit) {
        return {
          allowed: false,
          reason: 'monthly-limit-reached',
          limit,
          used,
          remaining: 0,
        };
      }

      return {
        allowed: true,
        reason: 'within-monthly-limit',
        limit,
        used,
        remaining,
      };
    }

    // Fallback for unknown status
    return {
      allowed: false,
      reason: 'unknown-status',
    };
  };

  // Legacy compatibility - returns the old canMakePrompt format
  const canMakePromptLegacy = () => {
    const status = getPromptStatus();
    return {
      allowed: status.allowed,
      reason: status.reason,
      remaining: status.remaining || 0,
      limit: status.limit,
      used: status.used,
    };
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
    if (hasUnlimitedAccess) {
      return { allowed: true, reason: 'unlimited-access' };
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
        reason: 'limit-reached',
        limit: actionLimit,
        usage,
      };
    }

    return {
      allowed: true,
      reason: 'within-limit',
      limit: actionLimit,
      usage,
      remaining: actionLimit - usage,
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
    canPerformAction,

    // Prompt management
    monthlyPromptCount,
    maxFreePrompts,
    canMakePrompt: canMakePromptLegacy, // Use the legacy format function
    remainingPrompts,
    getPromptStatus,
    incrementPromptCount,

    // Utility functions
    refreshPromptCount: refreshUserData,

    // Backward compatibility
    isSubscribed: hasUnlimitedAccess, // For components still using this
  };
};

export default useFastFlixProFeatures;

// Backward compatibility alias
export const usePremiumFeatures = useFastFlixProFeatures;
