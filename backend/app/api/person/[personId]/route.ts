/**
 * FastFlix Backend - Person Details Endpoint
 * GET: Get actor/person details with credits from TMDB
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { tmdb } from '@/lib/tmdb';
import { db } from '@/lib/db';
import { applyTierRateLimit } from '@/lib/api-helpers';
import { z } from 'zod';

// Validation schema for person endpoint params
const personParamsSchema = z.object({
  personId: z.string().regex(/^\d+$/, 'Person ID must be a number').transform(Number),
});

const personQuerySchema = z.object({
  language: z.string().default('fr-FR'),
});

interface RouteParams {
  params: Promise<{ personId: string }>;
}

/**
 * GET /api/person/:personId
 * Get person details with movie and TV credits
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
    const validatedParams = personParamsSchema.parse(rawParams);
    const personId = validatedParams.personId;

    // Get and validate query params
    const { searchParams } = new URL(request.url);
    const validatedQuery = personQuerySchema.parse({
      language: searchParams.get('language') || undefined,
    });

    const { language } = validatedQuery;

    // Fetch person details from TMDB
    const person = await tmdb.getPersonDetails(personId, language);

    if (!person) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: person,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to fetch person details' }, { status: 500 });
  }
}
