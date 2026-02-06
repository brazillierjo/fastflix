/**
 * RevenueCat Context - Subscription Management
 *
 * This context handles subscription management via RevenueCat:
 * - Active subscribers: unlimited access
 * - Canceled subscription but still in grace period: unlimited access
 * - Non-subscribed users: limited access (managed by backend)
 *
 * NOTE: Prompt counting and limits are now handled entirely by the backend API.
 * Use usePromptLimit() hook to get current prompt status.
 */

import Constants from 'expo-constants';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Alert, Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';
import * as Sentry from '@sentry/react-native';
import { useLanguage } from './LanguageContext';
import { backendAPIService } from '../services/backend-api.service';
import { SubscriptionInfo } from '@/types/api';

// Subscription status enum for clarity
export enum SubscriptionStatus {
  UNKNOWN = 'unknown',
  FREE = 'free', // Non-subscribed user
  ACTIVE = 'active', // Currently subscribed
  GRACE_PERIOD = 'grace_period', // Canceled but still has access
  EXPIRED = 'expired', // Subscription expired
}

export interface SubscriptionContextType {
  // Subscription state
  subscriptionStatus: SubscriptionStatus;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOffering[] | null;

  // Backend subscription info (with full details)
  subscriptionInfo: SubscriptionInfo | null;

  // Derived properties for easy access
  hasUnlimitedAccess: boolean; // True for ACTIVE or GRACE_PERIOD
  isFreeUser: boolean; // True for FREE users

  // Actions
  purchasePackage: (packageToPurchase: PurchasesPackage) => Promise<void>;
  restorePurchases: () => Promise<boolean>;
  linkUserToRevenueCat: (userId: string) => Promise<void>;
  refreshSubscriptionStatus: () => Promise<void>;
  refreshOfferings: () => Promise<void>;

