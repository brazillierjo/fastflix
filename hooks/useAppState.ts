import { useState } from 'react';
import { Movie, StreamingProvider } from './useMovieSearch';

export interface AppState {
  query: string;
  movies: Movie[];
  streamingProviders: { [key: number]: StreamingProvider[] };
  showWelcome: boolean;
  showResults: boolean;
  numberOfRecommendations: number;
  includeMovies: boolean;
  includeTvShows: boolean;
  isMenuOpen: boolean;
  isSearching: boolean;
}

export const useAppState = () => {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [streamingProviders, setStreamingProviders] = useState<{
    [key: number]: StreamingProvider[];
  }>({});
  const [showWelcome, setShowWelcome] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [numberOfRecommendations, setNumberOfRecommendations] = useState(5);
  const [includeMovies, setIncludeMovies] = useState(true);
  const [includeTvShows, setIncludeTvShows] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const goBackToHome = () => {
    setShowResults(false);
    setShowWelcome(true);
    setMovies([]);
    setQuery('');
    setStreamingProviders({});
  };

  const handleSearchSuccess = (data: {
    movies: Movie[];
    streamingProviders: { [key: number]: StreamingProvider[] };
  }) => {
    setMovies(data.movies);
    setStreamingProviders(data.streamingProviders);
    setIsSearching(false);
    setShowResults(true);
  };

  const handleSearchStart = () => {
    setShowWelcome(false);
    setMovies([]);
    setIsSearching(true);
  };

  const handleSearchEnd = () => {
    setIsSearching(false);
  };

  return {
    // State
    query,
    movies,
    streamingProviders,
    showWelcome,
    showResults,
    numberOfRecommendations,
    includeMovies,
    includeTvShows,
    isMenuOpen,
    isSearching,
    
    // Setters
    setQuery,
    setMovies,
    setStreamingProviders,
    setShowWelcome,
    setShowResults,
    setNumberOfRecommendations,
    setIncludeMovies,
    setIncludeTvShows,
    setIsMenuOpen,
    setIsSearching,
    
    // Actions
    goBackToHome,
    handleSearchSuccess,
    handleSearchStart,
    handleSearchEnd,
  };
};