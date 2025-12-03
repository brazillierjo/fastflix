/**
 * FastFlix Backend - User Preferences Endpoint
 * GET/PUT endpoints for user search preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema for updating preferences
const updatePreferencesSchema = z.object({
  country: z.string().length(2).optional(),
  contentType: z.enum(['all', 'movies', 'tvshows']).optional(),
  platforms: z.array(z.number()).optional(),
  includeFlatrate: z.boolean().optional(),
  includeRent: z.boolean().optional(),
  includeBuy: z.boolean().optional(),
});

/**
 * GET /api/user/preferences
 * Get current user's search preferences
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);

    if (!authResult.success || !authResult.userId) {
      return authResult.error!;
    }

    const preferences = await db.getUserPreferences(authResult.userId);

    return NextResponse.json({
      success: true,
      data: { preferences },
    });
  } catch (error) {
    console.error('❌ Error in GET /api/user/preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

/**
 * PUT /api/user/preferences
 * Update current user's search preferences
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
    const validatedData = updatePreferencesSchema.parse(body);

    // Update preferences
    const updatedPreferences = await db.updateUserPreferences(authResult.userId, validatedData);

    console.log(`✅ Preferences updated for user ${authResult.userId}`);

    return NextResponse.json({
      success: true,
      data: { preferences: updatedPreferences },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('❌ Error in PUT /api/user/preferences:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
