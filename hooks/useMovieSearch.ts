/**
 * Movie Search and Recommendation Hook
 *
 * This file implements the core search functionality for the "What Movie Tonight" application.
 * It integrates Google's Gemini AI for intelligent movie recommendations with The Movie Database (TMDB)
 * API for detailed movie information, streaming providers, and cast details.
 *
 * The hook provides a sophisticated search workflow that:
 * 1. Uses Gemini AI to generate contextual movie/TV show recommendations based on user queries
 * 2. Searches TMDB for each recommended title to get comprehensive metadata
 * 3. Fetches additional information including streaming availability and cast details
 * 4. Filters and validates results to ensure data quality and relevance
 *
 * Key features:
 * - AI-powered recommendation generation using natural language processing
 * - Multi-source data aggregation (Gemini + TMDB)
 * - Streaming provider integration for French market (FR region)
 * - Cast and crew information retrieval
 * - Robust error handling and data validation
 * - Support for both movies and TV shows with configurable filtering
 *
 * The hook uses React Query's useMutation for efficient API state management,
 * providing loading states, error handling, and automatic retries.
 */

import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { geminiService, tmdbService } from '../utils/apiServices';

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

export interface TMDBSearchItem {
  id: number;
  media_type: 'movie' | 'tv' | 'person';
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
}

export interface StreamingProvider {
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
  numberOfRecommendations: number;
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
}

const searchMoviesWithGemini = async (
  params: SearchParams,
  countryCode: string = 'FR'
): Promise<SearchResult> => {
  const { query, numberOfRecommendations, includeMovies, includeTvShows } =
    params;

  if (!query.trim()) {
    throw new Error('enterRequest');
  }

  if (!includeMovies && !includeTvShows) {
    throw new Error('selectContentType');
  }

  try {
    // Generate recommendations using Gemini
    let contentTypes = [];
    if (includeMovies) contentTypes.push('films');
    if (includeTvShows) contentTypes.push('séries');

    // Generate recommendations and conversational response in a single API call
    const { recommendations: movieTitles, conversationalResponse } =
      await geminiService.generateRecommendationsWithResponse(
        query,
        numberOfRecommendations,
        contentTypes
      );

    // Search for each title on TMDB
    const contentPromises = movieTitles.map(title =>
      tmdbService.searchMulti(title, includeMovies, includeTvShows)
    );

    const contentResults = await Promise.all(contentPromises);
    const validContent = contentResults
      .filter(
        (item): item is TMDBSearchItem =>
          item !== null &&
          item !== undefined &&
          typeof item.id === 'number' &&
          (typeof item.title === 'string' || typeof item.name === 'string') &&
          typeof item.overview === 'string' &&
          typeof item.poster_path === 'string'
      )
      .map(
        (item): Movie => ({
          id: item.id,
          title: item.title,
          name: item.name,
          overview: item.overview!,
          poster_path: item.poster_path!,
          release_date: item.release_date,
          first_air_date: item.first_air_date,
          vote_average: item.vote_average || 0,
          media_type: item.media_type,
        })
      );

    // Get streaming providers, credits, and detailed info for each movie/show
    const dataPromises = validContent.map(async item => {
      const mediaType = item.media_type || 'movie';
      const [providers, credits, detailedInfo] = await Promise.all([
        tmdbService.getWatchProviders(item.id, mediaType, countryCode),
        tmdbService.getCredits(item.id, mediaType),
        tmdbService.getDetailedInfo(item.id, mediaType),
      ]);

      return {
        movieId: item.id,
        providers,
        credits,
        detailedInfo,
      };
    });

    const dataResults = await Promise.all(dataPromises);
    const providersMap: { [key: number]: StreamingProvider[] } = {};
    const creditsMap: { [key: number]: Cast[] } = {};
    const detailedInfoMap: { [key: number]: DetailedInfo } = {};

    dataResults.forEach(result => {
      providersMap[result.movieId] = result.providers;
      creditsMap[result.movieId] = result.credits;
      detailedInfoMap[result.movieId] = result.detailedInfo;
    });

    return {
      movies: validContent,
      streamingProviders: providersMap,
      credits: creditsMap,
      detailedInfo: detailedInfoMap,
      geminiResponse: conversationalResponse,
    };
  } catch (error) {
    console.error('Search error:', error);
    throw new Error('searchError');
  }
};

export const useMovieSearch = () => {
  const { t, country } = useLanguage();

  return useMutation({
    mutationFn: (params: SearchParams) => searchMoviesWithGemini(params, country),
    onError: (error: Error) => {
      Alert.alert(t('errors.title'), t(`errors.${error.message}`));
    },
  });
};
