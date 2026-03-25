/**
 * FastFlix Backend - Watchlist Watched Endpoint
 * POST: Mark a watchlist item as watched/unwatched
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Validation schema
const markWatchedSchema = z.object({
  watched: z.boolean(),
  rating: z.number().min(1).max(5).optional(),
  note: z.string().max(500).optional(),
});

/**
 * POST /api/watchlist/:id/watched
 * Mark a watchlist item as watched with optional rating and note
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);

    if (!authResult.success || !authResult.userId) {
      return authResult.error!;
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Missing item ID' }, { status: 400 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = markWatchedSchema.parse(body);

    // Mark as watched
    const updatedItem = await db.markWatchlistWatched(authResult.userId, id, {
      watched: validatedData.watched,
      rating: validatedData.rating,
      note: validatedData.note,
    });

    if (!updatedItem) {
      return NextResponse.json({ error: 'Item not found in watchlist' }, { status: 404 });
    }

    // Record activity
    const today = new Date().toISOString().split('T')[0];
    await db.recordActivity(authResult.userId, today);

    // If a rating is provided, also update the user's taste profile
    if (validatedData.rating !== undefined && validatedData.watched) {
      await db.rateMovie(
        authResult.userId,
        updatedItem.tmdb_id,
        validatedData.rating,
        updatedItem.title
      );
    }

    return NextResponse.json({
      success: true,
      data: { item: updatedItem },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to update watched status' }, { status: 500 });
  }
}
