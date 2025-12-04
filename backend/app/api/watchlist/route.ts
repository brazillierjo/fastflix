/**
 * FastFlix Backend - Watchlist Endpoint
 * POST: Add item to watchlist
 * GET: Get user's watchlist
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema for adding to watchlist
const addToWatchlistSchema = z.object({
  tmdbId: z.number(),
  mediaType: z.enum(['movie', 'tv']),
  title: z.string(),
  posterPath: z.string().nullable(),
  providers: z.array(
    z.object({
      provider_id: z.number(),
      provider_name: z.string(),
      logo_path: z.string().optional().default(''),
      display_priority: z.number().optional().default(0),
      availability_type: z.enum(['flatrate', 'rent', 'buy', 'ads']).optional().default('flatrate'),
    })
  ).optional().default([]),
  country: z.string().min(2).max(3),
});

/**
 * POST /api/watchlist
 * Add an item to user's watchlist
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
    const validatedData = addToWatchlistSchema.parse(body);

    // Add to watchlist
    const watchlistItem = await db.addToWatchlist(authResult.userId, validatedData);

    console.log(`✅ Added to watchlist: ${validatedData.title} for user ${authResult.userId}`);

    return NextResponse.json({
      success: true,
      data: { item: watchlistItem },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('❌ Error in POST /api/watchlist:', error);
    return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 });
  }
}

/**
 * GET /api/watchlist
 * Get user's watchlist with optional mediaType filter
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);

    if (!authResult.success || !authResult.userId) {
      return authResult.error!;
    }

    // Get optional mediaType filter from query params
    const { searchParams } = new URL(request.url);
    const mediaTypeParam = searchParams.get('mediaType');
    const mediaType =
      mediaTypeParam === 'movie' || mediaTypeParam === 'tv' ? mediaTypeParam : undefined;

    // Get watchlist
    const items = await db.getWatchlist(authResult.userId, mediaType);
    const count = await db.getWatchlistCount(authResult.userId);

    return NextResponse.json({
      success: true,
      data: {
        items,
        count,
        mediaType: mediaType || 'all',
      },
    });
  } catch (error) {
    console.error('❌ Error in GET /api/watchlist:', error);
    return NextResponse.json({ error: 'Failed to fetch watchlist' }, { status: 500 });
  }
}
