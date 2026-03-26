/**
 * FastFlix Backend - For You Endpoint
 * GET: Personalized recommendations based on user taste profile, search history, and watchlist
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { tmdb } from '@/lib/tmdb';
import { db } from '@/lib/db';
import { applyTierRateLimit } from '@/lib/api-helpers';
import type { MovieResult, StreamingProvider } from '@/lib/types';
import { computeAffinityScore, getWatchedTmdbIds } from '@/lib/affinity';

/**
 * TMDB genre ID mapping - Movies
 */
const MOVIE_GENRE_MAP: Record<string, number> = {
  Action: 28,
  Comedy: 35,
  Drama: 18,
  Thriller: 53,
  'Sci-Fi': 878,
  Horror: 27,
  Romance: 10749,
  Animation: 16,
  Documentary: 99,
  Fantasy: 14,
  Crime: 80,
  Adventure: 12,
};

/**
 * TMDB genre ID mapping - TV Shows (different IDs!)
 */
const TV_GENRE_MAP: Record<string, number> = {
  Action: 10759,      // Action & Adventure
  Comedy: 35,
  Drama: 18,
  Thriller: 9648,     // Mystery (closest to Thriller for TV)
  'Sci-Fi': 10765,    // Sci-Fi & Fantasy
  Horror: 9648,       // Mystery
  Romance: 18,        // Drama (no Romance genre for TV)
  Animation: 16,
  Documentary: 99,
  Fantasy: 10765,     // Sci-Fi & Fantasy
  Crime: 80,
  Adventure: 10759,   // Action & Adventure
};

