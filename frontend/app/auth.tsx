/**
 * Authentication Screen
 * Displays Sign in with Apple button for user authentication
 */

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/utils/cn';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Platform,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthScreen() {
  const { signInWithApple, isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleAppleSignIn = async () => {
    try {
      await signInWithApple();
      // Navigation will happen automatically via the useEffect above
    } catch (error) {
      // Error is already handled in AuthContext with Alert
      console.error('Sign in failed:', error);
    }
  };

  return (
    <SafeAreaView
      className={cn('flex-1 bg-light-background dark:bg-dark-background')}
    >
      <StatusBar barStyle='dark-content' backgroundColor='#ffffff' />

      <View className='flex-1 justify-center px-6'>
        {/* App Logo/Title */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: 'timing',
            duration: 800,
          }}
          className='mb-12 items-center'
        >
          <Text className='mb-4 text-center text-5xl'>🎬</Text>
          <Text className='mb-6 text-center text-4xl font-bold text-light-text dark:text-dark-text'>
            FastFlix
          </Text>
          <Text className='text-center text-base text-light-text/70 dark:text-dark-text/70'>
            {t('auth.welcome.subtitle') ||
              'AI-powered movie & TV show recommendations'}
          </Text>
        </MotiView>

        {/* Description */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            delay: 200,
            type: 'timing',
            duration: 600,
          }}
          className='mb-10'
        >
          <Text className='text-center text-base leading-relaxed text-light-text dark:text-dark-text'>
            {t('auth.welcome.description') ||
              'Sign in to get personalized recommendations and access all features.'}
          </Text>
        </MotiView>

        {/* Sign in with Apple Button */}
        {Platform.OS === 'ios' && (
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 400,
              type: 'timing',
              duration: 600,
            }}
          >
            {isLoading ? (
              <View className='items-center justify-center py-4'>
                <ActivityIndicator size='large' color='#007AFF' />
                <Text className='mt-2 text-sm text-light-text/70 dark:text-dark-text/70'>
                  {t('auth.loading') || 'Signing in...'}
                </Text>
              </View>
            ) : (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={
                  AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
                }
                buttonStyle={
                  AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                }
                cornerRadius={12}
                style={{ width: '100%', height: 50 }}
                onPress={handleAppleSignIn}
              />
            )}
          </MotiView>
        )}

        {/* Platform not supported message */}
        {Platform.OS !== 'ios' && (
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 400,
              type: 'timing',
              duration: 600,
            }}
          >
            <View className='rounded-xl border border-light-accent/20 bg-light-accent/5 p-4 dark:border-dark-accent/20 dark:bg-dark-accent/5'>
              <Text className='text-center text-sm text-light-text dark:text-dark-text'>
                {t('auth.platformNotSupported') ||
                  'Authentication is currently only available on iOS.'}
              </Text>
            </View>
          </MotiView>
        )}

        {/* Footer */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: 600,
            type: 'timing',
            duration: 600,
          }}
          className='mt-10'
        >
          <Text className='text-center text-xs text-light-text/50 dark:text-dark-text/50'>
            {t('auth.footer') ||
              'By signing in, you agree to our Terms of Service and Privacy Policy.'}
          </Text>
        </MotiView>
      </View>
    </SafeAreaView>
  );
}
