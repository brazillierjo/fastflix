import LoadingState from '@/components/LoadingState';
import MovieResults from '@/components/MovieResults';
import SearchForm from '@/components/SearchForm';
import { useAppState } from '@/hooks/useAppState';
import { useMovieSearch } from '@/hooks/useMovieSearch';
import { cn } from '@/utils/cn';
import React from 'react';
import { KeyboardAvoidingView, Platform, StatusBar, View } from 'react-native';
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
    numberOfRecommendations,
    isSearching,
    setQuery,
    setNumberOfRecommendations,
    goBackToHome,
    handleSearchSuccess,
    handleSearchStart,
    handleSearchEnd,
  } = useAppState();

  const movieSearchMutation = useMovieSearch();

  const handleSearch = () => {
    handleSearchStart();
    movieSearchMutation.mutate(
      {
        query,
        numberOfRecommendations,
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
              numberOfRecommendations={numberOfRecommendations}
              setNumberOfRecommendations={setNumberOfRecommendations}
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
    </SafeAreaView>
  );
}
