/**
 * Backend API Service
 * Handles all communication with the FastFlix backend API
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { deviceIdentityService } from './deviceIdentity.service';
import { APIResponse, APIError } from '@/types/api';

// Types matching backend API
export interface SearchRequest {
  deviceId: string;
  query: string;
  includeMovies: boolean;
  includeTvShows: boolean;
  platform: 'ios' | 'android';
  appVersion: string;
  language?: string;
  country?: string;
  isProUser?: boolean; // Subscription status from RevenueCat
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
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
  popularity: number;
  adult?: boolean;
}

export interface SearchResponse {
  recommendations: MovieResult[];
  conversationalResponse: string;
  promptsRemaining: number;
  isProUser: boolean;
  totalResults: number;
}

export interface CheckLimitResponse {
  canMakePrompt: boolean;
  promptsUsed: number;
  promptsRemaining: number;
  maxFreePrompts: number;
  isProUser: boolean;
  reason?: string;
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

    console.log('Backend API configured with URL:', this.baseUrl);
  }

  /**
   * Get current app version
   */
  private getAppVersion(): string {
    return Constants.expoConfig?.version || '1.0.0';
  }

  /**
   * Get current platform
   */
  private getPlatform(): 'ios' | 'android' {
    return Platform.OS === 'ios' ? 'ios' : 'android';
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

      console.log(`Making request to: ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        return {
          success: false,
          data: {} as T,
          error: {
            code: `HTTP_${response.status}`,
            message:
              errorData.error?.message ||
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
   */
  async search(params: {
    query: string;
    includeMovies: boolean;
    includeTvShows: boolean;
    language?: string;
    country?: string;
  }): Promise<APIResponse<SearchResponse>> {
    try {
      // Get device ID
      const deviceIdResult = await deviceIdentityService.getDeviceId();

      if (!deviceIdResult.success || !deviceIdResult.data) {
        return {
          success: false,
          data: {
            recommendations: [],
            conversationalResponse: '',
            promptsRemaining: 0,
            isProUser: false,
            totalResults: 0,
          },
          error: {
            code: 'DEVICE_ID_ERROR',
            message: 'Failed to get device ID',
          },
        };
      }

      const requestBody: SearchRequest = {
        deviceId: deviceIdResult.data,
        query: params.query,
        includeMovies: params.includeMovies,
        includeTvShows: params.includeTvShows,
        platform: this.getPlatform(),
        appVersion: this.getAppVersion(),
        language: params.language || 'fr-FR',
        country: params.country || 'FR',
      };

      console.log('Search request:', requestBody);

      return await this.makeRequest<SearchResponse>('/api/search', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
    } catch (error) {
      console.error('Search error:', error);

      return {
        success: false,
        data: {
          recommendations: [],
          conversationalResponse: '',
          promptsRemaining: 0,
          isProUser: false,
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
   * Check remaining prompt limit
   */
  async checkLimit(): Promise<APIResponse<CheckLimitResponse>> {
    try {
      // Get device ID
      const deviceIdResult = await deviceIdentityService.getDeviceId();

      if (!deviceIdResult.success || !deviceIdResult.data) {
        return {
          success: false,
          data: {
            canMakePrompt: false,
            promptsUsed: 0,
            promptsRemaining: 0,
            maxFreePrompts: 3,
            isProUser: false,
          },
          error: {
            code: 'DEVICE_ID_ERROR',
            message: 'Failed to get device ID',
          },
        };
      }

      const requestBody = {
        deviceId: deviceIdResult.data,
        platform: this.getPlatform(),
      };

      return await this.makeRequest<CheckLimitResponse>('/api/check-limit', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
    } catch (error) {
      console.error('Check limit error:', error);

      return {
        success: false,
        data: {
          canMakePrompt: false,
          promptsUsed: 0,
          promptsRemaining: 0,
          maxFreePrompts: 3,
          isProUser: false,
        },
        error: {
          code: 'CHECK_LIMIT_ERROR',
          message: 'Failed to check prompt limit',
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
}

// Export singleton instance
export const backendAPIService = new BackendAPIService();
