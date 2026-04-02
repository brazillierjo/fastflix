import '@/global.css';

import { isRunningInExpoGo } from 'expo';
import { Stack, useNavigationContainerRef } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import React, { useEffect } from 'react';
import 'react-native-reanimated';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';
import { SwipeDataProvider } from '@/contexts/SwipeDataContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SubscriptionProvider } from '@/contexts/RevenueCatContext';
import { QueryProvider } from '@/providers/QueryProvider';
import { AptabaseProvider } from '@aptabase/react-native';
import * as Sentry from '@sentry/react-native';

// Keep splash screen visible until we're ready
SplashScreen.preventAutoHideAsync();

// Navigation integration for performance tracking
const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isRunningInExpoGo(),
});

Sentry.init({
  dsn: 'https://30fa1065a683859f2063e0a098ac7dec@o4510470474825728.ingest.de.sentry.io/4510483823853648',
  sendDefaultPii: true,
  tracesSampleRate: __DEV__ ? 1.0 : 0.1,
  enableNativeFramesTracking: false,
  enableLogs: __DEV__,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  integrations: [
    navigationIntegration,
    Sentry.feedbackIntegration(),
  ],
  beforeSend(event) {
    const message = event.exception?.values?.[0]?.value || '';
    if (message.includes('canceled the authorization attempt')) {
      return null;
    }
    return event;
  },
  enabled: !__DEV__,
});

export default Sentry.wrap(function RootLayout() {
  const ref = useNavigationContainerRef();

  useEffect(() => {
    if (ref?.current) {
      navigationIntegration.registerNavigationContainer(ref);
    }
  }, [ref]);

  useEffect(() => {
    async function onFetchUpdateAsync() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (error) {
        Sentry.captureException(error, {
          tags: { context: 'expo-updates' },
        });
      }
    }

    if (!__DEV__) {
      onFetchUpdateAsync();
    }
  }, []);

  return (
    <ErrorBoundary>
      <AptabaseProvider appKey='A-EU-9072861721'>
      <QueryProvider>
        <LanguageProvider>
          <SubscriptionProvider>
            <AuthProvider>
            <SwipeDataProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                  gestureEnabled: true, // Enable swipe-back on all screens
                  animation: 'slide_from_right', // iOS-native slide animation
                }}
              >
                <Stack.Screen name='(tabs)' />
                <Stack.Screen
                  name='onboarding'
                  options={{ gestureEnabled: false, animation: 'fade' }}
                />
                <Stack.Screen
                  name='setup'
                  options={{ gestureEnabled: false, animation: 'fade' }}
                />
                <Stack.Screen
                  name='auth'
                  options={{ gestureEnabled: false, animation: 'slide_from_bottom' }}
                />
                <Stack.Screen
                  name='movie-detail'
                  options={{ gestureEnabled: true, animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name='actor-detail'
                  options={{ gestureEnabled: true, animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name='favorite-actors-list'
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name='watched-list'
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name='watchlist-full'
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name='search-history'
                  options={{ headerShown: false, animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name='swipe-discovery'
                  options={{
                    gestureEnabled: false,
                    animation: 'slide_from_bottom',
                    headerShown: false,
                  }}
                />
                <Stack.Screen name='+not-found' />
              </Stack>
              <StatusBar style='auto' />
            </SwipeDataProvider>
            </AuthProvider>
          </SubscriptionProvider>
        </LanguageProvider>
      </QueryProvider>
      </AptabaseProvider>
    </ErrorBoundary>
  );
});
