/**
 * FastFlix Backend - Search Endpoint
 * Main endpoint for AI-powered movie/TV show recommendations
 *
 * Simplified filter logic:
 * - Platform/availability filters are applied but with smart fallback
 * - If filters result in < 5 results, we include unfiltered results
 * - Always returns at least 10 results when possible
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchRequestSchema } from '@/lib/validation';
import { gemini } from '@/lib/gemini';
import { tmdb } from '@/lib/tmdb';
import { db } from '@/lib/db';
import { applyRateLimit } from '@/lib/api-helpers';
import { requireAuth } from '@/lib/middleware';
import type { SearchResponse, MovieResult, StreamingProvider } from '@/lib/types';

const MIN_RESULTS = 5;
const DEFAULT_RECOMMENDATIONS = 25;
const FILTERED_RECOMMENDATIONS = 40; // Request more when platform filters are active

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
    // Request more recommendations when platform filters are active to ensure enough results after filtering
    const hasPlatformFilters = platforms && platforms.length > 0;
    const maxRecommendations = hasPlatformFilters
      ? FILTERED_RECOMMENDATIONS
      : DEFAULT_RECOMMENDATIONS;

    if (hasPlatformFilters) {
      console.log(`📋 Platform filters active, requesting ${maxRecommendations} recommendations`);
    }

    const aiResult = await gemini.generateRecommendationsWithResponse(
      query,
      contentTypes,
      language,
      undefined, // filters (yearFrom/yearTo) - not used from search route currently
      maxRecommendations
    );

    // Step 5: Enrich recommendations with TMDB data
    const enrichedResults = await tmdb.enrichRecommendations(
      aiResult.recommendations,
      includeMovies,
      includeTvShows,
      language
    );

    console.log(`🎬 Got ${enrichedResults.length} enriched results from TMDB`);

    // Step 6: Fetch streaming providers and detailed info in parallel
    const [rawStreamingProviders, { credits, detailedInfo }] = await Promise.all([
      tmdb.getBatchWatchProviders(enrichedResults, country),
      tmdb.getBatchDetailsAndCredits(enrichedResults, language),
    ]);

    // Step 7: Smart filtering with fallback
    // Apply filters but ensure we always have enough results
    const { filteredResults, filteredProviders } = applySmartFilters(
      enrichedResults,
      rawStreamingProviders,
      {
        platforms,
        includeFlatrate,
        includeRent,
        includeBuy,
      }
    );

    // Step 8: Handle AI-detected platforms (from user query like "sur Netflix")
    let finalResults = filteredResults;
    const finalProviders = filteredProviders;

    if (aiResult.detectedPlatforms && aiResult.detectedPlatforms.length > 0) {
      console.log(`🔍 AI detected platforms in query: ${aiResult.detectedPlatforms.join(', ')}`);

      const platformFilteredResults = filteredResults.filter((movie) => {
        const movieProviders = filteredProviders[movie.tmdb_id] || [];
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

      // Only use platform-filtered results if we have enough
      if (platformFilteredResults.length >= MIN_RESULTS) {
        console.log(
          `✅ Platform filter: ${filteredResults.length} -> ${platformFilteredResults.length} results`
        );
        finalResults = platformFilteredResults;
      } else {
        console.log(
          `⚠️ Platform filter would give only ${platformFilteredResults.length} results, keeping ${filteredResults.length}`
        );
      }
    }

    const responseTimeMs = Date.now() - startTime;
    console.log(`📊 Final: ${finalResults.length} results in ${responseTimeMs}ms`);

    // Step 10: Return successful response
    const response: SearchResponse = {
      recommendations: finalResults,
      streamingProviders: finalProviders,
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

/**
 * Apply filters with smart fallback to ensure minimum results
 */
