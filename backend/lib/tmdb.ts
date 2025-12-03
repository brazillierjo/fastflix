/**
 * FastFlix Backend - TMDB Service
 * Handles all TMDB API interactions and enriches AI recommendations
 */

import type {
  MovieResult,
  TMDBSearchResponse,
  TMDBMovie,
  TMDBTVShow,
  TMDBWatchProviderResponse,
  StreamingProvider,
  TMDBPersonSearchResponse,
  PersonResult,
} from './types';

interface CachedData<T> {
  data: T;
  timestamp: number;
}

class TMDBService {
  private baseUrl: string;
  private apiKey: string;
  private cache: Map<string, CachedData<unknown>> = new Map();
  private cacheTTL = 1000 * 60 * 60; // 1 hour cache

  constructor() {
    this.baseUrl = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
    this.apiKey = process.env.TMDB_API_KEY || '';

    if (!this.apiKey) {
      console.error('⚠️ TMDB_API_KEY not found in environment variables');
    } else {
      console.log('✅ TMDB service initialized');
    }
  }

  /**
   * Make a request to TMDB API with caching
   */
  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const cacheKey = `${endpoint}?${new URLSearchParams(params).toString()}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log(`📦 Cache hit: ${endpoint}`);
      return cached.data as T;
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.append('api_key', this.apiKey);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }

    try {
      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Store in cache
      this.cache.set(cacheKey, { data, timestamp: Date.now() });

      return data as T;
    } catch (error) {
      console.error(`❌ TMDB request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Search for a movie by title
   */
  async searchMovieByTitle(title: string, language: string = 'fr-FR'): Promise<TMDBMovie | null> {
    try {
      const data = await this.makeRequest<TMDBSearchResponse>('/search/movie', {
        query: title,
        language,
        include_adult: 'false',
      });

      if (data.results && data.results.length > 0) {
        const movie = data.results[0] as TMDBMovie;
        return { ...movie, media_type: 'movie' };
      }

      return null;
    } catch (error) {
      console.error(`❌ Failed to search movie: ${title}`, error);
      return null;
    }
  }

  /**
   * Search for a TV show by title
   */
  async searchTVByTitle(title: string, language: string = 'fr-FR'): Promise<TMDBTVShow | null> {
    try {
      const data = await this.makeRequest<TMDBSearchResponse>('/search/tv', {
        query: title,
        language,
        include_adult: 'false',
      });

      if (data.results && data.results.length > 0) {
        const tv = data.results[0] as TMDBTVShow;
        return { ...tv, media_type: 'tv' };
      }

      return null;
    } catch (error) {
      console.error(`❌ Failed to search TV show: ${title}`, error);
      return null;
    }
  }

  /**
   * Search for both movies and TV shows (multi search)
   */
  async searchMulti(
    title: string,
    language: string = 'fr-FR'
  ): Promise<(TMDBMovie | TMDBTVShow) | null> {
    try {
      const data = await this.makeRequest<TMDBSearchResponse>('/search/multi', {
        query: title,
        language,
        include_adult: 'false',
      });

      if (data.results && data.results.length > 0) {
        // Filter out person results, keep only movie/tv
        const mediaResults = data.results.filter(
          (result): result is TMDBMovie | TMDBTVShow =>
            result.media_type === 'movie' || result.media_type === 'tv'
        );

        if (mediaResults.length > 0) {
          return mediaResults[0] as TMDBMovie | TMDBTVShow;
        }
      }

      return null;
    } catch (error) {
      console.error(`❌ Failed to search multi: ${title}`, error);
      return null;
    }
  }

  /**
   * Convert TMDB movie/TV result to MovieResult format
   */
  private convertToMovieResult(tmdbResult: TMDBMovie | TMDBTVShow): MovieResult {
    const isMovie = 'title' in tmdbResult;

    return {
      tmdb_id: tmdbResult.id,
      title: isMovie ? tmdbResult.title : tmdbResult.name,
      original_title: isMovie ? tmdbResult.original_title : tmdbResult.original_name,
      media_type: isMovie ? 'movie' : 'tv',
      overview: tmdbResult.overview || '',
      poster_path: tmdbResult.poster_path,
      backdrop_path: tmdbResult.backdrop_path,
      vote_average: tmdbResult.vote_average || 0,
      vote_count: tmdbResult.vote_count || 0,
      release_date: isMovie ? tmdbResult.release_date : undefined,
      first_air_date: !isMovie ? tmdbResult.first_air_date : undefined,
      genre_ids: tmdbResult.genre_ids || [],
      popularity: tmdbResult.popularity || 0,
      adult: isMovie ? tmdbResult.adult : undefined,
    };
  }

