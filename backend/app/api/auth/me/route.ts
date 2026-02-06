/**
 * FastFlix Backend - Get Current User Endpoint
 * GET /api/auth/me
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, verifyJWT } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Step 1: Extract JWT from Authorization header
    const authHeader = request.headers.get('Authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json({ error: 'Missing authentication token' }, { status: 401 });
    }

    // Step 2: Verify JWT
    const payload = verifyJWT(token);

    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Step 3: Get user from database
    const user = await db.getUserById(payload.userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Step 4: Get subscription details from database
    const subscriptionDetails = await db.getSubscriptionDetails(payload.userId);

    // Step 5: Return user info with subscription status
    return NextResponse.json(
      {
        user,
        subscription: {
          isActive: subscriptionDetails.isActive,
          status: subscriptionDetails.status,
          productId: subscriptionDetails.productId,
          expiresAt: subscriptionDetails.expiresAt,
          createdAt: subscriptionDetails.createdAt,
          willRenew: subscriptionDetails.willRenew,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to get user info',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
