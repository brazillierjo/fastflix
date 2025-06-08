import LoadingState from '@/components/LoadingState';
import MovieResults from '@/components/MovieResults';
import SearchForm from '@/components/SearchForm';
import SubscriptionModal from '@/components/SubscriptionModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppState } from '@/hooks/useAppState';
import { useMovieSearch } from '@/hooks/useMovieSearch';
import { useFastFlixProFeatures } from '@/hooks/usePremiumFeatures';
import { cn } from '@/utils/cn';
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
    showWelcome,
    showResults,
    isSearching,
    setQuery,
    goBackToHome,
    handleSearchSuccess,
    handleSearchStart,
    handleSearchEnd,
  } = useAppState();

  const movieSearchMutation = useMovieSearch();
  const { canMakePrompt, incrementPromptCount } = useFastFlixProFeatures();
  const { t } = useLanguage();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const handleSearch = async () => {
    // Check if user can make a prompt
    const promptCheck = canMakePrompt();

    if (!promptCheck.allowed) {
      // Show subscription modal for users who have reached their limit
      Alert.alert(
        t('prompts.limit.title') || 'Monthly Limit Reached',
        t('prompts.limit.message') ||
          `You've used all 3 free prompts this month. Upgrade to FastFlix Pro for unlimited recommendations!`,
        [
          {
            text: t('prompts.limit.cancel') || 'Cancel',
            style: 'cancel',
          },
          {
            text: t('prompts.limit.upgrade') || 'Upgrade to Pro',
            onPress: () => setShowSubscriptionModal(true),
          },
        ]
      );
      return;
    }

    handleSearchStart();

    // Increment prompt count for non-subscribers
    if (promptCheck.reason === 'within_monthly_limit') {
      await incrementPromptCount();
    }

    movieSearchMutation.mutate(
      {
        query,
        includeMovies: true,
        includeTvShows: true,
      },
      {
        onSuccess: data => {
          handleSearchSuccess(data);
        },
        onError: () => {
          handleSearchEnd();
        },
      }
    );
  };

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
      />
    </SafeAreaView>
  );
}
