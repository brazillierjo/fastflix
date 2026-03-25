/**
 * FastFlix Backend - Similar Content Endpoint
 * GET: Get similar movies or TV shows from TMDB
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { tmdb } from '@/lib/tmdb';
import { db } from '@/lib/db';
import { applyTierRateLimit } from '@/lib/api-helpers';
import { z } from 'zod';

// Validation schema for similar endpoint params
const similarParamsSchema = z.object({
  tmdbId: z.string().regex(/^\d+$/, 'TMDB ID must be a number').transform(Number),
});

const similarQuerySchema = z.object({
  type: z.enum(['movie', 'tv']).default('movie'),
  language: z.string().default('fr-FR'),
  country: z.string().default('FR'),
});

interface RouteParams {
  params: Promise<{ tmdbId: string }>;
}

/**
 * GET /api/similar/:tmdbId
 * Get similar movies or TV shows, enriched with streaming providers
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);

    if (!authResult.success || !authResult.userId) {
      return authResult.error!;
    }

    // Apply tier-based rate limiting
    const isPremium = await db.hasAccess(authResult.userId);
    const rateLimitResponse = await applyTierRateLimit(request, 'similar', isPremium);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const rawParams = await params;
    const validatedParams = similarParamsSchema.parse(rawParams);
    const tmdbIdNum = validatedParams.tmdbId;

    // Get and validate query params
    const { searchParams } = new URL(request.url);
    const validatedQuery = similarQuerySchema.parse({
      type: searchParams.get('type') || undefined,
      language: searchParams.get('language') || undefined,
      country: searchParams.get('country') || undefined,
    });

    const { type: mediaType, language, country } = validatedQuery;

    // Fetch similar items from TMDB
    const similar = await tmdb.getSimilar(tmdbIdNum, mediaType, language);

    // Enrich with streaming providers
    const providers = await tmdb.getBatchWatchProviders(similar, country);

    return NextResponse.json({
      success: true,
      data: {
        items: similar,
        streamingProviders: providers,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to fetch similar content' }, { status: 500 });
  }
}
