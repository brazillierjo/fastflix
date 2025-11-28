/**
 * FastFlix Backend - Database Service
 * Turso (libSQL) database client and operations
 */

import { createClient, Client, Row } from '@libsql/client';
import type { UserPrompt, Subscription } from './types';

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
   * Get current month in YYYY-MM format
   */
  private getCurrentMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Get or create a user in the database
   * Automatically resets prompt count if it's a new month
   */
  async getOrCreateUser(
    deviceId: string,
    platform?: 'ios' | 'android',
    appVersion?: string
  ): Promise<UserPrompt> {
    const client = this.getClient();
    const currentMonth = this.getCurrentMonth();

    try {
      // Check if user exists
      const result = await client.execute({
        sql: 'SELECT * FROM user_prompts WHERE device_id = ?',
        args: [deviceId],
      });

      if (result.rows.length > 0) {
        const user = rowToObject<UserPrompt>(result.rows[0]);

        // Check if we need to reset the monthly count
        if (user.current_month !== currentMonth) {
          console.log(`📅 Resetting monthly count for ${deviceId} (new month: ${currentMonth})`);

          await client.execute({
            sql: `UPDATE user_prompts
                  SET prompt_count = 0,
                      current_month = ?,
                      last_updated = CURRENT_TIMESTAMP
                  WHERE device_id = ?`,
            args: [currentMonth, deviceId],
          });

          // Return updated user
          return {
            ...user,
            prompt_count: 0,
            current_month: currentMonth,
          };
        }

        return user;
      }

      // Create new user
      console.log(`➕ Creating new user: ${deviceId}`);

      await client.execute({
        sql: `INSERT INTO user_prompts
              (device_id, prompt_count, current_month, platform, app_version)
              VALUES (?, 0, ?, ?, ?)`,
        args: [deviceId, currentMonth, platform || null, appVersion || null],
      });

      // Return the newly created user
      const newUserResult = await client.execute({
        sql: 'SELECT * FROM user_prompts WHERE device_id = ?',
        args: [deviceId],
      });

      return rowToObject<UserPrompt>(newUserResult.rows[0]);
    } catch (error) {
      console.error('❌ Database error in getOrCreateUser:', error);
      throw error;
    }
  }

  /**
   * Get prompt count for a device
   */
  async getPromptCount(deviceId: string): Promise<number> {
    const user = await this.getOrCreateUser(deviceId);
    return user.prompt_count;
  }

  /**
   * Increment prompt count for a device
   */
  async incrementPromptCount(deviceId: string): Promise<number> {
    const client = this.getClient();

    try {
      // First ensure user exists and month is current
      await this.getOrCreateUser(deviceId);

      // Increment the count
      await client.execute({
        sql: `UPDATE user_prompts
              SET prompt_count = prompt_count + 1,
                  last_updated = CURRENT_TIMESTAMP
              WHERE device_id = ?`,
        args: [deviceId],
      });

      // Get the new count
      const result = await client.execute({
        sql: 'SELECT prompt_count FROM user_prompts WHERE device_id = ?',
        args: [deviceId],
      });

      const row = rowToObject<{ prompt_count: number }>(result.rows[0]);
      console.log(`📊 Incremented prompt count for ${deviceId}: ${row.prompt_count}`);

      return row.prompt_count;
    } catch (error) {
      console.error('❌ Database error in incrementPromptCount:', error);
      throw error;
    }
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
   * Get count of prompt logs with zero results for a device in a time window
   */
  async getZeroResultCount(deviceId: string, hoursAgo: number): Promise<number> {
    const client = this.getClient();

    try {
      const result = await client.execute({
        sql: `SELECT COUNT(*) as zero_result_count
              FROM prompt_logs
              WHERE device_id = ?
                AND results_count = 0
                AND created_at > datetime('now', ?)`,
        args: [deviceId, `-${hoursAgo} hour`],
      });

      const row = rowToObject<{ zero_result_count: number }>(result.rows[0]);
      return row.zero_result_count;
    } catch (error) {
      console.error('❌ Database error in getZeroResultCount:', error);
      return 0;
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
}

// Export singleton instance
export const db = new DatabaseService();
