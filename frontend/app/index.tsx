import LoadingState from '@/components/LoadingState';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/utils/cn';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

const ONBOARDING_KEY = '@fastflix/onboarding_complete';
const SETUP_COMPLETE_KEY = '@fastflix/setup_complete';

export default function IndexScreen() {
  const { isLoading } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(
    null
  );
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null);

  // Check if onboarding and setup have been completed
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(ONBOARDING_KEY),
      AsyncStorage.getItem(SETUP_COMPLETE_KEY),
    ]).then(([onboarding, setup]) => {
      setOnboardingComplete(onboarding === 'true');
      setSetupComplete(setup === 'true');
    });
  }, []);

  // Show loading while checking onboarding/setup status
  if (isLoading || onboardingComplete === null || setupComplete === null) {
    return (
      <SafeAreaView
        className={cn('flex-1 bg-light-background dark:bg-dark-background')}
      >
        <LoadingState isSearching={false} />
      </SafeAreaView>
    );
  }

  // Redirect to onboarding if not completed
  if (!onboardingComplete) {
    return <Redirect href={'/onboarding' as never} />;
  }

  // Redirect to setup if not completed
  if (!setupComplete) {
    return <Redirect href={'/setup' as never} />;
  }

  // Default: redirect to home tab (guest mode - no auth required)
  return <Redirect href={'/home' as never} />;
}
