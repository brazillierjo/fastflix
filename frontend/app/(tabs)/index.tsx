import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';

const ONBOARDING_KEY = '@fastflix/onboarding_complete';
const SETUP_COMPLETE_KEY = '@fastflix/setup_complete';

export default function IndexScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(
    null
  );
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null);

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

  return <Redirect href={'/home' as never} />;
}
