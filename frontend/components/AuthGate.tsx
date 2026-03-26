/**
 * AuthGate - Reusable bottom sheet modal that prompts sign-in
 * Shows when a guest user tries a premium action (add to watchlist, etc.)
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
import { MotiView } from 'moti';
import React, { useEffect, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Complete auth session for web browser redirect
WebBrowser.maybeCompleteAuthSession();

interface AuthGateProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AuthGate({ visible, onClose, onSuccess }: AuthGateProps) {
  const { signInWithApple, signInWithGoogle, isAuthenticated, isLoading } =
    useAuth();
  const { t } = useLanguage();
  // Get Google Client IDs from config
  const googleIosClientId =
    Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const googleAndroidClientId =
    Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

  // Setup Google Auth Request
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: googleIosClientId,
    androidClientId: googleAndroidClientId,
  });

  // Track processed response to prevent duplicate handling
  const processedResponseRef = useRef<string | null>(null);

  // Close on successful auth
  useEffect(() => {
    if (isAuthenticated && visible) {
      onClose();
      onSuccess?.();
    }
  }, [isAuthenticated, visible, onClose, onSuccess]);

  const handleAppleSignIn = async () => {
    try {
      await signInWithApple();
    } catch (error) {
      Sentry.captureException(error, { tags: { context: 'apple-sign-in-authgate' } });
    }
  };

  const handleGoogleSignIn = useCallback(
    async (idToken: string) => {
      try {
        await signInWithGoogle(idToken);
      } catch (error) {
        Sentry.captureException(error, { tags: { context: 'google-sign-in-authgate' } });
      }
    },
    [signInWithGoogle]
  );

  // Handle Google Sign In response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token && processedResponseRef.current !== id_token) {
        processedResponseRef.current = id_token;
        handleGoogleSignIn(id_token);
      }
    }
  }, [response, handleGoogleSignIn]);

  return (
    <Modal
      visible={visible}
      animationType='slide'
      transparent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
      <View className='flex-1 justify-end bg-black/50'>
        <MotiView
          from={{ translateY: 400 }}
          animate={{ translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={[getSquircle(24), { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]}
          className={cn(
            'border-t border-light-border bg-light-background px-6 pb-12 pt-6 dark:border-dark-border dark:bg-dark-background'
          )}
        >
          {/* Handle bar */}
          <View className='mb-4 items-center'>
            <View className='h-1 w-10 rounded-full bg-light-muted/30 dark:bg-dark-muted/30' />
          </View>

          {/* Icon */}
          <View className='mb-4 items-center'>
            <View
              style={getSquircle(20)}
              className='items-center justify-center bg-netflix-500/10 p-4'
            >
              <Ionicons name='person-circle-outline' size={48} color='#E50914' />
            </View>
          </View>

          {/* Title */}
          <Text className='mb-2 text-center text-xl font-bold text-light-text dark:text-dark-text'>
            {t('authGate.title') || 'Sign in to continue'}
          </Text>

          {/* Subtitle */}
          <Text className='mb-6 text-center text-sm leading-5 text-light-muted dark:text-dark-muted'>
            {t('authGate.subtitle') ||
              'Create a free account to save your watchlist, sync your preferences across devices, and get personalized recommendations.'}
          </Text>

          {/* Auth Buttons */}
          {isLoading ? (
            <View className='items-center justify-center py-4'>
              <ActivityIndicator size='large' color='#E50914' />
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

              {/* Sign in with Google Button */}
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
                  <Text className='text-base font-medium text-[#1f1f1f]'>
                    {t('auth.signInWithGoogle') || 'Sign in with Google'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Maybe later button */}
              <TouchableOpacity
                onPress={onClose}
                className='mt-1 items-center py-3'
              >
                <Text className='text-base font-medium text-light-muted dark:text-dark-muted'>
                  {t('authGate.maybeLater') || 'Maybe later'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </MotiView>
      </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
