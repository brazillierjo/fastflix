/**
 * FastFlix Backend - Database Service
 * Turso (libSQL) database client and operations
 */

import { createClient, Client, Row } from '@libsql/client';
import type {
  User,
  UserPreferences,
  WatchlistItem,
  StreamingProvider,
  UserQuota,
  SearchHistoryEntry,
  UserTasteProfile,
  RatedMovie,
  UserStats,
} from './types';

/**
 * Helper function to safely convert a database row to a specific type
 */
function rowToObject<T>(row: Row): T {
  const obj: Record<string, unknown> = {};
  for (const key in row) {
    obj[key] = row[key];
  }
  return obj as T;
}

class DatabaseService {
  private client: Client | null = null;
  private isInitialized = false;

  /**
   * Initialize the Turso client (singleton)
   */
  private initialize(): void {
    if (this.isInitialized && this.client) {
      return;
    }

    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
      throw new Error('Missing Turso credentials in environment variables');
    }

    this.client = createClient({
      url,
      authToken,
    });

    this.isInitialized = true;
  }

  /**
   * Get the Turso client instance
   */
  private getClient(): Client {
    if (!this.client || !this.isInitialized) {
      this.initialize();
    }
    return this.client!;
  }

  // ==========================================================================
  // User Methods (Authentication)
  // ==========================================================================

  /**
   * Create a new user
   */
  async createUser(data: {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
    auth_provider: 'apple' | 'google';
    provider_user_id: string;
  }): Promise<User> {
    this.initialize();

    try {
      const { id, email, name, avatar_url, auth_provider, provider_user_id } = data;

      await this.client!.execute({
        sql: `INSERT INTO users (id, email, name, avatar_url, auth_provider, provider_user_id)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [id, email, name, avatar_url, auth_provider, provider_user_id],
      });

      // Return the created user
      const user = await this.getUserById(id);
      if (!user) {
        throw new Error('Failed to retrieve created user');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    this.initialize();

    try {
      const result = await this.client!.execute({
        sql: 'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL',
        args: [id],
      });

      if (result.rows.length === 0) {
        return null;
      }

      return rowToObject<User>(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    this.initialize();

    try {
      const result = await this.client!.execute({
        sql: 'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL',
        args: [email],
      });

      if (result.rows.length === 0) {
        return null;
      }

      return rowToObject<User>(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user by provider and provider_user_id
   */
  async getUserByProvider(
    auth_provider: 'apple' | 'google',
    provider_user_id: string
  ): Promise<User | null> {
    this.initialize();

    try {
      const result = await this.client!.execute({
        sql: 'SELECT * FROM users WHERE auth_provider = ? AND provider_user_id = ? AND deleted_at IS NULL',
        args: [auth_provider, provider_user_id],
      });

      if (result.rows.length === 0) {
        return null;
      }

      return rowToObject<User>(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user information
   */
  async updateUser(
    id: string,
    data: {
      name?: string | null;
      avatar_url?: string | null;
    }
  ): Promise<User> {
    this.initialize();

    try {
      const updates: string[] = [];
      const args: (string | null)[] = [];

      if (data.name !== undefined) {
        updates.push('name = ?');
        args.push(data.name);
      }

      if (data.avatar_url !== undefined) {
        updates.push('avatar_url = ?');
        args.push(data.avatar_url);
      }

      if (updates.length === 0) {
        // No updates, just return current user
        const user = await this.getUserById(id);
        if (!user) {
          throw new Error('User not found');
        }
        return user;
      }

      updates.push("updated_at = datetime('now')");
      args.push(id);

      await this.client!.execute({
        sql: `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        args,
      });

      const user = await this.getUserById(id);
      if (!user) {
        throw new Error('Failed to retrieve updated user');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find a soft-deleted user by provider (for reactivation on re-login)
   */
  async getDeletedUserByProvider(
    auth_provider: 'apple' | 'google',
    provider_user_id: string
  ): Promise<User | null> {
    this.initialize();

    try {
      const result = await this.client!.execute({
        sql: 'SELECT * FROM users WHERE auth_provider = ? AND provider_user_id = ? AND deleted_at IS NOT NULL',
        args: [auth_provider, provider_user_id],
      });

      if (result.rows.length === 0) {
        return null;
      }

      return rowToObject<User>(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reactivate a soft-deleted user account
   */
  async reactivateUser(userId: string): Promise<User> {
    this.initialize();

    await this.client!.execute({
      sql: `UPDATE users SET deleted_at = NULL, updated_at = datetime('now') WHERE id = ?`,
      args: [userId],
    });

    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('Failed to reactivate user');
    }
    return user;
  }

  /**
   * Soft delete a user account (sets deleted_at timestamp)
   * Data is preserved to prevent trial abuse
   */
  async softDeleteUser(userId: string): Promise<void> {
    this.initialize();

    await this.client!.execute({
      sql: `UPDATE users SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
      args: [userId],
    });

    // Clean up push tokens so they don't receive notifications
    await this.client!.execute({
      sql: 'DELETE FROM push_tokens WHERE user_id = ?',
      args: [userId],
    });
  }

  /**
   * Check if user has active subscription (by user_id)
   */
  async hasActiveSubscriptionByUserId(userId: string): Promise<boolean> {
    this.initialize();

    try {
      const result = await this.client!.execute({
        sql: `SELECT COUNT(*) as count FROM subscriptions
              WHERE user_id = ?
              AND status IN ('active', 'cancelled')
              AND (expires_at IS NULL OR datetime(expires_at) > datetime('now'))`,
        args: [userId],
      });

      const count = Number(result.rows[0]?.count || 0);
      return count > 0;
    } catch {
      return false;
    }
  }

  /**
   * Upsert subscription by user_id (for authenticated users)
   */
  async upsertSubscriptionByUserId(subscription: {
    user_id: string;
    revenuecat_user_id: string;
    status: string;
    expires_at: string | null;
    product_id: string | null;
  }): Promise<void> {
    this.initialize();

    try {
      const { user_id, revenuecat_user_id, status, expires_at, product_id } = subscription;

      // First, check if a subscription exists for this user
      const existing = await this.client!.execute({
        sql: 'SELECT * FROM subscriptions WHERE user_id = ?',
        args: [user_id],
      });

      if (existing.rows.length > 0) {
        // Update existing subscription
        await this.client!.execute({
          sql: `UPDATE subscriptions
                SET revenuecat_user_id = ?,
                    status = ?,
                    expires_at = ?,
                    product_id = ?,
                    last_updated = CURRENT_TIMESTAMP
                WHERE user_id = ?`,
          args: [revenuecat_user_id, status, expires_at, product_id, user_id],
        });
      } else {
        // Insert new subscription with user_id (device_id can be null)
        await this.client!.execute({
          sql: `INSERT INTO subscriptions
                (user_id, revenuecat_user_id, status, expires_at, product_id)
                VALUES (?, ?, ?, ?, ?)`,
          args: [user_id, revenuecat_user_id, status, expires_at, product_id],
        });
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if user has access (active subscription)
   * Uses RevenueCat API as source of truth, falls back to DB
   */
  async hasAccess(userId: string): Promise<boolean> {
    // RevenueCat is the single source of truth for subscription status
    try {
      const { checkPremiumAccess } = await import('./revenuecat');
      const { isPremium } = await checkPremiumAccess(userId);
      return isPremium;
    } catch (error) {
      console.error('❌ RevenueCat API check failed:', error);
      return false;
    }
  }

  /**
   * Get subscription details for a user
   * Uses RevenueCat as source of truth, DB as supplementary info
   */
  async getSubscriptionDetails(userId: string): Promise<{
    isActive: boolean;
    status: string | null;
    productId: string | null;
    expiresAt: string | null;
    createdAt: string | null;
    willRenew: boolean;
  }> {
    this.initialize();

    // RevenueCat is the source of truth for active status
    let rcActive = false;
    let rcExpiresAt: string | null = null;
    try {
      const { checkPremiumAccess } = await import('./revenuecat');
      const rc = await checkPremiumAccess(userId);
      rcActive = rc.isPremium;
      rcExpiresAt = rc.expiresAt;
    } catch {
      // RevenueCat unavailable
    }

    // Get supplementary details from DB (product, dates, etc.)
    try {
      const result = await this.client!.execute({
        sql: `SELECT status, product_id, expires_at, created_at
              FROM subscriptions
              WHERE user_id = ?
              ORDER BY created_at DESC
              LIMIT 1`,
        args: [userId],
      });

      if (result.rows.length === 0) {
        return {
          isActive: rcActive,
          status: rcActive ? 'active' : null,
          productId: null,
          expiresAt: rcExpiresAt,
          createdAt: null,
          willRenew: rcActive,
        };
      }

      const row = result.rows[0];
      const dbStatus = row.status as string;

      return {
        isActive: rcActive,
        status: rcActive ? 'active' : dbStatus,
        productId: row.product_id as string | null,
        expiresAt: rcExpiresAt || (row.expires_at as string | null),
        createdAt: row.created_at as string | null,
        willRenew: rcActive && dbStatus === 'active',
      };
    } catch {
      return {
        isActive: rcActive,
        status: rcActive ? 'active' : null,
        productId: null,
        expiresAt: null,
        createdAt: null,
        willRenew: false,
      };
    }
  }

  // ==========================================================================
  // User Preferences Methods
  // ==========================================================================

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    this.initialize();

    try {
      const result = await this.client!.execute({
        sql: `SELECT pref_country, pref_content_type, pref_platforms,
                     pref_include_flatrate, pref_include_rent, pref_include_buy
              FROM users WHERE id = ?`,
        args: [userId],
      });

      if (result.rows.length === 0) {
        // Return defaults
        return {
          country: 'FR',
          contentType: 'all',
          platforms: [],
          includeFlatrate: true,
          includeRent: false,
          includeBuy: false,
        };
      }

      const row = result.rows[0];

      // Parse platforms JSON
      let platforms: number[] = [];
      try {
        const platformsStr = row.pref_platforms as string;
        if (platformsStr) {
          platforms = JSON.parse(platformsStr);
        }
      } catch {
        platforms = [];
      }

      return {
        country: (row.pref_country as string) || 'FR',
        contentType: (row.pref_content_type as 'all' | 'movies' | 'tvshows') || 'all',
        platforms,
        includeFlatrate: Number(row.pref_include_flatrate) === 1,
        includeRent: Number(row.pref_include_rent) === 1,
        includeBuy: Number(row.pref_include_buy) === 1,
      };
    } catch {
      // Return defaults on error
      return {
        country: 'FR',
        contentType: 'all',
        platforms: [],
        includeFlatrate: true,
        includeRent: false,
        includeBuy: false,
      };
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    this.initialize();

    try {
      const updates: string[] = [];
      const args: (string | number)[] = [];

      if (preferences.country !== undefined) {
        updates.push('pref_country = ?');
        args.push(preferences.country);
      }

      if (preferences.contentType !== undefined) {
        updates.push('pref_content_type = ?');
        args.push(preferences.contentType);
      }

      if (preferences.platforms !== undefined) {
        updates.push('pref_platforms = ?');
        args.push(JSON.stringify(preferences.platforms));
      }

      if (preferences.includeFlatrate !== undefined) {
        updates.push('pref_include_flatrate = ?');
        args.push(preferences.includeFlatrate ? 1 : 0);
      }

      if (preferences.includeRent !== undefined) {
        updates.push('pref_include_rent = ?');
        args.push(preferences.includeRent ? 1 : 0);
      }

      if (preferences.includeBuy !== undefined) {
        updates.push('pref_include_buy = ?');
        args.push(preferences.includeBuy ? 1 : 0);
      }

      if (updates.length > 0) {
        updates.push("updated_at = datetime('now')");
        args.push(userId);

        await this.client!.execute({
          sql: `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
          args,
        });
      }

      return this.getUserPreferences(userId);
    } catch (error) {
      throw error;
    }
  }

  // ==========================================================================
  // Watchlist Methods
  // ==========================================================================

  /**
   * Add an item to user's watchlist
   */
  async addToWatchlist(
    userId: string,
    item: {
      tmdbId: number;
      mediaType: 'movie' | 'tv';
      title: string;
      posterPath: string | null;
      providers: StreamingProvider[];
      country: string;
    }
  ): Promise<WatchlistItem> {
    this.initialize();

    try {
      // Generate UUID for the watchlist item
      const id = crypto.randomUUID();
      const providersJson = JSON.stringify(item.providers);

      await this.client!.execute({
        sql: `INSERT INTO watchlist (id, user_id, tmdb_id, media_type, title, poster_path, providers_json, country, last_provider_check)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        args: [
          id,
          userId,
          item.tmdbId,
          item.mediaType,
          item.title,
          item.posterPath,
          providersJson,
          item.country,
        ],
      });

      // Return the created item
      const watchlistItem = await this.getWatchlistItemById(id);
      if (!watchlistItem) {
        throw new Error('Failed to retrieve created watchlist item');
      }

      return watchlistItem;
    } catch (error) {
      // Check for unique constraint violation (item already exists)
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        // Return existing item
        const existing = await this.getWatchlistItemByTmdbId(userId, item.tmdbId, item.mediaType);
        if (existing) {
          return existing;
        }
      }
      throw error;
    }
  }

  /**
   * Remove an item from user's watchlist
   */
  async removeFromWatchlist(userId: string, itemId: string): Promise<boolean> {
    this.initialize();

    try {
      const result = await this.client!.execute({
        sql: 'DELETE FROM watchlist WHERE id = ? AND user_id = ?',
        args: [itemId, userId],
      });

      const deleted = result.rowsAffected > 0;

      return deleted;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user's watchlist
   */
  async getWatchlist(userId: string, mediaType?: 'movie' | 'tv'): Promise<WatchlistItem[]> {
    this.initialize();

    try {
      let sql = 'SELECT * FROM watchlist WHERE user_id = ?';
      const args: (string | number)[] = [userId];

      if (mediaType) {
        sql += ' AND media_type = ?';
        args.push(mediaType);
      }

      sql += ' ORDER BY added_at DESC';

      const result = await this.client!.execute({ sql, args });

      return result.rows.map((row) => this.rowToWatchlistItem(row));
    } catch {
      return [];
    }
  }

  /**
   * Check if an item is in user's watchlist
   */
  async isInWatchlist(
    userId: string,
    tmdbId: number,
    mediaType: 'movie' | 'tv'
  ): Promise<{ inWatchlist: boolean; itemId: string | null }> {
    this.initialize();

    try {
      const result = await this.client!.execute({
        sql: 'SELECT id FROM watchlist WHERE user_id = ? AND tmdb_id = ? AND media_type = ?',
        args: [userId, tmdbId, mediaType],
      });

      if (result.rows.length > 0) {
        return { inWatchlist: true, itemId: result.rows[0].id as string };
      }

      return { inWatchlist: false, itemId: null };
    } catch {
      return { inWatchlist: false, itemId: null };
    }
  }

  /**
   * Get watchlist item by ID
   */
  async getWatchlistItemById(id: string): Promise<WatchlistItem | null> {
    this.initialize();

    try {
      const result = await this.client!.execute({
        sql: 'SELECT * FROM watchlist WHERE id = ?',
        args: [id],
      });

      if (result.rows.length === 0) {
        return null;
      }

      return this.rowToWatchlistItem(result.rows[0]);
    } catch {
      return null;
    }
  }

  /**
   * Get watchlist item by TMDB ID
   */
  async getWatchlistItemByTmdbId(
    userId: string,
    tmdbId: number,
    mediaType: 'movie' | 'tv'
  ): Promise<WatchlistItem | null> {
    this.initialize();

    try {
      const result = await this.client!.execute({
        sql: 'SELECT * FROM watchlist WHERE user_id = ? AND tmdb_id = ? AND media_type = ?',
        args: [userId, tmdbId, mediaType],
      });

      if (result.rows.length === 0) {
        return null;
      }

      return this.rowToWatchlistItem(result.rows[0]);
    } catch {
      return null;
    }
  }

  /**
   * Update providers for a watchlist item
   */
  async updateWatchlistProviders(itemId: string, providers: StreamingProvider[]): Promise<void> {
    this.initialize();

    try {
      const providersJson = JSON.stringify(providers);

      await this.client!.execute({
        sql: `UPDATE watchlist SET providers_json = ?, last_provider_check = datetime('now') WHERE id = ?`,
        args: [providersJson, itemId],
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get watchlist items that need provider refresh (last check > 24h ago)
   */
  async getWatchlistItemsNeedingRefresh(userId: string): Promise<WatchlistItem[]> {
    this.initialize();

    try {
      const result = await this.client!.execute({
        sql: `SELECT * FROM watchlist
              WHERE user_id = ?
              AND (last_provider_check IS NULL OR datetime(last_provider_check) < datetime('now', '-24 hours'))`,
        args: [userId],
      });

      return result.rows.map((row) => this.rowToWatchlistItem(row));
    } catch {
      return [];
    }
  }

  /**
   * Get watchlist count for a user
   */
  async getWatchlistCount(userId: string): Promise<number> {
    this.initialize();

    try {
      const result = await this.client!.execute({
        sql: 'SELECT COUNT(*) as count FROM watchlist WHERE user_id = ?',
        args: [userId],
      });

      return Number(result.rows[0]?.count || 0);
    } catch {
      return 0;
    }
  }

  // ==========================================================================
  // Quota Methods
  // ==========================================================================

  /**
   * Get user's quota usage for a specific date
   */
  async getUserQuota(userId: string, date: string): Promise<UserQuota> {
    this.initialize();

    try {
      const result = await this.client!.execute({
        sql: 'SELECT * FROM user_quotas WHERE user_id = ? AND date = ?',
        args: [userId, date],
      });

      if (result.rows.length === 0) {
        return {
          user_id: userId,
          date,
          search_count: 0,
          watchlist_additions: 0,
        };
      }

      return {
        user_id: result.rows[0].user_id as string,
        date: result.rows[0].date as string,
        search_count: Number(result.rows[0].search_count || 0),
        watchlist_additions: Number(result.rows[0].watchlist_additions || 0),
      };
    } catch {
      return {
        user_id: userId,
        date,
        search_count: 0,
        watchlist_additions: 0,
      };
    }
  }

  /**
   * Increment a quota field (search_count or watchlist_additions) for a user on a date
   */
  async incrementQuota(
    userId: string,
    date: string,
    field: 'search_count' | 'watchlist_additions'
  ): Promise<void> {
    this.initialize();

    try {
      // Use INSERT OR REPLACE with COALESCE to handle upsert
      await this.client!.execute({
        sql: `INSERT INTO user_quotas (user_id, date, search_count, watchlist_additions)
              VALUES (?, ?, ?, ?)
              ON CONFLICT(user_id, date) DO UPDATE SET ${field} = ${field} + 1`,
        args: [
          userId,
          date,
          field === 'search_count' ? 1 : 0,
          field === 'watchlist_additions' ? 1 : 0,
        ],
      });
    } catch (error) {
      throw error;
    }
  }

  // ==========================================================================
  // Search History Methods
  // ==========================================================================

  /**
   * Add a search to history
   */
  async addSearchHistory(userId: string, query: string, resultsCount: number): Promise<void> {
    this.initialize();

    try {
      await this.client!.execute({
        sql: 'INSERT INTO search_history (user_id, query, results_count) VALUES (?, ?, ?)',
        args: [userId, query, resultsCount],
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get recent search history for a user
   */
  async getSearchHistory(userId: string, limit: number = 20): Promise<SearchHistoryEntry[]> {
    this.initialize();

    try {
      const result = await this.client!.execute({
        sql: 'SELECT * FROM search_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
        args: [userId, limit],
      });

      return result.rows.map((row) => ({
        id: Number(row.id),
        user_id: row.user_id as string,
        query: row.query as string,
        results_count: Number(row.results_count || 0),
        created_at: row.created_at as string,
      }));
    } catch {
      return [];
    }
  }

  // ==========================================================================
  // Activity Tracking Methods
  // ==========================================================================

  /**
   * Record daily activity for a user (for streak calculation)
   */
  async recordActivity(userId: string, date: string): Promise<void> {
    this.initialize();
    try {
      await this.client!.execute({
        sql: `INSERT INTO user_activity (user_id, date, actions_count)
              VALUES (?, ?, 1)
              ON CONFLICT(user_id, date) DO UPDATE SET actions_count = actions_count + 1`,
        args: [userId, date],
      });
    } catch {
      // Non-critical - don't fail the request if activity tracking fails
      console.warn('Failed to record activity for user', userId);
    }
  }

  // ==========================================================================
  // Taste Profile Methods
  // ==========================================================================

  /**
   * Get user's taste profile
   */
  async getUserTasteProfile(userId: string): Promise<UserTasteProfile> {
    this.initialize();

    const defaultProfile: UserTasteProfile = {
      user_id: userId,
      favorite_genres: [],
      disliked_genres: [],
      favorite_decades: [],
      rated_movies: [],
    };

    try {
      const result = await this.client!.execute({
        sql: 'SELECT * FROM user_taste_profile WHERE user_id = ?',
        args: [userId],
      });

      if (result.rows.length === 0) {
        return defaultProfile;
      }

      const row = result.rows[0];

      const parseJsonArray = <T>(value: unknown): T[] => {
        try {
          if (typeof value === 'string' && value) {
            return JSON.parse(value);
          }
          return [];
        } catch {
          return [];
        }
      };

      return {
        user_id: row.user_id as string,
        favorite_genres: parseJsonArray<string>(row.favorite_genres),
        disliked_genres: parseJsonArray<string>(row.disliked_genres),
        favorite_decades: parseJsonArray<string>(row.favorite_decades),
        rated_movies: parseJsonArray<RatedMovie>(row.rated_movies),
      };
    } catch {
      return defaultProfile;
    }
  }

  /**
   * Update user's taste profile
   */
  async updateTasteProfile(
    userId: string,
    data: Partial<Omit<UserTasteProfile, 'user_id'>>
  ): Promise<UserTasteProfile> {
    this.initialize();

    try {
      // Check if profile exists
      const existing = await this.client!.execute({
        sql: 'SELECT user_id FROM user_taste_profile WHERE user_id = ?',
        args: [userId],
      });

      if (existing.rows.length === 0) {
        // Insert new profile
        await this.client!.execute({
          sql: `INSERT INTO user_taste_profile (user_id, favorite_genres, disliked_genres, favorite_decades, rated_movies)
                VALUES (?, ?, ?, ?, ?)`,
          args: [
            userId,
            JSON.stringify(data.favorite_genres || []),
            JSON.stringify(data.disliked_genres || []),
            JSON.stringify(data.favorite_decades || []),
            JSON.stringify(data.rated_movies || []),
          ],
        });
      } else {
        // Update existing profile
        const updates: string[] = [];
        const args: (string | number)[] = [];

        if (data.favorite_genres !== undefined) {
          updates.push('favorite_genres = ?');
          args.push(JSON.stringify(data.favorite_genres));
        }

        if (data.disliked_genres !== undefined) {
          updates.push('disliked_genres = ?');
          args.push(JSON.stringify(data.disliked_genres));
        }

        if (data.favorite_decades !== undefined) {
          updates.push('favorite_decades = ?');
          args.push(JSON.stringify(data.favorite_decades));
        }

        if (data.rated_movies !== undefined) {
          updates.push('rated_movies = ?');
          args.push(JSON.stringify(data.rated_movies));
        }

        if (updates.length > 0) {
          args.push(userId);
          await this.client!.execute({
            sql: `UPDATE user_taste_profile SET ${updates.join(', ')} WHERE user_id = ?`,
            args,
          });
        }
      }

      return this.getUserTasteProfile(userId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add or update a movie rating in the user's taste profile
   */
  async rateMovie(
    userId: string,
    tmdbId: number,
    rating: number,
    title: string,
    mediaType?: 'movie' | 'tv'
  ): Promise<UserTasteProfile> {
    this.initialize();

    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const profile = await this.getUserTasteProfile(userId);
        const ratedMovies = [...profile.rated_movies];

        const existingIndex = ratedMovies.findIndex((m) => m.tmdb_id === tmdbId);
        const entry = { tmdb_id: tmdbId, rating, title, ...(mediaType ? { media_type: mediaType } : {}) };

        if (existingIndex >= 0) {
          ratedMovies[existingIndex] = entry;
        } else {
          ratedMovies.push(entry);
        }

        const newJson = JSON.stringify(ratedMovies);

        // Ensure profile exists first
        await this.client!.execute({
          sql: `INSERT OR IGNORE INTO user_taste_profile (user_id, favorite_genres, disliked_genres, favorite_decades, rated_movies)
                VALUES (?, '[]', '[]', '[]', '[]')`,
          args: [userId],
        });

        // Compare-and-swap: only update if data hasn't changed since our read
        const currentJson = JSON.stringify(profile.rated_movies);
        const result = await this.client!.execute({
          sql: `UPDATE user_taste_profile SET rated_movies = ? WHERE user_id = ? AND rated_movies = ?`,
          args: [newJson, userId, currentJson],
        });

        if (result.rowsAffected > 0) {
          return this.getUserTasteProfile(userId);
        }

        // Concurrent modification detected - retry
        console.warn(`⚠️ rateMovie CAS retry ${attempt + 1}/${maxRetries} for user ${userId}`);
      } catch (error) {
        if (attempt === maxRetries - 1) throw error;
      }
    }

    // Final fallback: force update (last resort)
    return this.updateTasteProfile(userId, {
      rated_movies: (await this.getUserTasteProfile(userId)).rated_movies,
    });
  }

  /**
   * Remove a movie from the user's rated movies list
   */
  async removeRating(userId: string, tmdbId: number): Promise<UserTasteProfile> {
    this.initialize();

    const profile = await this.getUserTasteProfile(userId);
    const ratedMovies = profile.rated_movies.filter((m) => m.tmdb_id !== tmdbId);

    return this.updateTasteProfile(userId, { rated_movies: ratedMovies });
  }

  // ==========================================================================
  // Push Token Methods
  // ==========================================================================

  /**
   * Save a push notification token for a user
   */
  async savePushToken(userId: string, token: string, platform: string = 'ios'): Promise<void> {
    this.initialize();

    try {
      await this.client!.execute({
        sql: `INSERT INTO push_tokens (user_id, token, platform)
              VALUES (?, ?, ?)
              ON CONFLICT(user_id, token) DO UPDATE SET platform = ?, created_at = CURRENT_TIMESTAMP`,
        args: [userId, token, platform, platform],
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Helper: Convert database row to WatchlistItem
   */
  private rowToWatchlistItem(row: Row): WatchlistItem {
    let providers: StreamingProvider[] = [];
    try {
      const providersStr = row.providers_json as string;
      if (providersStr) {
        providers = JSON.parse(providersStr);
      }
    } catch {
      providers = [];
    }

    return {
      id: row.id as string,
      user_id: row.user_id as string,
      tmdb_id: Number(row.tmdb_id),
      media_type: row.media_type as 'movie' | 'tv',
      title: row.title as string,
      poster_path: row.poster_path as string | null,
      added_at: row.added_at as string,
      last_provider_check: row.last_provider_check as string | null,
      providers,
      country: row.country as string,
      watched: Number(row.watched || 0) === 1,
      watched_at: (row.watched_at as string) || null,
      user_rating: row.user_rating != null ? Number(row.user_rating) : null,
      user_note: (row.user_note as string) || null,
    };
  }
  // ==========================================================================
  // Watchlist Watched Methods
  // ==========================================================================

  /**
   * Mark a watchlist item as watched/unwatched with optional rating and note
   */
  async markWatchlistWatched(
    userId: string,
    itemId: string,
    data: { watched: boolean; rating?: number; note?: string }
  ): Promise<WatchlistItem | null> {
    this.initialize();

    try {
      const updates: string[] = ['watched = ?'];
      const args: (string | number | null)[] = [data.watched ? 1 : 0];

      if (data.watched) {
        updates.push("watched_at = datetime('now')");
      } else {
        updates.push('watched_at = NULL');
      }

      if (data.rating !== undefined) {
        updates.push('user_rating = ?');
        args.push(data.rating);
      }

      if (data.note !== undefined) {
        updates.push('user_note = ?');
        args.push(data.note);
      }

      args.push(itemId, userId);

      const result = await this.client!.execute({
        sql: `UPDATE watchlist SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
        args,
      });

      if (result.rowsAffected === 0) {
        return null;
      }

      return this.getWatchlistItemById(itemId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get count of watched items for a user
   */
  async getWatchedCount(userId: string): Promise<number> {
    this.initialize();

    try {
      const result = await this.client!.execute({
        sql: 'SELECT COUNT(*) as count FROM watchlist WHERE user_id = ? AND watched = 1',
        args: [userId],
      });

      return Number(result.rows[0]?.count || 0);
    } catch {
      return 0;
    }
  }

  // ==========================================================================
  // User Stats Methods
  // ==========================================================================

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<UserStats> {
    this.initialize();

    try {
      // Run all queries in parallel
      const [searchCountResult, watchlistCount, watchedCount, user, activityDatesResult] =
        await Promise.all([
          this.client!.execute({
            sql: 'SELECT COUNT(*) as count FROM search_history WHERE user_id = ?',
            args: [userId],
          }),
          this.getWatchlistCount(userId),
          this.getWatchedCount(userId),
          this.getUserById(userId),
          this.client!.execute({
            sql: `SELECT date FROM user_activity
                  WHERE user_id = ?
                  ORDER BY date DESC`,
            args: [userId],
          }),
        ]);

      const totalSearches = Number(searchCountResult.rows[0]?.count || 0);
      const memberSince = user?.created_at || new Date().toISOString();

      // Calculate streaks from user_activity dates
      const activityDates = activityDatesResult.rows.map((row) => row.date as string);
      const { currentStreak, longestStreak } = this.calculateStreaks(activityDates);

      return {
        totalSearches,
        watchlistCount,
        watchedCount,
        memberSince,
        currentStreak,
        longestStreak,
      };
    } catch {
      return {
        totalSearches: 0,
        watchlistCount: 0,
        watchedCount: 0,
        memberSince: new Date().toISOString(),
        currentStreak: 0,
        longestStreak: 0,
      };
    }
  }

  /**
   * Calculate current and longest streaks from a list of dates (desc order)
   */
  private calculateStreaks(dates: string[]): { currentStreak: number; longestStreak: number } {
    if (dates.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const today = new Date().toISOString().split('T')[0];
    let currentStreak = 0;
    let longestStreak = 0;
    let streak = 1;

    // Check if the most recent search is today or yesterday (for current streak)
    const mostRecent = dates[0];
    const daysDiffFromToday = this.daysBetween(mostRecent, today);

    if (daysDiffFromToday > 1) {
      // No current streak (last search was more than 1 day ago)
      currentStreak = 0;
    }

    // Calculate streaks by iterating through consecutive dates
    for (let i = 1; i < dates.length; i++) {
      const diff = this.daysBetween(dates[i], dates[i - 1]);
      if (diff === 1) {
        streak++;
      } else {
        if (i === 1 || (i > 1 && currentStreak === 0 && daysDiffFromToday <= 1)) {
          // This was the current streak
        }
        longestStreak = Math.max(longestStreak, streak);
        streak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, streak);

    // Calculate current streak: count consecutive days from today/yesterday backwards
    if (daysDiffFromToday <= 1) {
      currentStreak = 1;
      for (let i = 1; i < dates.length; i++) {
        const diff = this.daysBetween(dates[i], dates[i - 1]);
        if (diff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    return { currentStreak, longestStreak };
  }

  /**
   * Calculate days between two date strings (YYYY-MM-DD)
   */
  private daysBetween(dateA: string, dateB: string): number {
    const a = new Date(dateA);
    const b = new Date(dateB);
    const diffMs = Math.abs(b.getTime() - a.getTime());
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }
}

// Export singleton instance
export const db = new DatabaseService();
