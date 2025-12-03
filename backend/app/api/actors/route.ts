/**
 * FastFlix Backend - Actors Search Endpoint
 * Search for actors by name using TMDB API
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { tmdb } from '@/lib/tmdb';
import { requireAuth } from '@/lib/middleware';

const searchActorSchema = z.object({
  query: z.string().min(2).max(100),
  language: z.string().default('en-US'),
});

export async function GET(request: NextRequest) {
  try {
    // Step 1: Require authentication
    const authResult = await requireAuth(request);

    if (!authResult.success || !authResult.userId) {
      return authResult.error!;
    }

    // Step 2: Get search params
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const language = searchParams.get('language') || 'en-US';

    // Step 3: Validate
    const validatedData = searchActorSchema.parse({ query, language });

    // Step 4: Search for actors
    const actors = await tmdb.searchPerson(validatedData.query, validatedData.language);

    return NextResponse.json({
      actors,
      totalResults: actors.length,
    });
  } catch (error) {
    console.error('❌ Error in actors search endpoint:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to search actors',
      },
      { status: 500 }
    );
  }
}
