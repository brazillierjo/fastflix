/**
 * Tests for Zod validation schemas
 */

import { describe, it, expect } from '@jest/globals';
import { deviceIdSchema, checkLimitSchema, searchRequestSchema } from '../lib/validation';

describe('Validation Schemas', () => {
  describe('deviceIdSchema', () => {
    it('should accept valid device ID', () => {
      const result = deviceIdSchema.safeParse({
        deviceId: 'abc-123-def-456',
      });

      expect(result.success).toBe(true);
    });

    it('should reject empty device ID', () => {
      const result = deviceIdSchema.safeParse({
        deviceId: '',
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing device ID', () => {
      const result = deviceIdSchema.safeParse({});

      expect(result.success).toBe(false);
    });

    it('should reject too long device ID', () => {
      const longId = 'a'.repeat(300);
      const result = deviceIdSchema.safeParse({
        deviceId: longId,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('checkLimitSchema', () => {
    it('should accept valid check limit request', () => {
      const result = checkLimitSchema.safeParse({
        deviceId: 'test-device-123',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deviceId).toBe('test-device-123');
      }
    });

    it('should reject invalid device ID', () => {
      const result = checkLimitSchema.safeParse({
        deviceId: '',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('searchRequestSchema', () => {
    it('should accept valid search request with all fields', () => {
      const validRequest = {
        deviceId: 'test-device-123',
        query: 'action movies',
        includeMovies: true,
        includeTvShows: false,
        platform: 'ios',
        appVersion: '1.0.0',
        language: 'fr-FR',
        country: 'FR',
      };

      const result = searchRequestSchema.safeParse(validRequest);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deviceId).toBe('test-device-123');
        expect(result.data.query).toBe('action movies');
        expect(result.data.includeMovies).toBe(true);
        expect(result.data.includeTvShows).toBe(false);
        expect(result.data.platform).toBe('ios');
      }
    });

    it('should use default values for optional fields', () => {
      const minimalRequest = {
        deviceId: 'test-device',
        query: 'horror',
        platform: 'android',
        appVersion: '1.0.0',
      };

      const result = searchRequestSchema.safeParse(minimalRequest);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeMovies).toBe(true); // default
        expect(result.data.includeTvShows).toBe(true); // default
        expect(result.data.language).toBe('fr-FR'); // default
        expect(result.data.country).toBe('FR'); // default
      }
    });

    it('should reject empty query', () => {
      const result = searchRequestSchema.safeParse({
        deviceId: 'test-device',
        query: '',
        platform: 'ios',
        appVersion: '1.0.0',
      });

      expect(result.success).toBe(false);
    });

    it('should reject too long query', () => {
      const longQuery = 'a'.repeat(600);
      const result = searchRequestSchema.safeParse({
        deviceId: 'test-device',
        query: longQuery,
        platform: 'ios',
        appVersion: '1.0.0',
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid platform', () => {
      const result = searchRequestSchema.safeParse({
        deviceId: 'test-device',
        query: 'test',
        platform: 'windows',
        appVersion: '1.0.0',
      });

      expect(result.success).toBe(false);
    });

    it('should accept both ios and android platforms', () => {
      const iosResult = searchRequestSchema.safeParse({
        deviceId: 'test',
        query: 'test',
        platform: 'ios',
        appVersion: '1.0.0',
      });

      const androidResult = searchRequestSchema.safeParse({
        deviceId: 'test',
        query: 'test',
        platform: 'android',
        appVersion: '1.0.0',
      });

      expect(iosResult.success).toBe(true);
      expect(androidResult.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const result = searchRequestSchema.safeParse({
        query: 'test',
      });

      expect(result.success).toBe(false);
    });
  });
});
