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

export interface SearchResponse {
  recommendations: MovieResult[];
  streamingProviders: { [key: number]: StreamingProvider[] };
  conversationalResponse: string;
  totalResults: number;
}

export interface StreamingProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

// ============================================================================
// Database Types
// ============================================================================

export interface Subscription {
  device_id: string;
  revenuecat_user_id: string | null;
  status: 'active' | 'expired' | 'cancelled' | 'billing_issue';
  expires_at: string | null;
  product_id: string | null;
  created_at: string;
  last_updated: string;
}

export interface PromptLog {
  id?: number;
  device_id: string;
  query: string | null;
  results_count: number | null;
  created_at?: string;
  response_time_ms: number | null;
}

export interface BlockedDevice {
  device_id: string;
  reason: string | null;
  blocked_at: string;
  blocked_until: string | null;
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
// Trial Types
// ============================================================================

export interface TrialInfo {
  isActive: boolean;
  daysRemaining: number;
  startsAt: string | null;
  endsAt: string | null;
  used: boolean;
}
