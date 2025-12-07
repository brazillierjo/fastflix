/**
 * Authentication Screen
 * Displays Sign in with Apple and Google buttons for user authentication
 */

import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/utils/cn';
import { getSquircle } from '@/utils/designHelpers';
import * as Sentry from '@sentry/react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useEffect, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

// Complete auth session for web browser redirect
WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const { signInWithApple, signInWithGoogle, isAuthenticated, isLoading } =
    useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Get Google Client IDs from config
  const googleIosClientId =
    Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const googleAndroidClientId =
    Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

  // Setup Google Auth Request (using platform-specific client)
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: googleIosClientId,
    androidClientId: googleAndroidClientId,
  });

  // Track processed response to prevent duplicate handling
  const processedResponseRef = useRef<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleAppleSignIn = async () => {
    try {
      await signInWithApple();
    } catch (error) {
      Sentry.captureException(error, { tags: { context: 'apple-sign-in' } });
    }
  };

  const handleGoogleSignIn = useCallback(
    async (idToken: string) => {
      try {
        await signInWithGoogle(idToken);
      } catch (error) {
        Sentry.captureException(error, { tags: { context: 'google-sign-in' } });
      }
    },
    [signInWithGoogle]
  );

  // Handle Google Sign In response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;

      // Prevent processing the same response multiple times
      if (id_token && processedResponseRef.current !== id_token) {
        processedResponseRef.current = id_token;
        handleGoogleSignIn(id_token);
      }
    }
  }, [response, handleGoogleSignIn]);

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
          <View className='mb-4 items-center justify-center'>
            <Ionicons
              name='film'
              size={64}
              color={isDark ? '#E50914' : '#E50914'}
            />
          </View>
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

        {/* Auth Buttons */}
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
            <View className='gap-3'>
              {/* Sign in with Apple Button - iOS only */}
              {Platform.OS === 'ios' && (
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

              {/* Sign in with Google Button - Official Google styling */}
              {(googleIosClientId || googleAndroidClientId) && (
                <TouchableOpacity
                  onPress={() => promptAsync()}
                  disabled={!request}
                  style={[
                    getSquircle(12),
                    {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    },
                  ]}
                  className={cn(
                    'h-[50px] flex-row items-center justify-center border border-gray-200 bg-white',
                    !request && 'opacity-50'
                  )}
                >
                  <Image
                    source={{
                      uri: 'https://developers.google.com/identity/images/g-logo.png',
                    }}
                    style={{ width: 18, height: 18, marginRight: 10 }}
                  />
                  <Text className='text-[15px] font-medium text-[#1f1f1f]'>
                    {t('auth.signInWithGoogle') || 'Sign in with Google'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Platform not supported message - only if no auth methods available */}
              {Platform.OS !== 'ios' &&
                !googleIosClientId &&
                !googleAndroidClientId && (
                  <View
                    style={getSquircle(14)}
                    className='border border-light-accent/20 bg-light-accent/5 p-4 dark:border-dark-accent/20 dark:bg-dark-accent/5'
                  >
                    <Text className='text-center text-sm text-light-text dark:text-dark-text'>
                      {t('auth.platformNotSupported') ||
                        'Authentication is currently only available on iOS.'}
                    </Text>
                  </View>
                )}
            </View>
          )}
        </MotiView>

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
