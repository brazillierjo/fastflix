/**
 * FastFlix Backend - Apple Sign In Endpoint
 * POST /api/auth/apple
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { verifyAppleToken, generateJWT } from '@/lib/auth';
import { db } from '@/lib/db';
import type { AuthResponse, AppleAuthRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: AppleAuthRequest = await request.json();
    const { identityToken, user } = body;

    if (!identityToken) {
      return NextResponse.json({ error: 'Missing identityToken' }, { status: 400 });
    }

    // Step 1: Verify Apple token
    console.log('🍎 Verifying Apple identity token...');
    const applePayload = await verifyAppleToken(identityToken);

    // Step 2: Extract user info
    const providerUserId = applePayload.sub;
    const email = applePayload.email || user?.email;

    if (!email) {
      return NextResponse.json({ error: 'Email is required for authentication' }, { status: 400 });
    }

    // Step 3: Check if user exists (by provider ID or email)
    let existingUser = await db.getUserByProvider('apple', providerUserId);

    if (!existingUser) {
      existingUser = await db.getUserByEmail(email);
    }

    let dbUser;

    if (existingUser) {
      // User exists, return existing user
      console.log(`✅ Existing user found: ${email}`);
      dbUser = existingUser;
    } else {
      // Step 4: Create new user
      console.log(`🆕 Creating new user: ${email}`);

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

    console.log(`✅ Apple Sign In successful: ${email}`);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('❌ Error in Apple Sign In:', error);

    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';

    return NextResponse.json(
      {
        error: 'Apple Sign In failed',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
