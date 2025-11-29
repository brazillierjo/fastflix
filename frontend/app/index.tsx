import LoadingState from '@/components/LoadingState';
import MovieResults from '@/components/MovieResults';
import SearchForm from '@/components/SearchForm';
import SubscriptionModal from '@/components/SubscriptionModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppState } from '@/hooks/useAppState';
import { useBackendMovieSearch } from '@/hooks/useBackendMovieSearch';
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

  const movieSearchMutation = useBackendMovieSearch();
  const { t } = useLanguage();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const handleSearch = async () => {
    console.log('🔍 Starting search');

    handleSearchStart();

    movieSearchMutation.mutate(
      {
        query,
        includeMovies: true,
        includeTvShows: true,
      },
      {
        onSuccess: async data => {
          console.log('✅ Search successful - Results:', data.movies.length);
          handleSearchSuccess(data);
        },
        onError: (error) => {
          console.error('❌ Search error:', error);
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
