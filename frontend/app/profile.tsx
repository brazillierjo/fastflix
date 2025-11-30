import { Ionicons } from '@expo/vector-icons';
import SubscriptionModal from '@/components/SubscriptionModal';
import { AVAILABLE_LANGUAGES } from '@/constants/languages';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/RevenueCatContext';
import { getAppVersion } from '@/utils/appVersion';
import { getSquircle, getButtonBorderRadius } from '@/utils/designHelpers';
import { MotiView } from 'moti';
import React, { useState } from 'react';
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
  useColorScheme,
  View,
} from 'react-native';

export default function ProfileScreen() {
  const { language, setLanguage, country, setCountry, t, availableCountries } =
    useLanguage();
  const { hasUnlimitedAccess, restorePurchases } = useSubscription();
  const { user, signOut } = useAuth();

  const isSubscribed = hasUnlimitedAccess;
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const languages = AVAILABLE_LANGUAGES;

  return (
    <SafeAreaView className='flex-1 bg-light-background dark:bg-dark-background'>
      <ScrollView
        className='flex-1 px-6 pt-8'
        contentContainerStyle={{ paddingBottom: 120 }}
      >
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

        {/* User Information Section */}
        {user && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              delay: 100,
              type: 'timing',
              duration: 600,
            }}
            className='mb-6'
          >
            <View
              style={getSquircle(18)}
              className='bg-light-card p-6 dark:bg-dark-card'
            >
              <View className='mb-4 flex-row items-center gap-2'>
                <Ionicons
                  name='person'
                  size={20}
                  color={isDark ? '#ffffff' : '#0f172a'}
                />
                <Text className='text-lg font-semibold text-light-text dark:text-dark-text'>
                  {t('profile.account') || 'Account'}
                </Text>
              </View>

              <View className='space-y-3'>
                {user.name && (
                  <View className='flex-row items-center justify-between'>
                    <Text className='text-light-muted dark:text-dark-muted'>
                      {t('profile.name') || 'Name'}
                    </Text>
                    <Text className='text-light-text dark:text-dark-text'>
                      {user.name}
                    </Text>
                  </View>
                )}

                <View className='flex-row items-center justify-between'>
                  <Text className='text-light-muted dark:text-dark-muted'>
                    {t('profile.email') || 'Email'}
                  </Text>
                  <Text className='text-light-text dark:text-dark-text'>
                    {user.email}
                  </Text>
                </View>

                <View className='flex-row items-center justify-between'>
                  <Text className='text-light-muted dark:text-dark-muted'>
                    {t('profile.signInMethod') || 'Sign-in Method'}
                  </Text>
                  <Text className='text-light-text dark:text-dark-text'>
                    {user.auth_provider === 'apple' ? ' Apple' : '🔵 Google'}
                  </Text>
                </View>

                <View className='mt-4'>
                  <TouchableOpacity
                    onPress={signOut}
                    style={getButtonBorderRadius()}
                    className='bg-red-500 px-6 py-3 dark:bg-red-600'
                  >
                    <Text className='text-center font-semibold text-white'>
                      {t('profile.signOut') || 'Sign Out'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </MotiView>
        )}

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
          <View
            style={getSquircle(18)}
            className='bg-light-card p-6 dark:bg-dark-card'
          >
            <View className='mb-4 flex-row items-center gap-2'>
              <Ionicons
                name='globe'
                size={20}
                color={isDark ? '#ffffff' : '#0f172a'}
              />
              <Text className='text-lg font-semibold text-light-text dark:text-dark-text'>
                {t('profile.language')}
              </Text>
            </View>

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
              style={getButtonBorderRadius()}
              className='border border-light-border bg-light-background p-4 dark:border-dark-border dark:bg-dark-background'
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
          <View
            style={getSquircle(18)}
            className='bg-light-card p-6 dark:bg-dark-card'
          >
            <View className='mb-4 flex-row items-center gap-2'>
              <Ionicons
                name='flag'
                size={20}
                color={isDark ? '#ffffff' : '#0f172a'}
              />
              <Text className='text-lg font-semibold text-light-text dark:text-dark-text'>
                {t('settings.country')}
              </Text>
            </View>

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
              style={getButtonBorderRadius()}
              className='border border-light-border bg-light-background p-4 dark:border-dark-border dark:bg-dark-background'
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

        {/* Subscription Section - Only show if user is authenticated */}
        {user && (
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
            <View
              style={getSquircle(18)}
              className='bg-light-card p-6 dark:bg-dark-card'
            >
              <View className='mb-4 flex-row items-center gap-2'>
                <Ionicons
                  name='star'
                  size={20}
                  color={isDark ? '#fbbf24' : '#f59e0b'}
                />
                <Text className='text-lg font-semibold text-light-text dark:text-dark-text'>
                  {t('profile.premiumSubscription')}
                </Text>
              </View>

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
                    style={getButtonBorderRadius()}
                    className='bg-netflix-500 px-6 py-3'
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
                        Alert.alert(
                          t('subscription.restoration.error.title') ||
                            'Restore Failed',
                          t('subscription.restoration.error.message') ||
                            'An error occurred while restoring purchases. Please try again.'
                        );
                      } finally {
                        setRestoring(false);
                      }
                    }}
                    disabled={restoring}
                    className='py-3'
                  >
                    {restoring ? (
                      <ActivityIndicator color='#E50914' />
                    ) : (
                      <Text className='text-center font-medium text-netflix-500'>
                        {t('subscription.restore') || 'Restore Purchases'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
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
          <View
            style={getSquircle(18)}
            className='bg-light-card p-6 dark:bg-dark-card'
          >
            <View className='mb-4 flex-row items-center gap-2'>
              <Ionicons
                name='phone-portrait'
                size={20}
                color={isDark ? '#ffffff' : '#0f172a'}
              />
              <Text className='text-lg font-semibold text-light-text dark:text-dark-text'>
                {t('profile.aboutApp')}
              </Text>
            </View>
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
                      'https://fastflix-website.vercel.app/privacy-policy'
                    )
                  }
                  className='py-2'
                >
                  <Text className='text-netflix-500 underline'>
                    {t('profile.privacyPolicy')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL(
                      'https://fastflix-website.vercel.app/support'
                    )
                  }
                  className='py-2'
                >
                  <Text className='text-netflix-500 underline'>
                    {t('profile.support')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL('https://fastflix-website.vercel.app')
                  }
                  className='py-2'
                >
                  <Text className='text-netflix-500 underline'>
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
