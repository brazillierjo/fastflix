/**
 * FastFlix Backend - For You Endpoint
 * GET: Personalized recommendations powered by Gemini AI
 * Uses taste profile, watchlist signals, and search history for deep personalization
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { tmdb } from '@/lib/tmdb';
import { db } from '@/lib/db';
import { gemini } from '@/lib/gemini';
import { applyTierRateLimit } from '@/lib/api-helpers';
import type { MovieResult, StreamingProvider, UserContext } from '@/lib/types';
import { getWatchedTmdbIds } from '@/lib/affinity';

/**
 * GET /api/for-you
 * Returns personalized recommendations based on user taste profile via Gemini AI
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
    const rateLimitResponse = await applyTierRateLimit(request, 'for-you', isPremium);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Get optional params
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'fr-FR';
    const country = searchParams.get('country') || 'FR';

    // Fetch taste profile, watchlist, search history, preferences, and trending in parallel
    const [tasteProfile, watchlist, recentSearchHistory, preferences, trendingItems] =
      await Promise.all([
        db.getUserTasteProfile(userId),
        db.getWatchlist(userId),
        db.getSearchHistory(userId, 5),
        db.getUserPreferences(userId),
        tmdb.getTrending(language).catch(() => []),
      ]);

    // Check if user has a meaningful taste profile
    const hasProfile =
      tasteProfile.rated_movies.length > 0 || tasteProfile.favorite_genres.length > 0;

    if (!hasProfile) {
      return NextResponse.json({
        success: true,
        data: {
          recommendations: [],
          streamingProviders: {},
          hasProfile: false,
        },
      });
    }

    // Build exclusion set: watchlist + already watched/rated
    const watchlistTmdbIds = new Set(watchlist.map((item) => item.tmdb_id));
    const watchedTmdbIds = getWatchedTmdbIds(tasteProfile);
    const excludeIds = new Set([...watchlistTmdbIds, ...watchedTmdbIds]);

    // Enrich taste profile with watchlist genre signals
    // (watchlist reflects what user WANTS to watch → implicit genre preference)
    const watchlistGenreSignal = analyzeWatchlistGenres(watchlist);

    // Build user context for Gemini
    const userContext: UserContext = {};
    if (tasteProfile.favorite_genres.length > 0) {
      userContext.favoriteGenres = tasteProfile.favorite_genres;
    }
    if (tasteProfile.disliked_genres.length > 0) {
      userContext.dislikedGenres = tasteProfile.disliked_genres;
    }
    if (tasteProfile.favorite_decades.length > 0) {
      userContext.favoriteDecades = tasteProfile.favorite_decades;
    }
    if (tasteProfile.rated_movies.length > 0) {
      userContext.ratedMovies = tasteProfile.rated_movies.map((m) => ({
        title: m.title,
        rating: m.rating,
      }));
    }
    if (recentSearchHistory.length > 0) {
      userContext.recentSearches = recentSearchHistory.map((s) => s.query);
    }

    // Build a synthetic query that guides Gemini to discover great content for this user
    const syntheticQuery = buildPersonalizedQuery(tasteProfile, watchlistGenreSignal);

    // Content types based on user preferences
    const contentTypes: string[] = [];
    if (preferences.contentType === 'all' || preferences.contentType === 'movies') {
      contentTypes.push('movies');
    }
    if (preferences.contentType === 'all' || preferences.contentType === 'tvshows') {
      contentTypes.push('TV shows');
    }
    if (contentTypes.length === 0) contentTypes.push('movies', 'TV shows');

    // Recent trending titles for Gemini awareness
    const recentTitles = trendingItems.slice(0, 15).map((item) => ({
      title: item.title,
      mediaType: item.media_type,
    }));

    // Call Gemini AI for personalized recommendations
    const aiResult = await gemini.generateRecommendationsWithResponse(
      syntheticQuery,
      contentTypes,
      language,
      undefined,
      20, // max recommendations
      userContext,
      undefined, // no conversation history for for-you
      recentTitles.length > 0 ? recentTitles : undefined
    );

    // If Gemini failed, fall back to trending
    if (aiResult.isFallback || aiResult.recommendations.length === 0) {
      console.log('⚠️ For You: Gemini returned no results, falling back to trending');
      return NextResponse.json({
        success: true,
        data: {
          recommendations: [],
          streamingProviders: {},
          hasProfile: true,
        },
      });
    }

    // Enrich recommendations with TMDB data
    const includeMovies = contentTypes.includes('movies');
    const includeTvShows = contentTypes.includes('TV shows');
    const enrichedResults = await tmdb.enrichRecommendations(
      aiResult.recommendations,
      includeMovies,
      includeTvShows,
      language
    );

    // Filter out already-watched and watchlisted items
    const filteredResults = enrichedResults.filter((item) => !excludeIds.has(item.tmdb_id));

    // Take top 20
    const top20 = filteredResults.slice(0, 20);

    // Fetch streaming providers for all results in parallel
    const [rawProvidersMap] = await Promise.all([
      tmdb.getBatchWatchProviders(top20, country),
    ]);

    // Filter by user's availability type + platform preferences
    const allowFlatrate = preferences.includeFlatrate;
    const allowRent = preferences.includeRent;
    const allowBuy = preferences.includeBuy;
    const hasAvailabilityFilter = allowFlatrate || allowRent || allowBuy;

    const filteredProvidersMap: { [key: number]: StreamingProvider[] } = {};
    for (const [tmdbIdStr, itemProviders] of Object.entries(rawProvidersMap)) {
      const tmdbId = Number(tmdbIdStr);
      let filtered = itemProviders;

      if (hasAvailabilityFilter) {
        filtered = filtered.filter((p) => {
          if (p.availability_type === 'flatrate' && allowFlatrate) return true;
          if (p.availability_type === 'rent' && allowRent) return true;
          if (p.availability_type === 'buy' && allowBuy) return true;
          if (p.availability_type === 'ads' && allowFlatrate) return true;
          return false;
        });
      }

      if (preferences.platforms.length > 0) {
        const platformSet = new Set(preferences.platforms);
        filtered = filtered.filter((p) => platformSet.has(p.provider_id));
      }

      if (filtered.length > 0) {
        filteredProvidersMap[tmdbId] = filtered;
      }
    }

    // Only keep recommendations with matching providers (if user has filters)
    const hasFilters = hasAvailabilityFilter || preferences.platforms.length > 0;
    const finalRecommendations = hasFilters
      ? top20.filter((item) => filteredProvidersMap[item.tmdb_id]?.length > 0)
      : top20;

    return NextResponse.json(
      {
        success: true,
        data: {
          recommendations: finalRecommendations,
          streamingProviders: filteredProvidersMap,
          hasProfile: true,
        },
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=1800',
        },
      }
    );
  } catch (error) {
    console.error('❌ /api/for-you:', error);
    return NextResponse.json(
      { error: 'Failed to load personalized recommendations' },
      { status: 500 }
    );
  }
}

/**
 * Analyze watchlist to extract implicit genre preferences
 * If a user has 5 action movies in their watchlist, that's a strong signal
 */
