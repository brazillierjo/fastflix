/**
 * FastFlix Backend - Search Endpoint
 * Main endpoint for AI-powered movie/TV show recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchRequestSchema } from '@/lib/validation';
import { gemini } from '@/lib/gemini';
import { tmdb } from '@/lib/tmdb';
import { db } from '@/lib/db';
import { applyRateLimit } from '@/lib/api-helpers';
import { requireAuth } from '@/lib/middleware';
import type { SearchResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Step 1: Require authentication
    const authResult = await requireAuth(request);

    if (!authResult.success || !authResult.userId) {
      return authResult.error!;
    }

    const userId = authResult.userId;
    const user = authResult.user!;

    // Parse request body
    const body = await request.json();
    const validatedData = searchRequestSchema.parse(body);

    // Apply rate limiting (IP only, no device ID needed)
    const rateLimitResponse = await applyRateLimit(request, 'search');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { query, includeMovies, includeTvShows, language, country } = validatedData;

    // Step 2: Check subscription status (REQUIRED)
    const hasActiveSubscription = await db.hasActiveSubscriptionByUserId(userId);
    if (!hasActiveSubscription) {
      console.log(`🔒 Access denied for user ${user.email}: No active subscription`);
      return NextResponse.json(
        {
          error: 'Subscription required',
          reason: 'An active subscription is required to access movie recommendations',
        },
        { status: 402 } // Payment Required
      );
    }

    console.log(`✅ Access granted for user ${user.email}: Active subscription`);

    // Step 3: Build content type array for Gemini
    const contentTypes: string[] = [];
    if (includeMovies) contentTypes.push('movies');
    if (includeTvShows) contentTypes.push('TV shows');

    if (contentTypes.length === 0) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          reason: 'At least one content type (movies or TV shows) must be selected',
        },
        { status: 400 }
      );
    }

    // Step 4: Generate AI recommendations with conversational response
    const aiResult = await gemini.generateRecommendationsWithResponse(query, contentTypes, language);

    // Step 5: Enrich recommendations with TMDB data
    const enrichedResults = await tmdb.enrichRecommendations(
      aiResult.recommendations,
      includeMovies,
      includeTvShows,
      language
    );

    // Step 6: Fetch streaming providers for enriched results
    const streamingProviders = await tmdb.getBatchWatchProviders(enrichedResults, country);

    // Step 7: Filter results if specific platforms were requested
    let finalResults = enrichedResults;
    if (aiResult.detectedPlatforms && aiResult.detectedPlatforms.length > 0) {
      console.log(`🔍 Filtering results for platforms: ${aiResult.detectedPlatforms.join(', ')}`);

      const filteredResults = enrichedResults.filter(movie => {
        const movieProviders = streamingProviders[movie.tmdb_id] || [];
        return aiResult.detectedPlatforms.some(requestedPlatform => {
          const normalizedRequested = requestedPlatform.toLowerCase().replace(/\s+/g, '');
          return movieProviders.some(provider => {
            const normalizedProvider = provider.provider_name.toLowerCase().replace(/\s+/g, '');
            return normalizedProvider.includes(normalizedRequested) || normalizedRequested.includes(normalizedProvider);
          });
        });
      });

      // Smart filtering: only apply filter if we retain at least 30% of results
      // This prevents returning empty results when content isn't available on the requested platform
      const retentionRate = enrichedResults.length > 0 ? filteredResults.length / enrichedResults.length : 0;

      if (filteredResults.length === 0 || retentionRate < 0.3) {
        console.log(`⚠️  Platform filtering would remove too many results (${enrichedResults.length} -> ${filteredResults.length}). Keeping original results.`);
        finalResults = enrichedResults;
      } else {
        console.log(`✅ Filtered ${enrichedResults.length} -> ${filteredResults.length} results`);
        finalResults = filteredResults;
      }
    }

    // Step 8: Log the prompt for analytics
    const responseTimeMs = Date.now() - startTime;
    await db.logPromptWithUserId(userId, query, finalResults.length, responseTimeMs);

    // Step 9: Return successful response
    const response: SearchResponse = {
      recommendations: finalResults,
      streamingProviders,
      conversationalResponse: aiResult.conversationalResponse,
      totalResults: finalResults.length,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('❌ Error in search endpoint:', error);

    // Return user-friendly error
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      {
        error: errorMessage,
        reason: 'Failed to process recommendation request',
      },
      { status: 500 }
    );
  }
}
