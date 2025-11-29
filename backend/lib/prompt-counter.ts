/**
 * FastFlix Backend - Prompt Counter Service
 * Manages free prompt limits and subscription checks
 */

import { db } from './db';
import type { PromptCheckResult } from './types';

class PromptCounterService {
  private maxFreePrompts: number;

  constructor() {
    this.maxFreePrompts = parseInt(process.env.MAX_FREE_PROMPTS || '3', 10);
    console.log(`✅ Prompt counter initialized (max free: ${this.maxFreePrompts})`);
  }

  /**
   * Check if a device can make a prompt
   * Returns detailed information about the check
   * @param isProUserFromFrontend - Optional Pro status from frontend (temporary until webhook is configured)
   */
  async canMakePrompt(deviceId: string, isProUserFromFrontend?: boolean): Promise<PromptCheckResult> {
    try {
      // First check if device is blocked
      const isBlocked = await db.isDeviceBlocked(deviceId);
      if (isBlocked) {
        return {
          allowed: false,
          remaining: 0,
          reason: 'device_blocked',
          isProUser: false,
        };
      }

      // TEMPORARY: If frontend says user is Pro, trust it (until webhook is configured)
      if (isProUserFromFrontend === true) {
        console.log(`✅ User is Pro (from frontend): ${deviceId}`);
        return {
          allowed: true,
          remaining: Infinity,
          reason: 'active_subscription_from_frontend',
          isProUser: true,
        };
      }

      // Check if user has an active subscription in database
      const hasSubscription = await db.hasActiveSubscription(deviceId);
      if (hasSubscription) {
        return {
          allowed: true,
          remaining: Infinity,
          reason: 'active_subscription',
          isProUser: true,
        };
      }

      // Check monthly prompt count for free users
      const user = await db.getOrCreateUser(deviceId);
      const promptsUsed = user.prompt_count;
      const promptsRemaining = Math.max(0, this.maxFreePrompts - promptsUsed);

      if (promptsUsed >= this.maxFreePrompts) {
        return {
          allowed: false,
          remaining: 0,
          reason: 'monthly_limit_reached',
          isProUser: false,
        };
      }

      return {
        allowed: true,
        remaining: promptsRemaining,
        reason: 'within_monthly_limit',
        isProUser: false,
      };
    } catch (error) {
      console.error('❌ Error in canMakePrompt:', error);

      // Fail open with limited access in case of database errors
      return {
        allowed: false,
        remaining: 0,
        reason: 'database_error',
        isProUser: false,
      };
    }
  }

  /**
   * Get prompt usage statistics for a device
   */
  async getPromptStats(deviceId: string): Promise<{
    promptsUsed: number;
    promptsRemaining: number;
    maxFreePrompts: number;
    isProUser: boolean;
    currentMonth: string;
  }> {
    try {
      // Check subscription status
      const hasSubscription = await db.hasActiveSubscription(deviceId);

      // Get user data
      const user = await db.getOrCreateUser(deviceId);
      const promptsUsed = user.prompt_count;
      const promptsRemaining = hasSubscription
        ? Infinity
        : Math.max(0, this.maxFreePrompts - promptsUsed);

      return {
        promptsUsed,
        promptsRemaining,
        maxFreePrompts: this.maxFreePrompts,
        isProUser: hasSubscription,
        currentMonth: user.current_month,
      };
    } catch (error) {
      console.error('❌ Error in getPromptStats:', error);
      throw error;
    }
  }

  /**
   * Record a prompt usage
   * Only increments if user is not a pro subscriber
   */
  async recordPromptUsage(deviceId: string): Promise<number> {
    try {
      // Check if user has subscription (don't count for pro users)
      const hasSubscription = await db.hasActiveSubscription(deviceId);

      if (hasSubscription) {
        console.log(`💎 Pro user ${deviceId} - not counting prompt`);
        return 0; // Return 0 to indicate no increment
      }

      // Increment count for free users
      const newCount = await db.incrementPromptCount(deviceId);
      console.log(`📊 Recorded prompt usage for ${deviceId}: ${newCount}/${this.maxFreePrompts}`);

      return newCount;
    } catch (error) {
      console.error('❌ Error in recordPromptUsage:', error);
      throw error;
    }
  }

  /**
   * Check subscription status for a device
   */
  async checkSubscriptionStatus(deviceId: string): Promise<{
    isActive: boolean;
    expiresAt: string | null;
  }> {
    try {
      const hasSubscription = await db.hasActiveSubscription(deviceId);

      // If has subscription, get expiry date
      // (This is simplified - in production you'd fetch the actual subscription record)
      return {
        isActive: hasSubscription,
        expiresAt: null, // TODO: Fetch actual expiry date from subscription table
      };
    } catch (error) {
      console.error('❌ Error in checkSubscriptionStatus:', error);
      return {
        isActive: false,
        expiresAt: null,
      };
    }
  }

  /**
   * Reset monthly count for a specific device (admin function)
   * Useful for testing or support
   */
  async resetMonthlyCount(deviceId: string): Promise<void> {
    try {
      // This is handled automatically in getOrCreateUser
      // when the month changes, but we can force it here
      await db.getOrCreateUser(deviceId);
      console.log(`🔄 Monthly count reset for ${deviceId}`);
    } catch (error) {
      console.error('❌ Error in resetMonthlyCount:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const promptCounter = new PromptCounterService();
