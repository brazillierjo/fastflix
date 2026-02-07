import LoadingState from '@/components/LoadingState';
import MovieResults from '@/components/MovieResults';
import SearchForm from '@/components/SearchForm';
import SubscriptionModal from '@/components/SubscriptionModal';
import WatchlistBottomSheet from '@/components/WatchlistBottomSheet';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/RevenueCatContext';
import { useAppState } from '@/hooks/useAppState';
import { useBackendMovieSearch } from '@/hooks/useBackendMovieSearch';
import { cn } from '@/utils/cn';
import { Redirect } from 'expo-router';
import React, { useState } from 'react';
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
    showResults,
    isSearching,
    setQuery,
    goBackToHome,
    handleSearchSuccess,
    handleSearchStart,
    handleSearchEnd,
  } = useAppState();

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);

  const movieSearchMutation = useBackendMovieSearch();
  const { t } = useLanguage();
  const { isAuthenticated, isLoading } = useAuth();
  useSubscription();

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
        onError: error => {
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

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <SafeAreaView
        className={cn('flex-1 bg-light-background dark:bg-dark-background')}
      >
        <LoadingState isSearching={false} />
      </SafeAreaView>
    );
  }

  // Redirect to auth screen if not authenticated
  if (!isAuthenticated) {
    return <Redirect href='/auth' />;
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
          {movieSearchMutation.isPending ? (
            <LoadingState isSearching={isSearching} />
          ) : showResults && movies.length > 0 ? (
            <MovieResults
              movies={movies}
              streamingProviders={streamingProviders}
              credits={credits}
              detailedInfo={detailedInfo}
              geminiResponse={geminiResponse}
              onGoBack={goBackToHome}
            />
          ) : (
            <SearchForm
              query={query}
              setQuery={setQuery}
              onSearch={handleSearch}
              loading={movieSearchMutation.isPending}
              onWatchlistPress={() => setShowWatchlistModal(true)}
              onSubscriptionPress={() => setShowSubscriptionModal(true)}
            />
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Subscription Modal */}
      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSubscriptionSuccess={handleSubscriptionSuccess}
      />

      {/* Watchlist Bottom Sheet */}
      <WatchlistBottomSheet
        visible={showWatchlistModal}
        onClose={() => setShowWatchlistModal(false)}
      />
    </SafeAreaView>
  );
}
