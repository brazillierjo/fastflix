/**
 * Tests for Backend API Service
 * Tests HTTP client for all backend communication
 */

// Mock expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      API_URL: 'http://test-api.com',
    },
  },
}));

// Mock expo-secure-store
const mockSecureStore: Record<string, string> = {};
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn((key: string) =>
    Promise.resolve(mockSecureStore[key] || null)
  ),
  setItemAsync: jest.fn((key: string, value: string) => {
    mockSecureStore[key] = value;
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn((key: string) => {
    delete mockSecureStore[key];
    return Promise.resolve();
  }),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

import * as SecureStore from 'expo-secure-store';
import { backendAPIService } from '@/services/backend-api.service';

describe('BackendAPIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear mock store
    Object.keys(mockSecureStore).forEach(key => delete mockSecureStore[key]);
  });

  describe('Configuration', () => {
    it('should use API URL from config', () => {
      expect(backendAPIService.getBaseUrl()).toBe('http://test-api.com');
    });
  });

  describe('Authentication Headers', () => {
    it('should include auth token when available', async () => {
      mockSecureStore['fastflix_auth_token'] = 'test-jwt-token';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} }),
      });

      await backendAPIService.healthCheck();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-jwt-token',
          }),
        })
      );
    });

    it('should not include auth header when no token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} }),
      });

      await backendAPIService.healthCheck();

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers.Authorization).toBeUndefined();
    });
  });

  describe('healthCheck', () => {
    it('should return health data on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              status: 'healthy',
              timestamp: '2024-01-01T00:00:00Z',
              database: 'connected',
              ai: 'connected',
            },
          }),
      });

      const result = await backendAPIService.healthCheck();

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('healthy');
    });

    it('should handle health check failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: () => Promise.resolve({ error: 'Service unavailable' }),
      });

      const result = await backendAPIService.healthCheck();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('HTTP_503');
    });
  });

  describe('search', () => {
    it('should make POST request with search parameters', async () => {
      mockSecureStore['fastflix_auth_token'] = 'test-token';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              recommendations: [],
              streamingProviders: {},
              credits: {},
              detailedInfo: {},
              conversationalResponse: 'Test response',
              totalResults: 0,
            },
          }),
      });

      await backendAPIService.search({
        query: 'action movies',
        includeMovies: true,
        includeTvShows: false,
        language: 'fr-FR',
        country: 'FR',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/api/search',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            query: 'action movies',
            includeMovies: true,
            includeTvShows: false,
            language: 'fr-FR',
            country: 'FR',
          }),
        })
      );
    });

    it('should include platform filters when provided', async () => {
      mockSecureStore['fastflix_auth_token'] = 'test-token';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { recommendations: [], totalResults: 0 },
          }),
      });

      await backendAPIService.search({
        query: 'Netflix movies',
        includeMovies: true,
        includeTvShows: false,
        platforms: [8],
        includeFlatrate: true,
        includeRent: false,
      });

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);

      expect(body.platforms).toEqual([8]);
      expect(body.includeFlatrate).toBe(true);
      expect(body.includeRent).toBe(false);
    });

    it('should handle 402 subscription required', async () => {
      mockSecureStore['fastflix_auth_token'] = 'test-token';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 402,
        json: () => Promise.resolve({ error: 'Subscription required' }),
      });

      const result = await backendAPIService.search({
        query: 'test',
        includeMovies: true,
        includeTvShows: false,
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('HTTP_402');
    });

    it('should handle 401 and clear auth data', async () => {
      mockSecureStore['fastflix_auth_token'] = 'expired-token';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      });

      await backendAPIService.search({
        query: 'test',
        includeMovies: true,
        includeTvShows: false,
      });

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
        'fastflix_auth_token'
      );
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
        'fastflix_user_data'
      );
    });
  });

  describe('Authentication Methods', () => {
    describe('signInWithApple', () => {
      it('should send identity token to backend', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                user: { id: 'user-123', email: 'test@example.com' },
                token: 'new-jwt-token',
              },
            }),
        });

        const result = await backendAPIService.signInWithApple({
          identityToken: 'apple-identity-token',
          user: {
            email: 'test@example.com',
            name: { firstName: 'Test', lastName: 'User' },
          },
        });

        expect(result.success).toBe(true);
        expect(result.data?.token).toBe('new-jwt-token');
        expect(mockFetch).toHaveBeenCalledWith(
          'http://test-api.com/api/auth/apple',
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
    });

    describe('signInWithGoogle', () => {
      it('should send ID token to backend', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                user: { id: 'user-456', email: 'google@example.com' },
                token: 'google-jwt-token',
              },
            }),
        });

        const result = await backendAPIService.signInWithGoogle({
          idToken: 'google-id-token',
        });

        expect(result.success).toBe(true);
        expect(mockFetch).toHaveBeenCalledWith(
          'http://test-api.com/api/auth/google',
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
    });

    describe('getCurrentUser', () => {
      it('should return user with subscription and trial info', async () => {
        mockSecureStore['fastflix_auth_token'] = 'test-token';

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                user: { id: 'user-123', email: 'test@example.com' },
                subscription: { isActive: true },
                trial: {
                  isActive: false,
                  daysRemaining: 0,
                  used: true,
                },
              },
            }),
        });

        const result = await backendAPIService.getCurrentUser();

        expect(result.success).toBe(true);
        expect(result.data?.subscription.isActive).toBe(true);
      });
    });
  });

  describe('Trial Methods', () => {
    describe('startFreeTrial', () => {
      it('should start free trial', async () => {
        mockSecureStore['fastflix_auth_token'] = 'test-token';

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                success: true,
                message: 'Trial started',
                trial: {
                  isActive: true,
                  daysRemaining: 7,
                },
              },
            }),
        });

        const result = await backendAPIService.startFreeTrial();

        expect(result.success).toBe(true);
        expect(result.data?.trial.isActive).toBe(true);
        expect(mockFetch).toHaveBeenCalledWith(
          'http://test-api.com/api/trial',
          expect.objectContaining({ method: 'POST' })
        );
      });
    });

    describe('getTrialStatus', () => {
      it('should get trial status', async () => {
        mockSecureStore['fastflix_auth_token'] = 'test-token';

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                trial: {
                  isActive: true,
                  daysRemaining: 5,
                  startsAt: '2024-01-01',
                  endsAt: '2024-01-08',
                },
              },
            }),
        });

        const result = await backendAPIService.getTrialStatus();

        expect(result.success).toBe(true);
        expect(result.data?.trial.daysRemaining).toBe(5);
      });
    });
  });

  describe('User Preferences', () => {
    describe('getUserPreferences', () => {
      it('should get user preferences', async () => {
        mockSecureStore['fastflix_auth_token'] = 'test-token';

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                preferences: {
                  country: 'FR',
                  contentType: 'all',
                  platforms: [8, 337],
                  includeFlatrate: true,
                  includeRent: false,
                  includeBuy: false,
                },
              },
            }),
        });

        const result = await backendAPIService.getUserPreferences();

        expect(result.success).toBe(true);
        expect(result.data?.preferences.platforms).toEqual([8, 337]);
      });
    });

    describe('updateUserPreferences', () => {
      it('should update user preferences', async () => {
        mockSecureStore['fastflix_auth_token'] = 'test-token';

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                preferences: {
                  country: 'US',
                  platforms: [8],
                },
              },
            }),
        });

        const result = await backendAPIService.updateUserPreferences({
          country: 'US',
          platforms: [8],
        });

        expect(result.success).toBe(true);
        expect(mockFetch).toHaveBeenCalledWith(
          'http://test-api.com/api/user/preferences',
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ country: 'US', platforms: [8] }),
          })
        );
      });
    });
  });

  describe('Providers', () => {
    it('should get available providers by country', async () => {
      mockSecureStore['fastflix_auth_token'] = 'test-token';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              providers: [
                { provider_id: 8, provider_name: 'Netflix' },
                { provider_id: 337, provider_name: 'Disney+' },
              ],
            },
          }),
      });

      const result = await backendAPIService.getAvailableProviders('US');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/api/providers?country=US',
        expect.any(Object)
      );
    });
  });

  describe('Watchlist Methods', () => {
    describe('getWatchlist', () => {
      it('should get user watchlist', async () => {
        mockSecureStore['fastflix_auth_token'] = 'test-token';

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                items: [
                  { id: 'item-1', title: 'Movie 1', tmdb_id: 603 },
                  { id: 'item-2', title: 'Movie 2', tmdb_id: 550 },
                ],
                count: 2,
                mediaType: 'all',
              },
            }),
        });

        const result = await backendAPIService.getWatchlist();

        expect(result.success).toBe(true);
        expect(result.data?.items).toHaveLength(2);
      });

      it('should filter by media type', async () => {
        mockSecureStore['fastflix_auth_token'] = 'test-token';

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: { items: [], count: 0 },
            }),
        });

        await backendAPIService.getWatchlist('movie');

        expect(mockFetch).toHaveBeenCalledWith(
          'http://test-api.com/api/watchlist?mediaType=movie',
          expect.any(Object)
        );
      });
    });

    describe('addToWatchlist', () => {
      it('should add item to watchlist', async () => {
        mockSecureStore['fastflix_auth_token'] = 'test-token';

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                item: {
                  id: 'new-item',
                  tmdb_id: 603,
                  title: 'The Matrix',
                },
              },
            }),
        });

        const result = await backendAPIService.addToWatchlist({
          tmdbId: 603,
          mediaType: 'movie',
          title: 'The Matrix',
          posterPath: '/matrix.jpg',
          providers: [],
          country: 'FR',
        });

        expect(result.success).toBe(true);
        expect(result.data?.item.tmdb_id).toBe(603);
      });
    });

    describe('removeFromWatchlist', () => {
      it('should remove item from watchlist', async () => {
        mockSecureStore['fastflix_auth_token'] = 'test-token';

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: { deleted: true },
            }),
        });

        const result = await backendAPIService.removeFromWatchlist('item-123');

        expect(result.success).toBe(true);
        expect(result.data?.deleted).toBe(true);
        expect(mockFetch).toHaveBeenCalledWith(
          'http://test-api.com/api/watchlist/item-123',
          expect.objectContaining({ method: 'DELETE' })
        );
      });
    });

    describe('checkInWatchlist', () => {
      it('should check if item is in watchlist', async () => {
        mockSecureStore['fastflix_auth_token'] = 'test-token';

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                inWatchlist: true,
                itemId: 'item-123',
              },
            }),
        });

        const result = await backendAPIService.checkInWatchlist(603, 'movie');

        expect(result.success).toBe(true);
        expect(result.data?.inWatchlist).toBe(true);
        expect(mockFetch).toHaveBeenCalledWith(
          'http://test-api.com/api/watchlist/check/603/movie',
          expect.any(Object)
        );
      });
    });

    describe('refreshWatchlistProviders', () => {
      it('should refresh providers for watchlist items', async () => {
        mockSecureStore['fastflix_auth_token'] = 'test-token';

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                refreshed: 5,
                errors: 0,
              },
            }),
        });

        const result = await backendAPIService.refreshWatchlistProviders();

        expect(result.success).toBe(true);
        expect(mockFetch).toHaveBeenCalledWith(
          'http://test-api.com/api/watchlist/refresh-providers',
          expect.objectContaining({ method: 'POST' })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await backendAPIService.healthCheck();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
    });

    it('should handle timeout', async () => {
      mockFetch.mockImplementationOnce(() => {
        const error = new Error('Timeout');
        error.name = 'AbortError';
        return Promise.reject(error);
      });

      const result = await backendAPIService.healthCheck();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TIMEOUT');
    });

    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      const result = await backendAPIService.healthCheck();

      expect(result.success).toBe(false);
    });

    it('should include error details from server', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid query parameter',
            },
          }),
      });

      const result = await backendAPIService.search({
        query: '',
        includeMovies: true,
        includeTvShows: false,
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid query parameter');
    });
  });
});
