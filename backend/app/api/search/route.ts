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
import * as Sentry from '@sentry/nextjs';
import crypto from 'crypto';
import { z } from 'zod';
import { searchRequestSchema } from '@/lib/validation';
import { gemini } from '@/lib/gemini';
import { tmdb } from '@/lib/tmdb';
import { db } from '@/lib/db';
import { applyRateLimit } from '@/lib/api-helpers';
import { requireAuth } from '@/lib/middleware';
import type {
  SearchResponse,
  MovieResult,
  StreamingProvider,
  UserContext,
  AIRecommendationResult,
  ConversationMessage,
} from '@/lib/types';
import { FREE_TIER_LIMITS } from '@/lib/types';

const MIN_RESULTS = 5;
const DEFAULT_RECOMMENDATIONS = 25;
const FILTERED_RECOMMENDATIONS = 40; // Request more when platform filters are active

// ==========================================================================
// AI Result Cache (in-memory, 24-hour TTL)
// ==========================================================================
const searchCache = new Map<string, { result: AIRecommendationResult; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
let cacheHits = 0;
let cacheMisses = 0;

function getCacheKey(
  query: string,
  contentTypes: string[],
  conversationHistory?: ConversationMessage[]
): string {
  return crypto
    .createHash('md5')
    .update(JSON.stringify({ query, contentTypes, conversationHistory: conversationHistory || [] }))
    .digest('hex');
}

function cleanExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of searchCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      searchCache.delete(key);
    }
  }
}

