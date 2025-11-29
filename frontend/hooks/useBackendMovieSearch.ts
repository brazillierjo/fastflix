/**
 * Backend Movie Search Hook
 *
 * This hook replaces the old useMovieSearch by using the FastFlix backend API.
 * All AI processing and TMDB enrichment is now handled server-side.
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import {
  backendAPIService,
  MovieResult,
  SearchResponse,
} from '../services/backend-api.service';
import { APP_CONFIG } from '@/constants/app';

export interface Movie {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  media_type?: 'movie' | 'tv' | 'person';
}

export interface StreamingProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface Cast {
  id: number;
  name: string;
  character: string;
  profile_path?: string;
}

export interface SearchParams {
  query: string;
  includeMovies: boolean;
  includeTvShows: boolean;
}

export interface DetailedInfo {
  genres?: { id: number; name: string }[];
  runtime?: number;
  release_year?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
  first_air_year?: number;
}

export interface SearchResult {
  movies: Movie[];
  streamingProviders: { [key: number]: StreamingProvider[] };
  credits: { [key: number]: Cast[] };
  detailedInfo: { [key: number]: DetailedInfo };
  geminiResponse: string;
  promptsRemaining?: number;
  isProUser?: boolean;
}

/**
 * Transform backend MovieResult to frontend Movie format
 */
const transformMovieResult = (result: MovieResult): Movie => {
  return {
    id: result.tmdb_id,
    title: result.media_type === 'movie' ? result.title : undefined,
    name: result.media_type === 'tv' ? result.title : undefined,
    overview: result.overview,
    poster_path: result.poster_path || '',
    release_date: result.release_date,
    first_air_date: result.first_air_date,
    vote_average: result.vote_average,
    media_type: result.media_type,
  };
};

/**
 * Search for movies using the backend API
 */
const searchMoviesWithBackend = async (
  params: SearchParams,
  language: string = 'fr-FR',
  country: string = 'FR',
  isProUser: boolean = false
): Promise<SearchResult> => {
  const { query, includeMovies, includeTvShows } = params;

  if (!query.trim()) {
    throw new Error('enterRequest');
  }

  try {
    console.log('Searching with backend API:', {
      query,
      includeMovies,
      includeTvShows,
      language,
      country,
      isProUser,
    });

    const response = await backendAPIService.search({
      query,
      includeMovies,
      includeTvShows,
      language,
      country,
      isProUser, // Pass subscription status to backend
    });

    if (!response.success || !response.data) {
      console.error('Backend search failed:', response.error);
      throw new Error(response.error?.code || 'searchError');
    }

    const data = response.data;

    console.log('Backend search results:', {
      totalResults: data.totalResults,
      promptsRemaining: data.promptsRemaining,
      isProUser: data.isProUser,
    });

    // Transform backend results to frontend format
    const movies = data.recommendations.map(transformMovieResult);

    // Since backend doesn't return streaming providers and credits yet,
    // we'll return empty objects for now (TODO: add to backend)
    const streamingProviders: { [key: number]: StreamingProvider[] } = {};
    const credits: { [key: number]: Cast[] } = {};
    const detailedInfo: { [key: number]: DetailedInfo } = {};

    // You can enhance this by calling TMDB for additional details if needed
    // For now, we'll just use what the backend provides

    return {
      movies,
      streamingProviders,
      credits,
      detailedInfo,
      geminiResponse: data.conversationalResponse,
      promptsRemaining: data.promptsRemaining,
      isProUser: data.isProUser,
    };
  } catch (error) {
    console.error('Backend search error:', error);

    // Handle quota exceeded error
    if (error instanceof Error && error.message === 'HTTP_429') {
      throw new Error('quotaExceeded');
    }

    throw new Error('searchError');
  }
};

/**
 * Hook for searching movies using the backend API
 */
export const useBackendMovieSearch = (isProUser: boolean = false) => {
  const { t, country, language } = useLanguage();

  // Convert language format (e.g., 'fr' -> 'fr-FR')
  const tmdbLanguage = `${language}-${country}`;

  return useMutation({
    mutationFn: (params: SearchParams) =>
      searchMoviesWithBackend(params, tmdbLanguage, country, isProUser),
    onError: (error: Error) => {
      // Map error codes to user-friendly messages
      const errorMessage =
        error.message === 'quotaExceeded'
          ? t('errors.quotaExceeded') ||
            'You have reached your monthly limit. Please upgrade to Pro for unlimited searches.'
          : t(`errors.${error.message}`) || t('errors.searchError');

      Alert.alert(t('errors.title'), errorMessage);
    },
  });
};

/**
 * Hook to check remaining prompt limit
 */
export const usePromptLimit = () => {
  return useQuery({
    queryKey: ['promptLimit'],
    queryFn: async () => {
      const response = await backendAPIService.checkLimit();

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to check limit');
      }

      return response.data;
    },
    staleTime: 60000, // Cache for 1 minute
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook to check backend health
 */
export const useBackendHealth = () => {
  return useQuery({
    queryKey: ['backendHealth'],
    queryFn: async () => {
      const response = await backendAPIService.healthCheck();

      if (!response.success) {
        throw new Error('Backend health check failed');
      }

      return response.data;
    },
    staleTime: 300000, // Cache for 5 minutes
    retry: 3,
    retryDelay: 1000,
  });
};
