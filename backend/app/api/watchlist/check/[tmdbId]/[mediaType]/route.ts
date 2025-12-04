/**
 * FastFlix Backend - Watchlist Check Endpoint
 * GET: Check if an item is in user's watchlist
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { db } from '@/lib/db';

interface RouteParams {
  params: Promise<{ tmdbId: string; mediaType: string }>;
}

/**
 * GET /api/watchlist/check/:tmdbId/:mediaType
 * Check if an item is in user's watchlist
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);

    if (!authResult.success || !authResult.userId) {
      return authResult.error!;
    }

    const { tmdbId, mediaType } = await params;

    // Validate tmdbId
    const tmdbIdNum = parseInt(tmdbId, 10);
    if (isNaN(tmdbIdNum)) {
      return NextResponse.json({ error: 'Invalid TMDB ID' }, { status: 400 });
    }

    // Validate mediaType
    if (mediaType !== 'movie' && mediaType !== 'tv') {
      return NextResponse.json({ error: 'Invalid media type' }, { status: 400 });
    }

    // Check if in watchlist
    const result = await db.isInWatchlist(authResult.userId, tmdbIdNum, mediaType);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('❌ Error in GET /api/watchlist/check:', error);
    return NextResponse.json({ error: 'Failed to check watchlist' }, { status: 500 });
  }
}
