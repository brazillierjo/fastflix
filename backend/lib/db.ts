/**
 * FastFlix Backend - Database Service
 * Turso (libSQL) database client and operations
 */

import { createClient, Client, Row } from '@libsql/client';
import type { User, TrialInfo, UserPreferences, WatchlistItem, StreamingProvider } from './types';

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
        sql: 'SELECT * FROM users WHERE id = ?',
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
        sql: 'SELECT * FROM users WHERE email = ?',
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
        sql: 'SELECT * FROM users WHERE auth_provider = ? AND provider_user_id = ?',
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
   * Log a prompt with user_id for analytics
   */
  async logPromptWithUserId(
    userId: string,
    query: string,
    resultsCount: number,
    responseTimeMs: number
  ): Promise<void> {
    this.initialize();

    try {
      await this.client!.execute({
        sql: `INSERT INTO prompt_logs (user_id, device_id, query, results_count, response_time_ms)
              VALUES (?, 'authenticated', ?, ?, ?)`,
        args: [userId, query, resultsCount, responseTimeMs],
      });
    } catch {
      // Don't throw - logging should not break the request
    }
  }

  // ==========================================================================
  // Trial Methods (Free Trial)
  // ==========================================================================

  /**
   * Start a free trial for a user (7 days)
   * Returns the trial info if successful, null if trial already used
   */
  async startFreeTrial(userId: string): Promise<TrialInfo | null> {
    this.initialize();

    try {
      // Check if user has already used their trial
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if trial already used (trial_used = 1)
      const checkResult = await this.client!.execute({
        sql: 'SELECT trial_used FROM users WHERE id = ?',
        args: [userId],
      });

      if (checkResult.rows.length > 0) {
        const trialUsed = Number(checkResult.rows[0].trial_used) === 1;
        if (trialUsed) {
          return null;
        }
      }

      // Start the trial - set trial_started_at, trial_ends_at (+7 days), trial_used = 1
      await this.client!.execute({
        sql: `UPDATE users
              SET trial_started_at = datetime('now'),
                  trial_ends_at = datetime('now', '+7 days'),
                  trial_used = 1,
                  updated_at = datetime('now')
              WHERE id = ?`,
        args: [userId],
      });

      // Return the trial info
      return this.getTrialInfo(userId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if a user has already used their free trial
   */
  async hasUsedFreeTrial(userId: string): Promise<boolean> {
    this.initialize();

    try {
      const result = await this.client!.execute({
        sql: 'SELECT trial_used FROM users WHERE id = ?',
        args: [userId],
      });

      if (result.rows.length === 0) {
        return false;
      }

      return Number(result.rows[0].trial_used) === 1;
    } catch {
      return false;
    }
  }

  /**
   * Check if a user is currently in an active free trial
   */
  async isInFreeTrial(userId: string): Promise<boolean> {
    this.initialize();

    try {
      const result = await this.client!.execute({
        sql: `SELECT trial_ends_at FROM users
              WHERE id = ?
              AND trial_used = 1
              AND trial_ends_at IS NOT NULL
              AND datetime(trial_ends_at) > datetime('now')`,
        args: [userId],
      });

      return result.rows.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get trial information for a user
   */
  async getTrialInfo(userId: string): Promise<TrialInfo> {
    this.initialize();

    try {
      const result = await this.client!.execute({
        sql: 'SELECT trial_started_at, trial_ends_at, trial_used FROM users WHERE id = ?',
        args: [userId],
      });

      if (result.rows.length === 0) {
        return {
          isActive: false,
          daysRemaining: 0,
          startsAt: null,
          endsAt: null,
          used: false,
        };
      }

      const row = result.rows[0];
      const trialUsed = Number(row.trial_used) === 1;
      const trialStartsAt = row.trial_started_at as string | null;
      const trialEndsAt = row.trial_ends_at as string | null;

      // Calculate if trial is active and days remaining
      let isActive = false;
      let daysRemaining = 0;

      if (trialUsed && trialEndsAt) {
        const endsAtDate = new Date(trialEndsAt);
        const now = new Date();

        if (endsAtDate > now) {
          isActive = true;
          // Calculate days remaining (round up)
          const diffMs = endsAtDate.getTime() - now.getTime();
          daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        }
      }

      return {
        isActive,
        daysRemaining,
        startsAt: trialStartsAt,
        endsAt: trialEndsAt,
        used: trialUsed,
      };
    } catch {
      return {
        isActive: false,
        daysRemaining: 0,
        startsAt: null,
        endsAt: null,
        used: false,
      };
    }
  }

  /**
   * Check if user has access (subscription OR active trial)
   */
  async hasAccess(userId: string): Promise<boolean> {
    const hasSubscription = await this.hasActiveSubscriptionByUserId(userId);
    if (hasSubscription) {
      return true;
    }

    const isInTrial = await this.isInFreeTrial(userId);
    return isInTrial;
  }

  /**
   * End the free trial early (e.g., when user subscribes)
   * This sets trial_ends_at to now, so the trial is no longer active
   */
  async endFreeTrial(userId: string): Promise<void> {
    this.initialize();

    try {
      await this.client!.execute({
        sql: `UPDATE users
              SET trial_ends_at = datetime('now'),
                  updated_at = datetime('now')
              WHERE id = ? AND trial_used = 1`,
        args: [userId],
      });
    } catch (error) {
      // Don't throw - ending trial should not break the subscription flow
      console.error('Failed to end free trial:', error);
    }
  }

  /**
   * Get subscription details for a user
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
          isActive: false,
          status: null,
          productId: null,
          expiresAt: null,
          createdAt: null,
          willRenew: false,
        };
      }

      const row = result.rows[0];
      const status = row.status as string;
      const expiresAt = row.expires_at as string | null;

      // Check if subscription is active (not expired)
      let isActive = false;
      if (status === 'active' || status === 'cancelled') {
        if (expiresAt) {
          const expiresAtDate = new Date(expiresAt);
          isActive = expiresAtDate > new Date();
        } else {
          // No expiration date means lifetime or error
          isActive = status === 'active';
        }
      }

      // Will renew if status is 'active' (cancelled means won't renew)
      const willRenew = status === 'active';

      return {
        isActive,
        status,
        productId: row.product_id as string | null,
        expiresAt,
        createdAt: row.created_at as string | null,
        willRenew,
      };
    } catch {
      return {
        isActive: false,
        status: null,
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
    };
  }
}

// Export singleton instance
export const db = new DatabaseService();
