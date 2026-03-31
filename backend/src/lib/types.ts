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
  reason?: string; // AI-generated personalized reason for recommending this title
  matchScore?: number; // 0-100 affinity score based on user taste profile
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

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  profile_path: string | null;
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
  poster_path?: string;
  // Movie-specific enriched fields
  budget?: number;
  revenue?: number;
  production_companies?: Array<{ id: number; name: string; logo_path: string | null }>;
  production_countries?: Array<{ iso_3166_1: string; name: string }>;
  original_language?: string;
  original_title?: string;
  imdb_id?: string;
  spoken_languages?: Array<{ english_name: string; iso_639_1: string; name: string }>;
  belongs_to_collection?: { id: number; name: string; poster_path: string | null } | null;
  // TV-specific enriched fields
  created_by?: Array<{ id: number; name: string; profile_path: string | null }>;
  networks?: Array<{ id: number; name: string; logo_path: string | null }>;
  origin_country?: string[];
  last_episode_to_air?: { episode_number: number; season_number: number; name: string; air_date: string } | null;
  next_episode_to_air?: { episode_number: number; season_number: number; name: string; air_date: string } | null;
  in_production?: boolean;
}

export interface SearchResponse {
  recommendations: MovieResult[];
  streamingProviders: { [key: number]: StreamingProvider[] };
  credits: { [key: number]: { cast: Cast[]; crew: CrewMember[] } };
  detailedInfo: { [key: number]: DetailedInfo };
  conversationalResponse: string;
  totalResults: number;
  conversationHistory?: ConversationMessage[];
  isFallback?: boolean;
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
  reasons: string[]; // Personalized reasons per recommendation (same index)
  conversationalResponse: string;
  detectedPlatforms: string[]; // Detected streaming platforms from query
  isFallback?: boolean; // True when AI failed and fallback response is returned
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface UserContext {
  favoriteGenres?: string[];
  dislikedGenres?: string[];
  favoriteDecades?: string[];
  ratedMovies?: Array<{ title: string; rating: number }>;
  recentSearches?: string[];
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
  deleted_at: string | null;
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
  watched: boolean;
  watched_at: string | null;
  user_rating: number | null;
  user_note: string | null;
}

export interface AddToWatchlistRequest {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  providers: StreamingProvider[];
  country: string;
}

// ============================================================================
// Quota Types
// ============================================================================

export interface UserQuota {
  user_id: string;
  date: string;
  search_count: number;
  watchlist_additions: number;
}

export interface QuotaLimits {
  searches: number; // -1 means unlimited
  watchlistAdditions: number; // -1 means unlimited
}

export const FREE_TIER_LIMITS: QuotaLimits = {
  searches: 3, // per week
  watchlistAdditions: 5, // per day
};

export const PREMIUM_LIMITS: QuotaLimits = {
  searches: -1,
  watchlistAdditions: -1,
};

// ============================================================================
// Search History Types
// ============================================================================

export interface SearchHistoryEntry {
  id: number;
  user_id: string;
  query: string;
  results_count: number;
  created_at: string;
}

// ============================================================================
// Taste Profile Types
// ============================================================================

export interface RatedMovie {
  tmdb_id: number;
  rating: number;
  title: string;
  media_type?: 'movie' | 'tv';
  poster_path?: string;
}

export interface FavoriteActor {
  tmdb_id: number;
  name: string;
  profile_path?: string;
  known_for_department?: string;
}

export interface UserTasteProfile {
  user_id: string;
  favorite_genres: string[];
  disliked_genres: string[];
  favorite_decades: string[];
  rated_movies: RatedMovie[];
  favorite_actors: FavoriteActor[];
}

// ============================================================================
// Trending / Home Types
// ============================================================================

export interface TrendingItem {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  media_type: 'movie' | 'tv';
  genre_ids?: number[];
  providers?: { provider_name: string; logo_path: string }[];
}

export interface DailyPick {
  tmdb_id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  media_type: 'movie' | 'tv';
  genres: Genre[];
  providers: StreamingProvider[];
}

export interface HomeResponse {
  dailyPick: DailyPick | null;
  trending: TrendingItem[];
  recentSearches: SearchHistoryEntry[];
  quota: {
    used: number;
    limit: number;
    isPremium: boolean;
  };
}

export interface UserStats {
  totalSearches: number;
  watchlistCount: number;
  watchedCount: number;
  memberSince: string;
  currentStreak: number;
  longestStreak: number;
}

export interface TMDBTrendingResponse {
  page: number;
  results: (TMDBMovie | TMDBTVShow)[];
  total_pages: number;
  total_results: number;
}
