/**
 * FastFlix Backend - Rate Movie Endpoint
 * POST endpoint to rate a movie in the user's taste profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema for rating a movie
const rateMovieSchema = z.object({
  tmdb_id: z.number().int().positive(),
  rating: z.number().int().min(0).max(5), // 0 = watched but not rated
  title: z.string().min(1).max(500),
  media_type: z.enum(['movie', 'tv']).optional(),
  poster_path: z.string().max(500).optional(),
});

/**
 * POST /api/user/taste-profile/rate
 * Rate a movie (1-5) and add it to the user's taste profile
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
    const validatedData = rateMovieSchema.parse(body);

    // Rate the movie
    const updatedProfile = await db.rateMovie(
      authResult.userId,
      validatedData.tmdb_id,
      validatedData.rating,
      validatedData.title,
      validatedData.media_type,
      validatedData.poster_path
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

    return NextResponse.json({ error: 'Failed to rate movie' }, { status: 500 });
  }
}

// Validation schema for deleting a rating
const deleteRatingSchema = z.object({
  tmdb_id: z.number().int().positive(),
});

/**
 * DELETE /api/user/taste-profile/rate
 * Remove a movie from the user's rated movies list
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);

    if (!authResult.success || !authResult.userId) {
      return authResult.error!;
    }

    const body = await request.json();
    const validatedData = deleteRatingSchema.parse(body);

    const updatedProfile = await db.removeRating(
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

    return NextResponse.json({ error: 'Failed to remove rating' }, { status: 500 });
  }
}
