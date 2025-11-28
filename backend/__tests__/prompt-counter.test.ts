/**
 * Tests for PromptCounterService
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { PromptCheckResult } from '../lib/types';

// Mock the database module
jest.mock('../lib/db', () => ({
  db: {
    isDeviceBlocked: jest.fn(),
    hasActiveSubscription: jest.fn(),
    getOrCreateUser: jest.fn(),
    incrementPromptCount: jest.fn(),
  },
}));

describe('PromptCounterService', () => {
  let promptCounter: any;
  let mockDb: any;

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Re-import modules to get fresh instances
    const dbModule = await import('../lib/db');
    mockDb = dbModule.db;

    const promptCounterModule = await import('../lib/prompt-counter');
    promptCounter = promptCounterModule.promptCounter;
  });

  describe('canMakePrompt', () => {
    it('should deny access for blocked devices', async () => {
      mockDb.isDeviceBlocked.mockResolvedValue(true);

      const result: PromptCheckResult = await promptCounter.canMakePrompt('blocked-device');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('device_blocked');
      expect(result.isProUser).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should allow unlimited access for Pro users', async () => {
      mockDb.isDeviceBlocked.mockResolvedValue(false);
      mockDb.hasActiveSubscription.mockResolvedValue(true);

      const result: PromptCheckResult = await promptCounter.canMakePrompt('pro-user');

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('active_subscription');
      expect(result.isProUser).toBe(true);
      expect(result.remaining).toBe(Infinity);
    });

    it('should allow access for free users within monthly limit', async () => {
      mockDb.isDeviceBlocked.mockResolvedValue(false);
      mockDb.hasActiveSubscription.mockResolvedValue(false);
      mockDb.getOrCreateUser.mockResolvedValue({
        device_id: 'free-user',
        prompt_count: 1,
        current_month: '2025-11',
      });

      const result: PromptCheckResult = await promptCounter.canMakePrompt('free-user');

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('within_monthly_limit');
      expect(result.isProUser).toBe(false);
      expect(result.remaining).toBe(2); // 3 - 1 = 2
    });

    it('should deny access when monthly limit is reached', async () => {
      mockDb.isDeviceBlocked.mockResolvedValue(false);
      mockDb.hasActiveSubscription.mockResolvedValue(false);
      mockDb.getOrCreateUser.mockResolvedValue({
        device_id: 'limit-reached',
        prompt_count: 3,
        current_month: '2025-11',
      });

      const result: PromptCheckResult = await promptCounter.canMakePrompt('limit-reached');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('monthly_limit_reached');
      expect(result.isProUser).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      mockDb.isDeviceBlocked.mockRejectedValue(new Error('Database connection failed'));

      const result: PromptCheckResult = await promptCounter.canMakePrompt('error-device');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('database_error');
      expect(result.remaining).toBe(0);
    });
  });

  describe('getPromptStats', () => {
    it('should return stats for free users', async () => {
      mockDb.hasActiveSubscription.mockResolvedValue(false);
      mockDb.getOrCreateUser.mockResolvedValue({
        device_id: 'free-user',
        prompt_count: 2,
        current_month: '2025-11',
      });

      const stats = await promptCounter.getPromptStats('free-user');

      expect(stats.promptsUsed).toBe(2);
      expect(stats.promptsRemaining).toBe(1);
      expect(stats.maxFreePrompts).toBe(3);
      expect(stats.isProUser).toBe(false);
      expect(stats.currentMonth).toBe('2025-11');
    });

    it('should return unlimited stats for Pro users', async () => {
      mockDb.hasActiveSubscription.mockResolvedValue(true);
      mockDb.getOrCreateUser.mockResolvedValue({
        device_id: 'pro-user',
        prompt_count: 10,
        current_month: '2025-11',
      });

      const stats = await promptCounter.getPromptStats('pro-user');

      expect(stats.promptsUsed).toBe(10);
      expect(stats.promptsRemaining).toBe(Infinity);
      expect(stats.isProUser).toBe(true);
    });
  });

  describe('recordPromptUsage', () => {
    it('should not increment count for Pro users', async () => {
      mockDb.hasActiveSubscription.mockResolvedValue(true);

      const result = await promptCounter.recordPromptUsage('pro-user');

      expect(result).toBe(0);
      expect(mockDb.incrementPromptCount).not.toHaveBeenCalled();
    });

    it('should increment count for free users', async () => {
      mockDb.hasActiveSubscription.mockResolvedValue(false);
      mockDb.incrementPromptCount.mockResolvedValue(2);

      const result = await promptCounter.recordPromptUsage('free-user');

      expect(result).toBe(2);
      expect(mockDb.incrementPromptCount).toHaveBeenCalledWith('free-user');
    });
  });
});
