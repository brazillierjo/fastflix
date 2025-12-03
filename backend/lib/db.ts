/**
 * FastFlix Backend - Database Service
 * Turso (libSQL) database client and operations
 */

import { createClient, Client, Row } from '@libsql/client';
import type { Subscription, User, TrialInfo, UserPreferences } from './types';

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
    console.log('✅ Turso client initialized');
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

  /**
   * Check if a device has an active subscription
   * Returns true if subscription is 'active' or 'cancelled' with valid expiration date
   */
  async hasActiveSubscription(deviceId: string): Promise<boolean> {
    const client = this.getClient();

    try {
      const result = await client.execute({
        sql: `SELECT status, expires_at FROM subscriptions
              WHERE device_id = ? AND (status = 'active' OR status = 'cancelled')`,
        args: [deviceId],
      });

      if (result.rows.length === 0) {
        return false;
      }

      const subscription = rowToObject<Subscription>(result.rows[0]);

      // Check if subscription has expired
      if (subscription.expires_at) {
        const expiresAt = new Date(subscription.expires_at);
        if (expiresAt < new Date()) {
          // Subscription expired, update status
          await client.execute({
            sql: `UPDATE subscriptions SET status = 'expired' WHERE device_id = ?`,
            args: [deviceId],
          });
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Database error in hasActiveSubscription:', error);
      return false;
    }
  }

  /**
   * Log a prompt usage for analytics
   */
  async logPrompt(
    deviceId: string,
    query: string | null,
    resultsCount: number,
    responseTimeMs: number
  ): Promise<void> {
    const client = this.getClient();

    try {
      await client.execute({
        sql: `INSERT INTO prompt_logs
              (device_id, query, results_count, response_time_ms)
              VALUES (?, ?, ?, ?)`,
        args: [deviceId, query, resultsCount, responseTimeMs],
      });
    } catch (error) {
      // Don't throw on logging errors, just log them
      console.error('⚠️ Failed to log prompt:', error);
    }
  }

  /**
   * Check if a device is blocked
   */
  async isDeviceBlocked(deviceId: string): Promise<boolean> {
    const client = this.getClient();

    try {
      const result = await client.execute({
        sql: `SELECT blocked_until FROM blocked_devices WHERE device_id = ?`,
        args: [deviceId],
      });

      if (result.rows.length === 0) {
        return false;
      }

      const blockedDevice = rowToObject<{ blocked_until: string | null }>(result.rows[0]);

      // If blocked_until is NULL, it's permanently blocked
      if (!blockedDevice.blocked_until) {
        return true;
      }

      // Check if the blocking period has expired
      const blockedUntil = new Date(blockedDevice.blocked_until);
      if (blockedUntil < new Date()) {
        // Unblock the device
        await client.execute({
          sql: `DELETE FROM blocked_devices WHERE device_id = ?`,
          args: [deviceId],
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Database error in isDeviceBlocked:', error);
      return false;
    }
  }

  /**
   * Block a device
   */
  async blockDevice(deviceId: string, reason: string, blockedUntil: string | null): Promise<void> {
    const client = this.getClient();

    try {
      await client.execute({
        sql: `INSERT INTO blocked_devices (device_id, reason, blocked_until)
              VALUES (?, ?, ?)
              ON CONFLICT(device_id) DO UPDATE SET
                reason = excluded.reason,
                blocked_until = excluded.blocked_until,
                blocked_at = CURRENT_TIMESTAMP`,
        args: [deviceId, reason, blockedUntil],
      });

      console.warn(`🚫 Device blocked: ${deviceId} - ${reason}`);
    } catch (error) {
      console.error('❌ Database error in blockDevice:', error);
      throw error;
    }
  }

  /**
   * Update or create a subscription
   */
  async upsertSubscription(
    subscription: Partial<Subscription> & { device_id: string }
  ): Promise<void> {
    const client = this.getClient();

    try {
      const { device_id, revenuecat_user_id, status, expires_at, product_id } = subscription;

      await client.execute({
        sql: `INSERT INTO subscriptions
              (device_id, revenuecat_user_id, status, expires_at, product_id)
              VALUES (?, ?, ?, ?, ?)
              ON CONFLICT(device_id) DO UPDATE SET
                revenuecat_user_id = excluded.revenuecat_user_id,
                status = excluded.status,
                expires_at = excluded.expires_at,
                product_id = excluded.product_id,
                last_updated = CURRENT_TIMESTAMP`,
        args: [
          device_id,
          revenuecat_user_id || null,
          status || 'active',
          expires_at || null,
          product_id || null,
        ],
      });

      console.log(`💳 Subscription updated for ${device_id}: ${status}`);
    } catch (error) {
      console.error('❌ Database error in upsertSubscription:', error);
      throw error;
    }
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

      console.log(`✅ User created: ${email} (${auth_provider})`);

      // Return the created user
      const user = await this.getUserById(id);
      if (!user) {
        throw new Error('Failed to retrieve created user');
      }

      return user;
    } catch (error) {
      console.error('❌ Database error in createUser:', error);
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
      console.error('❌ Database error in getUserById:', error);
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
      console.error('❌ Database error in getUserByEmail:', error);
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
      console.error('❌ Database error in getUserByProvider:', error);
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

      console.log(`✅ User updated: ${id}`);

      const user = await this.getUserById(id);
      if (!user) {
        throw new Error('Failed to retrieve updated user');
      }

      return user;
    } catch (error) {
      console.error('❌ Database error in updateUser:', error);
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
    } catch (error) {
      console.error('❌ Database error in hasActiveSubscriptionByUserId:', error);
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

      console.log(`✅ Subscription upserted for user_id: ${user_id}`);
    } catch (error) {
      console.error('❌ Database error in upsertSubscriptionByUserId:', error);
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
    } catch (error) {
      console.error('❌ Database error in logPromptWithUserId:', error);
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
          console.log(`⚠️ User ${userId} has already used their free trial`);
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

      console.log(`🎉 Free trial started for user ${userId}`);

      // Return the trial info
      return this.getTrialInfo(userId);
    } catch (error) {
      console.error('❌ Database error in startFreeTrial:', error);
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
    } catch (error) {
      console.error('❌ Database error in hasUsedFreeTrial:', error);
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
    } catch (error) {
      console.error('❌ Database error in isInFreeTrial:', error);
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
    } catch (error) {
      console.error('❌ Database error in getTrialInfo:', error);
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
    } catch (error) {
      console.error('❌ Database error in getUserPreferences:', error);
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

        console.log(`✅ User preferences updated for ${userId}`);
      }

      return this.getUserPreferences(userId);
    } catch (error) {
      console.error('❌ Database error in updateUserPreferences:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const db = new DatabaseService();
