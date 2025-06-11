/**
 * API Services Module
 *
 * This file provides a centralized interface for external API interactions in the
 * "FastFlix" application, specifically for The Movie Database (TMDB) service.
 * AI-related functionality has been moved to aiServices.ts for better separation of concerns.
 *
 * The Movie Database (TMDB) Service provides:
 * - Comprehensive movie and TV show metadata including titles, descriptions, ratings
 * - High-quality poster images and media information
 * - Streaming provider availability specifically for the French market
 * - Cast and crew information with localized French content
 * - Multi-search functionality across different media types
 *
 * Key architectural decisions:
 * - Uses environment variables for secure API key management
 * - Implements proper error handling and logging for debugging
 * - Provides French localization for all API responses
 * - Maintains consistent data structures across different API responses
 * - Optimizes API calls by limiting results and focusing on relevant data
 *
 * The services are designed to be easily testable, maintainable, and extensible
 * for future API integrations or modifications.
 */

import { TMDBSearchItem } from '@/hooks/useMovieSearch';
import {
  getTMDBFallbackLanguages,
  type SupportedLanguage,
} from '@/constants/languages';
import axios from 'axios';
import Constants from 'expo-constants';

const TMDB_API_KEY = Constants.expoConfig?.extra?.TMDB_API_KEY;

// AI services have been moved to aiServices.ts for better separation of concerns

export const tmdbService = {
  async searchMulti(
    title: string,
    includeMovies: boolean,
    includeTvShows: boolean,
    language: string = 'fr-FR',
    userLanguage?: SupportedLanguage
  ): Promise<TMDBSearchItem | null> {
    try {
      // Nettoyer le titre pour améliorer la recherche
      const cleanTitle = title.trim();

      // Fonction pour effectuer une recherche avec un terme donné
      const performSearch = async (searchTerm: string, language: string) => {
        const response = await axios.get(
          `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchTerm)}&language=${language}`
        );

        return response.data.results.filter((item: TMDBSearchItem) => {
          if (item.media_type === 'movie' && includeMovies) return true;
          if (item.media_type === 'tv' && includeTvShows) return true;
          return false;
        });
      };

      // Stratégie de recherche progressive avec toutes les langues supportées
      const fallbackLanguages = userLanguage
        ? getTMDBFallbackLanguages(userLanguage)
        : [language, 'en-US', 'fr-FR']; // Fallback par défaut si userLanguage n'est pas fourni

      const searchStrategies: { term: string; language: string }[] = [];

      // Pour chaque langue de fallback, créer des stratégies de recherche
      fallbackLanguages.forEach((lang, index) => {
        const isFirstLanguage = index === 0;

        // 1. Recherche exacte
        searchStrategies.push({ term: cleanTitle, language: lang });

        // 2. Recherche sans articles (seulement pour les premières langues pour éviter trop de requêtes)
        if (index < 2) {
          searchStrategies.push({
            term: cleanTitle.replace(
              /^(le|la|les|the|a|an|の|が|を|に|で|と)\s+/i,
              ''
            ),
            language: lang,
          });
        }

        // 3. Recherche avec nettoyage des espaces (seulement pour la langue principale)
        if (isFirstLanguage) {
          searchStrategies.push({
            term: cleanTitle.replace(/\s+/g, ' '),
            language: lang,
          });
        }
      });

      // Essayer chaque stratégie jusqu'à trouver un résultat
      for (const strategy of searchStrategies) {
        if (strategy.term.length < 2) continue; // Éviter les recherches trop courtes

        try {
          const results = await performSearch(strategy.term, strategy.language);
          if (results.length > 0) {
            // Prioriser les résultats avec un score de pertinence élevé
            const sortedResults = results.sort(
              (a: TMDBSearchItem, b: TMDBSearchItem) => {
                const scoreA =
                  (a.vote_average || 0) * ((a as any).vote_count || 1);
                const scoreB =
                  (b.vote_average || 0) * ((b as any).vote_count || 1);
                return scoreB - scoreA;
              }
            );
            return sortedResults[0];
          }
        } catch (searchError) {
          console.warn(
            `Search failed for "${strategy.term}" in ${strategy.language}:`,
            searchError
          );
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error(`Error searching for ${title}:`, error);
      return null;
    }
  },

  async getWatchProviders(
    itemId: number,
    mediaType: string,
    countryCode: string = 'FR'
  ): Promise<any[]> {
    try {
      const providerResponse = await axios.get(
        `https://api.themoviedb.org/3/${mediaType}/${itemId}/watch/providers?api_key=${TMDB_API_KEY}`
      );

      return providerResponse.data.results?.[countryCode]?.flatrate || [];
    } catch (error) {
      console.error(
        `Error fetching providers for ${mediaType} ${itemId}:`,
        error
      );
      return [];
    }
  },

  async getCredits(
    itemId: number,
    mediaType: string,
    language: string = 'fr-FR'
  ): Promise<any[]> {
    try {
      const creditsResponse = await axios.get(
        `https://api.themoviedb.org/3/${mediaType}/${itemId}/credits?api_key=${TMDB_API_KEY}&language=${language}`
      );

      // Retourner les 5 premiers acteurs principaux
      return creditsResponse.data.cast?.slice(0, 5) || [];
    } catch (error) {
      console.error(
        `Error fetching credits for ${mediaType} ${itemId}:`,
        error
      );
      return [];
    }
  },

  async getDetailedInfo(
    itemId: number,
    mediaType: string,
    language: string = 'fr-FR'
  ): Promise<any> {
    try {
      const detailsResponse = await axios.get(
        `https://api.themoviedb.org/3/${mediaType}/${itemId}?api_key=${TMDB_API_KEY}&language=${language}`
      );

      const data = detailsResponse.data;

      if (mediaType === 'movie') {
        return {
          genres: data.genres || [],
          runtime: data.runtime || null,
          release_year: data.release_date
            ? new Date(data.release_date).getFullYear()
            : null,
        };
      } else if (mediaType === 'tv') {
        return {
          genres: data.genres || [],
          number_of_seasons: data.number_of_seasons || null,
          number_of_episodes: data.number_of_episodes || null,
          status: data.status || null,
          first_air_year: data.first_air_date
            ? new Date(data.first_air_date).getFullYear()
            : null,
        };
      }

      return {};
    } catch (error) {
      console.error(
        `Error fetching detailed info for ${mediaType} ${itemId}:`,
        error
      );
      return {};
    }
  },
};
