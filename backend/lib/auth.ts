/**
 * FastFlix Backend - Authentication Library
 * JWT generation/verification and Apple/Google token validation
 */

import jwt from 'jsonwebtoken';
import appleSignin from 'apple-signin-auth';
import { OAuth2Client } from 'google-auth-library';
import type { JWTPayload } from './types';

// ============================================================================
// JWT Functions
// ============================================================================

/**
 * Get JWT secret from environment
 */
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  return secret;
}

/**
 * Generate a JWT token for a user
 * @param userId - User ID (UUID)
 * @param email - User email
 * @returns JWT token string
 */
export function generateJWT(userId: string, email: string): string {
  const secret = getJWTSecret();

  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId,
    email,
  };

  // Token expires in 30 days
  const token = jwt.sign(payload, secret, {
    expiresIn: '30d',
  });

  return token;
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token string
 * @returns Decoded JWT payload or null if invalid
 */
export function verifyJWT(token: string): JWTPayload | null {
  try {
    const secret = getJWTSecret();
    const decoded = jwt.verify(token, secret) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

// ============================================================================
// Apple Sign In
// ============================================================================

export interface AppleTokenPayload {
  sub: string; // User ID from Apple
  email?: string;
  email_verified?: boolean;
  is_private_email?: boolean;
}

/**
 * Verify Apple identity token
 * @param identityToken - Identity token from Apple Sign In
 * @returns Decoded token payload
 */
export async function verifyAppleToken(
  identityToken: string
): Promise<AppleTokenPayload> {
  try {
    const clientId = process.env.APPLE_CLIENT_ID;

    if (!clientId) {
      throw new Error('APPLE_CLIENT_ID environment variable is not set');
    }

    const appleResponse = await appleSignin.verifyIdToken(identityToken, {
      audience: clientId,
      ignoreExpiration: false,
    });

    return {
      sub: appleResponse.sub,
      email: appleResponse.email,
      email_verified: appleResponse.email_verified === 'true',
      is_private_email: appleResponse.is_private_email === 'true',
    };
  } catch (error) {
    console.error('Apple token verification failed:', error);
    throw new Error('Invalid Apple identity token');
  }
}

// ============================================================================
// Google Sign In
// ============================================================================

export interface GoogleTokenPayload {
  sub: string; // User ID from Google
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

/**
 * Verify Google ID token
 * @param idToken - ID token from Google Sign In
 * @returns Decoded token payload
 */
export async function verifyGoogleToken(
  idToken: string
): Promise<GoogleTokenPayload> {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID environment variable is not set');
    }

    const client = new OAuth2Client(clientId);

    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new Error('Invalid Google ID token - no payload');
    }

    return {
      sub: payload.sub,
      email: payload.email || '',
      email_verified: payload.email_verified || false,
      name: payload.name,
      picture: payload.picture,
    };
  } catch (error) {
    console.error('Google token verification failed:', error);
    throw new Error('Invalid Google ID token');
  }
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Extract JWT token from Authorization header
 * @param authHeader - Authorization header value
 * @returns JWT token or null
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  // Expected format: "Bearer <token>"
  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}
