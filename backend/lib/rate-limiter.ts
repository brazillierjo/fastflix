/**
 * FastFlix Backend - Rate Limiter
 * In-memory rate limiting for API endpoints
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000
    );
  }

  /**
   * Check if a request should be rate limited
   * @param key - Unique identifier (IP, deviceId, etc.)
   * @param maxRequests - Maximum requests allowed in the window
   * @param windowMs - Time window in milliseconds
   * @returns true if request should be allowed, false if rate limited
   */
  async checkLimit(key: string, maxRequests: number, windowMs: number): Promise<boolean> {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetAt) {
      // No entry or window expired - create new entry
      this.limits.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return true;
    }

    // Check if limit exceeded
    if (entry.count >= maxRequests) {
      return false;
    }

    // Increment counter
    entry.count++;
    return true;
  }

  /**
   * Get remaining requests for a key
   */
  async getRemaining(key: string, maxRequests: number): Promise<number> {
    const entry = this.limits.get(key);
    if (!entry) {
      return maxRequests;
    }

    const now = Date.now();
    if (now > entry.resetAt) {
      return maxRequests;
    }

    return Math.max(0, maxRequests - entry.count);
  }

  /**
   * Get time until reset (in seconds)
   */
  async getResetTime(key: string): Promise<number> {
    const entry = this.limits.get(key);
    if (!entry) {
      return 0;
    }

    const now = Date.now();
    if (now > entry.resetAt) {
      return 0;
    }

    return Math.ceil((entry.resetAt - now) / 1000);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetAt) {
        this.limits.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Rate limiter cleaned up ${cleaned} expired entries`);
    }
  }

  /**
   * Reset limit for a specific key (useful for testing)
   */
  async reset(key: string): Promise<void> {
    this.limits.delete(key);
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.limits.clear();
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations
 * Can be overridden with environment variables
 */
export const RATE_LIMITS = {
  // Per IP limits
  perIP: {
    search: {
      maxRequests: Number(process.env.RATE_LIMIT_IP_SEARCH) || 10,
      windowMs: 60 * 1000,
    },
    checkLimit: {
      maxRequests: Number(process.env.RATE_LIMIT_IP_CHECK_LIMIT) || 30,
      windowMs: 60 * 1000,
    },
    webhook: {
      maxRequests: Number(process.env.RATE_LIMIT_IP_WEBHOOK) || 100,
      windowMs: 60 * 1000,
    },
  },
  // Per device limits
  perDevice: {
    search: {
      maxRequests: Number(process.env.RATE_LIMIT_DEVICE_SEARCH) || 5,
      windowMs: 60 * 1000,
    },
    checkLimit: {
      maxRequests: Number(process.env.RATE_LIMIT_DEVICE_CHECK_LIMIT) || 20,
      windowMs: 60 * 1000,
    },
  },
};
