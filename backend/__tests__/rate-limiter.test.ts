/**
 * Tests for RateLimiter
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { rateLimiter } from '../lib/rate-limiter';

describe('RateLimiter', () => {
  beforeEach(async () => {
    // Reset rate limiter state before each test
    await rateLimiter.reset('test-key');
  });

  describe('checkLimit', () => {
    it('should allow first request', async () => {
      const allowed = await rateLimiter.checkLimit('test-key', 3, 60000);

      expect(allowed).toBe(true);
    });

    it('should allow requests within limit', async () => {
      await rateLimiter.checkLimit('test-key', 3, 60000);
      await rateLimiter.checkLimit('test-key', 3, 60000);
      const thirdRequest = await rateLimiter.checkLimit('test-key', 3, 60000);

      expect(thirdRequest).toBe(true);
    });

    it('should block requests exceeding limit', async () => {
      await rateLimiter.checkLimit('test-key', 3, 60000);
      await rateLimiter.checkLimit('test-key', 3, 60000);
      await rateLimiter.checkLimit('test-key', 3, 60000);
      const fourthRequest = await rateLimiter.checkLimit('test-key', 3, 60000);

      expect(fourthRequest).toBe(false);
    });

    it('should reset after time window expires', async () => {
      // First request
      const firstRequest = await rateLimiter.checkLimit('test-key', 1, 100);
      expect(firstRequest).toBe(true);

      // Second request should be blocked
      const secondRequest = await rateLimiter.checkLimit('test-key', 1, 100);
      expect(secondRequest).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Third request should be allowed (new window)
      const thirdRequest = await rateLimiter.checkLimit('test-key', 1, 100);
      expect(thirdRequest).toBe(true);
    });

    it('should handle different keys independently', async () => {
      await rateLimiter.checkLimit('key-1', 1, 60000);
      const key1SecondRequest = await rateLimiter.checkLimit('key-1', 1, 60000);

      const key2FirstRequest = await rateLimiter.checkLimit('key-2', 1, 60000);

      expect(key1SecondRequest).toBe(false); // key-1 limit exceeded
      expect(key2FirstRequest).toBe(true); // key-2 still has quota
    });
  });

  describe('getRemaining', () => {
    it('should return max requests for new key', async () => {
      const remaining = await rateLimiter.getRemaining('new-key', 5);

      expect(remaining).toBe(5);
    });

    it('should return correct remaining count', async () => {
      await rateLimiter.checkLimit('test-key', 5, 60000);
      await rateLimiter.checkLimit('test-key', 5, 60000);

      const remaining = await rateLimiter.getRemaining('test-key', 5);

      expect(remaining).toBe(3); // 5 - 2 = 3
    });

    it('should return 0 when limit is exceeded', async () => {
      await rateLimiter.checkLimit('test-key', 2, 60000);
      await rateLimiter.checkLimit('test-key', 2, 60000);
      await rateLimiter.checkLimit('test-key', 2, 60000);

      const remaining = await rateLimiter.getRemaining('test-key', 2);

      expect(remaining).toBe(0);
    });
  });

  describe('getResetTime', () => {
    it('should return 0 for new key', async () => {
      const resetTime = await rateLimiter.getResetTime('new-key');

      expect(resetTime).toBe(0);
    });

    it('should return time until reset', async () => {
      await rateLimiter.checkLimit('test-key', 3, 5000); // 5 second window

      const resetTime = await rateLimiter.getResetTime('test-key');

      // Reset time should be roughly 5 seconds (allowing some margin)
      expect(resetTime).toBeGreaterThan(0);
      expect(resetTime).toBeLessThanOrEqual(5);
    });
  });

  describe('reset', () => {
    it('should reset limit for specific key', async () => {
      await rateLimiter.checkLimit('test-key', 1, 60000);
      const blockedRequest = await rateLimiter.checkLimit('test-key', 1, 60000);
      expect(blockedRequest).toBe(false);

      // Reset the key
      await rateLimiter.reset('test-key');

      // Should be allowed again
      const allowedRequest = await rateLimiter.checkLimit('test-key', 1, 60000);
      expect(allowedRequest).toBe(true);
    });
  });
});
