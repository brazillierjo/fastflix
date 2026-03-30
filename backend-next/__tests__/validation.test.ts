/**
 * Tests for Zod validation schemas
 */

import { describe, it, expect } from '@jest/globals';
import { searchRequestSchema } from '../lib/validation';

describe('Validation Schemas', () => {
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

    it('should accept minimal request with only query (for authenticated users)', () => {
      const result = searchRequestSchema.safeParse({
        query: 'test',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Should use default values
        expect(result.data.includeMovies).toBe(true);
        expect(result.data.includeTvShows).toBe(true);
        expect(result.data.language).toBe('fr-FR');
        expect(result.data.country).toBe('FR');
      }
    });

    it('should reject missing query field', () => {
      const result = searchRequestSchema.safeParse({
        deviceId: 'test-device',
      });

      expect(result.success).toBe(false);
    });
  });
});
