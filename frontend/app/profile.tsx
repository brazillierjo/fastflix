import FiltersBottomSheet from '@/components/FiltersBottomSheet';
import AboutModal from '@/components/settings/AboutModal';
import AccountModal from '@/components/settings/AccountModal';
import SettingsRow from '@/components/settings/SettingsRow';
import SubscriptionDetailsModal from '@/components/settings/SubscriptionDetailsModal';
import SubscriptionModal from '@/components/SubscriptionModal';
import { AVAILABLE_LANGUAGES } from '@/constants/languages';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/RevenueCatContext';
import { useWatchlistCount } from '@/hooks/useWatchlist';
import { getAppVersion } from '@/utils/appVersion';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Linking,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { language, setLanguage, t } = useLanguage();
  const { hasUnlimitedAccess, trialInfo, isInTrial } = useSubscription();
  const { user, isAuthenticated } = useAuth();
  const { count: watchlistCount } = useWatchlistCount();
  const router = useRouter();

  // Modal states
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showSubscriptionDetailsModal, setShowSubscriptionDetailsModal] =
    useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  const languages = AVAILABLE_LANGUAGES;
  const currentLanguage = languages.find(lang => lang.code === language);

  // Get subscription status text
  const getSubscriptionSubtitle = () => {
    if (!isAuthenticated) {
      return t('profile.signInRequired') || 'Sign in to manage';
    }
    if (hasUnlimitedAccess) {
      if (isInTrial && trialInfo) {
        return `${t('profile.activeTrial') || 'Free Trial'} - ${trialInfo.daysRemaining} ${
          trialInfo.daysRemaining === 1
            ? t('profile.dayRemaining') || 'day'
            : t('profile.daysRemaining') || 'days'
        }`;
      }
      return t('profile.activeSubscription') || 'Active';
    }
    return t('profile.noSubscription') || 'Not subscribed';
  };

  // Report handlers
  const openMailto = async (subject: string, body: string) => {
    const url = `mailto:j.brazillier@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      Linking.openURL(url);
    } else {
      Alert.alert(
        t('report.errorTitle') || 'Cannot Open Mail',
        t('report.errorMessage') ||
          'Please send an email to j.brazillier@gmail.com'
      );
    }
  };

  const openBugReport = () => {
    const subject = t('report.bugSubject') || '[FastFlix Bug Report]';
    const body = `${t('report.bugBody') || 'Please describe the bug you encountered:'}\n\n---\nApp Version: ${getAppVersion()}\nPlatform: ${Platform.OS}\nLanguage: ${language}`;
    openMailto(subject, body);
  };

  const openFeedback = () => {
    const subject = t('report.feedbackSubject') || '[FastFlix Feedback]';
    const body = `${t('report.feedbackBody') || 'Share your feedback or suggestions:'}\n\n---\nApp Version: ${getAppVersion()}\nPlatform: ${Platform.OS}\nLanguage: ${language}`;
    openMailto(subject, body);
  };

  // Language picker
  const showLanguagePicker = () => {
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
      Alert.alert(t('profile.chooseLanguage'), '', [
        { text: t('common.cancel'), style: 'cancel' },
        ...languages.map(lang => ({
          text: `${lang.flag} ${lang.name}`,
          onPress: () => setLanguage(lang.code),
        })),
      ]);
    }
  };

  return (
    <SafeAreaView className='flex-1 bg-light-background dark:bg-dark-background'>
      <ScrollView
        className='flex-1'
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
          className='mb-6 px-6 pt-8'
        >
          <Text className='text-3xl font-bold text-light-text dark:text-dark-text'>
            {t('modal.title')}
          </Text>
          <Text className='mt-2 text-base text-light-muted dark:text-dark-muted'>
            {t('profile.subtitle')}
          </Text>
        </MotiView>

        {/* Account Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 100, type: 'timing', duration: 600 }}
          className='mb-6 px-4'
        >
          <View className='overflow-hidden rounded-xl'>
            <SettingsRow
              icon={isAuthenticated ? 'person' : 'log-in'}
              iconColor={isAuthenticated ? undefined : '#E50914'}
              title={
                isAuthenticated
                  ? t('profile.account') || 'Account'
                  : t('auth.signIn') || 'Sign In'
              }
              subtitle={
                isAuthenticated
                  ? user?.email
                  : t('auth.signInPrompt') || 'Sign in to access all features'
              }
              onPress={() => {
                if (isAuthenticated) {
                  setShowAccountModal(true);
                } else {
                  router.push('/auth');
                }
              }}
              isFirst
              isLast
            />
          </View>
        </MotiView>

        {/* Subscription Section */}
        {isAuthenticated && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 150, type: 'timing', duration: 600 }}
            className='mb-6 px-4'
          >
            <View className='overflow-hidden rounded-xl'>
              <SettingsRow
                icon='star'
                iconColor={hasUnlimitedAccess ? '#fbbf24' : undefined}
                title={t('profile.premiumSubscription') || 'Subscription'}
                subtitle={getSubscriptionSubtitle()}
                onPress={() => setShowSubscriptionDetailsModal(true)}
                isFirst
                isLast
              />
            </View>
          </MotiView>
        )}

        {/* Watchlist Section */}
        {isAuthenticated && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 160, type: 'timing', duration: 600 }}
            className='mb-6 px-4'
          >
            <View className='overflow-hidden rounded-xl'>
              <SettingsRow
                icon='bookmark'
                iconColor='#E50914'
                title={t('watchlist.title') || 'Watchlist'}
                subtitle={
                  watchlistCount > 0
                    ? `${watchlistCount} ${watchlistCount === 1 ? t('watchlist.item') || 'item' : t('watchlist.items') || 'items'}`
                    : t('watchlist.emptyShort') || 'No items saved'
                }
                onPress={() => router.push('/watchlist')}
                isFirst
                isLast
              />
            </View>
          </MotiView>
        )}

        {/* Default Filters Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 175, type: 'timing', duration: 600 }}
          className='mb-6 px-4'
        >
          <Text className='mb-2 ml-3 text-sm font-medium uppercase text-light-muted dark:text-dark-muted'>
            {t('profile.defaultFiltersSection') || 'Search Filters'}
          </Text>
          <View className='overflow-hidden rounded-xl'>
            {isAuthenticated ? (
              <SettingsRow
                icon='options'
                iconColor='#E50914'
                title={t('profile.defaultFilters') || 'Default Filters'}
                subtitle={
                  t('profile.defaultFiltersSubtitle') ||
                  'Country, platforms, content type'
                }
                onPress={() => setShowFiltersModal(true)}
                isFirst
                isLast
              />
            ) : (
              <SettingsRow
                icon='options'
                title={t('profile.defaultFilters') || 'Default Filters'}
                subtitle={t('profile.signInRequired') || 'Sign in to access'}
                onPress={() => router.push('/auth')}
                isFirst
                isLast
              />
            )}
          </View>
        </MotiView>

        {/* Preferences Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 200, type: 'timing', duration: 600 }}
          className='mb-6 px-4'
        >
          <Text className='mb-2 ml-3 text-sm font-medium uppercase text-light-muted dark:text-dark-muted'>
            {t('profile.preferences') || 'Preferences'}
          </Text>
          <View className='overflow-hidden rounded-xl'>
            <SettingsRow
              icon='globe'
              title={t('profile.language') || 'Language'}
              subtitle={
                currentLanguage
                  ? `${currentLanguage.flag} ${currentLanguage.name}`
                  : undefined
              }
              onPress={showLanguagePicker}
              isFirst
              isLast
            />
          </View>
        </MotiView>

        {/* Report Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 225, type: 'timing', duration: 600 }}
          className='mb-6 px-4'
        >
          <Text className='mb-2 ml-3 text-sm font-medium uppercase text-light-muted dark:text-dark-muted'>
            {t('report.title') || 'Report'}
          </Text>
          <View className='overflow-hidden rounded-xl'>
            <SettingsRow
              icon='bug'
              iconColor='#ef4444'
              title={t('report.bugReport') || 'Bug Report'}
              subtitle={t('report.bugReportSubtitle') || 'Report an issue'}
              onPress={openBugReport}
              isFirst
            />
            <SettingsRow
              icon='chatbubble-ellipses'
              iconColor='#3b82f6'
              title={t('report.feedback') || 'Feedback'}
              subtitle={
                t('report.feedbackSubtitle') || 'Share your suggestions'
              }
              onPress={openFeedback}
              isLast
            />
          </View>
        </MotiView>

        {/* About Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 275, type: 'timing', duration: 600 }}
          className='mb-6 px-4'
        >
          <View className='overflow-hidden rounded-xl'>
            <SettingsRow
              icon='information-circle'
              title={t('profile.aboutApp') || 'About'}
              subtitle={`${t('profile.version') || 'Version'} ${getAppVersion()}`}
              onPress={() => setShowAboutModal(true)}
              isFirst
              isLast
            />
          </View>
        </MotiView>
      </ScrollView>

      {/* Modals */}
      <AccountModal
        visible={showAccountModal}
        onClose={() => setShowAccountModal(false)}
      />
      <SubscriptionDetailsModal
        visible={showSubscriptionDetailsModal}
        onClose={() => setShowSubscriptionDetailsModal(false)}
        onViewPlans={() => {
          setShowSubscriptionDetailsModal(false);
          // Small delay to let the first modal close before opening the second
          setTimeout(() => setShowPlansModal(true), 300);
        }}
      />
      <SubscriptionModal
        visible={showPlansModal}
        onClose={() => setShowPlansModal(false)}
      />
      <AboutModal
        visible={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />
      <FiltersBottomSheet
        visible={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        saveAsDefault
      />
    </SafeAreaView>
  );
}
