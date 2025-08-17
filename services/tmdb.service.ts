/**
 * TMDB Service - Dedicated API service with error handling
 * Implements proper error handling and data transformation
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import Constants from 'expo-constants';
import { APP_CONFIG, ERROR_MESSAGES } from '@/constants/app';
import {
  TMDBSearchItem,
  StreamingProvider,
  Cast,
  APIResponse,
  APIError,
  SearchParams,
  MediaItem,
  Movie,
  TVShow,
  isTMDBMovie,
  isTMDBTVShow,
  TMDBProvider,
  TMDBCastMember,
} from '@/types/api';
import {
  getTMDBFallbackLanguages,
  type SupportedLanguage,
} from '@/constants/languages';

class TMDBService {
  private client: AxiosInstance;
  private apiKey: string;

  constructor() {
    this.apiKey = Constants.expoConfig?.extra?.TMDB_API_KEY || '';

    if (!this.apiKey) {
      console.error('TMDB API key not found in configuration');
    }

    this.client = axios.create({
      baseURL: APP_CONFIG.TMDB.BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      config => {
        config.params = {
          ...config.params,
          api_key: this.apiKey,
        };
        return config;
      },
      error => Promise.reject(this.handleError(error))
    );

    // Response interceptor
    this.client.interceptors.response.use(
      response => response,
      error => Promise.reject(this.handleError(error))
    );
  }

  private handleError(error: AxiosError): APIError {
    console.error('TMDB API Error:', error);

    if (error.code === 'ECONNABORTED') {
      return {
        code: 'TIMEOUT',
        message: 'Request timeout - please check your connection',
      };
    }

    if (error.response) {
      return {
        code: `HTTP_${error.response.status}`,
        message:
          (error.response.data as any)?.status_message ||
          ERROR_MESSAGES.API_ERROR,
        details: error.response.data as Record<string, unknown>,
      };
    }

    if (error.request) {
      return {
        code: 'NETWORK_ERROR',
        message: ERROR_MESSAGES.NETWORK_ERROR,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: ERROR_MESSAGES.UNKNOWN_ERROR,
      details: { originalError: error.message },
    };
  }

  private transformTMDBToMediaItem(item: TMDBSearchItem): MediaItem {
    if (isTMDBMovie(item)) {
      return {
        id: item.id,
        title: item.title,
        overview: item.overview,
        posterPath: item.poster_path,
        backdropPath: item.backdrop_path,
        releaseDate: item.release_date,
        voteAverage: item.vote_average,
        voteCount: item.vote_count,
        genres: [], // Will be populated separately
        releaseYear: new Date(item.release_date || '1900').getFullYear(),
        mediaType: 'movie',
        tmdbId: item.id,
      } as Movie;
    }

    if (isTMDBTVShow(item)) {
      return {
        id: item.id,
        name: item.name,
        overview: item.overview,
        posterPath: item.poster_path,
        backdropPath: item.backdrop_path,
        firstAirDate: item.first_air_date,
        voteAverage: item.vote_average,
        voteCount: item.vote_count,
        genres: [], // Will be populated separately
        firstAirYear: new Date(item.first_air_date || '1900').getFullYear(),
        mediaType: 'tv',
        tmdbId: item.id,
      } as TVShow;
    }

    throw new Error(`Unsupported media type: ${(item as any).media_type}`);
  }

  async searchMulti(
    params: SearchParams
  ): Promise<APIResponse<MediaItem | null>> {
    try {
      const {
        query,
        includeMovies,
        includeTvShows,
        language = APP_CONFIG.TMDB.DEFAULT_LANGUAGE,
      } = params;

      if (!query.trim()) {
        return {
          success: false,
          data: null,
          error: {
            code: 'INVALID_QUERY',
            message: 'Search query cannot be empty',
          },
        };
      }

      const cleanTitle = query.trim();
      const fallbackLanguages = getTMDBFallbackLanguages(
        language as SupportedLanguage
      );

      // Progressive search strategy
      for (const searchLanguage of fallbackLanguages) {
        try {
          const response = await this.client.get('/search/multi', {
            params: {
              query: cleanTitle,
              language: searchLanguage,
              include_adult: false,
            },
          });

          const filteredResults = response.data.results.filter(
            (item: TMDBSearchItem) => {
              if (item.media_type === 'movie' && includeMovies) return true;
              if (item.media_type === 'tv' && includeTvShows) return true;
              return false;
            }
          );

          if (filteredResults.length > 0) {
            // Sort by relevance (vote_average * vote_count)
            const sortedResults = filteredResults.sort(
              (a: TMDBSearchItem, b: TMDBSearchItem) => {
                const scoreA = a.vote_average * Math.log(a.vote_count + 1);
                const scoreB = b.vote_average * Math.log(b.vote_count + 1);
                return scoreB - scoreA;
              }
            );

            const transformedItem = this.transformTMDBToMediaItem(
              sortedResults[0]
            );

            return {
              success: true,
              data: transformedItem,
            };
          }
        } catch (searchError) {
          console.warn(
            `Search failed for "${cleanTitle}" in ${searchLanguage}:`,
            searchError
          );
          continue;
        }
      }

      return {
        success: true,
        data: null,
        message: 'No results found for the given query',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error as APIError,
      };
    }
  }

  async getWatchProviders(
    itemId: number,
    mediaType: 'movie' | 'tv',
    countryCode: string = 'FR'
  ): Promise<APIResponse<StreamingProvider[]>> {
    try {
      const response = await this.client.get(
        `/${mediaType}/${itemId}/watch/providers`
      );

      const providers = response.data.results?.[countryCode]?.flatrate || [];

      const transformedProviders: StreamingProvider[] = providers.map(
        (provider: TMDBProvider) => ({
          id: provider.provider_id,
          provider_name: provider.provider_name,
          logo_path: provider.logo_path,
          display_priority: provider.display_priority,
        })
      );

      return {
        success: true,
        data: transformedProviders,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error as APIError,
      };
    }
  }

  async getCredits(
    itemId: number,
    mediaType: 'movie' | 'tv',
    language: string = APP_CONFIG.TMDB.DEFAULT_LANGUAGE
  ): Promise<APIResponse<Cast[]>> {
    try {
      const response = await this.client.get(
        `/${mediaType}/${itemId}/credits`,
        {
          params: { language },
        }
      );

      const cast = response.data.cast?.slice(0, 5) || [];

      const transformedCast: Cast[] = cast.map((actor: TMDBCastMember) => ({
        id: actor.id,
        name: actor.name,
        character: actor.character,
        profilePath: actor.profile_path,
        order: actor.order,
      }));

      return {
        success: true,
        data: transformedCast,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error as APIError,
      };
    }
  }

  async getDetailedInfo(
    itemId: number,
    mediaType: 'movie' | 'tv',
    language: string = APP_CONFIG.TMDB.DEFAULT_LANGUAGE
  ): Promise<APIResponse<Partial<MediaItem>>> {
    try {
      const response = await this.client.get(`/${mediaType}/${itemId}`, {
        params: { language },
      });

      const data = response.data;
      let detailedInfo: Partial<MediaItem>;

      if (mediaType === 'movie') {
        detailedInfo = {
          genres: data.genres || [],
          runtime: data.runtime || null,
          releaseYear: data.release_date
            ? new Date(data.release_date).getFullYear()
            : null,
        } as Partial<Movie>;
      } else {
        detailedInfo = {
          genres: data.genres || [],
          numberOfSeasons: data.number_of_seasons || null,
          numberOfEpisodes: data.number_of_episodes || null,
          status: data.status || null,
          firstAirYear: data.first_air_date
            ? new Date(data.first_air_date).getFullYear()
            : null,
        } as Partial<TVShow>;
      }

      return {
        success: true,
        data: detailedInfo,
      };
    } catch (error) {
      return {
        success: false,
        data: {},
        error: error as APIError,
      };
    }
  }

  // Utility method to get image URL
  getImageUrl(
    path: string | null,
    size: 'w92' | 'w300' | 'w500' | 'w780' | 'original' = 'w300'
  ): string | null {
    if (!path) return null;
    return `${APP_CONFIG.TMDB.IMAGE_BASE_URL}/${size}${path}`;
  }

  // Method to get TMDB URL for external linking
  getTMDBUrl(itemId: number, mediaType: 'movie' | 'tv'): string {
    const baseUrl =
      mediaType === 'movie'
        ? APP_CONFIG.LINKS.TMDB_MOVIE
        : APP_CONFIG.LINKS.TMDB_TV;
    return `${baseUrl}/${itemId}`;
  }
}

// Export singleton instance
export const tmdbService = new TMDBService();
