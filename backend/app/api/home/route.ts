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
import { computeAffinityScore, getWatchedTmdbIds } from '@/lib/affinity';

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
    const [trending, recentSearches, quota, isPremium, preferences, tasteProfile] = await Promise.all([
      tmdb.getTrending(language),
      db.getSearchHistory(userId, 5),
      db.getUserQuota(userId, today),
      db.hasAccess(userId),
      db.getUserPreferences(userId),
      db.getUserTasteProfile(userId),
    ]);

    // Build set of already-watched TMDB IDs to exclude
    const watchedIds = getWatchedTmdbIds(tasteProfile);

    // User filter helpers
    const allowFlatrate = preferences.includeFlatrate;
    const allowRent = preferences.includeRent;
    const allowBuy = preferences.includeBuy;
    const hasAvailabilityFilter = allowFlatrate || allowRent || allowBuy;
    const platformSet = preferences.platforms.length > 0 ? new Set(preferences.platforms) : null;
    const hasFilters = hasAvailabilityFilter || platformSet !== null;

    function filterProviders(providers: import('@/lib/types').StreamingProvider[]) {
      let filtered = providers;
      if (hasAvailabilityFilter) {
        filtered = filtered.filter((p) => {
          if (p.availability_type === 'flatrate' && allowFlatrate) return true;
          if (p.availability_type === 'rent' && allowRent) return true;
          if (p.availability_type === 'buy' && allowBuy) return true;
          if (p.availability_type === 'ads' && allowFlatrate) return true;
          return false;
        });
      }
      if (platformSet) {
        filtered = filtered.filter((p) => platformSet.has(p.provider_id));
      }
      return filtered;
    }

    // Fetch providers for all trending items so we can filter properly
    const allTrendingAsResults = trending.map((item) => ({
      tmdb_id: item.tmdb_id,
      title: item.title,
      media_type: item.media_type,
      overview: '',
      poster_path: item.poster_path,
      backdrop_path: null,
      vote_average: item.vote_average,
      vote_count: 0,
      genre_ids: item.genre_ids || [],
      popularity: 0,
    }));
    const trendingProviders = await tmdb.getBatchWatchProviders(allTrendingAsResults, country);

    // Build daily pick from trending items that match user's filters + taste
    let dailyPick: DailyPick | null = null;
    if (trending.length > 0) {
      // Find eligible items: matching providers, not already watched, not disliked genres
      const eligibleForPick = trending.filter((item) => {
        // Exclude already-watched
        if (watchedIds.has(item.tmdb_id)) return false;
        // Check provider filters
        if (hasFilters) {
          const itemProviders = trendingProviders[item.tmdb_id] || [];
          if (filterProviders(itemProviders).length === 0) return false;
        }
        // Penalize disliked genres (score < 0 means mostly disliked)
        const score = computeAffinityScore(item.genre_ids || [], tasteProfile);
        if (score < 0) return false;
        return true;
      });

      // Sort eligible items by affinity (best match first)
      eligibleForPick.sort((a, b) => {
        const scoreA = computeAffinityScore(a.genre_ids || [], tasteProfile);
        const scoreB = computeAffinityScore(b.genre_ids || [], tasteProfile);
        return scoreB - scoreA;
      });

      // Pick deterministically from top affinity candidates
      const pickSource = eligibleForPick.length > 0 ? eligibleForPick : trending;
      const topCandidates = pickSource.slice(0, Math.min(5, pickSource.length));
      const index = getDailyIndex(userId, today, topCandidates.length);
      const picked = topCandidates[index];

      const [details, rawProviders] = await Promise.all([
        tmdb.getFullDetails(picked.tmdb_id, picked.media_type, language),
        tmdb.getWatchProviders(picked.tmdb_id, picked.media_type, country),
      ]);

      const filteredPickProviders = hasFilters ? filterProviders(rawProviders) : rawProviders;

      dailyPick = {
        tmdb_id: picked.tmdb_id,
        title: details?.title || picked.title,
        overview: details?.overview || '',
        poster_path: details?.poster_path || picked.poster_path,
        backdrop_path: details?.backdrop_path || null,
        vote_average: details?.vote_average || picked.vote_average,
        media_type: picked.media_type,
        genres: details?.genres || [],
        providers: filteredPickProviders,
      };
    }

    // Build filtered trending list: exclude watched, filter by providers, sort by affinity
    const trendingEligible: (TrendingItem & { _affinityScore: number })[] = [];
    for (const item of trending) {
      // Exclude already-watched
      if (watchedIds.has(item.tmdb_id)) continue;
      // Exclude daily pick to avoid duplicate
      if (dailyPick && item.tmdb_id === dailyPick.tmdb_id) continue;

      const itemProviders = filterProviders(trendingProviders[item.tmdb_id] || []);

      // Skip items with no matching providers when user has filters
      if (hasFilters && itemProviders.length === 0) continue;

      trendingEligible.push({
        ...item,
        _affinityScore: computeAffinityScore(item.genre_ids || [], tasteProfile),
        providers: itemProviders.map((p) => ({
          provider_name: p.provider_name,
          logo_path: p.logo_path,
        })),
      });
    }

    // Sort by affinity score (best match first), keep original order as tiebreaker
    trendingEligible.sort((a, b) => b._affinityScore - a._affinityScore);

    // Take top 10 and strip internal score field
    const trendingTop10: TrendingItem[] = trendingEligible.slice(0, 10).map(({ _affinityScore, ...item }) => item);

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