function analyzeWatchlistGenres(
  watchlist: { tmdb_id: number; media_type: string; title: string }[]
): string[] {
  if (watchlist.length === 0) return [];

  // We don't have genre_ids on watchlist items, but we can mention
  // the titles to Gemini and let it infer patterns
  const titles = watchlist.slice(0, 10).map((item) => item.title);
  return titles;
}

/**
 * Build a synthetic query that guides Gemini to find great personalized content
 * Instead of a user-written query, we construct one from the taste profile
 */
function buildPersonalizedQuery(
  tasteProfile: {
    favorite_genres: string[];
    disliked_genres: string[];
    favorite_decades: string[];
    rated_movies: { title: string; rating: number; tmdb_id: number }[];
  },
  watchlistTitles: string[]
): string {
  const parts: string[] = [];

  // Core request
  parts.push('Recommend me great movies and TV shows I would love based on my taste.');

  // Highly rated movies as the strongest signal
  const loved = tasteProfile.rated_movies.filter((m) => m.rating >= 4);
  if (loved.length > 0) {
    const titles = loved.slice(0, 8).map((m) => m.title);
    parts.push(`I loved: ${titles.join(', ')}.`);
  }

  // Disliked movies
  const disliked = tasteProfile.rated_movies.filter((m) => m.rating >= 1 && m.rating <= 2);
  if (disliked.length > 0) {
    const titles = disliked.slice(0, 5).map((m) => m.title);
    parts.push(`I did NOT like: ${titles.join(', ')}.`);
  }

  // Watchlist hints (what they want to watch = taste signal)
  if (watchlistTitles.length > 0) {
    parts.push(`I'm interested in watching: ${watchlistTitles.slice(0, 5).join(', ')}.`);
  }

  // Genre preferences
  if (tasteProfile.favorite_genres.length > 0) {
    parts.push(`I enjoy ${tasteProfile.favorite_genres.join(', ')}.`);
  }

  // Decade preferences
  if (tasteProfile.favorite_decades.length > 0) {
    parts.push(`I prefer content from: ${tasteProfile.favorite_decades.join(', ')}.`);
  }

  // Add variety instruction
  parts.push('Suggest a diverse mix — hidden gems, classics, and recent titles. Surprise me!');

  return parts.join(' ');
}
