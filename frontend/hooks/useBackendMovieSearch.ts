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
  StreamingProvider,
  Cast as BackendCast,
  DetailedInfo as BackendDetailedInfo,
} from '../services/backend-api.service';
import { APP_CONFIG } from '@/constants/app';
import { getLanguageForTMDB } from '@/constants/languages';
import { useUserPreferences } from './useUserPreferences';

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
  // Platform/Provider filters (override user preferences if provided)
  platforms?: number[];
  includeFlatrate?: boolean;
  includeRent?: boolean;
  includeBuy?: boolean;
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
  country: string = 'FR'
): Promise<SearchResult> => {
  const {
    query,
    includeMovies,
    includeTvShows,
    platforms,
    includeFlatrate,
    includeRent,
    includeBuy,
  } = params;

  if (!query.trim()) {
    throw new Error('enterRequest');
  }

  try {
    const response = await backendAPIService.search({
      query,
      includeMovies,
      includeTvShows,
      language,
      country,
      platforms,
      includeFlatrate,
      includeRent,
      includeBuy,
    });

    if (!response.success || !response.data) {
      // Handle subscription required error specifically
      if (response.error?.code === 'HTTP_402') {
        throw new Error('subscriptionRequired');
      }

      throw new Error(response.error?.code || 'searchError');
    }

    const data = response.data;

    // Transform backend results to frontend format
    const movies = data.recommendations.map(transformMovieResult);

    // Get streaming providers from backend response
    const streamingProviders = data.streamingProviders || {};

    // Transform credits from backend format to frontend format
    const credits: { [key: number]: Cast[] } = {};
    if (data.credits) {
      Object.entries(data.credits).forEach(([id, castList]) => {
        credits[Number(id)] = castList.map((c: BackendCast) => ({
          id: c.id,
          name: c.name,
          character: c.character,
          profile_path: c.profile_path || undefined,
        }));
      });
    }

    // Transform detailed info from backend format to frontend format
    const detailedInfo: { [key: number]: DetailedInfo } = {};
    if (data.detailedInfo) {
      Object.entries(data.detailedInfo).forEach(([id, info]) => {
        const backendInfo = info as BackendDetailedInfo;
        detailedInfo[Number(id)] = {
          genres: backendInfo.genres || [],
          runtime: backendInfo.runtime,
          release_year: backendInfo.release_year,
          number_of_seasons: backendInfo.number_of_seasons,
          number_of_episodes: backendInfo.number_of_episodes,
          status: backendInfo.status,
          first_air_year: backendInfo.first_air_year,
        };
      });
    }

    return {
      movies,
      streamingProviders,
      credits,
      detailedInfo,
      geminiResponse: data.conversationalResponse,
    };
  } catch (error) {
    // Re-throw known errors (like subscriptionRequired) without transforming them
    if (error instanceof Error && error.message === 'subscriptionRequired') {
      throw error;
    }

    // For unexpected errors, throw a generic searchError
    throw new Error('searchError');
  }
};

/**
 * Hook for searching movies using the backend API
 * Backend automatically checks subscription status via database (updated by RevenueCat webhook)
 * Automatically applies user preferences (platforms, availability types) to searches
 */
export const useBackendMovieSearch = () => {
  const { t, country, language } = useLanguage();
  const { preferences } = useUserPreferences();

  // Convert language format using TMDB mapping (e.g., 'fr' -> 'fr-FR', 'it' -> 'it-IT')
  const tmdbLanguage = getLanguageForTMDB(language);

  return useMutation({
    mutationFn: (params: SearchParams) => {
      // Apply user preferences for platform/availability filters
      // These can be overridden by explicit params (e.g., when refining search)
      const includeMovies =
        params.includeMovies ??
        (preferences.contentType === 'all' ||
          preferences.contentType === 'movies');
      const includeTvShows =
        params.includeTvShows ??
        (preferences.contentType === 'all' ||
          preferences.contentType === 'tvshows');

      const mergedParams: SearchParams = {
        ...params,
        includeMovies,
        includeTvShows,
        // Use user preferences if not explicitly provided in params
        platforms: params.platforms ?? preferences.platforms,
        includeFlatrate: params.includeFlatrate ?? preferences.includeFlatrate,
        includeRent: params.includeRent ?? preferences.includeRent,
        includeBuy: params.includeBuy ?? preferences.includeBuy,
      };

      return searchMoviesWithBackend(mergedParams, tmdbLanguage, country);
    },
    onError: (error: Error) => {
      // Don't show alert for subscriptionRequired - it's handled in the component
      if (error.message === 'subscriptionRequired') {
        return;
      }

      // Map error codes to user-friendly messages
      const errorMessage =
        t(`errors.${error.message}`) || t('errors.searchError');

      Alert.alert(t('errors.title'), errorMessage);
    },
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
