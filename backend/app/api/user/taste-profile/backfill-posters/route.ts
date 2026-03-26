/**
 * POST /api/user/taste-profile/backfill-posters
 * Backfill missing poster_path for rated movies using TMDB API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { db } from '@/lib/db';
import { tmdb } from '@/lib/tmdb';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.success || !authResult.userId) {
      return authResult.error!;
    }

    const profile = await db.getUserTasteProfile(authResult.userId);
    const ratedMovies = [...profile.rated_movies];
    let updated = 0;

    for (const movie of ratedMovies) {
      if (movie.poster_path) continue;

      try {
        const mediaType = movie.media_type || 'movie';
        let details = mediaType === 'tv'
          ? await tmdb.getTVDetails(movie.tmdb_id)
          : await tmdb.getMovieDetails(movie.tmdb_id);
        // If primary type fails, try the other
        if (!details?.poster_path) {
          details = mediaType === 'tv'
            ? await tmdb.getMovieDetails(movie.tmdb_id)
            : await tmdb.getTVDetails(movie.tmdb_id);
          // Fix the media_type while we're at it
          if (details?.poster_path && !movie.media_type) {
            movie.media_type = mediaType === 'tv' ? 'movie' : 'tv';
          }
        }
        if (details?.poster_path) {
          movie.poster_path = details.poster_path;
          updated++;
        }
      } catch {
        // Skip items that fail
      }
    }

    if (updated > 0) {
      await db.updateTasteProfile(authResult.userId, { rated_movies: ratedMovies });
    }

    return NextResponse.json({
      success: true,
      data: { updated, total: ratedMovies.length },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to backfill posters' }, { status: 500 });
  }
}
