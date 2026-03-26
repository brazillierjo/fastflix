/**
 * FastFlix Backend - Trending Endpoint
 * GET: Fetch trending movies and TV shows from TMDB
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { tmdb } from '@/lib/tmdb';
import { db } from '@/lib/db';
import { applyTierRateLimit } from '@/lib/api-helpers';

/**
 * GET /api/trending
 * Fetch trending movies and TV shows, optionally filtered by user's preferred platforms
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);

    if (!authResult.success || !authResult.userId) {
      return authResult.error!;
    }

    const userId = authResult.userId;

    // Apply tier-based rate limiting
    const isPremium = await db.hasAccess(userId);
    const rateLimitResponse = await applyTierRateLimit(request, 'trending', isPremium);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Get optional language param
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'fr-FR';
    const country = searchParams.get('country') || 'FR';

    // Fetch trending from TMDB
    const trending = await tmdb.getTrending(language);

    // Get user preferences to optionally filter by platforms
    const preferences = await db.getUserPreferences(userId);
    let filteredTrending = trending;

    if (preferences.platforms.length > 0) {
      // Fetch providers for trending items to filter
      const trendingAsMovieResults = trending.map((item) => ({
        tmdb_id: item.tmdb_id,
        title: item.title,
        media_type: item.media_type,
        overview: '',
        poster_path: item.poster_path,
        backdrop_path: null,
        vote_average: item.vote_average,
        vote_count: 0,
        genre_ids: [],
        popularity: 0,
      }));

      const providers = await tmdb.getBatchWatchProviders(trendingAsMovieResults, country);
      const platformSet = new Set(preferences.platforms);

      const platformFiltered = trending.filter((item) => {
        const itemProviders = providers[item.tmdb_id] || [];
        return itemProviders.some((p) => platformSet.has(p.provider_id));
      });

      // Only use filtered results if we have enough
      if (platformFiltered.length >= 5) {
        filteredTrending = platformFiltered;
      }
    }

    // Return top 20 items
    const top20 = filteredTrending.slice(0, 20);

    return NextResponse.json(
      {
        success: true,
        data: { items: top20 },
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600',
        },
      }
    );
  } catch (error) {
    console.error('❌ /api/trending:', error);
    return NextResponse.json({ error: 'Failed to fetch trending' }, { status: 500 });
  }
}
