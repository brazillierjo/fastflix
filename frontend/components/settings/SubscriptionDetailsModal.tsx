import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/RevenueCatContext';
import * as Sentry from '@sentry/react-native';
import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SubscriptionDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  onViewPlans: () => void;
}

// Helper to format product ID to readable plan name
const getProductName = (
  productId: string | null,
  t: (key: string) => string
): string => {
  if (!productId) return t('subscription.plan.unknown') || 'Unknown';

  const id = productId.toLowerCase();
  if (id.includes('annual') || id.includes('yearly')) {
    return t('subscription.plan.annual') || 'Annual';
  }
  if (id.includes('quarter') || id.includes('three_month')) {
    return t('subscription.plan.quarterly') || 'Quarterly';
  }
  if (id.includes('month')) {
    return t('subscription.plan.monthly') || 'Monthly';
  }
  return t('subscription.plan.premium') || 'Premium';
};

// Helper to format date
const formatDate = (dateString: string | null, language: string): string => {
  if (!dateString) return '-';

  try {
    // Handle both ISO format and SQLite datetime format
    let date: Date;
    if (dateString.includes('T')) {
      // ISO format: 2026-01-03T12:11:29.000Z
      date = new Date(dateString);
    } else {
      // SQLite format: 2025-12-03 10:55:12
      date = new Date(`${dateString.replace(' ', 'T')}Z`);
    }

    if (isNaN(date.getTime())) return '-';

    return date.toLocaleDateString(language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '-';
  }
};

export default function SubscriptionDetailsModal({
  visible,
  onClose,
  onViewPlans,
}: SubscriptionDetailsModalProps) {
  const { hasUnlimitedAccess, restorePurchases, subscriptionInfo } =
    useSubscription();
  const { t, language } = useLanguage();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [restoring, setRestoring] = useState(false);

  const isSubscribed = hasUnlimitedAccess;

  // Determine if user has a paid subscription (not just trial)
  const hasPaidSubscription = subscriptionInfo?.isActive ?? false;

  // Format subscription info for display
  const subscriptionDetails = useMemo(() => {
    if (!subscriptionInfo || !subscriptionInfo.isActive) return null;

    return {
      planName: getProductName(subscriptionInfo.productId, t),
      startDate: formatDate(subscriptionInfo.createdAt, language),
      endDate: formatDate(subscriptionInfo.expiresAt, language),
      willRenew: subscriptionInfo.willRenew,
      status: subscriptionInfo.status,
    };
  }, [subscriptionInfo, t, language]);

  const handleRestore = async () => {
    try {
      setRestoring(true);
      await restorePurchases();
    } catch (error) {
      Sentry.captureException(error, {
        tags: { context: 'restore-purchases' },
      });
      Alert.alert(
        t('subscription.restoration.error.title') || 'Restore Failed',
        t('subscription.restoration.error.message') ||
          'An error occurred while restoring purchases. Please try again.'
      );
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
    >
      <SafeAreaView className='flex-1 bg-light-background dark:bg-dark-background'>
        {/* Header */}
        <View className='flex-row items-center justify-between border-b border-light-border px-4 py-3 dark:border-dark-border'>
          <View className='w-20' />
          <Text className='text-lg font-semibold text-light-text dark:text-dark-text'>
            {t('profile.premiumSubscription') || 'Subscription'}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            className='min-w-[80px] items-center justify-center rounded-full bg-netflix-500 px-4 py-2'
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text className='text-base font-semibold text-white'>
              {t('common.done') || 'Done'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className='flex-1 px-4 pt-6'>
          {/* Status Card */}
          <View className='mb-6 rounded-xl bg-light-card p-4 dark:bg-dark-card'>
            <View className='mb-3 flex-row items-center'>
              <View
                className={`mr-3 h-10 w-10 items-center justify-center rounded-full ${
                  isSubscribed
                    ? 'bg-green-500/20'
                    : 'bg-light-muted/20 dark:bg-dark-muted/20'
                }`}
              >
                <Ionicons
                  name={isSubscribed ? 'checkmark-circle' : 'close-circle'}
                  size={24}
                  color={
                    isSubscribed ? '#22c55e' : isDark ? '#6b7280' : '#9ca3af'
                  }
                />
              </View>
              <View className='flex-1'>
                <Text className='text-lg font-semibold text-light-text dark:text-dark-text'>
                  {isSubscribed
                    ? t('profile.activeSubscription') || 'Active Subscription'
                    : t('subscription.required.title') ||
                      'No Active Subscription'}
                </Text>
                {isSubscribed && (
                  <Text className='text-sm text-light-muted dark:text-dark-muted'>
                    {hasPaidSubscription && subscriptionDetails
                      ? subscriptionDetails.planName
                      : t('profile.enjoyPremiumFeatures') ||
                        'Enjoy all FastFlix Pro features'}
                  </Text>
                )}
              </View>
            </View>

            {/* Paid Subscription Info */}
            {hasPaidSubscription && subscriptionDetails && (
              <View className='mt-2 space-y-2'>
                {/* Start Date */}
                <View className='flex-row items-center justify-between rounded-lg bg-light-background/50 px-3 py-2 dark:bg-dark-background/50'>
                  <View className='flex-row items-center gap-2'>
                    <Ionicons
                      name='calendar-outline'
                      size={16}
                      color={isDark ? '#9ca3af' : '#6b7280'}
                    />
                    <Text className='text-sm text-light-muted dark:text-dark-muted'>
                      {t('subscription.startDate') || 'Start date'}
                    </Text>
                  </View>
                  <Text className='text-sm font-medium text-light-text dark:text-dark-text'>
                    {subscriptionDetails.startDate}
                  </Text>
                </View>

                {/* End/Renewal Date */}
                <View className='flex-row items-center justify-between rounded-lg bg-light-background/50 px-3 py-2 dark:bg-dark-background/50'>
                  <View className='flex-row items-center gap-2'>
                    <Ionicons
                      name={
                        subscriptionDetails.willRenew
                          ? 'refresh-outline'
                          : 'time-outline'
                      }
                      size={16}
                      color={
                        subscriptionDetails.willRenew ? '#22c55e' : '#f59e0b'
                      }
                    />
                    <Text className='text-sm text-light-muted dark:text-dark-muted'>
                      {subscriptionDetails.willRenew
                        ? t('subscription.renewalDate') || 'Renewal date'
                        : t('subscription.endDate') || 'End date'}
                    </Text>
                  </View>
                  <Text className='text-sm font-medium text-light-text dark:text-dark-text'>
                    {subscriptionDetails.endDate}
                  </Text>
                </View>

                {/* Cancellation Warning */}
                {!subscriptionDetails.willRenew && (
                  <View className='mt-2 rounded-lg bg-amber-500/10 p-3 dark:bg-amber-500/20'>
                    <View className='flex-row items-center gap-2'>
                      <Ionicons
                        name='warning-outline'
                        size={18}
                        color='#f59e0b'
                      />
                      <Text className='flex-1 text-sm font-medium text-amber-600 dark:text-amber-400'>
                        {t('subscription.cancelledMessage') ||
                          'Your subscription will not renew'}
                      </Text>
                    </View>
                    <Text className='mt-1 text-sm text-amber-600/80 dark:text-amber-400/80'>
                      {t('subscription.accessUntil') ||
                        'You will have access until'}{' '}
                      {subscriptionDetails.endDate}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Actions */}
          <View className='overflow-hidden rounded-xl bg-light-card dark:bg-dark-card'>
            {/* Plans button:
                - "View Plans" if not subscribed or cancelled
                - "Change Plan" if subscribed and will renew
            */}
            <TouchableOpacity
              onPress={onViewPlans}
              className='flex-row items-center px-4 py-3'
            >
              <View className='mr-3 h-8 w-8 items-center justify-center rounded-lg bg-netflix-500/20'>
                <Ionicons name='star' size={18} color='#E50914' />
              </View>
              <Text className='flex-1 text-base font-medium text-light-text dark:text-dark-text'>
                {hasPaidSubscription && subscriptionDetails?.willRenew
                  ? t('profile.changePlan') || 'Change Plan'
                  : t('profile.viewPlans') || 'View Plans'}
              </Text>
              <Ionicons
                name='chevron-forward'
                size={20}
                color={isDark ? '#6b7280' : '#9ca3af'}
              />
            </TouchableOpacity>

            <View className='ml-16 h-px bg-light-border dark:bg-dark-border' />

            {/* Restore Purchases */}
            <TouchableOpacity
              onPress={handleRestore}
              disabled={restoring}
              className='flex-row items-center px-4 py-3'
            >
              <View className='mr-3 h-8 w-8 items-center justify-center rounded-lg bg-light-background dark:bg-dark-background'>
                <Ionicons
                  name='refresh'
                  size={18}
                  color={isDark ? '#ffffff' : '#0f172a'}
                />
              </View>
              <Text className='flex-1 text-base font-medium text-light-text dark:text-dark-text'>
                {t('subscription.restore') || 'Restore Purchases'}
              </Text>
              {restoring ? (
                <ActivityIndicator size='small' color='#E50914' />
              ) : (
                <Ionicons
                  name='chevron-forward'
                  size={20}
                  color={isDark ? '#6b7280' : '#9ca3af'}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Info Text */}
          {!isSubscribed && (
            <Text className='mt-4 px-4 text-center text-sm text-light-muted dark:text-dark-muted'>
              {t('profile.unlockPremiumMessage') ||
                'Unlock all FastFlix Pro features for the best experience'}
            </Text>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
