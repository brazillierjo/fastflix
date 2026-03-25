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

    const trending = await tmdb.getTrending(language);
    const top20 = trending.slice(0, 20);

    return NextResponse.json(
      { success: true, data: { items: top20 } },
      { headers: { 'Cache-Control': 'public, max-age=3600' } }
    );
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch trending' },
      { status: 500 }
    );
  }
}
