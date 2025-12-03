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
  Cast,
  DetailedInfo,
  Genre,
  AvailableProvider,
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

    // Filter out nulls and deduplicate by tmdb_id
    const seenIds = new Set<number>();
    results.forEach((result) => {
      if (result && !seenIds.has(result.tmdb_id)) {
        seenIds.add(result.tmdb_id);
        enrichedResults.push(result);
      }
    });

    const duplicatesRemoved = results.filter(Boolean).length - enrichedResults.length;
    console.log(
      `✅ Enriched ${enrichedResults.length}/${titles.length} titles${duplicatesRemoved > 0 ? ` (${duplicatesRemoved} duplicates removed)` : ''}`
    );

    if (errors.length > 0) {
      console.log(`⚠️ Failed to enrich ${errors.length} titles:`, errors.slice(0, 5));
    }

    return enrichedResults;
  }

  /**
   * Get watch providers for a movie or TV show
   * Returns all availability types: flatrate (subscription), rent, buy, ads
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

      if (!regionData) {
        return [];
      }

      const providers: StreamingProvider[] = [];
      const seenProviders = new Set<number>();

      // Helper to add providers with availability type
      const addProviders = (
        list: typeof regionData.flatrate | undefined,
        type: 'flatrate' | 'rent' | 'buy' | 'ads'
      ) => {
        if (!list) return;
        for (const provider of list) {
          // Avoid duplicates (same provider might be in multiple lists)
          if (!seenProviders.has(provider.provider_id)) {
            seenProviders.add(provider.provider_id);
            providers.push({
              provider_id: provider.provider_id,
              provider_name: provider.provider_name,
              logo_path: provider.logo_path,
              display_priority: provider.display_priority,
              availability_type: type,
            });
          }
        }
      };

      // Add providers in priority order (flatrate first, then rent, then buy)
      addProviders(regionData.flatrate, 'flatrate');
      addProviders(regionData.rent, 'rent');
      addProviders(regionData.buy, 'buy');

      return providers;
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
   * Get detailed information for a movie
   */
  async getMovieDetails(tmdbId: number, language: string = 'fr-FR'): Promise<DetailedInfo | null> {
    try {
      const data = await this.makeRequest<{
        genres: Genre[];
        runtime: number | null;
        release_date: string;
        tagline: string;
      }>(`/movie/${tmdbId}`, { language });

      const releaseYear = data.release_date ? new Date(data.release_date).getFullYear() : undefined;

      return {
        genres: data.genres || [],
        runtime: data.runtime || undefined,
        release_year: releaseYear,
        tagline: data.tagline || undefined,
      };
    } catch (error) {
      console.error(`❌ Failed to get movie details for ID ${tmdbId}:`, error);
      return null;
    }
  }

  /**
   * Get detailed information for a TV show
   */
  async getTVDetails(tmdbId: number, language: string = 'fr-FR'): Promise<DetailedInfo | null> {
    try {
      const data = await this.makeRequest<{
        genres: Genre[];
        number_of_seasons: number;
        number_of_episodes: number;
        episode_run_time: number[];
        status: string;
        first_air_date: string;
        tagline: string;
      }>(`/tv/${tmdbId}`, { language });

      const firstAirYear = data.first_air_date
        ? new Date(data.first_air_date).getFullYear()
        : undefined;
      const avgEpisodeRunTime =
        data.episode_run_time && data.episode_run_time.length > 0
          ? Math.round(
              data.episode_run_time.reduce((a, b) => a + b, 0) / data.episode_run_time.length
            )
          : undefined;

      return {
        genres: data.genres || [],
        number_of_seasons: data.number_of_seasons,
        number_of_episodes: data.number_of_episodes,
        episode_run_time: avgEpisodeRunTime,
        status: data.status,
        first_air_year: firstAirYear,
        tagline: data.tagline || undefined,
      };
    } catch (error) {
      console.error(`❌ Failed to get TV details for ID ${tmdbId}:`, error);
      return null;
    }
  }

  /**
   * Get credits (cast) for a movie or TV show
   */
  async getCredits(
    tmdbId: number,
    mediaType: 'movie' | 'tv',
    language: string = 'fr-FR'
  ): Promise<Cast[]> {
    try {
      const endpoint = `/${mediaType}/${tmdbId}/credits`;
      const data = await this.makeRequest<{
        cast: Array<{
          id: number;
          name: string;
          character: string;
          profile_path: string | null;
          order: number;
        }>;
      }>(endpoint, { language });

      if (!data.cast || data.cast.length === 0) {
        return [];
      }

      // Return top 10 cast members sorted by order
      return data.cast
        .sort((a, b) => a.order - b.order)
        .slice(0, 10)
        .map((actor) => ({
          id: actor.id,
          name: actor.name,
          character: actor.character,
          profile_path: actor.profile_path,
        }));
    } catch (error) {
      console.error(`❌ Failed to get credits for ${mediaType} ${tmdbId}:`, error);
      return [];
    }
  }

  /**
   * Get detailed info and credits for multiple movies/TV shows in parallel
   */
  async getBatchDetailsAndCredits(
    items: MovieResult[],
    language: string = 'fr-FR'
  ): Promise<{
    credits: { [key: number]: Cast[] };
    detailedInfo: { [key: number]: DetailedInfo };
  }> {
    const credits: { [key: number]: Cast[] } = {};
    const detailedInfo: { [key: number]: DetailedInfo } = {};

    const promises = items.map(async (item) => {
      // Fetch details and credits in parallel for each item
      const [details, cast] = await Promise.all([
        item.media_type === 'movie'
          ? this.getMovieDetails(item.tmdb_id, language)
          : this.getTVDetails(item.tmdb_id, language),
        this.getCredits(item.tmdb_id, item.media_type, language),
      ]);

      if (details) {
        detailedInfo[item.tmdb_id] = details;
      }
      if (cast.length > 0) {
        credits[item.tmdb_id] = cast;
      }
    });

    await Promise.all(promises);

    console.log(
      `📊 Fetched details for ${Object.keys(detailedInfo).length} items, credits for ${Object.keys(credits).length} items`
    );

    return { credits, detailedInfo };
  }

  /**
   * Get list of available streaming providers for a country
   * Returns providers sorted by popularity (display_priority)
   */
  async getAvailableProviders(country: string = 'FR'): Promise<AvailableProvider[]> {
    try {
      // TMDB provides a list of all available watch providers
      const data = await this.makeRequest<{
        results: Array<{
          provider_id: number;
          provider_name: string;
          logo_path: string;
          display_priorities: { [country: string]: number };
        }>;
      }>('/watch/providers/movie', {
        watch_region: country,
      });

      if (!data.results || data.results.length === 0) {
        return [];
      }

      // Filter to only include providers available in the specified country
      // and sort by display priority
      return data.results
        .filter((provider) => provider.display_priorities && provider.display_priorities[country])
        .sort(
          (a, b) => (a.display_priorities[country] || 999) - (b.display_priorities[country] || 999)
        )
        .map((provider) => ({
          provider_id: provider.provider_id,
          provider_name: provider.provider_name,
          logo_path: provider.logo_path,
          display_priorities: provider.display_priorities,
        }));
    } catch (error) {
      console.error(`❌ Failed to get available providers for ${country}:`, error);
      return [];
    }
  }
}

// Export singleton instance
export const tmdb = new TMDBService();