function applySmartFilters(
  results: MovieResult[],
  providers: { [key: number]: StreamingProvider[] },
  filters: {
    platforms?: number[];
    includeFlatrate?: boolean;
    includeRent?: boolean;
    includeBuy?: boolean;
  }
): { filteredResults: MovieResult[]; filteredProviders: { [key: number]: StreamingProvider[] } } {
  const { platforms, includeFlatrate, includeRent, includeBuy } = filters;

  // Check if any filters are active
  const hasAvailabilityFilters =
    includeFlatrate !== undefined || includeRent !== undefined || includeBuy !== undefined;
  const hasPlatformFilters = platforms && platforms.length > 0;

  if (!hasAvailabilityFilters && !hasPlatformFilters) {
    console.log('📋 No filters active, returning all results');
    return { filteredResults: results, filteredProviders: providers };
  }

  // Step 1: Filter providers by availability type
  let filteredProviders: { [key: number]: StreamingProvider[] } = { ...providers };

  if (hasAvailabilityFilters) {
    const allowFlatrate = includeFlatrate !== false;
    const allowRent = includeRent === true;
    const allowBuy = includeBuy === true;

    console.log(
      `🔍 Availability filters: flatrate=${allowFlatrate}, rent=${allowRent}, buy=${allowBuy}`
    );

    filteredProviders = {};
    for (const [movieId, movieProviders] of Object.entries(providers)) {
      const filtered = movieProviders.filter((provider) => {
        if (provider.availability_type === 'flatrate' && allowFlatrate) return true;
        if (provider.availability_type === 'rent' && allowRent) return true;
        if (provider.availability_type === 'buy' && allowBuy) return true;
        if (provider.availability_type === 'ads' && allowFlatrate) return true;
        return false;
      });
      if (filtered.length > 0) {
        filteredProviders[Number(movieId)] = filtered;
      }
    }
  }

  // Step 2: Filter by specific platforms if provided
  if (hasPlatformFilters) {
    console.log(`🔍 Platform filters: ${platforms!.join(', ')}`);
    const platformSet = new Set(platforms);

    const platformFilteredProviders: { [key: number]: StreamingProvider[] } = {};
    for (const [movieId, movieProviders] of Object.entries(filteredProviders)) {
      const matching = movieProviders.filter((p) => platformSet.has(p.provider_id));
      if (matching.length > 0) {
        platformFilteredProviders[Number(movieId)] = matching;
      }
    }
    filteredProviders = platformFilteredProviders;
  }

  // Step 3: Filter results to only include movies with matching providers
  const movieIdsWithProviders = new Set(Object.keys(filteredProviders).map(Number));
  const strictlyFilteredResults = results.filter((movie) =>
    movieIdsWithProviders.has(movie.tmdb_id)
  );

  console.log(`📊 Filter result: ${results.length} -> ${strictlyFilteredResults.length} results`);

  // Step 4: Smart fallback - if too few results, include some unfiltered results
  if (strictlyFilteredResults.length >= MIN_RESULTS) {
    return { filteredResults: strictlyFilteredResults, filteredProviders };
  }

  console.log(
    `⚠️ Only ${strictlyFilteredResults.length} results after filtering, adding fallback results`
  );

  // Add unfiltered results that aren't already included
  const filteredIds = new Set(strictlyFilteredResults.map((m) => m.tmdb_id));
  const additionalResults = results
    .filter((movie) => !filteredIds.has(movie.tmdb_id))
    .slice(0, MIN_RESULTS - strictlyFilteredResults.length);

  // Merge providers for additional results
  const mergedProviders = { ...filteredProviders };
  for (const movie of additionalResults) {
    if (providers[movie.tmdb_id]) {
      mergedProviders[movie.tmdb_id] = providers[movie.tmdb_id];
    }
  }

  const finalResults = [...strictlyFilteredResults, ...additionalResults];
  console.log(`✅ After fallback: ${finalResults.length} results`);

  return { filteredResults: finalResults, filteredProviders: mergedProviders };
}
