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

    const {
      query,
      includeMovies,
      includeTvShows,
      language,
      country,
      yearFrom,
      yearTo,
      actorIds,
      platforms,
      includeFlatrate,
      includeRent,
      includeBuy,
    } = validatedData;

    // Step 2: Check access (subscription OR active trial)
    const hasAccess = await db.hasAccess(userId);
    if (!hasAccess) {
      console.log(`🔒 Access denied for user ${user.email}: No active subscription or trial`);
      return NextResponse.json(
        {
          error: 'Subscription required',
          reason:
            'An active subscription or free trial is required to access movie recommendations',
        },
        { status: 402 } // Payment Required
      );
    }

    console.log(`✅ Access granted for user ${user.email}`);

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
    const aiResult = await gemini.generateRecommendationsWithResponse(
      query,
      contentTypes,
      language,
      { yearFrom, yearTo }
    );

    // Step 5: Enrich recommendations with TMDB data
    let enrichedResults = await tmdb.enrichRecommendations(
      aiResult.recommendations,
      includeMovies,
      includeTvShows,
      language
    );

    // Step 5b: Filter by actor if actorIds provided
    if (actorIds && actorIds.length > 0) {
      console.log(`🎭 Filtering results by ${actorIds.length} actor(s)`);

      // Get credits for all selected actors
      const actorCreditsPromises = actorIds.map((actorId) =>
        tmdb.getPersonCredits(
          actorId,
          includeMovies && includeTvShows ? 'both' : includeMovies ? 'movie' : 'tv',
          language
        )
      );
      const allActorCredits = await Promise.all(actorCreditsPromises);

      // Create a set of TMDB IDs that appear in ALL selected actors' filmographies (AND logic)
      // For single actor, this is just their filmography
      // For multiple actors, we find the intersection
      const actorTmdbIdSets = allActorCredits.map(
        (credits) => new Set(credits.map((c) => c.tmdb_id))
      );

      let validTmdbIds: Set<number>;
      if (actorTmdbIdSets.length === 1) {
        validTmdbIds = actorTmdbIdSets[0];
      } else {
        // Intersection of all sets
        validTmdbIds = actorTmdbIdSets.reduce((acc, set) => {
          return new Set([...acc].filter((id) => set.has(id)));
        });
      }

      // Filter enriched results to only include titles with the selected actor(s)
      const filteredByActor = enrichedResults.filter((movie) => validTmdbIds.has(movie.tmdb_id));

      console.log(
        `🎭 Filtered ${enrichedResults.length} -> ${filteredByActor.length} results by actor`
      );

      // If we have good results from filtering, use them
      // Otherwise, augment with actor's other popular films
      if (filteredByActor.length >= 5) {
        enrichedResults = filteredByActor;
      } else {
        // Add popular films from the first actor to fill the results
        const actorFilms = allActorCredits[0]
          .filter((film) => !filteredByActor.some((f) => f.tmdb_id === film.tmdb_id))
          .slice(0, 20 - filteredByActor.length);
        enrichedResults = [...filteredByActor, ...actorFilms];
        console.log(`🎭 Augmented with ${actorFilms.length} additional actor films`);
      }
    }

    // Step 6: Fetch streaming providers and detailed info in parallel
    const [rawStreamingProviders, { credits, detailedInfo }] = await Promise.all([
      tmdb.getBatchWatchProviders(enrichedResults, country),
      tmdb.getBatchDetailsAndCredits(enrichedResults, language),
    ]);

    // Step 6b: Filter streaming providers by availability type preferences
    let streamingProviders = rawStreamingProviders;
    const hasAvailabilityFilters =
      includeFlatrate !== undefined || includeRent !== undefined || includeBuy !== undefined;

    if (hasAvailabilityFilters) {
      // Default to true if not specified (backward compatibility)
      const allowFlatrate = includeFlatrate !== false;
      const allowRent = includeRent === true;
      const allowBuy = includeBuy === true;

      console.log(
        `🔍 Filtering availability: flatrate=${allowFlatrate}, rent=${allowRent}, buy=${allowBuy}`
      );

      streamingProviders = {};
      for (const [movieId, providers] of Object.entries(rawStreamingProviders)) {
        const filteredProviders = providers.filter((provider) => {
          if (provider.availability_type === 'flatrate' && allowFlatrate) return true;
          if (provider.availability_type === 'rent' && allowRent) return true;
          if (provider.availability_type === 'buy' && allowBuy) return true;
          if (provider.availability_type === 'ads' && allowFlatrate) return true; // Ads = free with ads, similar to flatrate
          return false;
        });
        if (filteredProviders.length > 0) {
          streamingProviders[Number(movieId)] = filteredProviders;
        }
      }
    }

    // Step 6c: Filter by specific platform IDs if provided
    if (platforms && platforms.length > 0) {
      console.log(`🔍 Filtering by ${platforms.length} platform(s): ${platforms.join(', ')}`);

      const platformSet = new Set(platforms);
      const filteredByPlatform: typeof streamingProviders = {};

      for (const [movieId, providers] of Object.entries(streamingProviders)) {
        const matchingProviders = providers.filter((provider) =>
          platformSet.has(provider.provider_id)
        );
        if (matchingProviders.length > 0) {
          filteredByPlatform[Number(movieId)] = matchingProviders;
        }
      }

      streamingProviders = filteredByPlatform;
    }

    // Step 6d: Filter enriched results to only include movies with matching providers
    if ((platforms && platforms.length > 0) || hasAvailabilityFilters) {
      const movieIdsWithProviders = new Set(Object.keys(streamingProviders).map(Number));
      const originalCount = enrichedResults.length;
      enrichedResults = enrichedResults.filter((movie) => movieIdsWithProviders.has(movie.tmdb_id));
      console.log(
        `🎬 Filtered ${originalCount} -> ${enrichedResults.length} results by platform/availability preferences`
      );
    }

    // Step 7: Filter results if specific platforms were requested
    let finalResults = enrichedResults;
    if (aiResult.detectedPlatforms && aiResult.detectedPlatforms.length > 0) {
      console.log(`🔍 Filtering results for platforms: ${aiResult.detectedPlatforms.join(', ')}`);

      const filteredResults = enrichedResults.filter((movie) => {
        const movieProviders = streamingProviders[movie.tmdb_id] || [];
        return aiResult.detectedPlatforms.some((requestedPlatform) => {
          const normalizedRequested = requestedPlatform.toLowerCase().replace(/\s+/g, '');
          return movieProviders.some((provider) => {
            const normalizedProvider = provider.provider_name.toLowerCase().replace(/\s+/g, '');
            return (
              normalizedProvider.includes(normalizedRequested) ||
              normalizedRequested.includes(normalizedProvider)
            );
          });
        });
      });

      // Smart filtering: only apply filter if we retain at least 30% of results
      // This prevents returning empty results when content isn't available on the requested platform
      const retentionRate =
        enrichedResults.length > 0 ? filteredResults.length / enrichedResults.length : 0;

      if (filteredResults.length === 0 || retentionRate < 0.3) {
        console.log(
          `⚠️  Platform filtering would remove too many results (${enrichedResults.length} -> ${filteredResults.length}). Keeping original results.`
        );
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
      credits,
      detailedInfo,
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
