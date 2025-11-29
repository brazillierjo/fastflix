/**
 * FastFlix Backend - Anti-Abuse Detection
 * Detects and blocks suspicious behavior
 */

import { db } from './db';

interface AbuseRecord {
  failedAttempts: number;
  lastAttempt: number;
  firstAttempt: number;
}

class AntiAbuseService {
  private records: Map<string, AbuseRecord> = new Map();

  // Thresholds
  private readonly MAX_FAILED_ATTEMPTS = 10; // Max failed attempts before blocking
  private readonly FAILED_ATTEMPT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
  private readonly BLOCK_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Record a failed attempt (validation error, quota exceeded, etc.)
   */
  async recordFailedAttempt(deviceId: string): Promise<void> {
    const now = Date.now();
    const record = this.records.get(deviceId);

    if (!record) {
      // First failed attempt
      this.records.set(deviceId, {
        failedAttempts: 1,
        lastAttempt: now,
        firstAttempt: now,
      });
      return;
    }

    // Check if we're still in the window
    if (now - record.firstAttempt > this.FAILED_ATTEMPT_WINDOW_MS) {
      // Reset the window
      this.records.set(deviceId, {
        failedAttempts: 1,
        lastAttempt: now,
        firstAttempt: now,
      });
      return;
    }

    // Increment failed attempts
    record.failedAttempts++;
    record.lastAttempt = now;

    // Check if we should block
    if (record.failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
      await this.blockDevice(
        deviceId,
        `Automatic block: ${record.failedAttempts} failed attempts in ${Math.round((now - record.firstAttempt) / 1000)}s`
      );
      this.records.delete(deviceId); // Clean up
    }
  }

  /**
   * Record a successful attempt (clears the record)
   */
  async recordSuccessfulAttempt(deviceId: string): Promise<void> {
    this.records.delete(deviceId);
  }

  /**
   * Block a device
   */
  async blockDevice(deviceId: string, reason: string): Promise<void> {
    const blockedUntil = new Date(Date.now() + this.BLOCK_DURATION_MS).toISOString();

    try {
      await db.blockDevice(deviceId, reason, blockedUntil);
    } catch (error) {
      console.error('❌ Failed to block device:', error);
    }
  }

  /**
   * Clean up old records
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [deviceId, record] of this.records.entries()) {
      if (now - record.lastAttempt > this.FAILED_ATTEMPT_WINDOW_MS) {
        this.records.delete(deviceId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Anti-abuse cleaned up ${cleaned} expired records`);
    }
  }
}

// Export singleton instance
export const antiAbuse = new AntiAbuseService();

// Cleanup every 15 minutes
setInterval(
  () => {
    antiAbuse.cleanup();
  },
  15 * 60 * 1000
);
