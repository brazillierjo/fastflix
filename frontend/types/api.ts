/**
 * Strict API Types for FastFlix
 */

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

// Subscription types
export interface SubscriptionInfo {
  isActive: boolean;
  status: 'active' | 'cancelled' | 'expired' | 'billing_issue' | null;
  productId: string | null;
  expiresAt: string | null;
  createdAt: string | null;
  willRenew: boolean;
}

// Watchlist types
export interface WatchlistItem {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  added_at: string;
  last_provider_check: string | null;
  providers: WatchlistProvider[];
  country: string;
}

export interface WatchlistProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
  availability_type: 'flatrate' | 'rent' | 'buy' | 'ads';
}

export interface AddToWatchlistParams {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  providers: WatchlistProvider[];
  country: string;
}

export interface WatchlistResponse {
  items: WatchlistItem[];
  count: number;
  mediaType: 'all' | 'movie' | 'tv';
}

export interface WatchlistCheckResponse {
  inWatchlist: boolean;
  itemId: string | null;
}

export interface WatchlistRefreshResponse {
  refreshed: number;
  total?: number;
  message: string;
}
