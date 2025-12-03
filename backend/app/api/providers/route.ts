/**
 * FastFlix Backend - Providers Endpoint
 * GET endpoint to list available streaming providers from TMDB
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { tmdb } from '@/lib/tmdb';

/**
 * GET /api/providers
 * Get list of available streaming providers for a country
 *
 * Query params:
 * - country: ISO 3166-1 alpha-2 country code (default: 'FR')
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);

    if (!authResult.success || !authResult.userId) {
      return authResult.error!;
    }

    // Get country from query params
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || 'FR';

    // Validate country code (2 letters)
    if (!/^[A-Z]{2}$/.test(country)) {
      return NextResponse.json(
        { error: 'Invalid country code. Use ISO 3166-1 alpha-2 format (e.g., FR, US)' },
        { status: 400 }
      );
    }

    // Get providers from TMDB
    const providers = await tmdb.getAvailableProviders(country);

    return NextResponse.json({
      success: true,
      data: {
        country,
        providers,
        totalResults: providers.length,
      },
    });
  } catch (error) {
    console.error('❌ Error in GET /api/providers:', error);
    return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 });
  }
}
