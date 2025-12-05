/**
 * FastFlix Backend - Apple Sign In Endpoint
 * POST /api/auth/apple
 */

import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { verifyAppleToken, generateJWT } from '@/lib/auth';
import { db } from '@/lib/db';
import { jsonResponse, errorResponse, maskEmail } from '@/lib/api-helpers';
import type { AuthResponse, AppleAuthRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: AppleAuthRequest = await request.json();
    const { identityToken, user } = body;

    if (!identityToken) {
      return errorResponse('Missing identityToken', {
        status: 400,
        publicMessage: 'Invalid request',
      });
    }

    // Step 1: Verify Apple token
    console.log('[Auth] Verifying Apple identity token...');
    const applePayload = await verifyAppleToken(identityToken);

    // Step 2: Extract user info
    const providerUserId = applePayload.sub;
    const email = applePayload.email || user?.email;

    if (!email) {
      return errorResponse('Email is required for authentication', { status: 400 });
    }

    // Step 3: Check if user exists (by provider ID or email)
    let existingUser = await db.getUserByProvider('apple', providerUserId);

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

      const userName = user?.name
        ? `${user.name.firstName || ''} ${user.name.lastName || ''}`.trim()
        : null;

      dbUser = await db.createUser({
        id: randomUUID(),
        email,
        name: userName,
        avatar_url: null,
        auth_provider: 'apple',
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

    console.log(`[Auth] Apple Sign In successful: ${maskEmail(email)}`);

    return jsonResponse(response);
  } catch (error) {
    console.error('[Auth] Error in Apple Sign In:', error);
    return errorResponse(error instanceof Error ? error.message : 'Authentication failed', {
      status: 500,
      publicMessage: 'Apple Sign In failed',
    });
  }
}
