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

  // Actions
  purchasePackage: (packageToPurchase: PurchasesPackage) => Promise<void>;
  restorePurchases: () => Promise<boolean>;

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

        // Get customer info
        const info = await Purchases.getCustomerInfo();
        setCustomerInfo(info);

        const status = determineSubscriptionStatus(info);
        setSubscriptionStatus(status);

        console.log('✅ RevenueCat initialized - Status:', status);

        // Fetch available offerings
        const offerings = await Purchases.getOfferings();
        if (offerings.current) {
          setOfferings([offerings.current]);
          console.log('✅ Offerings loaded:', offerings.current.identifier);
        }

        setIsLoading(false);
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

      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      setCustomerInfo(customerInfo);

      const status = determineSubscriptionStatus(customerInfo);
      setSubscriptionStatus(status);

      console.log('✅ Purchase successful - Status:', status);

      Alert.alert(
        t('subscription.success.title') || 'Welcome to Pro!',
        t('subscription.success.message') ||
          'Thank you for upgrading! You now have unlimited access to all features.'
      );
    } catch (error: any) {
      console.error('❌ Error purchasing package:', error);

      if (error.userCancelled) {
        console.log('User cancelled purchase');
        return;
      }

      Alert.alert(
        t('subscription.error.title') || 'Purchase Failed',
        t('subscription.error.message') ||
          error.message ||
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
    } catch (error: any) {
      console.error('❌ Error restoring purchases:', error);

      Alert.alert(
        t('subscription.restoration.error.title') || 'Restore Failed',
        t('subscription.restoration.error.message') ||
          error.message ||
          'Something went wrong. Please try again.'
      );

      return false;
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

  const getAnnualPackage = (): PurchasesPackage | null => {
    if (!offerings || offerings.length === 0) return null;

    const annualPackage = offerings[0].availablePackages.find(
      pkg => pkg.identifier === '$rc_annual' || pkg.packageType === 'ANNUAL'
    );

    return annualPackage || null;
  };

  const contextValue: SubscriptionContextType = {
    subscriptionStatus,
    isLoading,
    customerInfo,
    offerings,
    hasUnlimitedAccess:
      subscriptionStatus === SubscriptionStatus.ACTIVE ||
      subscriptionStatus === SubscriptionStatus.GRACE_PERIOD,
    isFreeUser: subscriptionStatus === SubscriptionStatus.FREE,
    purchasePackage,
    restorePurchases,
    getMonthlyPackage,
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
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