  /**
   * Enrich AI recommendations with TMDB metadata
   * This is the main function that combines Gemini titles with TMDB data
   */
  async enrichRecommendations(
    titles: string[],
    includeMovies: boolean,
    includeTvShows: boolean,
    language: string = 'fr-FR'
  ): Promise<MovieResult[]> {
    console.log(`🔍 Enriching ${titles.length} titles with TMDB metadata...`);

    const enrichedResults: MovieResult[] = [];
    const errors: string[] = [];

    // Process titles in parallel for better performance
    const promises = titles.map(async (title) => {
      try {
        let tmdbResult: (TMDBMovie | TMDBTVShow) | null = null;

        // Search based on content type preferences
        if (includeMovies && includeTvShows) {
          // Search both (multi search)
          tmdbResult = await this.searchMulti(title, language);
        } else if (includeMovies) {
          // Movies only
          tmdbResult = await this.searchMovieByTitle(title, language);
        } else if (includeTvShows) {
          // TV shows only
          tmdbResult = await this.searchTVByTitle(title, language);
        }

        if (tmdbResult) {
          return this.convertToMovieResult(tmdbResult);
        } else {
          errors.push(title);
          return null;
        }
      } catch (error) {
        console.error(`❌ Error enriching title "${title}":`, error);
        errors.push(title);
        return null;
      }
    });

    const results = await Promise.all(promises);

    // Filter out nulls and add to enriched results
    results.forEach((result) => {
      if (result) {
        enrichedResults.push(result);
      }
    });

    console.log(`✅ Enriched ${enrichedResults.length}/${titles.length} titles`);

    if (errors.length > 0) {
      console.log(`⚠️ Failed to enrich ${errors.length} titles:`, errors.slice(0, 5));
    }

    return enrichedResults;
  }

  /**
   * Get watch providers for a movie or TV show
   */
  async getWatchProviders(
    tmdbId: number,
    mediaType: 'movie' | 'tv',
    country: string = 'FR'
  ): Promise<StreamingProvider[]> {
    try {
      const endpoint = `/${mediaType}/${tmdbId}/watch/providers`;

      const response = await this.makeRequest<TMDBWatchProviderResponse>(endpoint);

      // Get providers for the specific region
      const regionData = response.results[country];

      if (!regionData || !regionData.flatrate) {
        return [];
      }

      // Return only flatrate (streaming) providers
      return regionData.flatrate.map((provider) => ({
        provider_id: provider.provider_id,
        provider_name: provider.provider_name,
        logo_path: provider.logo_path,
        display_priority: provider.display_priority,
      }));
    } catch (error) {
      console.error(`❌ Failed to get watch providers for ${mediaType} ${tmdbId}:`, error);
      return [];
    }
  }

  /**
   * Get watch providers for multiple movies/TV shows in parallel
   */
  async getBatchWatchProviders(
    items: MovieResult[],
    country: string = 'FR'
  ): Promise<{ [key: number]: StreamingProvider[] }> {
    const result: { [key: number]: StreamingProvider[] } = {};

    const promises = items.map(async (item) => {
      const providers = await this.getWatchProviders(item.tmdb_id, item.media_type, country);
      if (providers.length > 0) {
        result[item.tmdb_id] = providers;
      }
    });

    await Promise.all(promises);
    return result;
  }

  /**
   * Search for a person/actor by name
   */
  async searchPerson(query: string, language: string = 'en-US'): Promise<PersonResult[]> {
    try {
      const data = await this.makeRequest<TMDBPersonSearchResponse>('/search/person', {
        query,
        language,
        include_adult: 'false',
      });

      if (data.results && data.results.length > 0) {
        // Filter to only include actors (known_for_department === 'Acting')
        // and sort by popularity
        return data.results
          .filter((person) => person.known_for_department === 'Acting')
          .slice(0, 10)
          .map((person) => ({
            id: person.id,
            name: person.name,
            profile_path: person.profile_path,
            known_for_department: person.known_for_department,
            popularity: person.popularity,
          }));
      }

      return [];
    } catch (error) {
      console.error(`❌ Failed to search person: ${query}`, error);
      return [];
    }
  }

  /**
   * Get movies/TV shows for a specific actor using TMDB person credits
   */
  async getPersonCredits(
    personId: number,
    mediaType: 'movie' | 'tv' | 'both' = 'both',
    language: string = 'en-US'
  ): Promise<MovieResult[]> {
    try {
      const endpoint = `/person/${personId}/combined_credits`;
      const data = await this.makeRequest<{
        cast: (TMDBMovie | TMDBTVShow)[];
        crew: (TMDBMovie | TMDBTVShow)[];
      }>(endpoint, { language });

      let results = data.cast || [];

      // Filter by media type if specified
      if (mediaType === 'movie') {
        results = results.filter((item) => 'title' in item);
      } else if (mediaType === 'tv') {
        results = results.filter((item) => 'name' in item);
      }

      // Sort by popularity and vote count, take top results
      results = results
        .filter((item) => item.vote_count > 50) // Filter out obscure titles
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 30);

      return results.map((item) => this.convertToMovieResult(item));
    } catch (error) {
      console.error(`❌ Failed to get person credits for ID ${personId}:`, error);
      return [];
    }
  }
}

// Export singleton instance
export const tmdb = new TMDBService();
