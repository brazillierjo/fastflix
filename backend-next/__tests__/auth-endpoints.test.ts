/**
 * Tests for authentication endpoints
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { generateJWT, verifyJWT } from '../lib/auth';
import jwt from 'jsonwebtoken';

describe('Authentication Endpoints', () => {
  const TEST_USER_ID = 'test-user-123';
  const TEST_EMAIL = 'test@example.com';
  let validToken: string;

  beforeAll(() => {
    // Set JWT_SECRET for tests
    process.env.JWT_SECRET = 'test-secret-key-for-jest-tests';
    validToken = generateJWT(TEST_USER_ID, TEST_EMAIL);
  });

  describe('JWT Token Generation and Verification', () => {
    it('should generate a valid JWT token', () => {
      const token = generateJWT(TEST_USER_ID, TEST_EMAIL);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should verify a valid JWT token', () => {
      const payload = verifyJWT(validToken);

      expect(payload).toBeTruthy();
      expect(payload?.userId).toBe(TEST_USER_ID);
      expect(payload?.email).toBe(TEST_EMAIL);
      expect(payload?.exp).toBeTruthy();
      expect(payload?.iat).toBeTruthy();
    });

    it('should reject an expired JWT token', () => {
      // Create an expired token
      const secret = process.env.JWT_SECRET!;
      const expiredToken = jwt.sign(
        { userId: TEST_USER_ID, email: TEST_EMAIL },
        secret,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const payload = verifyJWT(expiredToken);

      expect(payload).toBeNull();
    });

    it('should reject a malformed JWT token', () => {
      const payload = verifyJWT('invalid.token.here');

      expect(payload).toBeNull();
    });

    it('should reject a token with invalid signature', () => {
      // Create token with different secret
      const wrongToken = jwt.sign({ userId: TEST_USER_ID, email: TEST_EMAIL }, 'wrong-secret', {
        expiresIn: '1h',
      });

      const payload = verifyJWT(wrongToken);

      expect(payload).toBeNull();
    });
  });

  describe('JWT Expiration Logic', () => {
    it('should have expiration time set to 30 days', () => {
      const token = generateJWT(TEST_USER_ID, TEST_EMAIL);
      const payload = verifyJWT(token);

      expect(payload).toBeTruthy();

      if (payload) {
        const expirationDate = new Date(payload.exp! * 1000);
        const issuedDate = new Date(payload.iat! * 1000);
        const diffInDays =
          (expirationDate.getTime() - issuedDate.getTime()) / (1000 * 60 * 60 * 24);

        // Should be approximately 30 days (allowing small variance)
        expect(diffInDays).toBeGreaterThan(29);
        expect(diffInDays).toBeLessThan(31);
      }
    });
  });

  describe('Token Payload Structure', () => {
    it('should contain required fields in payload', () => {
      const token = generateJWT(TEST_USER_ID, TEST_EMAIL);
      const payload = verifyJWT(token);

      expect(payload).toBeTruthy();
      expect(payload).toHaveProperty('userId');
      expect(payload).toHaveProperty('email');
      expect(payload).toHaveProperty('iat');
      expect(payload).toHaveProperty('exp');
    });

    it('should not contain sensitive information', () => {
      const token = generateJWT(TEST_USER_ID, TEST_EMAIL);
      const payload = verifyJWT(token);

      expect(payload).toBeTruthy();
      // Ensure no password or other sensitive data
      expect(payload).not.toHaveProperty('password');
      expect(payload).not.toHaveProperty('auth_token');
    });
  });
});
