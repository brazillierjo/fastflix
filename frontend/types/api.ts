/**
 * Strict API Types for FastFlix
 * Normalized data structures for better type safety
 */

// Base entity types
export interface BaseEntity {
  id: number;
  createdAt?: string;
  updatedAt?: string;
}

// TMDB API Types
export interface TMDBMovie extends BaseEntity {
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  original_title: string;
  popularity: number;
  video: boolean;
  media_type: 'movie';
}

export interface TMDBTVShow extends BaseEntity {
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  origin_country: string[];
  original_language: string;
  original_name: string;
  popularity: number;
  media_type: 'tv';
}

export type TMDBSearchItem = TMDBMovie | TMDBTVShow;

export interface TMDBGenre extends BaseEntity {
  name: string;
}

export interface TMDBCast extends BaseEntity {
  name: string;
  character: string;
  profile_path: string | null;
  cast_id: number;
  credit_id: string;
  order: number;
}

export interface StreamingProvider extends BaseEntity {
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

// Normalized application types
export interface Movie extends BaseEntity {
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  voteAverage: number;
  voteCount: number;
  genres: Genre[];
  runtime?: number;
  releaseYear: number;
  mediaType: 'movie';
  tmdbId: number;
}

export interface TVShow extends BaseEntity {
  name: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  firstAirDate: string;
  voteAverage: number;
  voteCount: number;
  genres: Genre[];
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  status?: string;
  firstAirYear: number;
  mediaType: 'tv';
  tmdbId: number;
}

export type MediaItem = Movie | TVShow;

export interface Genre extends BaseEntity {
  name: string;
}

export interface Cast extends BaseEntity {
  name: string;
  character: string;
  profilePath: string | null;
  order: number;
}

// Normalized data structures
export interface NormalizedData<T extends BaseEntity> {
  entities: Record<number, T>;
  ids: number[];
}

export interface MovieSearchResult {
  movies: NormalizedData<MediaItem>;
  streamingProviders: NormalizedData<StreamingProvider>;
  cast: NormalizedData<Cast>;
  genres: NormalizedData<Genre>;
  geminiResponse: string;
  searchQuery: string;
  timestamp: number;
}

// API Response types
export interface APIResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: APIError;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Search types
export interface SearchParams {
  query: string;
  includeMovies: boolean;
  includeTvShows: boolean;
  language?: string;
  country?: string;
}

export interface SearchFilters {
  sortBy: 'release_date' | 'vote_average' | 'popularity';
  selectedProviders: Set<string>;
  genres: Set<number>;
  yearRange?: {
    start: number;
    end: number;
  };
}

// State types
export interface AppState {
  search: SearchState;
  movies: MovieState;
  subscription: SubscriptionState;
  user: UserState;
}

export interface SearchState {
  isSearching: boolean;
  currentQuery: string;
  results: MovieSearchResult | null;
  error: APIError | null;
  filters: SearchFilters;
}

export interface MovieState {
  expandedCards: Set<number>;
  favorites: Set<number>;
  watchlist: Set<number>;
}

export interface SubscriptionState {
  isSubscribed: boolean;
  isLoading: boolean;
  customerInfo: unknown; // Use unknown for RevenueCat types
  offerings: unknown; // Use unknown for RevenueCat types
}

// Trial types
export interface TrialInfo {
  isActive: boolean;
  daysRemaining: number;
  startsAt: string | null;
  endsAt: string | null;
  used: boolean;
}

export interface UserState {
  language: string;
  country: string;
  monthlyPromptCount: number;
  preferences: UserPreferences;
}

export interface UserPreferences {
  darkMode: boolean;
  notifications: boolean;
  autoPlay: boolean;
  dataUsage: 'low' | 'medium' | 'high';
}

// Action types for state management
export interface Action<T = unknown> {
  type: string;
  payload?: T;
}

// TMDB Raw API Response Types (to avoid using 'any')
export interface TMDBProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

// Utility types
export type EntityId = number | string;
export type MediaType = 'movie' | 'tv';
export type LoadingState = 'idle' | 'pending' | 'fulfilled' | 'rejected';

// Type guards
export const isMovie = (item: MediaItem): item is Movie => {
  return item.mediaType === 'movie';
};

export const isTVShow = (item: MediaItem): item is TVShow => {
  return item.mediaType === 'tv';
};

export const isTMDBMovie = (item: TMDBSearchItem): item is TMDBMovie => {
  return item.media_type === 'movie';
};

export const isTMDBTVShow = (item: TMDBSearchItem): item is TMDBTVShow => {
  return item.media_type === 'tv';
};
