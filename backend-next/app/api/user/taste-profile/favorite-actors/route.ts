/**
 * FastFlix Backend - Favorite Actors Endpoint
 * POST endpoint to favorite an actor in the user's taste profile
 * DELETE endpoint to unfavorite an actor
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema for favoriting an actor
const favoriteActorSchema = z.object({
  tmdb_id: z.number().int().positive(),
  name: z.string().min(1).max(500),
  profile_path: z.string().max(500).optional(),
  known_for_department: z.string().max(200).optional(),
});

/**
 * POST /api/user/taste-profile/favorite-actors
 * Add an actor to the user's favorite actors
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);

    if (!authResult.success || !authResult.userId) {
      return authResult.error!;
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = favoriteActorSchema.parse(body);

    // Favorite the actor
    const updatedProfile = await db.favoriteActor(
      authResult.userId,
      validatedData.tmdb_id,
      validatedData.name,
      validatedData.profile_path,
      validatedData.known_for_department
    );

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

    return NextResponse.json({ error: 'Failed to favorite actor' }, { status: 500 });
  }
}

// Validation schema for unfavoriting an actor
const unfavoriteActorSchema = z.object({
  tmdb_id: z.number().int().positive(),
});

/**
 * DELETE /api/user/taste-profile/favorite-actors
 * Remove an actor from the user's favorite actors
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);

    if (!authResult.success || !authResult.userId) {
      return authResult.error!;
    }

    const body = await request.json();
    const validatedData = unfavoriteActorSchema.parse(body);

    const updatedProfile = await db.unfavoriteActor(
      authResult.userId,
      validatedData.tmdb_id
    );

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

    return NextResponse.json({ error: 'Failed to unfavorite actor' }, { status: 500 });
  }
}
