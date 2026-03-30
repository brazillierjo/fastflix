/**
 * Public providers endpoint - no auth required
 * Used by the setup screen before the user signs in
 */

import { NextRequest, NextResponse } from 'next/server';
import { tmdb } from '@/lib/tmdb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || 'FR';

    if (!/^[A-Z]{2}$/.test(country)) {
      return NextResponse.json(
        { error: 'Invalid country code' },
        { status: 400 }
      );
    }

    const providers = await tmdb.getAvailableProviders(country);

    return NextResponse.json(
      {
        success: true,
        data: { country, providers },
      },
      {
        headers: { 'Cache-Control': 'public, max-age=86400' }, // Cache 24h
      }
    );
  } catch (error) {
    console.error('❌ /api/providers/public:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}
