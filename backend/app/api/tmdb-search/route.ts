/**
 * FastFlix Backend - TMDB Quick Search
 * Lightweight multi-search for movies, TV shows, and actors
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { tmdb } from '@/lib/tmdb';

/**
 * GET /api/tmdb-search?q=query&language=fr-FR
 * Returns up to 10 results (movies, TV shows, actors)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.success || !authResult.userId) {
      return authResult.error!;
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const language = searchParams.get('language') || 'fr-FR';

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const results = await tmdb.searchMultiAll(query, language, 10);

    return NextResponse.json({
      success: true,
      data: { results },
    });
  } catch {
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
