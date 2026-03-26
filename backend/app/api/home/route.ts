/**
 * FastFlix Backend - Home Endpoint
 * GET: Aggregate endpoint for the home screen
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { tmdb } from '@/lib/tmdb';
import { db } from '@/lib/db';
import { applyTierRateLimit } from '@/lib/api-helpers';
import { FREE_TIER_LIMITS } from '@/lib/types';
import type { DailyPick, TrendingItem, HomeResponse } from '@/lib/types';

/**
 * Generate a deterministic index from userId and date
 */
function getDailyIndex(userId: string, date: string, maxIndex: number): number {
  let hash = 0;
  const seed = `${userId}-${date}`;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash) % maxIndex;
}

/**
 * GET /api/home
 * Aggregate endpoint returning daily pick, trending, recent searches, and quota
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);

    if (!authResult.success || !authResult.userId) {
      return authResult.error!;
    }

    const userId = authResult.userId;

    // Apply tier-based rate limiting (check access early for rate limiting)
    const isPremiumForRL = await db.hasAccess(userId);
    const rateLimitResponse = await applyTierRateLimit(request, 'home', isPremiumForRL);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Get optional params
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'fr-FR';
    const country = searchParams.get('country') || 'FR';

    const today = new Date().toISOString().split('T')[0];

    // Fetch everything in parallel (reuse isPremium from rate limit check)
    const [trending, recentSearches, quota, isPremium, preferences] = await Promise.all([
      tmdb.getTrending(language),
      db.getSearchHistory(userId, 5),
      db.getUserQuota(userId, today),
      db.hasAccess(userId),
      db.getUserPreferences(userId),
    ]);

    // Build daily pick from trending
    let dailyPick: DailyPick | null = null;
    if (trending.length > 0) {
      const index = getDailyIndex(userId, today, trending.length);
      const picked = trending[index];

      const [details, providers] = await Promise.all([
        tmdb.getFullDetails(picked.tmdb_id, picked.media_type, language),
        tmdb.getWatchProviders(picked.tmdb_id, picked.media_type, country),
      ]);

      dailyPick = {
        tmdb_id: picked.tmdb_id,
        title: details?.title || picked.title,
        overview: details?.overview || '',
        poster_path: details?.poster_path || picked.poster_path,
        backdrop_path: details?.backdrop_path || null,
        vote_average: details?.vote_average || picked.vote_average,
        media_type: picked.media_type,
        genres: details?.genres || [],
        providers: providers,
      };
    }

    // Top 10 trending with providers
    const trendingTop10Raw = trending.slice(0, 10);
    const trendingAsResults = trendingTop10Raw.map((item) => ({
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
    const trendingProviders = await tmdb.getBatchWatchProviders(trendingAsResults, country);

    // Filter providers by user's availability & platform preferences
    const allowFlatrate = preferences.includeFlatrate;
    const allowRent = preferences.includeRent;
    const allowBuy = preferences.includeBuy;
    const hasAvailabilityFilter = allowFlatrate || allowRent || allowBuy;
    const platformSet = preferences.platforms.length > 0 ? new Set(preferences.platforms) : null;

    const trendingTop10: TrendingItem[] = trendingTop10Raw.map((item) => {
      let itemProviders = trendingProviders[item.tmdb_id] || [];

      if (hasAvailabilityFilter) {
        itemProviders = itemProviders.filter((p) => {
          if (p.availability_type === 'flatrate' && allowFlatrate) return true;
          if (p.availability_type === 'rent' && allowRent) return true;
          if (p.availability_type === 'buy' && allowBuy) return true;
          if (p.availability_type === 'ads' && allowFlatrate) return true;
          return false;
        });
      }

      if (platformSet) {
        itemProviders = itemProviders.filter((p) => platformSet.has(p.provider_id));
      }

      return {
        ...item,
        providers: itemProviders.map((p) => ({
          provider_name: p.provider_name,
          logo_path: p.logo_path,
        })),
      };
    });

    const response: HomeResponse = {
      dailyPick,
      trending: trendingTop10,
      recentSearches,
      quota: {
        used: quota.search_count,
        limit: isPremium ? -1 : FREE_TIER_LIMITS.searches,
        isPremium,
      },
    };

    return NextResponse.json(
      {
        success: true,
        data: response,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=300',
        },
      }
    );
  } catch {
    return NextResponse.json({ error: 'Failed to load home data' }, { status: 500 });
  }
}
