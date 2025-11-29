/**
 * FastFlix Backend - Middleware
 * Authentication middleware for protected routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, verifyJWT } from './auth';
import { db } from './db';
import type { User } from './types';

/**
 * Authenticated request with user info
 */
export interface AuthenticatedRequest extends NextRequest {
  user?: User;
  userId?: string;
}

/**
 * Result of authentication check
 */
export interface AuthResult {
  success: boolean;
  user?: User;
  userId?: string;
  error?: NextResponse;
}

/**
 * Require authentication middleware
 * Verifies JWT and adds user info to request
 *
 * @param request - Next.js request object
 * @returns AuthResult with user info or error response
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Step 1: Extract JWT from Authorization header
    const authHeader = request.headers.get('Authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return {
        success: false,
        error: NextResponse.json({ error: 'Missing authentication token' }, { status: 401 }),
      };
    }

    // Step 2: Verify JWT
    const payload = verifyJWT(token);

    if (!payload) {
      return {
        success: false,
        error: NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }),
      };
    }

    // Step 3: Get user from database
    const user = await db.getUserById(payload.userId);

    if (!user) {
      return {
        success: false,
        error: NextResponse.json({ error: 'User not found' }, { status: 404 }),
      };
    }

    // Step 4: Return success with user info
    return {
      success: true,
      user,
      userId: user.id,
    };
  } catch (error) {
    console.error('❌ Authentication error:', error);

    return {
      success: false,
      error: NextResponse.json(
        {
          error: 'Authentication failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      ),
    };
  }
}
