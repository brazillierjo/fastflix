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
import { useLanguage } from './LanguageContext';
import { backendAPIService } from '../services/backend-api.service';
import { TrialInfo, SubscriptionInfo } from '@/types/api';

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

  // Trial state
  trialInfo: TrialInfo | null;
  isInTrial: boolean;
  canStartTrial: boolean; // True if user hasn't used their trial yet

  // Backend subscription info (with full details)
  subscriptionInfo: SubscriptionInfo | null;

  // Derived properties for easy access
  hasUnlimitedAccess: boolean; // True for ACTIVE, GRACE_PERIOD, or active trial
  isFreeUser: boolean; // True for FREE users without trial

  // Actions
  purchasePackage: (packageToPurchase: PurchasesPackage) => Promise<void>;
  restorePurchases: () => Promise<boolean>;
  linkUserToRevenueCat: (userId: string) => Promise<void>;
  startFreeTrial: () => Promise<boolean>;
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
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
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
    const TIMEOUT_MS = 10000; // 10 seconds timeout

    try {
      console.log('📦 Fetching offerings...');
      const offerings = await withTimeout(
        Purchases.getOfferings(),
        TIMEOUT_MS,
        'Offerings fetch timeout'
      );

      if (offerings.current) {
        setOfferings([offerings.current]);
        console.log('✅ Offerings loaded:', offerings.current.identifier);
      } else {
        console.warn('⚠️ No current offering available');
      }
    } catch (error) {
      console.error('❌ Error fetching offerings:', error);

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
            8000, // 8 seconds timeout
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
        // Update trial info
        if (response.data.trial) {
          setTrialInfo(response.data.trial);
          if (response.data.trial.isActive) {
            console.log(
              '✅ User is in active trial, days remaining:',
              response.data.trial.daysRemaining
            );
          }
        }

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

  // Start free trial
  const startFreeTrial = async (): Promise<boolean> => {
    try {
      console.log('🎁 Starting free trial...');

      const response = await backendAPIService.startFreeTrial();

      if (response.success && response.data?.trial) {
        setTrialInfo(response.data.trial);
        console.log('✅ Free trial started successfully');

        Alert.alert(
          t('trial.success.title') || 'Free Trial Started!',
          t('trial.success.message') ||
            'Enjoy 7 days of unlimited access to all features!'
        );

        return true;
      }

      // Handle error cases
      const errorMessage = response.error?.message || 'Failed to start trial';
      console.warn('⚠️ Failed to start trial:', errorMessage);

      Alert.alert(
        t('trial.error.title') || 'Trial Unavailable',
        errorMessage === 'You have already used your free trial'
          ? t('trial.error.alreadyUsed') ||
              'You have already used your free trial.'
          : t('trial.error.message') || errorMessage
      );

      return false;
    } catch (error) {
      console.error('❌ Error starting trial:', error);

      Alert.alert(
        t('trial.error.title') || 'Error',
        t('trial.error.message') || 'Something went wrong. Please try again.'
      );

      return false;
    }
  };

  // Computed property for trial status
  const isInTrial = trialInfo?.isActive ?? false;

  // User can start trial if they haven't used it yet (trialInfo.used is false or undefined means not used)
  const canStartTrial = trialInfo ? !trialInfo.used : false;

  // Refresh subscription and trial status from backend
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
    trialInfo,
    isInTrial,
    canStartTrial,
    subscriptionInfo,
    hasUnlimitedAccess:
      hasBackendSubscription ||
      isInTrial ||
      subscriptionStatus === SubscriptionStatus.ACTIVE ||
      subscriptionStatus === SubscriptionStatus.GRACE_PERIOD,
    isFreeUser:
      subscriptionStatus === SubscriptionStatus.FREE &&
      !hasBackendSubscription &&
      !isInTrial,
    purchasePackage,
    restorePurchases,
    linkUserToRevenueCat,
    startFreeTrial,
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
