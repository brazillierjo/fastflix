/**
 * FastFlix Backend - New Releases Endpoint
 * GET: Fetch movies and TV shows released this week, grouped by user's platforms
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { tmdb } from '@/lib/tmdb';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.success || !authResult.userId) {
      return authResult.error!;
    }

    const userId = authResult.userId;
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'fr-FR';
    const country = searchParams.get('country') || 'FR';

    // Get user's preferred platforms
    const preferences = await db.getUserPreferences(userId);
    const userPlatformIds = preferences.platforms.length > 0
      ? preferences.platforms
      : []; // empty = show all

    // Calculate date range for "this week"
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const dateFrom = weekAgo.toISOString().split('T')[0];
    const dateTo = now.toISOString().split('T')[0];

    // Fetch recent movies and TV from TMDB discover
    const params: Record<string, string> = {
      'primary_release_date.gte': dateFrom,
      'primary_release_date.lte': dateTo,
      sort_by: 'popularity.desc',
      'vote_count.gte': '5',
      language,
      watch_region: country,
      page: '1',
    };

    const tvParams: Record<string, string> = {
      'first_air_date.gte': dateFrom,
      'first_air_date.lte': dateTo,
      sort_by: 'popularity.desc',
      'vote_count.gte': '3',
      language,
      watch_region: country,
      page: '1',
    };

    // If user has platform preferences, filter by them
    if (userPlatformIds.length > 0) {
      params.with_watch_providers = userPlatformIds.join('|');
      params.watch_region = country;
      tvParams.with_watch_providers = userPlatformIds.join('|');
      tvParams.watch_region = country;
    }

    const [moviesData, tvData] = await Promise.all([
      tmdb.makePublicRequest('/discover/movie', params),
      tmdb.makePublicRequest('/discover/tv', tvParams),
    ]);

    // Combine and format results
    interface TMDBResult {
      id: number;
      title?: string;
      name?: string;
      poster_path: string | null;
      vote_average: number;
      overview: string;
      release_date?: string;
      first_air_date?: string;
    }

    const movies = ((moviesData as { results?: TMDBResult[] }).results || []).slice(0, 10).map((item: TMDBResult) => ({
      tmdb_id: item.id,
      title: item.title || item.name || '',
      poster_path: item.poster_path,
      vote_average: item.vote_average,
      overview: item.overview,
      media_type: 'movie' as const,
      release_date: item.release_date,
    }));

    const tvShows = ((tvData as { results?: TMDBResult[] }).results || []).slice(0, 10).map((item: TMDBResult) => ({
      tmdb_id: item.id,
      title: item.name || item.title || '',
      poster_path: item.poster_path,
      vote_average: item.vote_average,
      overview: item.overview,
      media_type: 'tv' as const,
      release_date: item.first_air_date,
    }));

    // Fetch providers for all items
    const allItems = [...movies, ...tvShows];
    const providersMap: Record<number, { provider_name: string; logo_path: string }[]> = {};

    // Batch fetch providers (5 at a time)
    for (let i = 0; i < allItems.length; i += 5) {
      const batch = allItems.slice(i, i + 5);
      const results = await Promise.all(
        batch.map(item =>
          tmdb.getWatchProviders(item.tmdb_id, item.media_type, country)
            .then(providers => ({ id: item.tmdb_id, providers }))
            .catch(() => ({ id: item.tmdb_id, providers: [] }))
        )
      );
      for (const { id, providers } of results) {
        providersMap[id] = providers.map(p => ({
          provider_name: p.provider_name,
          logo_path: p.logo_path,
        }));
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          movies,
          tvShows,
          providers: providersMap,
          dateRange: { from: dateFrom, to: dateTo },
        },
      },
      { headers: { 'Cache-Control': 'public, max-age=3600' } }
    );
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch new releases' },
      { status: 500 }
    );
  }
}