  // Package helpers
  getMonthlyPackage: () => PurchasesPackage | null;
  getQuarterlyPackage: () => PurchasesPackage | null;
  getAnnualPackage: () => PurchasesPackage | null;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({
  children,
}) => {
  const { t } = useLanguage();
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus>(SubscriptionStatus.UNKNOWN);
  const [isLoading, setIsLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOffering[] | null>(null);
  const [hasBackendSubscription, setHasBackendSubscription] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] =
    useState<SubscriptionInfo | null>(null);

  // Determine subscription status from CustomerInfo
  const determineSubscriptionStatus = (
    customerInfo: CustomerInfo
  ): SubscriptionStatus => {
    const activeEntitlements = Object.keys(customerInfo.entitlements.active);

    // If user has active entitlements, they have unlimited access
    if (activeEntitlements.length > 0) {
      return SubscriptionStatus.ACTIVE;
    }

    // Check if user has expired entitlements (grace period case)
    const allEntitlements = Object.values(customerInfo.entitlements.all);
    for (const entitlement of allEntitlements) {
      if (entitlement.expirationDate) {
        const expirationDate = new Date(entitlement.expirationDate);
        const now = new Date();

        // If subscription expired recently (within grace period), still give access
        // This handles the case where user canceled but is still in their paid period
        if (expirationDate > now) {
          return SubscriptionStatus.GRACE_PERIOD;
        }

        // If we have any purchase history, user had a subscription before
        if (entitlement.latestPurchaseDate) {
          return SubscriptionStatus.EXPIRED;
        }
      }
    }

    // No subscription history, free user
    return SubscriptionStatus.FREE;
  };

  // Helper to add timeout to promises
  const withTimeout = <T,>(
    promise: Promise<T>,
    timeoutMs: number,
    errorMessage: string
  ): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
      ),
    ]);
  };

  // Fetch offerings separately (can be retried)
  const fetchOfferings = async (retryCount = 0): Promise<void> => {
    const MAX_RETRIES = 2;
    const TIMEOUT_MS = 30000; // 30 seconds timeout (Apple servers can be slow)

    try {
      console.log('📦 Fetching offerings...');
      const offerings = await withTimeout(
        Purchases.getOfferings(),
        TIMEOUT_MS,
        'Offerings fetch timeout'
      );

      // Log full offerings response for debugging
      console.log(
        '📦 Offerings response:',
        JSON.stringify({
          current: offerings.current?.identifier ?? null,
          allKeys: Object.keys(offerings.all),
          allCount: Object.keys(offerings.all).length,
        })
      );

      if (offerings.current) {
        setOfferings([offerings.current]);
        console.log('✅ Offerings loaded:', offerings.current.identifier);
        console.log(
          '📦 Packages:',
          offerings.current.availablePackages.map(p => ({
            id: p.identifier,
            productId: p.product.identifier,
            price: p.product.priceString,
          }))
        );
      } else {
        // Log to Sentry when offerings.current is null (common issue on sandbox)
        const allOfferingKeys = Object.keys(offerings.all);
        console.warn(
          '⚠️ No current offering available. All offerings:',
          allOfferingKeys
        );

        Sentry.captureMessage('RevenueCat: No current offering available', {
          level: 'warning',
          extra: {
            allOfferingKeys,
            allOfferingsCount: allOfferingKeys.length,
            retryCount,
          },
        });

        // If there are other offerings available, try to use the first one
        if (allOfferingKeys.length > 0) {
          const firstOffering = offerings.all[allOfferingKeys[0]];
          if (firstOffering) {
            console.log('📦 Using fallback offering:', allOfferingKeys[0]);
            setOfferings([firstOffering]);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error fetching offerings:', error);

      Sentry.captureException(error, {
        tags: { context: 'fetch-offerings' },
        extra: { retryCount },
      });

      // Retry with exponential backoff
      if (retryCount < MAX_RETRIES) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`🔄 Retrying offerings fetch in ${delay}ms...`);
        setTimeout(() => fetchOfferings(retryCount + 1), delay);
      }
    }
  };

  // Initialize RevenueCat
  useEffect(() => {
    const initializeRevenueCat = async () => {
      try {
        console.log('Initializing RevenueCat...');

        // Configure RevenueCat with minimal logging (only warnings and errors)
        Purchases.setLogLevel(LOG_LEVEL.WARN);

        const apiKey = Platform.select({
          ios: Constants.expoConfig?.extra?.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
        });

        if (!apiKey) {
          console.error('RevenueCat API key not found');
          setIsLoading(false);
          return;
        }

        // Configure RevenueCat
        await Purchases.configure({ apiKey });

        console.log('✅ RevenueCat configured successfully');

        // Get customer info with timeout (critical for subscription status)
        try {
          const info = await withTimeout(
            Purchases.getCustomerInfo(),
            20000, // 20 seconds timeout (Apple servers can be slow)
            'CustomerInfo fetch timeout'
          );
          setCustomerInfo(info);

          const status = determineSubscriptionStatus(info);
          setSubscriptionStatus(status);

          console.log('✅ RevenueCat initialized - Status:', status);
        } catch (infoError) {
          console.warn('⚠️ Failed to get customer info:', infoError);
          // Continue without customer info - will be fetched later
          setSubscriptionStatus(SubscriptionStatus.FREE);
        }

        // Mark loading as complete before fetching offerings
        // This prevents the app from being blocked waiting for offerings
        setIsLoading(false);

        // Fetch offerings in background (non-blocking)
        // This allows the app to start even if offerings take a while
        fetchOfferings();
      } catch (error) {
        console.error('❌ Error initializing RevenueCat:', error);
        setIsLoading(false);
      }
    };

    initializeRevenueCat();
  }, []);

  // Purchase a package
  const purchasePackage = async (packageToPurchase: PurchasesPackage) => {
    try {
      console.log('Purchasing package:', packageToPurchase.identifier);

      const { customerInfo } =
        await Purchases.purchasePackage(packageToPurchase);
      setCustomerInfo(customerInfo);

      const status = determineSubscriptionStatus(customerInfo);
      setSubscriptionStatus(status);

      console.log('✅ Purchase successful - Status:', status);

      Alert.alert(
        t('subscription.success.title') || 'Welcome to Pro!',
        t('subscription.success.message') ||
          'Thank you for upgrading! You now have unlimited access to all features.'
      );
    } catch (error: unknown) {
      console.error('❌ Error purchasing package:', error);

      const purchaseError = error as {
        userCancelled?: boolean;
        message?: string;
      };
      if (purchaseError.userCancelled) {
        console.log('User cancelled purchase');
        return;
      }

      Alert.alert(
        t('subscription.error.title') || 'Purchase Failed',
        t('subscription.error.message') ||
          purchaseError.message ||
          'Something went wrong. Please try again.'
      );
    }
  };

  // Restore purchases
  const restorePurchases = async (): Promise<boolean> => {
    try {
      console.log('Restoring purchases...');

      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);

      const status = determineSubscriptionStatus(info);
      setSubscriptionStatus(status);

      console.log('✅ Purchases restored - Status:', status);

      const hasActiveSubscription =
        status === SubscriptionStatus.ACTIVE ||
        status === SubscriptionStatus.GRACE_PERIOD;

      if (hasActiveSubscription) {
        Alert.alert(
          t('subscription.restoration.success.title') || 'Purchases Restored',
          t('subscription.restoration.success.message') ||
            'Your purchases have been restored successfully!'
        );
      } else {
        Alert.alert(
          t('subscription.restoration.none.title') || 'No Purchases Found',
          t('subscription.restoration.none.message') ||
            'No active subscriptions found to restore.'
        );
      }

      return hasActiveSubscription;
    } catch (error: unknown) {
      console.error('❌ Error restoring purchases:', error);

      const restoreError = error as { message?: string };
      Alert.alert(
        t('subscription.restoration.error.title') || 'Restore Failed',
        t('subscription.restoration.error.message') ||
          restoreError.message ||
          'Something went wrong. Please try again.'
      );

      return false;
    }
  };

  // Check backend subscription and trial status
  const checkBackendSubscription = async (): Promise<boolean> => {
    try {
      const response = await backendAPIService.getCurrentUser();

      if (response.success && response.data) {
        // Update subscription info with full details
        if (response.data.subscription) {
          setSubscriptionInfo(response.data.subscription);

          // Check subscription status
          if (response.data.subscription.isActive) {
            console.log(
              '✅ Backend subscription is active, status:',
              response.data.subscription.status,
              'willRenew:',
              response.data.subscription.willRenew
            );
            setHasBackendSubscription(true);
            return true;
          }
        }
      }

      setHasBackendSubscription(false);
      return false;
    } catch (error) {
      console.warn('⚠️ Failed to check backend subscription:', error);
      return false;
    }
  };

  // Link user to RevenueCat (call after authentication)
  const linkUserToRevenueCat = async (userId: string): Promise<void> => {
    try {
      console.log('🔗 Linking user to RevenueCat:', userId);

      // Check backend subscription first (for admin/manual subscriptions)
      await checkBackendSubscription();

      // Log in to RevenueCat with the userId from our auth system
      // This associates the anonymous ID with the actual user ID
      const { customerInfo } = await Purchases.logIn(userId);

      setCustomerInfo(customerInfo);

      const status = determineSubscriptionStatus(customerInfo);
      setSubscriptionStatus(status);

      console.log('✅ User linked to RevenueCat - Status:', status);
    } catch (error: unknown) {
      console.error('❌ Error linking user to RevenueCat:', error);
      // Don't throw - this is not critical, just log the error
      // The user can still use the app, but purchases might not sync properly
    }
  };

  // Package helpers
  const getMonthlyPackage = (): PurchasesPackage | null => {
    if (!offerings || offerings.length === 0) return null;

    const monthlyPackage = offerings[0].availablePackages.find(
      pkg => pkg.identifier === '$rc_monthly' || pkg.packageType === 'MONTHLY'
    );

    return monthlyPackage || null;
  };

  const getQuarterlyPackage = (): PurchasesPackage | null => {
    if (!offerings || offerings.length === 0) return null;

    const quarterlyPackage = offerings[0].availablePackages.find(
      pkg =>
        pkg.identifier === '$rc_three_month' ||
        pkg.packageType === 'THREE_MONTH'
    );

    return quarterlyPackage || null;
  };

  const getAnnualPackage = (): PurchasesPackage | null => {
    if (!offerings || offerings.length === 0) return null;

    const annualPackage = offerings[0].availablePackages.find(
      pkg => pkg.identifier === '$rc_annual' || pkg.packageType === 'ANNUAL'
    );

    return annualPackage || null;
  };

  // Refresh subscription status from backend
  const refreshSubscriptionStatus = async (): Promise<void> => {
    await checkBackendSubscription();
  };

  // Refresh offerings (useful if initial fetch failed)
  const refreshOfferings = async (): Promise<void> => {
    await fetchOfferings();
  };

  const contextValue: SubscriptionContextType = {
    subscriptionStatus,
    isLoading,
    customerInfo,
    offerings,
    subscriptionInfo,
    hasUnlimitedAccess:
      hasBackendSubscription ||
      subscriptionStatus === SubscriptionStatus.ACTIVE ||
      subscriptionStatus === SubscriptionStatus.GRACE_PERIOD,
    isFreeUser:
      subscriptionStatus === SubscriptionStatus.FREE && !hasBackendSubscription,
    purchasePackage,
    restorePurchases,
    linkUserToRevenueCat,
    refreshSubscriptionStatus,
    refreshOfferings,
    getMonthlyPackage,
    getQuarterlyPackage,
    getAnnualPackage,
  };

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error(
      'useSubscription must be used within a SubscriptionProvider'
    );
  }
  return context;
};
