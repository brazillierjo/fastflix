/**
 * FastFlix Backend - Daily Pick Endpoint
 * GET: Generate a deterministic daily recommendation for the user
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { tmdb } from '@/lib/tmdb';
import { db } from '@/lib/db';
import { applyTierRateLimit } from '@/lib/api-helpers';
import type { DailyPick } from '@/lib/types';

/**
 * Generate a deterministic seed from userId and date
 */
function getDailyIndex(userId: string, date: string, maxIndex: number): number {
  let hash = 0;
  const seed = `${userId}-${date}`;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % maxIndex;
}

/**
 * GET /api/daily-pick
 * Get a deterministic daily recommendation for the authenticated user
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
    const rateLimitResponse = await applyTierRateLimit(request, 'daily-pick', isPremium);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Get optional params
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'fr-FR';
    const country = searchParams.get('country') || 'FR';

    // Fetch trending items from TMDB
    const trending = await tmdb.getTrending(language);

    if (trending.length === 0) {
      return NextResponse.json({
        success: true,
        data: { dailyPick: null },
      });
    }

    // Pick one deterministically based on userId + today's date
    const today = new Date().toISOString().split('T')[0];
    const index = getDailyIndex(userId, today, trending.length);
    const picked = trending[index];

    // Enrich with full details and streaming providers
    const [details, providers] = await Promise.all([
      tmdb.getFullDetails(picked.tmdb_id, picked.media_type, language),
      tmdb.getWatchProviders(picked.tmdb_id, picked.media_type, country),
    ]);

    // Filter providers by user preferences
    const preferences = await db.getUserPreferences(userId);
    let filteredProviders = providers;
    if (preferences.platforms.length > 0) {
      const platformSet = new Set(preferences.platforms);
      filteredProviders = providers.filter((p) => platformSet.has(p.provider_id));
      // Fall back to all providers if none match
      if (filteredProviders.length === 0) {
        filteredProviders = providers;
      }
    }

    const dailyPick: DailyPick = {
      tmdb_id: picked.tmdb_id,
      title: details?.title || picked.title,
      overview: details?.overview || '',
      poster_path: details?.poster_path || picked.poster_path,
      backdrop_path: details?.backdrop_path || null,
      vote_average: details?.vote_average || picked.vote_average,
      media_type: picked.media_type,
      genres: details?.genres || [],
      providers: filteredProviders,
    };

    return NextResponse.json(
      {
        success: true,
        data: { dailyPick },
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600',
        },
      }
    );
  } catch (error) {
    console.error('❌ /api/daily-pick:', error);
    return NextResponse.json({ error: 'Failed to generate daily pick' }, { status: 500 });
  }
}
