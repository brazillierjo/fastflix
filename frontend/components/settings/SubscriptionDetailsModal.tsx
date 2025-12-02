import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/RevenueCatContext';
import React, { useState } from 'react';
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

export default function SubscriptionDetailsModal({
  visible,
  onClose,
  onViewPlans,
}: SubscriptionDetailsModalProps) {
  const { hasUnlimitedAccess, restorePurchases, trialInfo, isInTrial } =
    useSubscription();
  const { t } = useLanguage();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [restoring, setRestoring] = useState(false);

  const isSubscribed = hasUnlimitedAccess;

  const handleRestore = async () => {
    try {
      setRestoring(true);
      await restorePurchases();
    } catch (error) {
      console.error('Restore error:', error);
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
                    ? isInTrial
                      ? t('profile.activeTrial') || 'Free Trial Active'
                      : t('profile.activeSubscription') || 'Active Subscription'
                    : t('subscription.required.title') ||
                      'No Active Subscription'}
                </Text>
                {isSubscribed && (
                  <Text className='text-sm text-light-muted dark:text-dark-muted'>
                    {t('profile.enjoyPremiumFeatures') ||
                      'Enjoy all FastFlix Pro features'}
                  </Text>
                )}
              </View>
            </View>

            {/* Trial Info */}
            {isInTrial && trialInfo && (
              <View className='mt-2 rounded-lg bg-amber-500/10 p-3 dark:bg-amber-500/20'>
                <View className='flex-row items-center gap-2'>
                  <Ionicons name='time-outline' size={18} color='#f59e0b' />
                  <Text className='font-medium text-amber-600 dark:text-amber-400'>
                    {trialInfo.daysRemaining}{' '}
                    {trialInfo.daysRemaining === 1
                      ? t('profile.dayRemaining') || 'day remaining'
                      : t('profile.daysRemaining') || 'days remaining'}
                  </Text>
                </View>
                <Text className='mt-1 text-sm text-amber-600/80 dark:text-amber-400/80'>
                  {t('profile.trialEndsMessage') ||
                    'Subscribe before your trial ends to keep unlimited access'}
                </Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View className='overflow-hidden rounded-xl bg-light-card dark:bg-dark-card'>
            {/* View Plans */}
            <TouchableOpacity
              onPress={onViewPlans}
              className='flex-row items-center px-4 py-3'
            >
              <View className='mr-3 h-8 w-8 items-center justify-center rounded-lg bg-netflix-500/20'>
                <Ionicons name='star' size={18} color='#E50914' />
              </View>
              <Text className='flex-1 text-base font-medium text-light-text dark:text-dark-text'>
                {t('profile.viewPlans') || 'View Plans'}
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
