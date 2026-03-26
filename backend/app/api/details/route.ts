/**
 * FastFlix Backend - Details Endpoint
 * GET: Fetch full details, credits, and providers for a single movie/TV show
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { tmdb } from '@/lib/tmdb';
import { applyTierRateLimit } from '@/lib/api-helpers';
import { db } from '@/lib/db';

/**
 * GET /api/details?tmdbId=123&mediaType=movie&language=fr-FR&country=FR
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.success || !authResult.userId) {
      return authResult.error!;
    }

    const isPremium = await db.hasAccess(authResult.userId);
    const rateLimitResponse = await applyTierRateLimit(request, 'details', isPremium);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { searchParams } = new URL(request.url);
    const tmdbId = parseInt(searchParams.get('tmdbId') || '0', 10);
    const mediaType = (searchParams.get('mediaType') || 'movie') as 'movie' | 'tv';
    const language = searchParams.get('language') || 'fr-FR';
    const country = searchParams.get('country') || 'FR';

    if (!tmdbId) {
      return NextResponse.json({ error: 'tmdbId is required' }, { status: 400 });
    }

    // Fetch details, credits, and providers in parallel
    const [fullDetails, detailedInfo, creditsResult, providers] = await Promise.all([
      tmdb.getFullDetails(tmdbId, mediaType, language),
      mediaType === 'movie'
        ? tmdb.getMovieDetails(tmdbId, language)
        : tmdb.getTVDetails(tmdbId, language),
      tmdb.getCredits(tmdbId, mediaType, language),
      tmdb.getWatchProviders(tmdbId, mediaType, country),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          overview: fullDetails?.overview || '',
          backdrop_path: fullDetails?.backdrop_path || null,
          poster_path: fullDetails?.poster_path || null,
          vote_average: fullDetails?.vote_average || 0,
          title: fullDetails?.title || '',
          providers,
          credits: creditsResult.cast,
          crew: creditsResult.crew,
          detailedInfo: detailedInfo || {},
        },
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=1800',
        },
      }
    );
  } catch (error) {
    console.error('❌ /api/details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch details' },
      { status: 500 }
    );
  }
}
