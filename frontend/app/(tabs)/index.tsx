import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';

const ONBOARDING_KEY = '@fastflix/onboarding_complete';
const SETUP_COMPLETE_KEY = '@fastflix/setup_complete';

// Bump this when a new version requires a forced re-login
const FORCE_LOGOUT_VERSION = '4.0.0';
const FORCE_LOGOUT_KEY = '@fastflix/force_logout_version';

export default function IndexScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(
    null
  );
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null);

  // Force re-login on major version upgrade
  useEffect(() => {
    AsyncStorage.getItem(FORCE_LOGOUT_KEY).then(async (lastVersion) => {
      if (lastVersion !== FORCE_LOGOUT_VERSION) {
        // Clear auth tokens to force re-login
        await SecureStore.deleteItemAsync('fastflix_auth_token').catch(() => {});
        await SecureStore.deleteItemAsync('fastflix_user_data').catch(() => {});
        await AsyncStorage.setItem(FORCE_LOGOUT_KEY, FORCE_LOGOUT_VERSION);
      }
    });
  }, []);

  // Check if onboarding and setup have been completed
  // Re-check when auth state changes (e.g. after account deletion clears flags)
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(ONBOARDING_KEY),
      AsyncStorage.getItem(SETUP_COMPLETE_KEY),
    ]).then(([onboarding, setup]) => {
      setOnboardingComplete(onboarding === 'true');
      setSetupComplete(setup === 'true');
    });
  }, [isAuthenticated]);

  // Hide splash screen once all routing decisions are resolved
  const isReady = !isLoading && onboardingComplete !== null && setupComplete !== null;
  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  // Keep splash visible while checking statuses
  if (!isReady) {
    return null;
  }

  // Flow: Onboarding → Setup → Auth → Home
  if (!onboardingComplete) {
    return <Redirect href={'/onboarding' as never} />;
  }

  if (!setupComplete) {
    return <Redirect href={'/setup' as never} />;
  }

  if (!isAuthenticated) {
    return <Redirect href='/auth' />;
  }

  return <Redirect href={'/for-you' as never} />;
}
