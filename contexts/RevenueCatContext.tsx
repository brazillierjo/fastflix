/**
 * New RevenueCat Context - Simplified and Robust
 *
 * This context handles:
 * 1. Non-subscribed users: 3 free prompts/month (persistent via RevenueCat attributes)
 * 2. Canceled subscription but still in grace period: unlimited access
 * 3. Active subscribers: unlimited access
 *
 * Key improvements:
 * - Uses RevenueCat Subscriber Attributes for persistent prompt counting
 * - Proper subscription status detection (active vs expired)
 * - No more AsyncStorage dependency
 * - Cleaner user identification
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import React, {
  createContext,
  ReactNode,
  useCallback,
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

  // Derived properties for easy access
  hasUnlimitedAccess: boolean; // True for ACTIVE and GRACE_PERIOD
  isFreeUser: boolean; // True for FREE users

  // Prompt management (for free users)
  monthlyPromptCount: number;
  maxFreePrompts: number;
  canMakePrompt: boolean;
  remainingPrompts: number;

  // Actions
  purchasePackage: (packageToPurchase: PurchasesPackage) => Promise<void>;
  restorePurchases: () => Promise<void>;
  incrementPromptCount: () => Promise<void>;
  refreshUserData: () => Promise<void>;

  // Package helpers
  getMonthlyPackage: () => PurchasesPackage | null;
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
  const [monthlyPromptCount, setMonthlyPromptCount] = useState(0);

  const maxFreePrompts = 3;

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

  // Get prompt count from AsyncStorage using stable RevenueCat ID
  const getPromptCountFromStorage = async (
    customerInfo: CustomerInfo
  ): Promise<number> => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

      // Use RevenueCat's original user ID as stable identifier
      const stableUserId = customerInfo.originalAppUserId;
      const storageKey = `fastflix_prompts_${stableUserId}_${currentMonth}`;

      const storedCount = await AsyncStorage.getItem(storageKey);
      return storedCount ? parseInt(storedCount, 10) : 0;
    } catch (error) {
      console.error('Error loading prompt count from storage:', error);
      return 0;
    }
  };

  // Set prompt count in AsyncStorage with stable RevenueCat ID
  const setPromptCountInStorage = async (
    customerInfo: CustomerInfo,
    count: number
  ) => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const stableUserId = customerInfo.originalAppUserId;
      const storageKey = `fastflix_prompts_${stableUserId}_${currentMonth}`;

      await AsyncStorage.setItem(storageKey, count.toString());

      // Also sync to RevenueCat attributes for server-side tracking (write-only)
      await Purchases.setAttributes({
        [`prompts_${currentMonth}`]: count.toString(),
        last_reset_month: currentMonth,
      });

      console.log(`Set prompt count to ${count} for month ${currentMonth}`);
    } catch (error) {
      console.error('Failed to set prompt count:', error);
    }
  };

  // Initialize RevenueCat
  useEffect(() => {
    const initializeRevenueCat = async () => {
      try {
        console.log('Initializing RevenueCat...');

        // Configure RevenueCat with verbose logging for debugging
        Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

        const apiKey = Platform.select({
          ios: Constants.expoConfig?.extra?.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
        });

        if (!apiKey) {
          console.error('RevenueCat API key not found');
          setIsLoading(false);
          return;
        }

        await Purchases.configure({ apiKey });
        console.log('RevenueCat configured successfully');

        // Load initial data
        await Promise.all([refreshUserData(), loadOfferings()]);
      } catch (error) {
        console.error('Failed to initialize RevenueCat:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeRevenueCat();
  }, []);

  // Load available offerings
  const loadOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current) {
        setOfferings([offerings.current]);
        console.log('Offerings loaded successfully');
      }
    } catch (error) {
      console.error('Failed to load offerings:', error);
    }
  };

  // Refresh user data from RevenueCat
  const refreshUserData = useCallback(async () => {
    try {
      console.log('Refreshing user data...');
      const customerInfo = await Purchases.getCustomerInfo();
      setCustomerInfo(customerInfo);

      // Determine subscription status
      const status = determineSubscriptionStatus(customerInfo);
      setSubscriptionStatus(status);
      console.log(`Subscription status: ${status}`);

      // For free users, load prompt count from storage
      if (
        status === SubscriptionStatus.FREE ||
        status === SubscriptionStatus.EXPIRED
      ) {
        const promptCount = await getPromptCountFromStorage(customerInfo);
        setMonthlyPromptCount(promptCount);
        console.log(`Monthly prompt count: ${promptCount}`);
      } else {
        // Premium users don't need prompt counting
        setMonthlyPromptCount(0);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      setSubscriptionStatus(SubscriptionStatus.FREE);
    }
  }, []);

  // Purchase a package
  const purchasePackage = async (packageToPurchase: PurchasesPackage) => {
    try {
      setIsLoading(true);
      console.log('Purchasing package:', packageToPurchase.identifier);

      const { customerInfo } =
        await Purchases.purchasePackage(packageToPurchase);
      setCustomerInfo(customerInfo);

      const status = determineSubscriptionStatus(customerInfo);
      setSubscriptionStatus(status);

      if (status === SubscriptionStatus.ACTIVE) {
        Alert.alert(
          t('subscription.success.title') || 'Subscription Activated',
          t('subscription.success.message') ||
            'Welcome to FastFlix Pro features!'
        );
      }
    } catch (error: any) {
      console.error('Purchase failed:', error);

      if (!error?.userCancelled) {
        Alert.alert(
          t('subscription.error.title') || 'Purchase Failed',
          t('subscription.error.message') ||
            'Unable to complete purchase. Please try again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Restore purchases
  const restorePurchases = async () => {
    try {
      setIsLoading(true);
      console.log('Restoring purchases...');

      const customerInfo = await Purchases.restorePurchases();
      setCustomerInfo(customerInfo);

      const status = determineSubscriptionStatus(customerInfo);
      setSubscriptionStatus(status);

      if (
        status === SubscriptionStatus.ACTIVE ||
        status === SubscriptionStatus.GRACE_PERIOD
      ) {
        Alert.alert(
          t('subscription.restoration.success.title') || 'Purchases Restored',
          t('subscription.restoration.success.message') ||
            'Your subscription has been restored.'
        );
      } else {
        Alert.alert(
          t('subscription.restoration.none.title') || 'No Purchases Found',
          t('subscription.restoration.none.message') ||
            'No active subscriptions found to restore.'
        );
      }
    } catch (error) {
      console.error('Restore failed:', error);
      Alert.alert(
        t('subscription.restoration.error.title') || 'Restore Failed',
        t('subscription.restoration.error.message') ||
          'Unable to restore purchases. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Increment prompt count for free users
  const incrementPromptCount = async () => {
    if (!customerInfo) {
      console.error('Cannot increment prompt count: no customer info');
      return;
    }

    if (
      subscriptionStatus !== SubscriptionStatus.FREE &&
      subscriptionStatus !== SubscriptionStatus.EXPIRED
    ) {
      console.log('User has unlimited access, not incrementing prompt count');
      return;
    }

    try {
      const newCount = monthlyPromptCount + 1;

      // Update storage and RevenueCat attributes
      await setPromptCountInStorage(customerInfo, newCount);

      // Update local state
      setMonthlyPromptCount(newCount);

      console.log(`Incremented prompt count to ${newCount}`);
    } catch (error) {
      console.error('Failed to increment prompt count:', error);
    }
  };

  // Get monthly package
  const getMonthlyPackage = (): PurchasesPackage | null => {
    if (!offerings || offerings.length === 0) return null;
    return offerings[0].monthly ?? null;
  };

  // Get annual package
  const getAnnualPackage = (): PurchasesPackage | null => {
    if (!offerings || offerings.length === 0) return null;
    return offerings[0].annual ?? null;
  };

  // Derived properties
  const hasUnlimitedAccess =
    subscriptionStatus === SubscriptionStatus.ACTIVE ||
    subscriptionStatus === SubscriptionStatus.GRACE_PERIOD;
  const isFreeUser =
    subscriptionStatus === SubscriptionStatus.FREE ||
    subscriptionStatus === SubscriptionStatus.EXPIRED;
  const canMakePrompt =
    hasUnlimitedAccess || monthlyPromptCount < maxFreePrompts;
  const remainingPrompts = hasUnlimitedAccess
    ? Infinity
    : Math.max(0, maxFreePrompts - monthlyPromptCount);

  const value: SubscriptionContextType = {
    subscriptionStatus,
    isLoading,
    customerInfo,
    offerings,
    hasUnlimitedAccess,
    isFreeUser,
    monthlyPromptCount,
    maxFreePrompts,
    canMakePrompt,
    remainingPrompts,
    purchasePackage,
    restorePurchases,
    incrementPromptCount,
    refreshUserData,
    getMonthlyPackage,
    getAnnualPackage,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);

  if (context === undefined) {
    throw new Error(
      'useSubscription must be used within a SubscriptionProvider'
    );
  }

  return context;
};
