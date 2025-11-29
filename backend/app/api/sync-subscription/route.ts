/**
 * Sync Subscription Status
 *
 * Temporary endpoint to sync subscription status from frontend to backend
 * This is called when the app starts to ensure backend knows about user's Pro status
 *
 * TODO: Replace this with RevenueCat webhook in Phase 8
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const syncSubscriptionSchema = z.object({
  deviceId: z.string().min(1),
  isProUser: z.boolean(),
  revenueCatUserId: z.string().optional(),
  expiresAt: z.string().optional(), // ISO date string
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = syncSubscriptionSchema.parse(body);

    const { deviceId, isProUser, revenueCatUserId, expiresAt } = validatedData;

    console.log(`📱 Syncing subscription for ${deviceId}: isProUser=${isProUser}`);

    if (isProUser) {
      // User is Pro - upsert subscription in database
      await db.upsertSubscription({
        device_id: deviceId,
        revenuecat_user_id: revenueCatUserId || null,
        status: 'active',
        expires_at: expiresAt || null,
        product_id: null, // We don't have this info from frontend yet
      });

      console.log(`✅ Subscription synced for ${deviceId}`);
    } else {
      // User is not Pro - check if we need to mark subscription as expired
      const hasSubscription = await db.hasActiveSubscription(deviceId);

      if (hasSubscription) {
        // User had a subscription but it's no longer active
        await db.upsertSubscription({
          device_id: deviceId,
          status: 'expired',
        });
        console.log(`⚠️ Subscription marked as expired for ${deviceId}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription status synced',
    });
  } catch (error) {
    // Zod validation error
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.message,
        },
        { status: 400 }
      );
    }

    console.error('❌ Error syncing subscription:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync subscription',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
