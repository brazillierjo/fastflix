import LoadingState from '@/components/LoadingState';
import MovieResults from '@/components/MovieResults';
import SearchForm from '@/components/SearchForm';
import SubscriptionModal from '@/components/SubscriptionModal';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppState } from '@/hooks/useAppState';
import { useBackendMovieSearch } from '@/hooks/useBackendMovieSearch';
import { cn } from '@/utils/cn';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const {
    query,
    movies,
    streamingProviders,
    credits,
    detailedInfo,
    geminiResponse,
    showWelcome,
    showResults,
    isSearching,
    setQuery,
    goBackToHome,
    handleSearchSuccess,
    handleSearchStart,
    handleSearchEnd,
  } = useAppState();

  const movieSearchMutation = useBackendMovieSearch();
  const { t } = useLanguage();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Redirect to auth screen if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSearch = async () => {
    handleSearchStart();

    movieSearchMutation.mutate(
      {
        query,
        includeMovies: true,
        includeTvShows: true,
      },
      {
        onSuccess: async data => {
          handleSearchSuccess(data);
        },
        onError: (error) => {
          handleSearchEnd();

          // Handle subscription required error
          if (error.message === 'subscriptionRequired') {
            Alert.alert(
              t('subscription.required.title') || 'Subscription Required',
              t('subscription.required.message') ||
                'An active subscription is required to access movie recommendations. Subscribe now to get unlimited access!',
              [
                {
                  text: t('subscription.required.cancel') || 'Cancel',
                  style: 'cancel',
                  onPress: () => {
                    // Reset to welcome screen when user cancels
                    goBackToHome();
                  },
                },
                {
                  text: t('subscription.required.subscribe') || 'Subscribe',
                  onPress: () => setShowSubscriptionModal(true),
                },
              ]
            );
          }
        },
      }
    );
  };

  const handleSubscriptionSuccess = () => {
    // Automatically retry the search after successful subscription
    if (query.trim()) {
      // Small delay to ensure subscription is synced with backend
      setTimeout(() => {
        handleSearch();
      }, 500);
    } else {
      // If no query, go back to home
      goBackToHome();
    }
  };

  // Show loading while checking authentication or redirecting
  if (isLoading || !isAuthenticated) {
    return (
      <SafeAreaView
        className={cn('flex-1 bg-light-background dark:bg-dark-background')}
      >
        <LoadingState isSearching={false} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className={cn('flex-1 bg-light-background dark:bg-dark-background')}
    >
      <StatusBar barStyle='dark-content' backgroundColor='#ffffff' />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className={cn('flex-1')}
      >
        <View className={cn('flex-1')}>
          {showWelcome &&
          movies.length === 0 &&
          !movieSearchMutation.isPending ? (
            <SearchForm
              query={query}
              setQuery={setQuery}
              onSearch={handleSearch}
              loading={movieSearchMutation.isPending}
            />
          ) : movieSearchMutation.isPending ? (
            <LoadingState isSearching={isSearching} />
          ) : (
            showResults && (
              <MovieResults
                movies={movies}
                streamingProviders={streamingProviders}
                credits={credits}
                detailedInfo={detailedInfo}
                geminiResponse={geminiResponse}
                onGoBack={goBackToHome}
              />
            )
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Subscription Modal */}
      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSubscriptionSuccess={handleSubscriptionSuccess}
      />
    </SafeAreaView>
  );
}
