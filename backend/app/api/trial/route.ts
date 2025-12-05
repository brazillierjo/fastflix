/**
 * FastFlix Backend - Trial Endpoints
 * Manage free trial for users
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { db } from '@/lib/db';

/**
 * GET /api/trial - Get trial status for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);

    if (!authResult.success || !authResult.userId) {
      return authResult.error!;
    }

    const userId = authResult.userId;

    // Get trial info
    const trialInfo = await db.getTrialInfo(userId);

    return NextResponse.json({
      trial: trialInfo,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to get trial status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/trial - Start free trial for authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);

    if (!authResult.success || !authResult.userId) {
      return authResult.error!;
    }

    const userId = authResult.userId;

    // Check if user already has an active subscription
    const hasSubscription = await db.hasActiveSubscriptionByUserId(userId);
    if (hasSubscription) {
      return NextResponse.json(
        {
          error: 'Already subscribed',
          message: 'You already have an active subscription',
        },
        { status: 400 }
      );
    }

    // Try to start free trial
    const trialInfo = await db.startFreeTrial(userId);

    if (!trialInfo) {
      // Trial already used
      return NextResponse.json(
        {
          error: 'Trial already used',
          message: 'You have already used your free trial',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Free trial started successfully',
      trial: trialInfo,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to start trial',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
