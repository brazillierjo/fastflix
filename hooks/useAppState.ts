/**
 * Application State Management Hook
 *
 * This file provides a centralized state management solution for the "What Movie Tonight" application.
 * It manages all the core application state including user queries, movie recommendations, UI states,
 * and user preferences. This hook serves as the main state container that coordinates between
 * different components and ensures consistent data flow throughout the application.
 *
 * Key responsibilities:
 * - Managing search queries and movie recommendation results
 * - Controlling UI navigation states (welcome screen, results screen, loading states)
 * - Storing user preferences (number of recommendations, content type filters)
 * - Handling streaming provider data and movie credits information
 * - Providing state update functions and action handlers for components
 *
 * The hook follows React's state management patterns and provides a clean API for components
 * to interact with the application state without prop drilling or complex state lifting.
 */

import { useState } from 'react';
import { Cast, DetailedInfo, Movie, StreamingProvider } from './useMovieSearch';

export interface AppState {
  query: string;
  movies: Movie[];
  streamingProviders: { [key: number]: StreamingProvider[] };
  credits: { [key: number]: Cast[] };
  detailedInfo: { [key: number]: DetailedInfo };
  geminiResponse: string;
  showWelcome: boolean;
  showResults: boolean;
  numberOfRecommendations: number;
  includeMovies: boolean;
  includeTvShows: boolean;
  isSearching: boolean;
}

export const useAppState = () => {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [streamingProviders, setStreamingProviders] = useState<{
    [key: number]: StreamingProvider[];
  }>({});
  const [credits, setCredits] = useState<{
    [key: number]: Cast[];
  }>({});
  const [detailedInfo, setDetailedInfo] = useState<{
    [key: number]: DetailedInfo;
  }>({});
  const [geminiResponse, setGeminiResponse] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [numberOfRecommendations, setNumberOfRecommendations] = useState(10);
  const [includeMovies, setIncludeMovies] = useState(true);
  const [includeTvShows, setIncludeTvShows] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  const goBackToHome = () => {
    setShowResults(false);
    setShowWelcome(true);
    setMovies([]);
    setQuery('');
    setStreamingProviders({});
    setCredits({});
    setDetailedInfo({});
    setGeminiResponse('');
  };

  const handleSearchSuccess = (data: {
    movies: Movie[];
    streamingProviders: { [key: number]: StreamingProvider[] };
    credits: { [key: number]: Cast[] };
    detailedInfo: { [key: number]: DetailedInfo };
    geminiResponse: string;
  }) => {
    setMovies(data.movies);
    setStreamingProviders(data.streamingProviders);
    setCredits(data.credits);
    setDetailedInfo(data.detailedInfo);
    setGeminiResponse(data.geminiResponse);
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
    credits,
    detailedInfo,
    geminiResponse,
    showWelcome,
    showResults,
    numberOfRecommendations,
    includeMovies,
    includeTvShows,
    isSearching,

    // Setters
    setQuery,
    setMovies,
    setStreamingProviders,
    setCredits,
    setDetailedInfo,
    setGeminiResponse,
    setShowWelcome,
    setShowResults,
    setNumberOfRecommendations,
    setIncludeMovies,
    setIncludeTvShows,
    setIsSearching,

    // Actions
    goBackToHome,
    handleSearchSuccess,
    handleSearchStart,
    handleSearchEnd,
  };
};
