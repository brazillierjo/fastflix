import LoadingState from '@/components/LoadingState';
import MovieResults from '@/components/MovieResults';
import SearchForm from '@/components/SearchForm';
import { SettingsModal } from '@/components/SettingsModal';
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
    showWelcome,
    showResults,
    numberOfRecommendations,
    includeMovies,
    includeTvShows,
    isMenuOpen,
    isSearching,
    setQuery,
    setNumberOfRecommendations,
    setIncludeMovies,
    setIncludeTvShows,
    setIsMenuOpen,
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
        includeMovies,
        includeTvShows,
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
              includeMovies={includeMovies}
              setIncludeMovies={setIncludeMovies}
              includeTvShows={includeTvShows}
              setIncludeTvShows={setIncludeTvShows}
              onSearch={handleSearch}
              loading={movieSearchMutation.isPending}
              showResults={showResults}
              setIsMenuOpen={setIsMenuOpen}
            />
          ) : movieSearchMutation.isPending ? (
            <LoadingState isSearching={isSearching} />
          ) : (
            showResults && (
              <MovieResults
                movies={movies}
                streamingProviders={streamingProviders}
                credits={credits}
                onGoBack={goBackToHome}
              />
            )
          )}
        </View>

        <SettingsModal
          isVisible={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
