/**
 * RevenueCat Context for Subscription Management
 *
 * This context provides a centralized way to manage subscription state and purchases
 * throughout the "FastFlix" application. It integrates with RevenueCat SDK
 * to handle subscription purchases, restoration, and status checking.
 *
 * Key features:
 * - Subscription status management (active, expired, trial)
 * - Purchase flow handling for monthly and annual subscriptions
 * - Automatic subscription restoration
 * - Error handling and user feedback
 * - Integration with app state for premium features
 */

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

export interface SubscriptionContextType {
  // Subscription state
  isSubscribed: boolean;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOffering[] | null;

  // Subscription actions
  purchasePackage: (packageToPurchase: PurchasesPackage) => Promise<void>;
  restorePurchases: () => Promise<void>;
  checkSubscriptionStatus: () => Promise<void>;

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
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOffering[] | null>(null);

  // Initialize RevenueCat
  useEffect(() => {
    const initializeRevenueCat = async () => {
      try {
        // Configure RevenueCat
        Purchases.setLogLevel(LOG_LEVEL.INFO);

        const apiKey = Platform.select({
          ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
        });

        if (!apiKey) {
          console.warn('RevenueCat API key not found');
          setIsLoading(false);
          return;
        }

        await Purchases.configure({ apiKey });

        // Get initial customer info and offerings
        await Promise.all([checkSubscriptionStatus(), loadOfferings()]);
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
      }
    } catch (error) {
      console.error('Failed to load offerings:', error);
    }
  };

  // Check subscription status
  const checkSubscriptionStatus = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      setCustomerInfo(customerInfo);

      // Check if user has active subscription
      const isActive = Object.keys(customerInfo.entitlements.active).length > 0;
      setIsSubscribed(isActive);
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      setIsSubscribed(false);
    }
  };

  // Purchase a package
  const purchasePackage = async (packageToPurchase: PurchasesPackage) => {
    try {
      setIsLoading(true);
      const { customerInfo } =
        await Purchases.purchasePackage(packageToPurchase);

      setCustomerInfo(customerInfo);
      const isActive = Object.keys(customerInfo.entitlements.active).length > 0;
      setIsSubscribed(isActive);

      if (isActive) {
        Alert.alert(
          t('subscription.success.title') || 'Subscription Activated',
          t('subscription.success.message') || 'Welcome to FastFlix Pro features!'
        );
      }
    } catch (error: any) {
      console.error('Purchase failed:', error);

      if (!error.userCancelled) {
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
      const customerInfo = await Purchases.restorePurchases();

      setCustomerInfo(customerInfo);
      const isActive = Object.keys(customerInfo.entitlements.active).length > 0;
      setIsSubscribed(isActive);

      if (isActive) {
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

  // Get monthly package
  const getMonthlyPackage = (): PurchasesPackage | null => {
    if (!offerings || offerings.length === 0) return null;

    const currentOffering = offerings[0];
    return currentOffering.monthly ?? null;
  };

  // Get annual package
  const getAnnualPackage = (): PurchasesPackage | null => {
    if (!offerings || offerings.length === 0) return null;

    const currentOffering = offerings[0];
    return currentOffering.annual ?? null;
  };

  const value: SubscriptionContextType = {
    isSubscribed,
    isLoading,
    customerInfo,
    offerings,
    purchasePackage,
    restorePurchases,
    checkSubscriptionStatus,
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
