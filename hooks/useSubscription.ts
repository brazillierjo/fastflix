/**
 * Subscription Hook - Clean integration with Zustand store
 * Separates business logic from UI concerns
 */

import { useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';
import { subscriptionService } from '@/services/subscription.service';
import { useSubscriptionState, useSubscriptionActions } from '@/store';
import { useLanguage } from '@/contexts/LanguageContext';

interface UseSubscriptionReturn {
  // State
  isSubscribed: boolean;
  isLoading: boolean;
  customerInfo: unknown;
  offerings: unknown;

  // Actions
  purchasePackage: (packageToPurchase: PurchasesPackage) => Promise<void>;
  restorePurchases: () => Promise<void>;
  refreshSubscriptionStatus: () => Promise<void>;

  // Package helpers
  getMonthlyPackage: () => PurchasesPackage | null;
  getAnnualPackage: () => PurchasesPackage | null;
}

export const useSubscription = (): UseSubscriptionReturn => {
  const { t } = useLanguage();
  const { isSubscribed, isLoading, customerInfo, offerings } =
    useSubscriptionState();
  const { setSubscriptionStatus, setLoading, setCustomerInfo, setOfferings } =
    useSubscriptionActions();

  // Initialize subscription service on mount
  useEffect(() => {
    const initializeSubscription = async () => {
      setLoading(true);

      const initResult = await subscriptionService.initialize();
      if (!initResult.success) {
        console.error(
          'Failed to initialize subscription service:',
          initResult.error
        );
        setLoading(false);
        return;
      }

      // Load initial data
      await Promise.all([refreshSubscriptionStatus(), loadOfferings()]);

      setLoading(false);
    };

    initializeSubscription();
  }, []);

  const refreshSubscriptionStatus = useCallback(async (): Promise<void> => {
    try {
      const result = await subscriptionService.getCustomerInfo();

      if (result.success) {
        setCustomerInfo(result.data);
        const isActive = subscriptionService.checkIfSubscribed(result.data);
        setSubscriptionStatus(isActive);
      } else {
        console.error('Failed to refresh subscription status:', result.error);
        setSubscriptionStatus(false);
      }
    } catch (error) {
      console.error('Error refreshing subscription status:', error);
      setSubscriptionStatus(false);
    }
  }, [setCustomerInfo, setSubscriptionStatus]);

  const loadOfferings = useCallback(async (): Promise<void> => {
    try {
      const result = await subscriptionService.getOfferings();

      if (result.success) {
        setOfferings(result.data);
      } else {
        console.error('Failed to load offerings:', result.error);
        setOfferings([]);
      }
    } catch (error) {
      console.error('Error loading offerings:', error);
      setOfferings([]);
    }
  }, [setOfferings]);

  const purchasePackage = useCallback(
    async (packageToPurchase: PurchasesPackage): Promise<void> => {
      try {
        setLoading(true);

        const result =
          await subscriptionService.purchasePackage(packageToPurchase);

        if (result.success) {
          setCustomerInfo(result.data.customerInfo);
          setSubscriptionStatus(result.data.isSubscribed);

          if (result.data.isSubscribed) {
            Alert.alert(
              t('subscription.success.title') || 'Subscription Activated',
              result.message ||
                t('subscription.success.message') ||
                'Welcome to FastFlix Pro features!'
            );
          }
        } else {
          // Don't show alert for user cancellation
          if (result.error?.code !== 'USER_CANCELLED') {
            Alert.alert(
              t('subscription.error.title') || 'Purchase Failed',
              result.error?.message ||
                t('subscription.error.message') ||
                'Unable to complete purchase. Please try again.'
            );
          }
        }
      } catch (error) {
        console.error('Unexpected error during purchase:', error);
        Alert.alert(
          t('subscription.error.title') || 'Purchase Failed',
          t('subscription.error.message') ||
            'An unexpected error occurred. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setCustomerInfo, setSubscriptionStatus, t]
  );

  const restorePurchases = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);

      const result = await subscriptionService.restorePurchases();

      if (result.success) {
        setCustomerInfo(result.data.customerInfo);
        setSubscriptionStatus(result.data.isSubscribed);

        if (result.data.isSubscribed) {
          Alert.alert(
            t('subscription.restoration.success.title') || 'Purchases Restored',
            result.message ||
              t('subscription.restoration.success.message') ||
              'Your subscription has been restored.'
          );
        } else if (result.data.hadPreviousPurchases) {
          Alert.alert(
            t('subscription.restoration.expired.title') ||
              'Previous Purchases Found',
            t('subscription.restoration.expired.message') ||
              'Previous purchases were found but no active subscriptions.'
          );
        } else {
          Alert.alert(
            t('subscription.restoration.none.title') || 'No Purchases Found',
            t('subscription.restoration.none.message') ||
              'No previous purchases found to restore.'
          );
        }
      } else {
        Alert.alert(
          t('subscription.restoration.error.title') || 'Restore Failed',
          result.error?.message ||
            t('subscription.restoration.error.message') ||
            'Unable to restore purchases. Please try again.'
        );
      }
    } catch (error) {
      console.error('Unexpected error during restore:', error);
      Alert.alert(
        t('subscription.restoration.error.title') || 'Restore Failed',
        t('subscription.restoration.error.message') ||
          'An unexpected error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [setLoading, setCustomerInfo, setSubscriptionStatus, t]);

  const getMonthlyPackage = useCallback((): PurchasesPackage | null => {
    return subscriptionService.getMonthlyPackage(
      Array.isArray(offerings) ? offerings : []
    );
  }, [offerings]);

  const getAnnualPackage = useCallback((): PurchasesPackage | null => {
    return subscriptionService.getAnnualPackage(
      Array.isArray(offerings) ? offerings : []
    );
  }, [offerings]);

  return {
    // State
    isSubscribed,
    isLoading,
    customerInfo,
    offerings,

    // Actions
    purchasePackage,
    restorePurchases,
    refreshSubscriptionStatus,

    // Package helpers
    getMonthlyPackage,
    getAnnualPackage,
  };
};
