import SubscriptionModal from '@/components/SubscriptionModal';
import { AVAILABLE_LANGUAGES } from '@/constants/languages';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/RevenueCatContext';
import { useFastFlixProFeatures } from '@/hooks/usePremiumFeatures';
import { getAppVersion } from '@/utils/appVersion';
import { useFocusEffect } from 'expo-router';
import { MotiView } from 'moti';
import React, { useCallback, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ProfileScreen() {
  const { language, setLanguage, country, setCountry, t, availableCountries } =
    useLanguage();
  const { isSubscribed, restorePurchases, customerInfo } = useSubscription();
  const { monthlyPromptCount, refreshPromptCount } = useFastFlixProFeatures();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Refresh prompt count when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshPromptCount();
    }, [refreshPromptCount])
  );

  // Utilisation des constantes centralisées
  const languages = AVAILABLE_LANGUAGES;

  return (
    <SafeAreaView className='flex-1 bg-light-background dark:bg-dark-background'>
      <ScrollView className='flex-1 px-6 pt-8'>
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: 'timing',
            duration: 600,
          }}
          className='mb-8'
        >
          <Text className='text-3xl font-bold text-light-text dark:text-dark-text'>
            {t('modal.title')}
          </Text>
          <Text className='mt-2 text-base text-light-muted dark:text-dark-muted'>
            {t('profile.subtitle')}
          </Text>
        </MotiView>

        {/* Language Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            delay: 200,
            type: 'timing',
            duration: 600,
          }}
          className='mb-6'
        >
          <View className='rounded-xl bg-light-card p-6 dark:bg-dark-card'>
            <Text className='mb-4 text-lg font-semibold text-light-text dark:text-dark-text'>
              🌍 {t('profile.language')}
            </Text>

            <TouchableOpacity
              onPress={() => {
                if (Platform.OS === 'ios') {
                  ActionSheetIOS.showActionSheetWithOptions(
                    {
                      options: [
                        t('common.cancel'),
                        ...languages.map(lang => `${lang.flag} ${lang.name}`),
                      ],
                      cancelButtonIndex: 0,
                      title: t('profile.chooseLanguage'),
                    },
                    buttonIndex => {
                      if (buttonIndex > 0) {
                        const selectedLang = languages[buttonIndex - 1];
                        setLanguage(selectedLang.code);
                      }
                    }
                  );
                } else {
                  // Pour Android, utiliser Alert avec des boutons
                  Alert.alert(t('profile.chooseLanguage'), '', [
                    {
                      text: t('common.cancel'),
                      style: 'cancel',
                    },
                    ...languages.map(lang => ({
                      text: `${lang.flag} ${lang.name}`,
                      onPress: () => setLanguage(lang.code),
                    })),
                  ]);
                }
              }}
              className='rounded-lg border border-light-border bg-light-background p-4 dark:border-dark-border dark:bg-dark-background'
            >
              <View className='flex-row items-center justify-between'>
                <Text className='text-base text-light-text dark:text-dark-text'>
                  {languages.find(lang => lang.code === language)?.flag}{' '}
                  {languages.find(lang => lang.code === language)?.name}
                </Text>
                <Text className='text-light-muted dark:text-dark-muted'>▼</Text>
              </View>
            </TouchableOpacity>
          </View>
        </MotiView>

        {/* Country Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            delay: 300,
            type: 'timing',
            duration: 600,
          }}
          className='mb-6'
        >
          <View className='rounded-xl bg-light-card p-6 dark:bg-dark-card'>
            <Text className='mb-4 text-lg font-semibold text-light-text dark:text-dark-text'>
              🌍 {t('settings.country')}
            </Text>

            <TouchableOpacity
              onPress={() => {
                if (Platform.OS === 'ios') {
                  ActionSheetIOS.showActionSheetWithOptions(
                    {
                      options: [
                        t('common.cancel'),
                        ...availableCountries.map(
                          country => `${country.flag} ${country.name}`
                        ),
                      ],
                      cancelButtonIndex: 0,
                      title: t('profile.chooseCountry'),
                    },
                    buttonIndex => {
                      if (buttonIndex > 0) {
                        const selectedCountry =
                          availableCountries[buttonIndex - 1];
                        setCountry(selectedCountry.code);
                      }
                    }
                  );
                } else {
                  // Pour Android, utiliser Alert avec des boutons
                  Alert.alert(t('profile.chooseCountry'), '', [
                    {
                      text: t('common.cancel'),
                      style: 'cancel',
                    },
                    ...availableCountries.map(countryItem => ({
                      text: `${countryItem.flag} ${countryItem.name}`,
                      onPress: () => setCountry(countryItem.code),
                    })),
                  ]);
                }
              }}
              className='rounded-lg border border-light-border bg-light-background p-4 dark:border-dark-border dark:bg-dark-background'
            >
              <View className='flex-row items-center justify-between'>
                <Text className='text-base text-light-text dark:text-dark-text'>
                  {availableCountries.find(c => c.code === country)?.flag}{' '}
                  {availableCountries.find(c => c.code === country)?.name}
                </Text>
                <Text className='text-light-muted dark:text-dark-muted'>▼</Text>
              </View>
            </TouchableOpacity>
          </View>
        </MotiView>

        {/* Subscription Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            delay: 400,
            type: 'timing',
            duration: 600,
          }}
          className='mb-6'
        >
          <View className='rounded-xl bg-light-card p-6 dark:bg-dark-card'>
            <Text className='mb-4 text-lg font-semibold text-light-text dark:text-dark-text'>
              ⭐ {t('profile.premiumSubscription')}
            </Text>

            {isSubscribed ? (
              <View className='gap-3'>
                <View className='flex-row items-center'>
                  <View className='mr-3 h-3 w-3 rounded-full bg-success-500' />
                  <Text className='font-medium text-light-text dark:text-dark-text'>
                    {t('profile.activeSubscription')}
                  </Text>
                </View>
                <Text className='text-sm text-light-muted dark:text-dark-muted'>
                  {t('profile.enjoyPremiumFeatures')}
                </Text>
              </View>
            ) : (
              <View className='gap-4'>
                <Text className='text-light-muted dark:text-dark-muted'>
                  {t('profile.unlockPremiumMessage')}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowSubscriptionModal(true)}
                  className='rounded-lg bg-primary-500 px-6 py-3'
                >
                  <Text className='text-center font-semibold text-white'>
                    {t('profile.viewPlans')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      setRestoring(true);
                      await restorePurchases();
                    } catch (error) {
                      console.error('Restore error:', error);
                    } finally {
                      setRestoring(false);
                    }
                  }}
                  disabled={restoring}
                  className='py-3'
                >
                  {restoring ? (
                    <ActivityIndicator color='#3B82F6' />
                  ) : (
                    <Text className='text-center font-medium text-primary-500'>
                      {t('subscription.restore') || 'Restore Purchases'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </MotiView>

        {/* Free Prompts Section */}
        {!isSubscribed && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              delay: 450,
              type: 'timing',
              duration: 600,
            }}
            className='mb-6'
          >
            <View className='rounded-xl bg-light-card p-6 dark:bg-dark-card'>
              <Text className='mb-4 text-lg font-semibold text-light-text dark:text-dark-text'>
                🎯 {t('profile.freePrompts.title')}
              </Text>

              <View className='gap-3'>
                <View className='flex-row items-center justify-between'>
                  <Text className='text-light-muted dark:text-dark-muted'>
                    {t('profile.freePrompts.used')}
                  </Text>
                  <Text className='font-medium text-light-text dark:text-dark-text'>
                    {monthlyPromptCount} / 3
                  </Text>
                </View>

                <View className='flex-row items-center justify-between'>
                  <Text className='text-light-muted dark:text-dark-muted'>
                    {t('profile.freePrompts.remaining')}
                  </Text>
                  <Text
                    className={`font-medium ${
                      isSubscribed || Math.max(0, 3 - monthlyPromptCount) > 0
                        ? 'text-success-500'
                        : 'text-error-500'
                    }`}
                  >
                    {isSubscribed ? '∞' : Math.max(0, 3 - monthlyPromptCount)}
                  </Text>
                </View>

                <View className='mt-2 h-2 w-full rounded-full bg-light-border dark:bg-dark-border'>
                  <View
                    className={`h-full rounded-full ${
                      isSubscribed || Math.max(0, 3 - monthlyPromptCount) > 0
                        ? 'bg-success-500'
                        : 'bg-error-500'
                    }`}
                    style={{
                      width: `${Math.min((monthlyPromptCount / 3) * 100, 100)}%`,
                    }}
                  />
                </View>

                <Text className='mt-2 text-sm text-light-muted dark:text-dark-muted'>
                  {t('profile.freePrompts.resetInfo')}
                </Text>

                {!isSubscribed && monthlyPromptCount >= 3 && (
                  <TouchableOpacity
                    onPress={() => setShowSubscriptionModal(true)}
                    className='mt-3 rounded-lg bg-primary-500 px-4 py-3'
                  >
                    <Text className='text-center font-semibold text-white'>
                      {t('profile.freePrompts.upgradeButton')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </MotiView>
        )}

        {/* App Info Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            delay: isSubscribed ? 500 : 550,
            type: 'timing',
            duration: 600,
          }}
          className='mb-6'
        >
          <View className='rounded-xl bg-light-card p-6 dark:bg-dark-card'>
            <Text className='mb-4 text-lg font-semibold text-light-text dark:text-dark-text'>
              📱 {t('profile.aboutApp')}
            </Text>
            <View className='space-y-3'>
              <View className='flex-row justify-between'>
                <Text className='text-light-muted dark:text-dark-muted'>
                  {t('profile.version')}
                </Text>
                <Text className='text-light-text dark:text-dark-text'>
                  {getAppVersion()}
                </Text>
              </View>

              {/* Legal Links */}
              <View className='mt-4 space-y-2'>
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL(
                      'https://fastflix-nu.vercel.app/privacy-policy'
                    )
                  }
                  className='py-2'
                >
                  <Text className='text-primary-500 underline'>
                    {t('profile.privacyPolicy')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL('https://fastflix-nu.vercel.app/support')
                  }
                  className='py-2'
                >
                  <Text className='text-primary-500 underline'>
                    {t('profile.support')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL('https://fastflix-nu.vercel.app')
                  }
                  className='py-2'
                >
                  <Text className='text-primary-500 underline'>
                    {t('profile.website')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </MotiView>
      </ScrollView>

      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
    </SafeAreaView>
  );
}
