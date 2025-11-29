/**
 * FastFlix Backend - Search Endpoint
 * Main endpoint for AI-powered movie/TV show recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchRequestSchema } from '@/lib/validation';
import { promptCounter } from '@/lib/prompt-counter';
import { gemini } from '@/lib/gemini';
import { tmdb } from '@/lib/tmdb';
import { db } from '@/lib/db';
import { applyRateLimit } from '@/lib/api-helpers';
import { antiAbuse } from '@/lib/anti-abuse';
import type { SearchResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body first to get deviceId for rate limiting
    const body = await request.json();
    const validatedData = searchRequestSchema.parse(body);

    // Apply rate limiting (IP + device)
    const rateLimitResponse = await applyRateLimit(request, 'search', validatedData.deviceId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { deviceId, query, includeMovies, includeTvShows, platform, appVersion, language, country } =
      validatedData;

    // Step 1: Check if device is blocked
    const isBlocked = await db.isDeviceBlocked(deviceId);
    if (isBlocked) {
      await antiAbuse.recordFailedAttempt(deviceId);
      return NextResponse.json(
        {
          error: 'Device is blocked',
          reason: 'Your device has been blocked due to policy violations',
        },
        { status: 403 }
      );
    }

    // Step 2: Check prompt quota (checks database for Pro status via webhook)
    const limitCheck = await promptCounter.canMakePrompt(deviceId);
    if (!limitCheck.allowed) {
      await antiAbuse.recordFailedAttempt(deviceId);
      return NextResponse.json(
        {
          error: 'Quota exceeded',
          reason: limitCheck.reason,
          promptsRemaining: 0,
          isProUser: limitCheck.isProUser,
        },
        { status: 429 }
      );
    }

    // Step 3: Ensure user exists in database (create if needed)
    await db.getOrCreateUser(deviceId, platform, appVersion);

    // Step 4: Build content type array for Gemini
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

    // Step 5: Generate AI recommendations with conversational response
    const aiResult = await gemini.generateRecommendationsWithResponse(query, contentTypes, language);

    // Step 6: Enrich recommendations with TMDB data
    const enrichedResults = await tmdb.enrichRecommendations(
      aiResult.recommendations,
      includeMovies,
      includeTvShows,
      language
    );

    // Step 6b: Fetch streaming providers for enriched results
    const streamingProviders = await tmdb.getBatchWatchProviders(enrichedResults, country);

    // Step 6c: Filter results if specific platforms were requested
    let finalResults = enrichedResults;
    if (aiResult.detectedPlatforms && aiResult.detectedPlatforms.length > 0) {
      console.log(`🔍 Filtering results for platforms: ${aiResult.detectedPlatforms.join(', ')}`);
      
      finalResults = enrichedResults.filter(movie => {
        const movieProviders = streamingProviders[movie.tmdb_id] || [];
        return aiResult.detectedPlatforms.some(requestedPlatform => {
          const normalizedRequested = requestedPlatform.toLowerCase().replace(/\s+/g, '');
          return movieProviders.some(provider => {
            const normalizedProvider = provider.provider_name.toLowerCase().replace(/\s+/g, '');
            return normalizedProvider.includes(normalizedRequested) || normalizedRequested.includes(normalizedProvider);
          });
        });
      });
      
      console.log(`✅ Filtered ${enrichedResults.length} -> ${finalResults.length} results`);
    }

    // Step 7: Increment prompt count (only if we got results)
    let newPromptCount = limitCheck.remaining;
    if (finalResults.length > 0) {
      newPromptCount = await db.incrementPromptCount(deviceId);
    }

    // Step 8: Log the prompt for analytics
    const responseTimeMs = Date.now() - startTime;
    await db.logPrompt(deviceId, query, finalResults.length, responseTimeMs);

    // Step 9: Calculate remaining prompts
    const maxFreePrompts = parseInt(process.env.MAX_FREE_PROMPTS || '3', 10);
    const promptsRemaining = limitCheck.isProUser
      ? -1 // Unlimited for Pro users
      : Math.max(0, maxFreePrompts - newPromptCount);

    // Step 10: Record successful attempt (clears abuse records)
    await antiAbuse.recordSuccessfulAttempt(deviceId);

    // Step 11: Return successful response
    const response: SearchResponse = {
      recommendations: finalResults,
      streamingProviders,
      conversationalResponse: aiResult.conversationalResponse,
      promptsRemaining,
      isProUser: limitCheck.isProUser,
      totalResults: finalResults.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    // Zod validation error
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.message,
        },
        { status: 400 }
      );
    }

    // Other errors
    console.error('❌ Error in /api/search:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