/**
 * GET /api/for-you
 * Returns personalized recommendations based on user taste profile
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

    // Fetch taste profile, watchlist, and user preferences in parallel
    const [tasteProfile, watchlist, preferences] = await Promise.all([
      db.getUserTasteProfile(userId),
      db.getWatchlist(userId),
      db.getUserPreferences(userId),
    ]);

    // Build set of IDs to exclude: watchlist + already watched/rated
    const watchlistTmdbIds = new Set(watchlist.map((item) => item.tmdb_id));
    const watchedTmdbIds = getWatchedTmdbIds(tasteProfile);
    const excludeIds = new Set([...watchlistTmdbIds, ...watchedTmdbIds]);

    // Get top 5 favorite genres (was 3, more variety)
    const favoriteGenres = tasteProfile.favorite_genres.slice(0, 5);

    // Build disliked genre IDs to filter out
    const dislikedGenreNames = new Set(tasteProfile.disliked_genres.map(g => g.toLowerCase()));

    // Map genre names to TMDB genre IDs (different for movies vs TV!)
    const movieGenreIds = favoriteGenres
      .map((genre) => MOVIE_GENRE_MAP[genre])
      .filter((id): id is number => id !== undefined);

    const tvGenreIds = favoriteGenres
      .map((genre) => TV_GENRE_MAP[genre])
      .filter((id): id is number => id !== undefined);

    // Deduplicate TV genre IDs (some genres map to the same ID)
    const uniqueTvGenreIds = [...new Set(tvGenreIds)];

    // If no genres configured, use popular defaults
    const effectiveMovieGenreIds = movieGenreIds.length > 0 ? movieGenreIds : [18, 28, 35];
    const effectiveTvGenreIds = uniqueTvGenreIds.length > 0 ? uniqueTvGenreIds : [18, 10759, 35];

    // Discover movies and TV shows with their respective genre IDs
    const [movies, tvShows] = await Promise.all([
      tmdb.discoverByGenres(effectiveMovieGenreIds, 'movie', 1, language),
      tmdb.discoverByGenres(effectiveTvGenreIds, 'tv', 1, language),
    ]);

    // Convert to MovieResult format and merge
    const allResults: MovieResult[] = [];
    const seenIds = new Set<number>();

    const processResults = (
      items: Awaited<ReturnType<typeof tmdb.discoverByGenres>>,
      mediaType: 'movie' | 'tv'
    ) => {
      for (const item of items) {
        const id = item.id;

        // Skip if already watched, in watchlist, or already processed
        if (excludeIds.has(id) || seenIds.has(id)) {
          continue;
        }

        // Skip items that are primarily in disliked genres
        const itemGenreIds = item.genre_ids || [];
        const affinityScore = computeAffinityScore(itemGenreIds, tasteProfile);
        if (affinityScore < -2) continue; // strongly disliked

        seenIds.add(id);

        const isMovie = 'title' in item;
        const movieItem = item as import('@/lib/types').TMDBMovie;
        const tvItem = item as import('@/lib/types').TMDBTVShow;

        allResults.push({
          tmdb_id: id,
          title: isMovie ? movieItem.title : tvItem.name,
          original_title: isMovie ? movieItem.original_title : tvItem.original_name,
          media_type: mediaType,
          overview: item.overview || '',
          poster_path: item.poster_path,
          backdrop_path: item.backdrop_path,
          vote_average: item.vote_average || 0,
          vote_count: item.vote_count || 0,
          release_date: isMovie ? movieItem.release_date : undefined,
          first_air_date: !isMovie ? tvItem.first_air_date : undefined,
          genre_ids: item.genre_ids || [],
          popularity: item.popularity || 0,
        });
      }
    };

    processResults(movies, 'movie');
    processResults(tvShows, 'tv');

    // Sort by affinity score first, then vote_average as tiebreaker
    allResults.sort((a, b) => {
      const scoreA = computeAffinityScore(a.genre_ids || [], tasteProfile);
      const scoreB = computeAffinityScore(b.genre_ids || [], tasteProfile);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return b.vote_average - a.vote_average;
    });

    // Take top 20
    const top20 = allResults.slice(0, 20);

    // Fetch streaming providers for each result in parallel
    const providersMap: { [key: number]: StreamingProvider[] } = {};
    await Promise.all(
      top20.map(async (item) => {
        const providers = await tmdb.getWatchProviders(item.tmdb_id, item.media_type, country);
        if (providers.length > 0) {
          providersMap[item.tmdb_id] = providers;
        }
      })
    );

    // Filter by user's availability type preferences
    const allowFlatrate = preferences.includeFlatrate;
    const allowRent = preferences.includeRent;
    const allowBuy = preferences.includeBuy;
    const hasAvailabilityFilter = allowFlatrate || allowRent || allowBuy;

    const filteredProvidersMap: { [key: number]: StreamingProvider[] } = {};
    for (const [tmdbIdStr, itemProviders] of Object.entries(providersMap)) {
      const tmdbId = Number(tmdbIdStr);
      let filtered = itemProviders;

      // Filter by availability type
      if (hasAvailabilityFilter) {
        filtered = filtered.filter((p) => {
          if (p.availability_type === 'flatrate' && allowFlatrate) return true;
          if (p.availability_type === 'rent' && allowRent) return true;
          if (p.availability_type === 'buy' && allowBuy) return true;
          if (p.availability_type === 'ads' && allowFlatrate) return true;
          return false;
        });
      }

      // Filter by platform preferences
      if (preferences.platforms.length > 0) {
        const platformSet = new Set(preferences.platforms);
        filtered = filtered.filter((p) => platformSet.has(p.provider_id));
      }

      if (filtered.length > 0) {
        filteredProvidersMap[tmdbId] = filtered;
      }
    }

    // Only keep recommendations that have matching providers (if user has filters set)
    const hasFilters = hasAvailabilityFilter || preferences.platforms.length > 0;
    const filteredRecommendations = hasFilters
      ? top20.filter((item) => filteredProvidersMap[item.tmdb_id]?.length > 0)
      : top20;

    return NextResponse.json(
      {
        success: true,
        data: {
          recommendations: filteredRecommendations,
          streamingProviders: filteredProvidersMap,
        },
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=1800',
        },
      }
    );
  } catch {
    return NextResponse.json({ error: 'Failed to load personalized recommendations' }, { status: 500 });
  }
}
