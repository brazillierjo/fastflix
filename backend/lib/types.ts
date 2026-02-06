/**
 * FastFlix Backend - TypeScript Types
 * Shared types for API requests/responses and data models
 */

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface SearchRequest {
  deviceId: string;
  query: string;
  includeMovies: boolean;
  includeTvShows: boolean;
  platform: 'ios' | 'android';
  appVersion: string;
  language?: string; // 'fr-FR', 'en-US', etc.
  country?: string; // 'FR', 'US', etc.
}

export interface MovieResult {
  tmdb_id: number;
  title: string;
  original_title?: string;
  media_type: 'movie' | 'tv';
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  release_date?: string; // For movies
  first_air_date?: string; // For TV shows
  genre_ids: number[];
  popularity: number;
  adult?: boolean;
}

export interface Cast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface Genre {
  id: number;
  name: string;
}

export interface DetailedInfo {
  genres: Genre[];
  runtime?: number; // For movies (in minutes)
  release_year?: number; // For movies
  number_of_seasons?: number; // For TV shows
  number_of_episodes?: number; // For TV shows
  episode_run_time?: number; // For TV shows (average episode duration)
  status?: string; // For TV shows (Returning Series, Ended, etc.)
  first_air_year?: number; // For TV shows
  tagline?: string;
}

export interface SearchResponse {
  recommendations: MovieResult[];
  streamingProviders: { [key: number]: StreamingProvider[] };
  credits: { [key: number]: Cast[] };
  detailedInfo: { [key: number]: DetailedInfo };
  conversationalResponse: string;
  totalResults: number;
}

export interface StreamingProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
  availability_type: 'flatrate' | 'rent' | 'buy' | 'ads'; // How content is available
}

// ============================================================================
// Service Response Types
// ============================================================================

export interface AIRecommendationResult {
  recommendations: string[]; // Just titles from Gemini
  conversationalResponse: string;
  detectedPlatforms: string[]; // Detected streaming platforms from query
}

// ============================================================================
// Error Types
// ============================================================================

export interface APIError {
  code: string;
  message: string;
  details?: unknown;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
}

// ============================================================================
// TMDB Types
// ============================================================================

export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  release_date: string;
  genre_ids: number[];
  popularity: number;
  adult: boolean;
  media_type?: 'movie';
}

export interface TMDBTVShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  first_air_date: string;
  genre_ids: number[];
  popularity: number;
  media_type?: 'tv';
}

export interface TMDBSearchResponse {
  page: number;
  results: (TMDBMovie | TMDBTVShow)[];
  total_pages: number;
  total_results: number;
}

export interface TMDBWatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

export interface TMDBWatchProviderResponse {
  id: number;
  results: {
    [countryCode: string]: {
      link: string;
      flatrate?: TMDBWatchProvider[];
      rent?: TMDBWatchProvider[];
      buy?: TMDBWatchProvider[];
    };
  };
}

// ============================================================================
// Authentication Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  auth_provider: 'apple' | 'google';
  provider_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export interface AppleAuthRequest {
  identityToken: string;
  user?: {
    email?: string;
    name?: {
      firstName?: string;
      lastName?: string;
    };
  };
}

export interface GoogleAuthRequest {
  idToken: string;
}

// ============================================================================
// User Preferences Types
// ============================================================================

export interface UserPreferences {
  country: string;
  contentType: 'all' | 'movies' | 'tvshows';
  platforms: number[]; // TMDB provider IDs
  includeFlatrate: boolean; // Subscription-based
  includeRent: boolean; // Rental
  includeBuy: boolean; // Purchase
}

export interface AvailableProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priorities: { [country: string]: number };
}

// ============================================================================
// Watchlist Types
// ============================================================================

export interface WatchlistItem {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  added_at: string;
  last_provider_check: string | null;
  providers: StreamingProvider[];
  country: string;
}

export interface AddToWatchlistRequest {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  providers: StreamingProvider[];
  country: string;
}
