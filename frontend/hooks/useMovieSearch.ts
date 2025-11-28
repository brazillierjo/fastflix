/**
 * Movie Search and Recommendation Hook
 *
 * This file implements the core search functionality for the "FastFlix" application.
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
import { aiService } from '../utils/aiServices';
import { tmdbService } from '../utils/apiServices';
import {
  getLanguageForTMDB,
  type SupportedLanguage,
} from '../constants/languages';

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
}

const searchMoviesWithGemini = async (
  params: SearchParams,
  countryCode: string = 'FR',
  language: string = 'fr-FR',
  userLanguage?: SupportedLanguage
): Promise<SearchResult> => {
  const { query, includeMovies, includeTvShows } = params;

  if (!query.trim()) {
    throw new Error('enterRequest');
  }

  try {
    // Analyze the query to determine content types using AI
    const { includeMovies: aiIncludeMovies, includeTvShows: aiIncludeTvShows } =
      aiService.analyzeQueryForContentTypes(
        query,
        includeMovies,
        includeTvShows
      );

    // Detect streaming platform mentions in the query
    const { platform, platformId } = aiService.detectStreamingPlatform(query);

    // Generate recommendations using AI with determined content types
    let contentTypes = [];
    if (aiIncludeMovies) contentTypes.push('films');
    if (aiIncludeTvShows) contentTypes.push('séries');

    // Generate recommendations and conversational response in a single API call
    const { recommendations: movieTitles, conversationalResponse } =
      await aiService.generateRecommendationsWithResponse(query, contentTypes);

    // Remove duplicate titles (case-insensitive)
    const uniqueTitles = movieTitles.filter((title, index, array) => {
      const normalizedTitle = title.toLowerCase().trim();
      return (
        array.findIndex(t => t.toLowerCase().trim() === normalizedTitle) ===
        index
      );
    });

    // Search for each unique title on TMDB using AI-determined content types
    const contentPromises = uniqueTitles.map(title =>
      tmdbService.searchMulti(
        title,
        aiIncludeMovies,
        aiIncludeTvShows,
        language,
        userLanguage
      )
    );

    const contentResults = await Promise.all(contentPromises);

    // Console log for debugging TMDB response
    console.log('🎭 TMDB Search Results:', contentResults);

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
      )
      // Remove duplicates based on TMDB ID
      .filter(
        (movie, index, array) =>
          array.findIndex(m => m.id === movie.id) === index
      );

    // Get streaming providers, credits, and detailed info for each movie/show
    const dataPromises = validContent.map(async item => {
      const mediaType = item.media_type || 'movie';
      const [providers, credits, detailedInfo] = await Promise.all([
        tmdbService.getWatchProviders(item.id, mediaType, countryCode),
        tmdbService.getCredits(item.id, mediaType, language),
        tmdbService.getDetailedInfo(item.id, mediaType, language),
      ]);

      return {
        movieId: item.id,
        providers,
        credits,
        detailedInfo,
        movie: item,
      };
    });

    const dataResults = await Promise.all(dataPromises);

    // Filter by streaming platform if specified in the query
    // This allows users to search for content available on specific platforms
    // e.g., "je veux voir un film d'action disponible sur Netflix"
    let platformFilteredResults = dataResults;
    if (platformId) {
      console.log(
        `Filtering results for platform: ${platform} (ID: ${platformId})`
      );
      platformFilteredResults = dataResults.filter(result => {
        // Check if the specified platform is available for this content in the user's country
        const hasRequestedPlatform = result.providers.some(
          provider => provider.provider_id === platformId
        );
        if (hasRequestedPlatform) {
          console.log(
            `Found content "${result.movie.title || result.movie.name}" on ${platform}`
          );
        }
        return hasRequestedPlatform;
      });

      // If no results found for the specified platform, keep all results but inform the user
      if (platformFilteredResults.length === 0) {
        console.log(
          `No content found for platform: ${platform}. Showing all available results.`
        );
        platformFilteredResults = dataResults;
      } else {
        console.log(
          `Found ${platformFilteredResults.length} items available on ${platform}`
        );
      }
    }

    // Filter results based on query relevance (especially for actor searches)
    const filteredResults = platformFilteredResults.filter(result => {
      const queryLower = query.toLowerCase();

      // Mots-clés indiquant explicitement une recherche de personne spécifique
      const personKeywords =
        /\b(acteur|actrice|actor|actress|avec|starring|films? de|movies? by|réalisé par|directed by|joue dans|interprété par)\b/i;

      // Si la requête mentionne explicitement une personne, vérifier le casting
      if (personKeywords.test(queryLower)) {
        const possibleNames = queryLower
          .split(/[\s,]+/)
          .filter(
            word =>
              word.length > 2 &&
              !/^(le|la|les|de|du|des|un|une|et|ou|avec|dans|pour|sur|par)$/i.test(
                word
              )
          );

        const castNames = result.credits.map(cast => cast.name.toLowerCase());
        const hasMatchingPerson = possibleNames.some(name =>
          castNames.some(
            castName =>
              castName.includes(name) ||
              name.includes(castName.split(' ')[0]) ||
              name.includes(castName.split(' ').pop() || '')
          )
        );

        return hasMatchingPerson;
      }

      // Pour les requêtes conceptuelles (robots, voitures, etc.), garder tous les résultats
      return true;
    });

    const providersMap: { [key: number]: StreamingProvider[] } = {};
    const creditsMap: { [key: number]: Cast[] } = {};
    const detailedInfoMap: { [key: number]: DetailedInfo } = {};
    const finalMovies: Movie[] = [];

    filteredResults.forEach(result => {
      providersMap[result.movieId] = result.providers;
      creditsMap[result.movieId] = result.credits;
      detailedInfoMap[result.movieId] = result.detailedInfo;
      finalMovies.push(result.movie);
    });

    return {
      movies: finalMovies,
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
  const { t, country, language } = useLanguage();
  const tmdbLanguage = getLanguageForTMDB(language);

  return useMutation({
    mutationFn: (params: SearchParams) =>
      searchMoviesWithGemini(params, country, tmdbLanguage, language),
    onError: (error: Error) => {
      Alert.alert(t('errors.title'), t(`errors.${error.message}`));
    },
  });
};
