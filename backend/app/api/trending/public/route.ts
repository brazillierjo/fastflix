/**
 * Public trending endpoint - no auth required
 * Used by the home screen for guest users
 */

import { NextRequest, NextResponse } from 'next/server';
import { tmdb } from '@/lib/tmdb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'fr-FR';
    const country = searchParams.get('country') || 'FR';

    const trending = await tmdb.getTrending(language);
    const top20 = trending.slice(0, 20);

    // Fetch providers for trending items
    const trendingAsResults = top20.map((item) => ({
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
    const providers = await tmdb.getBatchWatchProviders(trendingAsResults, country);
    const itemsWithProviders = top20.map((item) => ({
      ...item,
      providers: (providers[item.tmdb_id] || []).map((p) => ({
        provider_name: p.provider_name,
        logo_path: p.logo_path,
      })),
    }));

    return NextResponse.json(
      { success: true, data: { items: itemsWithProviders } },
      { headers: { 'Cache-Control': 'public, max-age=3600' } }
    );
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch trending' },
      { status: 500 }
    );
  }
}
