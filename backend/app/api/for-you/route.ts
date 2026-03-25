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

/**
 * TMDB genre ID mapping
 */
const GENRE_MAP: Record<string, number> = {
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

    // Fetch taste profile and watchlist in parallel
    const [tasteProfile, watchlist] = await Promise.all([
      db.getUserTasteProfile(userId),
      db.getWatchlist(userId),
    ]);

    // Build set of watchlist TMDB IDs to exclude
    const watchlistTmdbIds = new Set(watchlist.map((item) => item.tmdb_id));

    // Get top 3 favorite genres from taste profile
    const favoriteGenres = tasteProfile.favorite_genres.slice(0, 3);

    // Map genre names to TMDB genre IDs
    const genreIds = favoriteGenres
      .map((genre) => GENRE_MAP[genre])
      .filter((id): id is number => id !== undefined);

    // If no genres configured, use popular defaults (Drama, Action, Comedy)
    const effectiveGenreIds = genreIds.length > 0 ? genreIds : [18, 28, 35];

    // Discover movies and TV shows with those genres in parallel
    const [movies, tvShows] = await Promise.all([
      tmdb.discoverByGenres(effectiveGenreIds, 'movie', 1, language),
      tmdb.discoverByGenres(effectiveGenreIds, 'tv', 1, language),
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

        // Skip if already in watchlist or already seen
        if (watchlistTmdbIds.has(id) || seenIds.has(id)) {
          continue;
        }

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

    // Sort by vote_average descending
    allResults.sort((a, b) => b.vote_average - a.vote_average);

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

    return NextResponse.json(
      {
        success: true,
        data: {
          recommendations: top20,
          streamingProviders: providersMap,
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
