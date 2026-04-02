import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MotiView } from 'moti';

import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import * as Sentry from '@sentry/react-native';
import {
  registerForPushNotifications,
  shouldAskPermission,
  markPermissionAsked,
  scheduleDailyPickReminder,
} from '@/services/notifications';
import { backendAPIService } from '@/services/backend-api.service';
import { getSquircle } from '@/utils/designHelpers';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const SEARCH_COUNT_KEY = '@fastflix/search_count_local';
const SEARCH_THRESHOLD = 3;

interface NotificationPromptProps {
  searchCount?: number;
}

export default function NotificationPrompt({
  searchCount,
}: NotificationPromptProps) {
  const [visible, setVisible] = useState(false);
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const checkIfShouldShow = useCallback(async () => {
    if (!isAuthenticated) return;

    const countStr = await AsyncStorage.getItem(SEARCH_COUNT_KEY);
    const count = countStr ? parseInt(countStr, 10) : 0;

    if (count >= SEARCH_THRESHOLD) {
      const shouldAsk = await shouldAskPermission();
      if (shouldAsk) {
        setVisible(true);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    checkIfShouldShow();
  }, [searchCount, checkIfShouldShow]);

  const handleEnable = async () => {
    await markPermissionAsked();
    const token = await registerForPushNotifications();

    if (token) {
      // Send token to backend
      try {
        await backendAPIService.registerPushToken(
          token,
          Platform.OS as 'ios' | 'android'
        );
      } catch (error) {
        Sentry.captureException(error, {
          tags: { context: 'push-token-registration' },
        });
      }

      // Schedule daily pick reminder
      const dailyTitle =
        t('notifications.dailyTitle') || 'Your daily pick is ready!';
      const dailyBody =
        t('notifications.dailyBody') ||
        "Check out today's personalized recommendation";
      await scheduleDailyPickReminder(dailyTitle, dailyBody);
    }

    setVisible(false);
  };

  const handleDismiss = async () => {
    await markPermissionAsked();
    setVisible(false);
  };

  const features = [
    {
      icon: 'film-outline' as const,
      emoji: '\uD83C\uDFAC',
      label: t('notifications.featureDaily') || 'Daily movie pick',
    },
    {
      icon: 'tv-outline' as const,
      emoji: '\uD83D\uDCFA',
      label: t('notifications.featureNew') || 'New on your platforms',
    },
    {
      icon: 'alarm-outline' as const,
      emoji: '\u23F0',
      label: t('notifications.featureReminder') || 'Watchlist reminders',
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      statusBarTranslucent
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View
          className='flex-1 items-center justify-center'
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        >
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 300 }}
            style={[
              getSquircle(24),
              { width: '85%', maxWidth: 380, overflow: 'hidden' },
            ]}
          >
            <BlurView
              intensity={Platform.OS === 'ios' ? 80 : 50}
              tint={isDark ? 'dark' : 'light'}
              style={{ overflow: 'hidden', borderRadius: 24 }}
            >
              <View
                className='px-6 py-8'
                style={{
                  backgroundColor: isDark
                    ? 'rgba(30,30,30,0.85)'
                    : 'rgba(255,255,255,0.9)',
                }}
              >
                {/* Bell icon */}
                <View className='mb-4 items-center'>
                  <View
                    style={[
                      getSquircle(20),
                      {
                        width: 64,
                        height: 64,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(229, 9, 20, 0.12)',
                      },
                    ]}
                  >
                    <Ionicons name='notifications' size={32} color='#E50914' />
                  </View>
                </View>

                {/* Title */}
                <Text className='mb-2 text-center text-xl font-bold text-light-text dark:text-dark-text'>
                  {t('notifications.promptTitle') || 'Never miss a great pick'}
                </Text>

                {/* Subtitle */}
                <Text className='mb-6 text-center text-sm leading-5 text-light-muted dark:text-dark-muted'>
                  {t('notifications.promptSubtitle') ||
                    'Get daily personalized recommendations and alerts when movies become available on your platforms.'}
                </Text>

                {/* Feature list */}
                <View className='mb-6 gap-3'>
                  {features.map((feature, index) => (
                    <MotiView
                      key={index}
                      from={{ opacity: 0, translateX: -10 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{
                        delay: 100 + index * 80,
                        type: 'timing',
                        duration: 300,
                      }}
                      className='flex-row items-center gap-3'
                    >
                      <Text style={{ fontSize: 20 }}>{feature.emoji}</Text>
                      <Text className='flex-1 text-sm font-medium text-light-text dark:text-dark-text'>
                        {feature.label}
                      </Text>
                    </MotiView>
                  ))}
                </View>

                {/* Enable button */}
                <TouchableOpacity
                  onPress={handleEnable}
                  activeOpacity={0.8}
                  style={[
                    getSquircle(14),
                    {
                      backgroundColor: '#E50914',
                      paddingVertical: 14,
                      alignItems: 'center',
                      marginBottom: 10,
                    },
                  ]}
                >
                  <Text className='text-base font-semibold text-white'>
                    {t('notifications.enable') || 'Enable Notifications'}
                  </Text>
                </TouchableOpacity>

                {/* Dismiss button */}
                <TouchableOpacity
                  onPress={handleDismiss}
                  activeOpacity={0.7}
                  style={{ paddingVertical: 10, alignItems: 'center' }}
                >
                  <Text className='text-sm text-light-muted dark:text-dark-muted'>
                    {t('notifications.notNow') || 'Not now'}
                  </Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </MotiView>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

/**
 * Increment local search count and return the new count.
 * Call this after each successful search.
 */
export async function incrementSearchCount(): Promise<number> {
  const countStr = await AsyncStorage.getItem(SEARCH_COUNT_KEY);
  const count = (countStr ? parseInt(countStr, 10) : 0) + 1;
  await AsyncStorage.setItem(SEARCH_COUNT_KEY, String(count));
  return count;
}
