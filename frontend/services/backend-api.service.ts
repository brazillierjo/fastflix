/**
 * Backend API Service
 * Handles all communication with the FastFlix backend API
 */

import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { APIResponse, APIError, TrialInfo } from '@/types/api';

// Storage key for auth token
const AUTH_TOKEN_KEY = 'fastflix_auth_token';

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
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
  popularity: number;
  adult?: boolean;
}

export interface StreamingProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

export interface SearchResponse {
  recommendations: MovieResult[];
  streamingProviders: { [key: number]: StreamingProvider[] };
  conversationalResponse: string;
  totalResults: number;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  database: string;
  ai: string;
}

class BackendAPIService {
  private baseUrl: string;
  private timeout: number = 30000; // 30 seconds

  constructor() {
    // Get API URL from environment
    const apiUrl = Constants.expoConfig?.extra?.API_URL;

    if (!apiUrl) {
      console.warn('API_URL not configured, using default');
      this.baseUrl = __DEV__
        ? 'http://localhost:3000'
        : 'https://fastflix-api.vercel.app';
    } else {
      this.baseUrl = apiUrl;
    }
  }

  /**
   * Make a request to the backend API
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;

      // Get auth token if available
      const authToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);

      // Build headers with auth token if available
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      // Merge with provided headers
      if (options.headers) {
        Object.assign(headers, options.headers);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle 401 Unauthorized - token expired or invalid
        if (response.status === 401) {
          console.warn(
            '⚠️ 401 Unauthorized - Token expired or invalid. Clearing auth data.'
          );
          // Clear auth token and user data
          await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
          await SecureStore.deleteItemAsync('fastflix_user_data');

          // Note: The app will detect the missing token and show login screen
          // This is handled by AuthContext checking getCurrentUser() on mount
        }

        return {
          success: false,
          data: {} as T,
          error: {
            code: `HTTP_${response.status}`,
            message:
              errorData.error?.message ||
              errorData.error ||
              `Request failed with status ${response.status}`,
            details: errorData,
          },
        };
      }

      const data = await response.json();

      // Handle backend API response format
      if (data.success === false) {
        return {
          success: false,
          data: {} as T,
          error: data.error || {
            code: 'API_ERROR',
            message: 'Request failed',
          },
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      console.error(`API request failed:`, error);

      let errorCode = 'NETWORK_ERROR';
      let errorMessage = 'Network request failed';

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorCode = 'TIMEOUT';
          errorMessage = 'Request timeout - please check your connection';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        data: {} as T,
        error: {
          code: errorCode,
          message: errorMessage,
          details: { originalError: (error as Error).message },
        },
      };
    }
  }

  /**
   * Search for movies/TV shows using AI recommendations
   * Requires authentication - JWT token must be present
   */
  async search(params: {
    query: string;
    includeMovies: boolean;
    includeTvShows: boolean;
    language?: string;
    country?: string;
  }): Promise<APIResponse<SearchResponse>> {
    try {
      // Authentication is now required - no deviceId needed
      // JWT token is automatically included by makeRequest()
      const requestBody = {
        query: params.query,
        includeMovies: params.includeMovies,
        includeTvShows: params.includeTvShows,
        language: params.language || 'fr-FR',
        country: params.country || 'FR',
      };

      return await this.makeRequest<SearchResponse>('/api/search', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
    } catch (error) {
      return {
        success: false,
        data: {
          recommendations: [],
          streamingProviders: {},
          conversationalResponse: '',
          totalResults: 0,
        },
        error: {
          code: 'SEARCH_ERROR',
          message: 'Failed to execute search',
          details: { error: (error as Error).message },
        },
      };
    }
  }

  /**
   * Health check to verify backend is available
   */
  async healthCheck(): Promise<APIResponse<HealthCheckResponse>> {
    try {
      return await this.makeRequest<HealthCheckResponse>('/api/health', {
        method: 'GET',
      });
    } catch (error) {
      return {
        success: false,
        data: {
          status: 'error',
          timestamp: new Date().toISOString(),
          database: 'unknown',
          ai: 'unknown',
        },
        error: {
          code: 'HEALTH_CHECK_ERROR',
          message: 'Backend health check failed',
          details: { error: (error as Error).message },
        },
      };
    }
  }

  /**
   * Get the configured base URL (for debugging)
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  // ==========================================================================
  // Authentication Methods
  // ==========================================================================

  /**
   * Sign in with Apple
   */
  async signInWithApple(data: {
    identityToken: string;
    user?: {
      email?: string;
      name?: {
        firstName?: string;
        lastName?: string;
      };
    };
  }): Promise<APIResponse<{ user: any; token: string }>> {
    return await this.makeRequest('/api/auth/apple', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get current authenticated user with subscription and trial status
   */
  async getCurrentUser(): Promise<
    APIResponse<{
      user: any;
      subscription: { isActive: boolean };
      trial: TrialInfo;
    }>
  > {
    return await this.makeRequest('/api/auth/me', {
      method: 'GET',
    });
  }

  // ==========================================================================
  // Trial Methods
  // ==========================================================================

  /**
   * Start free trial for authenticated user
   */
  async startFreeTrial(): Promise<
    APIResponse<{
      success: boolean;
      message: string;
      trial: TrialInfo;
    }>
  > {
    return await this.makeRequest('/api/trial', {
      method: 'POST',
    });
  }

  /**
   * Get trial status for authenticated user
   */
  async getTrialStatus(): Promise<APIResponse<{ trial: TrialInfo }>> {
    return await this.makeRequest('/api/trial', {
      method: 'GET',
    });
  }
}

// Export singleton instance
export const backendAPIService = new BackendAPIService();
