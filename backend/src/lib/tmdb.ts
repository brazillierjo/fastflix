/**
 * FastFlix Backend - TMDB Service
 * Handles all TMDB API interactions and enriches AI recommendations
 */

import type {
  MovieResult,
  TMDBSearchResponse,
  TMDBTrendingResponse,
  TMDBMovie,
  TMDBTVShow,
  TMDBWatchProviderResponse,
  StreamingProvider,
  Cast,
  CrewMember,
  DetailedInfo,
  Genre,
  AvailableProvider,
  TrendingItem,
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
  private requestCount = 0;
  private cleanupInterval = 100; // Clean expired entries every N requests

  constructor() {
    this.baseUrl = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
    this.apiKey = '';
  }

  private getApiKey(): string {
    if (!this.apiKey) {
      this.apiKey = process.env.TMDB_API_KEY || '';
      if (!this.apiKey) {
        throw new Error('TMDB_API_KEY not found in environment variables');
      }
    }
    return this.apiKey;
  }

  /**
   * Remove expired entries from the cache to prevent memory leaks
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    this.cache.forEach((cached, key) => {
      if (now - cached.timestamp >= this.cacheTTL) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Make a request to TMDB API (also used by route handlers for discover queries)
   */
  async makePublicRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    return this.makeRequest<T>(endpoint, params);
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    // Periodically clean expired cache entries
    this.requestCount++;
    if (this.requestCount % this.cleanupInterval === 0) {
      this.cleanExpiredCache();
    }

    const cacheKey = `${endpoint}?${new URLSearchParams(params).toString()}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data as T;
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.append('api_key', this.getApiKey());

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }

    try {
      const response = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });

      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Store in cache
      this.cache.set(cacheKey, { data, timestamp: Date.now() });

      return data as T;
    } catch (error) {
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
    } catch {
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
    } catch {
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
    } catch {
      return null;
    }
  }

  /**
   * Search for movies, TV shows, AND actors (returns multiple results)
   */
  async searchMultiAll(
    query: string,
    language: string = 'fr-FR',
    limit: number = 10
  ): Promise<Array<{
    id: number;
    media_type: 'movie' | 'tv' | 'person';
    title: string;
    poster_path: string | null;
    profile_path?: string | null;
    vote_average?: number;
    release_date?: string;
    first_air_date?: string;
    known_for_department?: string;
  }>> {
    try {
      const data = await this.makeRequest<{
        results: Array<{
          id: number;
          media_type: 'movie' | 'tv' | 'person';
          title?: string;
          name?: string;
          poster_path?: string | null;
          profile_path?: string | null;
          vote_average?: number;
          release_date?: string;
          first_air_date?: string;
          known_for_department?: string;
        }>;
      }>('/search/multi', {
        query,
        language,
        include_adult: 'false',
      });

      if (!data.results) return [];

      return data.results
        .filter(r => r.media_type === 'movie' || r.media_type === 'tv' || r.media_type === 'person')
        .slice(0, limit)
        .map(r => ({
          id: r.id,
          media_type: r.media_type,
          title: r.title || r.name || '',
          poster_path: r.poster_path || null,
          profile_path: r.media_type === 'person' ? (r.profile_path || null) : undefined,
          vote_average: r.vote_average,
          release_date: r.release_date,
          first_air_date: r.first_air_date,
          known_for_department: r.known_for_department,
        }));
    } catch {
      return [];
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
   * Processes titles in batches of 5 for controlled parallelism
   */
  async enrichRecommendations(
    titles: string[],
    includeMovies: boolean,
    includeTvShows: boolean,
    language: string = 'fr-FR'
  ): Promise<MovieResult[]> {
    const enrichedResults: MovieResult[] = [];
    const errors: string[] = [];
    const BATCH_SIZE = 5;
    const startTime = Date.now();

    // Process titles in batches of 5 for controlled parallelism
    for (let i = 0; i < titles.length; i += BATCH_SIZE) {
      const batch = titles.slice(i, i + BATCH_SIZE);
      const batchStart = Date.now();

      const batchResults = await Promise.all(
        batch.map(async (title) => {
          try {
            let tmdbResult: (TMDBMovie | TMDBTVShow) | null = null;

            // Search based on content type preferences
            if (includeMovies && includeTvShows) {
              tmdbResult = await this.searchMulti(title, language);
            } else if (includeMovies) {
              tmdbResult = await this.searchMovieByTitle(title, language);
            } else if (includeTvShows) {
              tmdbResult = await this.searchTVByTitle(title, language);
            }

            if (tmdbResult) {
              return this.convertToMovieResult(tmdbResult);
            } else {
              errors.push(title);
              return null;
            }
          } catch {
            errors.push(title);
            return null;
          }
        })
      );

      console.log(`📦 TMDB batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(titles.length / BATCH_SIZE)} enriched in ${Date.now() - batchStart}ms`);

      // Collect results from this batch
      for (const result of batchResults) {
        if (result) {
          enrichedResults.push(result);
        }
      }
    }

    // Deduplicate by tmdb_id
    const seenIds = new Set<number>();
    const deduplicated: MovieResult[] = [];
    for (const result of enrichedResults) {
      if (!seenIds.has(result.tmdb_id)) {
        seenIds.add(result.tmdb_id);
        deduplicated.push(result);
      }
    }

    console.log(`📦 TMDB enrichment complete: ${deduplicated.length} results in ${Date.now() - startTime}ms (${errors.length} failures)`);
    return deduplicated;
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
    } catch {
      return [];
    }
  }

  /**
   * Get watch providers for multiple movies/TV shows in parallel batches of 5
   */
  async getBatchWatchProviders(
    items: MovieResult[],
    country: string = 'FR'
  ): Promise<{ [key: number]: StreamingProvider[] }> {
    const result: { [key: number]: StreamingProvider[] } = {};
    const BATCH_SIZE = 5;

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (item) => {
          const providers = await this.getWatchProviders(item.tmdb_id, item.media_type, country);
          if (providers.length > 0) {
            result[item.tmdb_id] = providers;
          }
        })
      );
    }

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
        budget: number;
        revenue: number;
        poster_path: string | null;
        production_companies: Array<{ id: number; name: string; logo_path: string | null }>;
        production_countries: Array<{ iso_3166_1: string; name: string }>;
        original_language: string;
        original_title: string;
        imdb_id: string | null;
        spoken_languages: Array<{ english_name: string; iso_639_1: string; name: string }>;
        belongs_to_collection: { id: number; name: string; poster_path: string | null; backdrop_path: string | null } | null;
      }>(`/movie/${tmdbId}`, { language });

      const releaseYear = data.release_date ? new Date(data.release_date).getFullYear() : undefined;

      return {
        genres: data.genres || [],
        runtime: data.runtime || undefined,
        release_year: releaseYear,
        tagline: data.tagline || undefined,
        poster_path: data.poster_path || undefined,
        budget: data.budget || undefined,
        revenue: data.revenue || undefined,
        production_companies: data.production_companies?.map(c => ({ id: c.id, name: c.name, logo_path: c.logo_path })) || undefined,
        production_countries: data.production_countries || undefined,
        original_language: data.original_language || undefined,
        original_title: data.original_title || undefined,
        imdb_id: data.imdb_id || undefined,
        spoken_languages: data.spoken_languages || undefined,
        belongs_to_collection: data.belongs_to_collection
          ? { id: data.belongs_to_collection.id, name: data.belongs_to_collection.name, poster_path: data.belongs_to_collection.poster_path }
          : null,
      };
    } catch {
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
        poster_path: string | null;
        created_by: Array<{ id: number; name: string; profile_path: string | null }>;
        networks: Array<{ id: number; name: string; logo_path: string | null }>;
        original_language: string;
        origin_country: string[];
        last_episode_to_air: { episode_number: number; season_number: number; name: string; air_date: string } | null;
        next_episode_to_air: { episode_number: number; season_number: number; name: string; air_date: string } | null;
        in_production: boolean;
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
        poster_path: data.poster_path || undefined,
        created_by: data.created_by?.map(c => ({ id: c.id, name: c.name, profile_path: c.profile_path })) || undefined,
        networks: data.networks?.map(n => ({ id: n.id, name: n.name, logo_path: n.logo_path })) || undefined,
        original_language: data.original_language || undefined,
        origin_country: data.origin_country || undefined,
        last_episode_to_air: data.last_episode_to_air
          ? { episode_number: data.last_episode_to_air.episode_number, season_number: data.last_episode_to_air.season_number, name: data.last_episode_to_air.name, air_date: data.last_episode_to_air.air_date }
          : null,
        next_episode_to_air: data.next_episode_to_air
          ? { episode_number: data.next_episode_to_air.episode_number, season_number: data.next_episode_to_air.season_number, name: data.next_episode_to_air.name, air_date: data.next_episode_to_air.air_date }
          : null,
        in_production: data.in_production,
      };
    } catch {
      return null;
    }
  }

  /**
   * Key crew jobs to extract from credits
   */
  private static KEY_CREW_JOBS = new Set(['Director', 'Writer', 'Screenplay', 'Creator', 'Executive Producer']);

  /**
   * Get credits (cast and key crew) for a movie or TV show
   */
  async getCredits(
    tmdbId: number,
    mediaType: 'movie' | 'tv',
    language: string = 'fr-FR'
  ): Promise<{ cast: Cast[]; crew: CrewMember[] }> {
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
        crew: Array<{
          id: number;
          name: string;
          job: string;
          profile_path: string | null;
        }>;
      }>(endpoint, { language });

      // Return top 10 cast members sorted by order
      const cast = (data.cast || [])
        .sort((a, b) => a.order - b.order)
        .slice(0, 10)
        .map((actor) => ({
          id: actor.id,
          name: actor.name,
          character: actor.character,
          profile_path: actor.profile_path,
        }));

      // Extract key crew members (Director, Writer, Screenplay, Creator, Executive Producer), limit to 5
      const seenCrewIds = new Set<number>();
      const crew: CrewMember[] = [];
      for (const member of data.crew || []) {
        if (TMDBService.KEY_CREW_JOBS.has(member.job) && !seenCrewIds.has(member.id) && crew.length < 5) {
          seenCrewIds.add(member.id);
          crew.push({
            id: member.id,
            name: member.name,
            job: member.job,
            profile_path: member.profile_path,
          });
        }
      }

      return { cast, crew };
    } catch {
      return { cast: [], crew: [] };
    }
  }

  /**
   * Get detailed info and credits for multiple movies/TV shows in parallel batches of 5
   * Each item fetches its details + credits in parallel, and items are processed in batches
   */
  async getBatchDetailsAndCredits(
    items: MovieResult[],
    language: string = 'fr-FR'
  ): Promise<{
    credits: { [key: number]: { cast: Cast[]; crew: CrewMember[] } };
    detailedInfo: { [key: number]: DetailedInfo };
  }> {
    const credits: { [key: number]: { cast: Cast[]; crew: CrewMember[] } } = {};
    const detailedInfo: { [key: number]: DetailedInfo } = {};
    const BATCH_SIZE = 5;

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (item) => {
          // Fetch details and credits in parallel for each item
          const [details, creditsResult] = await Promise.all([
            item.media_type === 'movie'
              ? this.getMovieDetails(item.tmdb_id, language)
              : this.getTVDetails(item.tmdb_id, language),
            this.getCredits(item.tmdb_id, item.media_type, language),
          ]);

          if (details) {
            detailedInfo[item.tmdb_id] = details;
          }
          if (creditsResult.cast.length > 0 || creditsResult.crew.length > 0) {
            credits[item.tmdb_id] = creditsResult;
          }
        })
      );
    }

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
    } catch {
      return [];
    }
  }
  /**
   * Get trending movies and TV shows for the week
   */
  async getTrending(language: string = 'fr-FR'): Promise<TrendingItem[]> {
    try {
      const data = await this.makeRequest<TMDBTrendingResponse>('/trending/all/week', {
        language,
      });

      if (!data.results || data.results.length === 0) {
        return [];
      }

      return data.results
        .filter(
          (item): item is TMDBMovie | TMDBTVShow =>
            item.media_type === 'movie' || item.media_type === 'tv'
        )
        .map((item) => {
          const isMovie = 'title' in item;
          return {
            tmdb_id: item.id,
            title: isMovie ? (item as TMDBMovie).title : (item as TMDBTVShow).name,
            poster_path: item.poster_path,
            vote_average: item.vote_average || 0,
            media_type: (isMovie ? 'movie' : 'tv') as 'movie' | 'tv',
            genre_ids: item.genre_ids || [],
          };
        });
    } catch {
      return [];
    }
  }

  /**
   * Discover movies or TV shows by genre IDs
   * Uses TMDB /discover endpoint with genre filtering and vote count minimum
   */
  async discoverByGenres(
    genreIds: number[],
    mediaType: 'movie' | 'tv',
    page: number = 1,
    language: string = 'fr-FR'
  ): Promise<(TMDBMovie | TMDBTVShow)[]> {
    try {
      const params: Record<string, string> = {
        with_genres: genreIds.join(','),
        sort_by: 'vote_average.desc',
        'vote_count.gte': '100',
        page: String(page),
        include_adult: 'false',
        language,
      };

      const data = await this.makeRequest<TMDBSearchResponse>(
        `/discover/${mediaType}`,
        params
      );

      if (!data.results || data.results.length === 0) {
        return [];
      }

      return data.results.map((item) => ({
        ...item,
        media_type: mediaType,
      })) as (TMDBMovie | TMDBTVShow)[];
    } catch {
      return [];
    }
  }

  /**
   * Get similar movies or TV shows
   */
  async getSimilar(
    tmdbId: number,
    mediaType: 'movie' | 'tv',
    language: string = 'fr-FR'
  ): Promise<MovieResult[]> {
    try {
      const data = await this.makeRequest<TMDBSearchResponse>(
        `/${mediaType}/${tmdbId}/similar`,
        { language }
      );

      if (!data.results || data.results.length === 0) {
        return [];
      }

      return data.results.slice(0, 10).map((item) => {
        const isMovie = mediaType === 'movie';
        const movie = item as TMDBMovie;
        const tv = item as TMDBTVShow;

        return {
          tmdb_id: item.id,
          title: isMovie ? movie.title : tv.name,
          original_title: isMovie ? movie.original_title : tv.original_name,
          media_type: mediaType,
          overview: item.overview || '',
          poster_path: item.poster_path,
          backdrop_path: item.backdrop_path,
          vote_average: item.vote_average || 0,
          vote_count: item.vote_count || 0,
          release_date: isMovie ? movie.release_date : undefined,
          first_air_date: !isMovie ? tv.first_air_date : undefined,
          genre_ids: item.genre_ids || [],
          popularity: item.popularity || 0,
        };
      });
    } catch {
      return [];
    }
  }

  /**
   * Get person details with movie and TV credits
   */
  async getPersonDetails(
    personId: number,
    language: string = 'fr-FR'
  ): Promise<{
    id: number;
    name: string;
    biography: string;
    birthday: string | null;
    deathday: string | null;
    place_of_birth: string | null;
    profile_path: string | null;
    known_for_department: string;
    also_known_as: string[];
    imdb_id: string | null;
    gender: number;
    movie_credits: Array<{
      id: number;
      title: string;
      poster_path: string | null;
      character: string;
      vote_average: number;
      release_date: string;
      media_type: 'movie';
    }>;
    tv_credits: Array<{
      id: number;
      name: string;
      poster_path: string | null;
      character: string;
      vote_average: number;
      first_air_date: string;
      media_type: 'tv';
    }>;
  } | null> {
    try {
      const data = await this.makeRequest<{
        id: number;
        name: string;
        biography: string;
        birthday: string | null;
        deathday: string | null;
        place_of_birth: string | null;
        profile_path: string | null;
        known_for_department: string;
        also_known_as: string[];
        imdb_id: string | null;
        gender: number;
        movie_credits: {
          cast: Array<{
            id: number;
            title: string;
            poster_path: string | null;
            character: string;
            vote_average: number;
            vote_count: number;
            popularity: number;
            release_date: string;
          }>;
        };
        tv_credits: {
          cast: Array<{
            id: number;
            name: string;
            poster_path: string | null;
            character: string;
            vote_average: number;
            vote_count: number;
            popularity: number;
            first_air_date: string;
          }>;
        };
      }>(`/person/${personId}`, {
        append_to_response: 'movie_credits,tv_credits',
        language,
      });

      const movieCredits = (data.movie_credits?.cast || [])
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 20)
        .map((credit) => ({
          id: credit.id,
          title: credit.title,
          poster_path: credit.poster_path,
          character: credit.character,
          vote_average: credit.vote_average || 0,
          release_date: credit.release_date || '',
          media_type: 'movie' as const,
        }));

      const tvCredits = (data.tv_credits?.cast || [])
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 20)
        .map((credit) => ({
          id: credit.id,
          name: credit.name,
          poster_path: credit.poster_path,
          character: credit.character,
          vote_average: credit.vote_average || 0,
          first_air_date: credit.first_air_date || '',
          media_type: 'tv' as const,
        }));

      return {
        id: data.id,
        name: data.name,
        biography: data.biography || '',
        birthday: data.birthday,
        deathday: data.deathday,
        place_of_birth: data.place_of_birth,
        profile_path: data.profile_path,
        known_for_department: data.known_for_department || '',
        also_known_as: data.also_known_as || [],
        imdb_id: data.imdb_id || null,
        gender: data.gender ?? 0,
        movie_credits: movieCredits,
        tv_credits: tvCredits,
      };
    } catch {
      return null;
    }
  }

  /**
   * Get full details for a movie or TV show (overview, backdrop, genres, etc.)
   */
  async getFullDetails(
    tmdbId: number,
    mediaType: 'movie' | 'tv',
    language: string = 'fr-FR'
  ): Promise<{
    overview: string;
    backdrop_path: string | null;
    poster_path: string | null;
    vote_average: number;
    genres: Genre[];
    title: string;
  } | null> {
    try {
      if (mediaType === 'movie') {
        const data = await this.makeRequest<
          TMDBMovie & { genres: Genre[] }
        >(`/movie/${tmdbId}`, { language });
        return {
          overview: data.overview || '',
          backdrop_path: data.backdrop_path,
          poster_path: data.poster_path,
          vote_average: data.vote_average || 0,
          genres: data.genres || [],
          title: data.title,
        };
      } else {
        const data = await this.makeRequest<
          TMDBTVShow & { genres: Genre[] }
        >(`/tv/${tmdbId}`, { language });
        return {
          overview: data.overview || '',
          backdrop_path: data.backdrop_path,
          poster_path: data.poster_path,
          vote_average: data.vote_average || 0,
          genres: data.genres || [],
          title: data.name,
        };
      }
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const tmdb = new TMDBService();