/** Clear the search cache (exported for testing) */
export function clearSearchCache(): void {
  searchCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
}

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
      conversationHistory,
    } = validatedData;

    // Step 2: Check access and quota
    const isPremium = await db.hasAccess(userId);
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    Sentry.addBreadcrumb({
      category: 'search',
      message: `Quota check: isPremium=${isPremium}`,
      level: 'info',
      data: { userId, isPremium },
    });

    // Weekly key for search quota (ISO week: YYYY-WNN)
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    const weekKey = `${now.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;

    if (!isPremium) {
      // Free tier: check weekly search quota
      const quota = await db.getUserQuota(userId, weekKey);

      if (quota.search_count >= FREE_TIER_LIMITS.searches) {
        console.log(
          `🔒 Quota exceeded for user ${user.email}: ${quota.search_count}/${FREE_TIER_LIMITS.searches} searches this week`
        );
        return NextResponse.json(
          {
            error: 'Weekly search limit reached',
            reason: `Free users are limited to ${FREE_TIER_LIMITS.searches} AI searches per week. Upgrade to premium for unlimited searches.`,
            quota: {
              used: quota.search_count,
              limit: FREE_TIER_LIMITS.searches,
              period: 'week',
            },
          },
          { status: 429 }
        );
      }
    }

    console.log(`✅ Access granted for user ${user.email} (premium: ${isPremium})`);

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

    // Step 4: Fetch user context for personalization
    const [tasteProfile, recentSearchHistory] = await Promise.all([
      db.getUserTasteProfile(userId),
      db.getSearchHistory(userId, 5),
    ]);

    // Build user context from taste profile and search history
    const userContext: UserContext = {};
    if (tasteProfile.favorite_genres.length > 0) {
      userContext.favoriteGenres = tasteProfile.favorite_genres;
    }
    if (tasteProfile.disliked_genres.length > 0) {
      userContext.dislikedGenres = tasteProfile.disliked_genres;
    }
    if (tasteProfile.favorite_decades.length > 0) {
      userContext.favoriteDecades = tasteProfile.favorite_decades;
    }
    if (tasteProfile.rated_movies.length > 0) {
      userContext.ratedMovies = tasteProfile.rated_movies.map((m) => ({
        title: m.title,
        rating: m.rating,
      }));
    }
    if (recentSearchHistory.length > 0) {
      userContext.recentSearches = recentSearchHistory.map((s) => s.query);
    }

    const hasUserContext = Object.keys(userContext).length > 0;
    if (hasUserContext) {
      console.log(`👤 User context loaded for personalization`);
    }

    // Step 5: Generate AI recommendations with conversational response
    // Request more recommendations when platform filters are active to ensure enough results after filtering
    const hasPlatformFilters = platforms && platforms.length > 0;
    const maxRecommendations = hasPlatformFilters
      ? FILTERED_RECOMMENDATIONS
      : DEFAULT_RECOMMENDATIONS;

    if (hasPlatformFilters) {
      console.log(`📋 Platform filters active, requesting ${maxRecommendations} recommendations`);
    }

    // Step 5a: Check AI result cache
    cleanExpiredCache();
    const cacheKey = getCacheKey(query, contentTypes, conversationHistory);
    const cachedEntry = searchCache.get(cacheKey);
    let aiResult: AIRecommendationResult;

    if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL) {
      aiResult = cachedEntry.result;
      cacheHits++;
      console.log(`🗄️ Cache HIT for query "${query}" (hits: ${cacheHits}, misses: ${cacheMisses}, size: ${searchCache.size})`);
      Sentry.addBreadcrumb({
        category: 'search.cache',
        message: 'Cache HIT',
        level: 'info',
        data: { query, cacheSize: searchCache.size },
      });
    } else {
      const geminiStartTime = Date.now();
      aiResult = await gemini.generateRecommendationsWithResponse(
        query,
        contentTypes,
        language,
        undefined, // filters (yearFrom/yearTo) - not used from search route currently
        maxRecommendations,
        hasUserContext ? userContext : undefined,
        conversationHistory
      );

      // Cache the result (only if not a fallback)
      if (!aiResult.isFallback) {
        searchCache.set(cacheKey, { result: aiResult, timestamp: Date.now() });
      }
      cacheMisses++;
      const geminiDuration = Date.now() - geminiStartTime;
      console.log(`🗄️ Cache MISS for query "${query}" (hits: ${cacheHits}, misses: ${cacheMisses}, size: ${searchCache.size})`);
      Sentry.addBreadcrumb({
        category: 'search.cache',
        message: 'Cache MISS',
        level: 'info',
        data: { query, geminiDurationMs: geminiDuration, isFallback: aiResult.isFallback },
      });
    }

    // Step 5.5: If AI failed, use TMDB trending as fallback
    if (aiResult.isFallback) {
      console.log('⚠️ AI fallback triggered, fetching TMDB trending as backup');
      Sentry.addBreadcrumb({
        category: 'search.fallback',
        message: 'AI fallback triggered, using TMDB trending',
        level: 'warning',
      });

      const trendingItems = await tmdb.getTrending(language);

      // Filter trending by content type
      const filteredTrending = trendingItems.filter((item) => {
        if (includeMovies && item.media_type === 'movie') return true;
        if (includeTvShows && item.media_type === 'tv') return true;
        return false;
      });

      // Convert trending items to MovieResult format
      const fallbackResults: MovieResult[] = filteredTrending.slice(0, 10).map((item) => ({
        tmdb_id: item.tmdb_id,
        title: item.title,
        media_type: item.media_type,
        overview: '',
        poster_path: item.poster_path,
        backdrop_path: null,
        vote_average: item.vote_average,
        vote_count: 0,
        genre_ids: [],
        popularity: 0,
      }));

      // Fetch providers and details for fallback results
      const [fallbackProviders, { credits: fallbackCredits, detailedInfo: fallbackDetailedInfo }] =
        await Promise.all([
          tmdb.getBatchWatchProviders(fallbackResults, country),
          tmdb.getBatchDetailsAndCredits(fallbackResults, language),
        ]);

      // Record quota usage and activity
      await Promise.all([
        db.incrementQuota(userId, weekKey, 'search_count'),
        db.addSearchHistory(userId, query, fallbackResults.length),
        db.recordActivity(userId, today),
      ]);

      let remainingSearches = -1;
      if (!isPremium) {
        const updatedQuota = await db.getUserQuota(userId, today);
        remainingSearches = Math.max(0, FREE_TIER_LIMITS.searches - updatedQuota.search_count);
      }

      const response: SearchResponse = {
        recommendations: fallbackResults,
        streamingProviders: fallbackProviders,
        credits: fallbackCredits,
        detailedInfo: fallbackDetailedInfo,
        conversationalResponse: aiResult.conversationalResponse,
        totalResults: fallbackResults.length,
      };

      return NextResponse.json(
        {
          ...response,
          quota: {
            remainingSearches,
            isPremium,
          },
        },
        { status: 200 }
      );
    }

    // Step 6: Enrich recommendations with TMDB data
    const tmdbStartTime = Date.now();
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

    const tmdbDuration = Date.now() - tmdbStartTime;
    Sentry.addBreadcrumb({
      category: 'search.tmdb',
      message: `TMDB enrichment completed in ${tmdbDuration}ms`,
      level: 'info',
      data: { enrichedCount: enrichedResults.length, tmdbDurationMs: tmdbDuration },
    });

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

    // Step 10: Record quota usage, search history, and activity
    await Promise.all([
      db.incrementQuota(userId, weekKey, 'search_count'),
      db.addSearchHistory(userId, query, finalResults.length),
      db.recordActivity(userId, today),
    ]);

    // Calculate remaining searches for the response
    let remainingSearches = -1; // unlimited for premium
    if (!isPremium) {
      const updatedQuota = await db.getUserQuota(userId, today);
      remainingSearches = Math.max(0, FREE_TIER_LIMITS.searches - updatedQuota.search_count);
    }

    // Step 11: Build conversation history for multi-turn support
    const updatedConversationHistory = [
      ...(conversationHistory || []),
      { role: 'user' as const, content: query },
      { role: 'assistant' as const, content: aiResult.conversationalResponse },
    ];

    // Step 12: Return successful response
    const response: SearchResponse = {
      recommendations: finalResults,
      streamingProviders: finalProviders,
      credits,
      detailedInfo,
      conversationalResponse: aiResult.conversationalResponse,
      totalResults: finalResults.length,
      conversationHistory: updatedConversationHistory,
    };

    return NextResponse.json(
      {
        ...response,
        quota: {
          remainingSearches,
          isPremium,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error in search endpoint:', error);

    // Return user-friendly error (never leak internal details)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to process recommendation request',
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
