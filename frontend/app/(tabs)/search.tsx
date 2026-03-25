import AuthGate from '@/components/AuthGate';
import LoadingState from '@/components/LoadingState';
import MovieResults from '@/components/MovieResults';
import NotificationPrompt, { incrementSearchCount } from '@/components/NotificationPrompt';
import SearchForm from '@/components/SearchForm';
import SubscriptionModal from '@/components/SubscriptionModal';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/RevenueCatContext';
import { useAppState } from '@/hooks/useAppState';
import { useBackendMovieSearch } from '@/hooks/useBackendMovieSearch';
import { ConversationMessage } from '@/services/backend-api.service';
import { cn } from '@/utils/cn';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SearchScreen() {
  const params = useLocalSearchParams<{ query?: string }>();
  const {
    query,
    movies,
    streamingProviders,
    credits,
    detailedInfo,
    geminiResponse,
    conversationHistory,
    showResults,
    isSearching,
    setQuery,
    goBackToHome,
    handleSearchSuccess,
    handleSearchStart,
    handleSearchEnd,
  } = useAppState();

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [localSearchCount, setLocalSearchCount] = useState(0);
  const [isRefining, setIsRefining] = useState(false);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const queryClient = useQueryClient();
  const movieSearchMutation = useBackendMovieSearch();
  const { t } = useLanguage();
  const { isAuthenticated, isLoading } = useAuth();
  useSubscription();

  // Clean up timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  // Pre-fill query from route params (e.g. from collections)
  const hasPrefilledRef = useRef(false);
  useEffect(() => {
    if (params.query && !hasPrefilledRef.current) {
      hasPrefilledRef.current = true;
      setQuery(params.query);
    }
  }, [params.query, setQuery]);

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

          // Invalidate home data so recent searches update
          queryClient.invalidateQueries({ queryKey: ['homeData'] });

          // Track local search count for notification prompt
          const newCount = await incrementSearchCount();
          setLocalSearchCount(newCount);

          // Prompt guests to sign in after seeing results
          if (!isAuthenticated) {
            const timer = setTimeout(() => setShowAuthGate(true), 1500);
            timersRef.current.push(timer);
          }
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
      const timer = setTimeout(() => {
        handleSearch();
      }, 500);
      timersRef.current.push(timer);
    } else {
      // If no query, go back to home
      goBackToHome();
    }
  };

  const handleRefine = (refineQuery: string, history: ConversationMessage[]) => {
    setIsRefining(true);

    movieSearchMutation.mutate(
      {
        query: refineQuery,
        includeMovies: true,
        includeTvShows: true,
        conversationHistory: history,
      },
      {
        onSuccess: data => {
          handleSearchSuccess(data);
          setIsRefining(false);
        },
        onError: () => {
          setIsRefining(false);
        },
      }
    );
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
              conversationHistory={conversationHistory}
              onGoBack={goBackToHome}
              onRefine={handleRefine}
              isRefining={isRefining}
            />
          ) : (
            <SearchForm
              query={query}
              setQuery={setQuery}
              onSearch={handleSearch}
              loading={movieSearchMutation.isPending}
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

      {/* Auth Gate for guest users */}
      <AuthGate
        visible={showAuthGate}
        onClose={() => setShowAuthGate(false)}
      />

      {/* Notification permission prompt (after 3rd search) */}
      <NotificationPrompt searchCount={localSearchCount} />
    </SafeAreaView>
  );
}
