/**
 * FastFlix Backend - User Taste Profile Endpoint
 * GET/PUT endpoints for user taste preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema for updating taste profile
const updateTasteProfileSchema = z.object({
  favorite_genres: z.array(z.string().max(50)).max(20).optional(),
  disliked_genres: z.array(z.string().max(50)).max(20).optional(),
  favorite_decades: z.array(z.string().max(10)).max(10).optional(),
});

/**
 * GET /api/user/taste-profile
 * Get current user's taste profile
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);

    if (!authResult.success || !authResult.userId) {
      return authResult.error!;
    }

    const profile = await db.getUserTasteProfile(authResult.userId);

    return NextResponse.json({
      success: true,
      data: { profile },
    });
  } catch (error) {
    console.error('❌ /api/user/taste-profile:', error);
    return NextResponse.json({ error: 'Failed to fetch taste profile' }, { status: 500 });
  }
}

/**
 * PUT /api/user/taste-profile
 * Update current user's taste profile
 */
export async function PUT(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);

    if (!authResult.success || !authResult.userId) {
      return authResult.error!;
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateTasteProfileSchema.parse(body);

    // Update taste profile
    const updatedProfile = await db.updateTasteProfile(authResult.userId, validatedData);

    return NextResponse.json({
      success: true,
      data: { profile: updatedProfile },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to update taste profile' }, { status: 500 });
  }
}
