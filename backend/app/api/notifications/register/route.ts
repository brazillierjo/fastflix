/**
 * FastFlix Backend - Push Notification Token Registration
 * POST: Save a push token for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema for push token registration
const registerPushTokenSchema = z.object({
  token: z
    .string()
    .min(1, 'Push token is required')
    .max(500)
    .regex(
      /^ExponentPushToken\[.+\]$|^[A-Za-z0-9_:.-]+$/,
      'Invalid push token format'
    ),
  platform: z.enum(['ios', 'android']).default('ios'),
});

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);

    if (!authResult.success || !authResult.userId) {
      return authResult.error!;
    }

    const userId = authResult.userId;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = registerPushTokenSchema.parse(body);

    // Save push token
    await db.savePushToken(userId, validatedData.token, validatedData.platform);

    return NextResponse.json(
      {
        success: true,
        data: { registered: true },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error registering push token:', error);

    return NextResponse.json(
      {
        error: 'Failed to register push token',
      },
      { status: 500 }
    );
  }
}
