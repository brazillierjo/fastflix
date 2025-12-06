/**
 * Tests for Database Service
 * Tests all database operations with mocked Turso client
 */

// Mock the @libsql/client module
const mockExecute = jest.fn();
const mockClient = {
  execute: mockExecute,
};

jest.mock('@libsql/client', () => ({
  createClient: jest.fn(() => mockClient),
}));

import { createClient } from '@libsql/client';
import { db } from '../lib/db';

describe('Database Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.TURSO_DATABASE_URL = 'libsql://test.turso.io';
    process.env.TURSO_AUTH_TOKEN = 'test-token';

    // Reset singleton state
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any).isInitialized = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any).client = null;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('initialization', () => {
    it('should throw error when credentials are missing', async () => {
      delete process.env.TURSO_DATABASE_URL;
      delete process.env.TURSO_AUTH_TOKEN;

      await expect(db.getUserById('test-id')).rejects.toThrow('Missing Turso credentials');
    });

    it('should initialize client with valid credentials', async () => {
      mockExecute.mockResolvedValueOnce({ rows: [] });

      await db.getUserById('test-id');

      expect(createClient).toHaveBeenCalledWith({
        url: 'libsql://test.turso.io',
        authToken: 'test-token',
      });
    });
  });

  describe('User Methods', () => {
    describe('createUser', () => {
      it('should create a new user', async () => {
        const userData = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          avatar_url: 'https://example.com/avatar.jpg',
          auth_provider: 'apple' as const,
          provider_user_id: 'apple-123',
        };

        // Mock INSERT
        mockExecute.mockResolvedValueOnce({ rows: [] });
        // Mock SELECT for getUserById
        mockExecute.mockResolvedValueOnce({
          rows: [
            {
              id: userData.id,
              email: userData.email,
              name: userData.name,
              avatar_url: userData.avatar_url,
              auth_provider: userData.auth_provider,
              provider_user_id: userData.provider_user_id,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
          ],
        });

        const user = await db.createUser(userData);

        expect(user.id).toBe('user-123');
        expect(user.email).toBe('test@example.com');
        expect(mockExecute).toHaveBeenCalledTimes(2);
      });

      it('should throw error when user creation fails', async () => {
        mockExecute.mockRejectedValueOnce(new Error('DB Error'));

        await expect(
          db.createUser({
            id: 'user-123',
            email: 'test@example.com',
            name: null,
            avatar_url: null,
            auth_provider: 'google',
            provider_user_id: 'google-123',
          })
        ).rejects.toThrow('DB Error');
      });
    });

    describe('getUserById', () => {
      it('should return user when found', async () => {
        mockExecute.mockResolvedValueOnce({
          rows: [
            {
              id: 'user-123',
              email: 'test@example.com',
              name: 'Test User',
            },
          ],
        });

        const user = await db.getUserById('user-123');

        expect(user).not.toBeNull();
        expect(user?.id).toBe('user-123');
      });

      it('should return null when user not found', async () => {
        mockExecute.mockResolvedValueOnce({ rows: [] });

        const user = await db.getUserById('nonexistent');

        expect(user).toBeNull();
      });
    });

    describe('getUserByEmail', () => {
      it('should find user by email', async () => {
        mockExecute.mockResolvedValueOnce({
          rows: [{ id: 'user-123', email: 'test@example.com' }],
        });

        const user = await db.getUserByEmail('test@example.com');

        expect(user?.email).toBe('test@example.com');
        expect(mockExecute).toHaveBeenCalledWith({
          sql: 'SELECT * FROM users WHERE email = ?',
          args: ['test@example.com'],
        });
      });
    });

    describe('getUserByProvider', () => {
      it('should find user by auth provider', async () => {
        mockExecute.mockResolvedValueOnce({
          rows: [
            {
              id: 'user-123',
              auth_provider: 'apple',
              provider_user_id: 'apple-123',
            },
          ],
        });

        const user = await db.getUserByProvider('apple', 'apple-123');

        expect(user?.id).toBe('user-123');
      });
    });

    describe('updateUser', () => {
      it('should update user name', async () => {
        // Mock UPDATE
        mockExecute.mockResolvedValueOnce({ rows: [] });
        // Mock SELECT for getUserById
        mockExecute.mockResolvedValueOnce({
          rows: [{ id: 'user-123', name: 'New Name' }],
        });

        const user = await db.updateUser('user-123', { name: 'New Name' });

        expect(user.name).toBe('New Name');
      });

      it('should return current user when no updates provided', async () => {
        mockExecute.mockResolvedValueOnce({
          rows: [{ id: 'user-123', name: 'Current Name' }],
        });

        const user = await db.updateUser('user-123', {});

        expect(user.name).toBe('Current Name');
        expect(mockExecute).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Subscription Methods', () => {
    describe('hasActiveSubscriptionByUserId', () => {
      it('should return true when user has active subscription', async () => {
        mockExecute.mockResolvedValueOnce({
          rows: [{ count: 1 }],
        });

        const hasSubscription = await db.hasActiveSubscriptionByUserId('user-123');

        expect(hasSubscription).toBe(true);
      });

      it('should return false when no active subscription', async () => {
        mockExecute.mockResolvedValueOnce({
          rows: [{ count: 0 }],
        });

        const hasSubscription = await db.hasActiveSubscriptionByUserId('user-123');

        expect(hasSubscription).toBe(false);
      });

      it('should return false on error', async () => {
        mockExecute.mockRejectedValueOnce(new Error('DB Error'));

        const hasSubscription = await db.hasActiveSubscriptionByUserId('user-123');

        expect(hasSubscription).toBe(false);
      });
    });

    describe('upsertSubscriptionByUserId', () => {
      it('should update existing subscription', async () => {
        // Check existing
        mockExecute.mockResolvedValueOnce({
          rows: [{ user_id: 'user-123' }],
        });
        // Update
        mockExecute.mockResolvedValueOnce({ rows: [] });

        await db.upsertSubscriptionByUserId({
          user_id: 'user-123',
          revenuecat_user_id: 'rc-123',
          status: 'active',
          expires_at: '2025-01-01',
          product_id: 'premium',
        });

        expect(mockExecute).toHaveBeenCalledTimes(2);
      });

      it('should insert new subscription when not exists', async () => {
        // Check existing - not found
        mockExecute.mockResolvedValueOnce({ rows: [] });
        // Insert
        mockExecute.mockResolvedValueOnce({ rows: [] });

        await db.upsertSubscriptionByUserId({
          user_id: 'user-123',
          revenuecat_user_id: 'rc-123',
          status: 'active',
          expires_at: null,
          product_id: 'premium',
        });

        expect(mockExecute).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Trial Methods', () => {
    describe('startFreeTrial', () => {
      it('should start trial for eligible user', async () => {
        // getUserById
        mockExecute.mockResolvedValueOnce({
          rows: [{ id: 'user-123', trial_used: 0 }],
        });
        // Check trial_used
        mockExecute.mockResolvedValueOnce({
          rows: [{ trial_used: 0 }],
        });
        // Update trial
        mockExecute.mockResolvedValueOnce({ rows: [] });
        // getTrialInfo
        mockExecute.mockResolvedValueOnce({
          rows: [
            {
              trial_started_at: '2024-01-01T00:00:00Z',
              trial_ends_at: '2024-01-08T00:00:00Z',
              trial_used: 1,
            },
          ],
        });

        const trial = await db.startFreeTrial('user-123');

        expect(trial).not.toBeNull();
        expect(trial?.used).toBe(true);
      });

      it('should return null if trial already used', async () => {
        // getUserById
        mockExecute.mockResolvedValueOnce({
          rows: [{ id: 'user-123', trial_used: 1 }],
        });
        // Check trial_used
        mockExecute.mockResolvedValueOnce({
          rows: [{ trial_used: 1 }],
        });

        const trial = await db.startFreeTrial('user-123');

        expect(trial).toBeNull();
      });

      it('should throw error if user not found', async () => {
        mockExecute.mockResolvedValueOnce({ rows: [] });

        await expect(db.startFreeTrial('nonexistent')).rejects.toThrow('User not found');
      });
    });

    describe('hasUsedFreeTrial', () => {
      it('should return true when trial is used', async () => {
        mockExecute.mockResolvedValueOnce({
          rows: [{ trial_used: 1 }],
        });

        const used = await db.hasUsedFreeTrial('user-123');

        expect(used).toBe(true);
      });

      it('should return false when trial not used', async () => {
        mockExecute.mockResolvedValueOnce({
          rows: [{ trial_used: 0 }],
        });

        const used = await db.hasUsedFreeTrial('user-123');

        expect(used).toBe(false);
      });
    });

    describe('isInFreeTrial', () => {
      it('should return true when in active trial', async () => {
        mockExecute.mockResolvedValueOnce({
          rows: [{ trial_ends_at: '2099-01-01T00:00:00Z' }],
        });

        const isActive = await db.isInFreeTrial('user-123');

        expect(isActive).toBe(true);
      });

      it('should return false when trial expired', async () => {
        mockExecute.mockResolvedValueOnce({ rows: [] });

        const isActive = await db.isInFreeTrial('user-123');

        expect(isActive).toBe(false);
      });
    });

    describe('getTrialInfo', () => {
      it('should calculate days remaining correctly', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 5);

        mockExecute.mockResolvedValueOnce({
          rows: [
            {
              trial_started_at: new Date().toISOString(),
              trial_ends_at: futureDate.toISOString(),
              trial_used: 1,
            },
          ],
        });

        const info = await db.getTrialInfo('user-123');

        expect(info.isActive).toBe(true);
        expect(info.daysRemaining).toBeGreaterThanOrEqual(4);
        expect(info.daysRemaining).toBeLessThanOrEqual(6);
      });

      it('should return default info when user not found', async () => {
        mockExecute.mockResolvedValueOnce({ rows: [] });

        const info = await db.getTrialInfo('nonexistent');

        expect(info.isActive).toBe(false);
        expect(info.daysRemaining).toBe(0);
        expect(info.used).toBe(false);
      });
    });

    describe('hasAccess', () => {
      it('should return true when user has subscription', async () => {
        mockExecute.mockResolvedValueOnce({
          rows: [{ count: 1 }],
        });

        const hasAccess = await db.hasAccess('user-123');

        expect(hasAccess).toBe(true);
      });

      it('should return true when user in active trial', async () => {
        // No subscription
        mockExecute.mockResolvedValueOnce({
          rows: [{ count: 0 }],
        });
        // Active trial
        mockExecute.mockResolvedValueOnce({
          rows: [{ trial_ends_at: '2099-01-01' }],
        });

        const hasAccess = await db.hasAccess('user-123');

        expect(hasAccess).toBe(true);
      });

      it('should return false when no subscription and no trial', async () => {
        mockExecute.mockResolvedValueOnce({ rows: [{ count: 0 }] });
        mockExecute.mockResolvedValueOnce({ rows: [] });

        const hasAccess = await db.hasAccess('user-123');

        expect(hasAccess).toBe(false);
      });
    });
  });

  describe('User Preferences Methods', () => {
    describe('getUserPreferences', () => {
      it('should return user preferences', async () => {
        mockExecute.mockResolvedValueOnce({
          rows: [
            {
              pref_country: 'US',
              pref_content_type: 'movies',
              pref_platforms: '[8, 337]',
              pref_include_flatrate: 1,
              pref_include_rent: 0,
              pref_include_buy: 1,
            },
          ],
        });

        const prefs = await db.getUserPreferences('user-123');

        expect(prefs.country).toBe('US');
        expect(prefs.contentType).toBe('movies');
        expect(prefs.platforms).toEqual([8, 337]);
        expect(prefs.includeFlatrate).toBe(true);
        expect(prefs.includeRent).toBe(false);
        expect(prefs.includeBuy).toBe(true);
      });

      it('should return defaults when no preferences set', async () => {
        mockExecute.mockResolvedValueOnce({ rows: [] });

        const prefs = await db.getUserPreferences('user-123');

        expect(prefs.country).toBe('FR');
        expect(prefs.contentType).toBe('all');
        expect(prefs.platforms).toEqual([]);
        expect(prefs.includeFlatrate).toBe(true);
      });

      it('should handle invalid JSON in platforms', async () => {
        mockExecute.mockResolvedValueOnce({
          rows: [
            {
              pref_country: 'FR',
              pref_content_type: 'all',
              pref_platforms: 'invalid-json',
              pref_include_flatrate: 1,
              pref_include_rent: 0,
              pref_include_buy: 0,
            },
          ],
        });

        const prefs = await db.getUserPreferences('user-123');

        expect(prefs.platforms).toEqual([]);
      });
    });

    describe('updateUserPreferences', () => {
      it('should update preferences', async () => {
        // Update
        mockExecute.mockResolvedValueOnce({ rows: [] });
        // Get updated preferences
        mockExecute.mockResolvedValueOnce({
          rows: [
            {
              pref_country: 'DE',
              pref_content_type: 'tvshows',
              pref_platforms: '[8]',
              pref_include_flatrate: 1,
              pref_include_rent: 1,
              pref_include_buy: 0,
            },
          ],
        });

        const prefs = await db.updateUserPreferences('user-123', {
          country: 'DE',
          contentType: 'tvshows',
          platforms: [8],
          includeRent: true,
        });

        expect(prefs.country).toBe('DE');
        expect(prefs.contentType).toBe('tvshows');
      });
    });
  });

  describe('Watchlist Methods', () => {
    describe('addToWatchlist', () => {
      it('should add item to watchlist', async () => {
        // Insert
        mockExecute.mockResolvedValueOnce({ rows: [] });
        // Get created item
        mockExecute.mockResolvedValueOnce({
          rows: [
            {
              id: 'watchlist-123',
              user_id: 'user-123',
              tmdb_id: 603,
              media_type: 'movie',
              title: 'The Matrix',
              poster_path: '/matrix.jpg',
              added_at: '2024-01-01',
              providers_json: '[]',
              country: 'FR',
            },
          ],
        });

        const item = await db.addToWatchlist('user-123', {
          tmdbId: 603,
          mediaType: 'movie',
          title: 'The Matrix',
          posterPath: '/matrix.jpg',
          providers: [],
          country: 'FR',
        });

        expect(item.tmdb_id).toBe(603);
        expect(item.title).toBe('The Matrix');
      });

      it('should return existing item on duplicate', async () => {
        // Insert fails with constraint
        mockExecute.mockRejectedValueOnce(new Error('UNIQUE constraint failed'));
        // Get existing item
        mockExecute.mockResolvedValueOnce({
          rows: [
            {
              id: 'existing-123',
              user_id: 'user-123',
              tmdb_id: 603,
              media_type: 'movie',
              title: 'The Matrix',
              poster_path: '/matrix.jpg',
              added_at: '2024-01-01',
              providers_json: '[]',
              country: 'FR',
            },
          ],
        });

        const item = await db.addToWatchlist('user-123', {
          tmdbId: 603,
          mediaType: 'movie',
          title: 'The Matrix',
          posterPath: '/matrix.jpg',
          providers: [],
          country: 'FR',
        });

        expect(item.id).toBe('existing-123');
      });
    });

    describe('removeFromWatchlist', () => {
      it('should remove item and return true', async () => {
        mockExecute.mockResolvedValueOnce({ rowsAffected: 1 });

        const result = await db.removeFromWatchlist('user-123', 'watchlist-123');

        expect(result).toBe(true);
      });

      it('should return false when item not found', async () => {
        mockExecute.mockResolvedValueOnce({ rowsAffected: 0 });

        const result = await db.removeFromWatchlist('user-123', 'nonexistent');

        expect(result).toBe(false);
      });
    });

    describe('getWatchlist', () => {
      it('should return user watchlist', async () => {
        mockExecute.mockResolvedValueOnce({
          rows: [
            {
              id: 'item-1',
              user_id: 'user-123',
              tmdb_id: 603,
              media_type: 'movie',
              title: 'The Matrix',
              poster_path: '/matrix.jpg',
              added_at: '2024-01-01',
              providers_json: '[{"provider_id":8,"provider_name":"Netflix"}]',
              country: 'FR',
            },
            {
              id: 'item-2',
              user_id: 'user-123',
              tmdb_id: 1399,
              media_type: 'tv',
              title: 'Game of Thrones',
              poster_path: '/got.jpg',
              added_at: '2024-01-02',
              providers_json: '[]',
              country: 'FR',
            },
          ],
        });

        const items = await db.getWatchlist('user-123');

        expect(items).toHaveLength(2);
        expect(items[0].providers).toHaveLength(1);
        expect(items[0].providers[0].provider_name).toBe('Netflix');
      });

      it('should filter by media type', async () => {
        mockExecute.mockResolvedValueOnce({
          rows: [
            {
              id: 'item-1',
              tmdb_id: 603,
              media_type: 'movie',
              title: 'The Matrix',
              providers_json: '[]',
            },
          ],
        });

        await db.getWatchlist('user-123', 'movie');

        expect(mockExecute).toHaveBeenCalledWith({
          sql: expect.stringContaining('AND media_type = ?'),
          args: ['user-123', 'movie'],
        });
      });
    });

    describe('isInWatchlist', () => {
      it('should return true and itemId when in watchlist', async () => {
        mockExecute.mockResolvedValueOnce({
          rows: [{ id: 'watchlist-123' }],
        });

        const result = await db.isInWatchlist('user-123', 603, 'movie');

        expect(result.inWatchlist).toBe(true);
        expect(result.itemId).toBe('watchlist-123');
      });

      it('should return false when not in watchlist', async () => {
        mockExecute.mockResolvedValueOnce({ rows: [] });

        const result = await db.isInWatchlist('user-123', 999, 'movie');

        expect(result.inWatchlist).toBe(false);
        expect(result.itemId).toBeNull();
      });
    });

    describe('updateWatchlistProviders', () => {
      it('should update providers for watchlist item', async () => {
        mockExecute.mockResolvedValueOnce({ rows: [] });

        await db.updateWatchlistProviders('watchlist-123', [
          {
            provider_id: 8,
            provider_name: 'Netflix',
            logo_path: '/netflix.jpg',
            display_priority: 1,
            availability_type: 'flatrate',
          },
        ]);

        expect(mockExecute).toHaveBeenCalledWith({
          sql: expect.stringContaining('UPDATE watchlist SET providers_json'),
          args: expect.any(Array),
        });
      });
    });

    describe('getWatchlistCount', () => {
      it('should return correct count', async () => {
        mockExecute.mockResolvedValueOnce({
          rows: [{ count: 5 }],
        });

        const count = await db.getWatchlistCount('user-123');

        expect(count).toBe(5);
      });

      it('should return 0 on error', async () => {
        mockExecute.mockRejectedValueOnce(new Error('DB Error'));

        const count = await db.getWatchlistCount('user-123');

        expect(count).toBe(0);
      });
    });

    describe('getWatchlistItemsNeedingRefresh', () => {
      it('should return items needing provider refresh', async () => {
        mockExecute.mockResolvedValueOnce({
          rows: [
            {
              id: 'item-1',
              tmdb_id: 603,
              media_type: 'movie',
              title: 'The Matrix',
              last_provider_check: '2024-01-01',
              providers_json: '[]',
            },
          ],
        });

        const items = await db.getWatchlistItemsNeedingRefresh('user-123');

        expect(items).toHaveLength(1);
      });
    });
  });

});
