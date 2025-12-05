/**
 * FastFlix Backend - Google Sign In Endpoint
 * POST /api/auth/google
 */

import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { verifyGoogleToken, generateJWT } from '@/lib/auth';
import { db } from '@/lib/db';
import { jsonResponse, errorResponse, maskEmail } from '@/lib/api-helpers';
import type { AuthResponse, GoogleAuthRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: GoogleAuthRequest = await request.json();
    const { idToken } = body;

    if (!idToken) {
      return errorResponse('Missing idToken', { status: 400, publicMessage: 'Invalid request' });
    }

    // Step 1: Verify Google token
    console.log('[Auth] Verifying Google ID token...');
    const googlePayload = await verifyGoogleToken(idToken);

    // Step 2: Extract user info
    const providerUserId = googlePayload.sub;
    const email = googlePayload.email;

    if (!email) {
      return errorResponse('Email is required for authentication', { status: 400 });
    }

    // Step 3: Check if user exists (by provider ID or email)
    let existingUser = await db.getUserByProvider('google', providerUserId);

    if (!existingUser) {
      existingUser = await db.getUserByEmail(email);
    }

    let dbUser;

    if (existingUser) {
      // User exists, return existing user
      console.log(`[Auth] Existing user found: ${maskEmail(email)}`);
      dbUser = existingUser;
    } else {
      // Step 4: Create new user
      console.log(`[Auth] Creating new user: ${maskEmail(email)}`);

      dbUser = await db.createUser({
        id: randomUUID(),
        email,
        name: googlePayload.name || null,
        avatar_url: googlePayload.picture || null,
        auth_provider: 'google',
        provider_user_id: providerUserId,
      });
    }

    // Step 5: Generate JWT
    const token = generateJWT(dbUser.id, dbUser.email);

    // Step 6: Return response
    const response: AuthResponse = {
      user: dbUser,
      token,
    };

    console.log(`[Auth] Google Sign In successful: ${maskEmail(email)}`);

    return jsonResponse(response);
  } catch (error) {
    console.error('[Auth] Error in Google Sign In:', error);
    return errorResponse(error instanceof Error ? error.message : 'Authentication failed', {
      status: 500,
      publicMessage: 'Google Sign In failed',
    });
  }
}
