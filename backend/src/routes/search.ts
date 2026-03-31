import { Hono } from "hono";
import crypto from "crypto";
import { z } from "zod";
import { searchRequestSchema } from "../lib/validation.js";
import { gemini } from "../lib/gemini.js";
import { tmdb } from "../lib/tmdb.js";
import { db } from "../lib/db.js";
import { authMiddleware, getUserId } from "../middleware/auth.js";
import { rateLimitMiddleware } from "../middleware/rate-limit.js";
import { captureException } from "../lib/sentry.js";
import type {
  MovieResult,
  StreamingProvider,
  UserContext,
  AIRecommendationResult,
  ConversationMessage,
} from "../lib/types.js";
import { FREE_TIER_LIMITS } from "../lib/types.js";

const MIN_RESULTS = 5;
const DEFAULT_RECOMMENDATIONS = 25;
const FILTERED_RECOMMENDATIONS = 40;

const searchCache = new Map<string, { result: AIRecommendationResult; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

function getCacheKey(
  userId: string,
  query: string,
  contentTypes: string[],
  conversationHistory?: ConversationMessage[]
): string {
  return crypto
    .createHash("md5")
    .update(
      JSON.stringify({
        userId,
        query,
        contentTypes,
        conversationHistory: conversationHistory || [],
      })
    )
    .digest("hex");
}

function cleanExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of searchCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) searchCache.delete(key);
  }
}

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

  const hasAvailabilityFilters =
    includeFlatrate !== undefined || includeRent !== undefined || includeBuy !== undefined;
  const hasPlatformFilters = platforms && platforms.length > 0;

  if (!hasAvailabilityFilters && !hasPlatformFilters) {
    return { filteredResults: results, filteredProviders: providers };
  }

  let filteredProviders: { [key: number]: StreamingProvider[] } = { ...providers };

  if (hasAvailabilityFilters) {
    const allowFlatrate = includeFlatrate !== false;
    const allowRent = includeRent === true;
    const allowBuy = includeBuy === true;

    filteredProviders = {};
    for (const [movieId, movieProviders] of Object.entries(providers)) {
      const filtered = movieProviders.filter((provider) => {
        if (provider.availability_type === "flatrate" && allowFlatrate) return true;
        if (provider.availability_type === "rent" && allowRent) return true;
        if (provider.availability_type === "buy" && allowBuy) return true;
        if (provider.availability_type === "ads" && allowFlatrate) return true;
        return false;
      });
      if (filtered.length > 0) filteredProviders[Number(movieId)] = filtered;
    }
  }

  if (hasPlatformFilters) {
    const platformSet = new Set(platforms);
    const platformFilteredProviders: { [key: number]: StreamingProvider[] } = {};
    for (const [movieId, movieProviders] of Object.entries(filteredProviders)) {
      const matching = movieProviders.filter((p) => platformSet.has(p.provider_id));
      if (matching.length > 0) platformFilteredProviders[Number(movieId)] = matching;
    }
    filteredProviders = platformFilteredProviders;
  }

  const movieIdsWithProviders = new Set(Object.keys(filteredProviders).map(Number));
  const strictlyFilteredResults = results.filter((movie) =>
    movieIdsWithProviders.has(movie.tmdb_id)
  );

  if (strictlyFilteredResults.length >= MIN_RESULTS) {
    return { filteredResults: strictlyFilteredResults, filteredProviders };
  }

  const filteredIds = new Set(strictlyFilteredResults.map((m) => m.tmdb_id));
  const additionalResults = results
    .filter((movie) => !filteredIds.has(movie.tmdb_id))
    .slice(0, MIN_RESULTS - strictlyFilteredResults.length);

  const mergedProviders = { ...filteredProviders };
  for (const movie of additionalResults) {
    if (providers[movie.tmdb_id]) mergedProviders[movie.tmdb_id] = providers[movie.tmdb_id];
  }

  return {
    filteredResults: [...strictlyFilteredResults, ...additionalResults],
    filteredProviders: mergedProviders,
  };
}

const app = new Hono();

// POST /search — AI-powered search
app.post("/", authMiddleware, rateLimitMiddleware("ai"), async (c) => {
  try {
    const userId = getUserId(c);

    const body = await c.req.json();
    const validatedData = searchRequestSchema.parse(body);

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

    // Check access and quota
    const isPremium = await db.hasAccess(userId);
    const today = new Date().toISOString().split("T")[0];

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(
      ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
    );
    const weekKey = `${now.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;

    if (!isPremium) {
      const quota = await db.getUserQuota(userId, weekKey);
      if (quota.search_count >= FREE_TIER_LIMITS.searches) {
        return c.json(
          {
            error: "Weekly search limit reached",
            quota: { used: quota.search_count, limit: FREE_TIER_LIMITS.searches, period: "week" },
          },
          429
        );
      }
    }

    // Build content types
    const contentTypes: string[] = [];
    if (includeMovies) contentTypes.push("movies");
    if (includeTvShows) contentTypes.push("TV shows");
    if (contentTypes.length === 0) {
      return c.json({ error: "At least one content type must be selected" }, 400);
    }

    // Fetch user context
    const [tasteProfile, recentSearchHistory, trendingItems] = await Promise.all([
      db.getUserTasteProfile(userId),
      db.getSearchHistory(userId, 5),
      tmdb.getTrending(language).catch(() => []),
    ]);

    const recentTitles = trendingItems
      .slice(0, 20)
      .map((item) => ({ title: item.title, mediaType: item.media_type }));

    const userContext: UserContext = {};
    if (tasteProfile.favorite_genres.length > 0)
      userContext.favoriteGenres = tasteProfile.favorite_genres;
    if (tasteProfile.disliked_genres.length > 0)
      userContext.dislikedGenres = tasteProfile.disliked_genres;
    if (tasteProfile.favorite_decades.length > 0)
      userContext.favoriteDecades = tasteProfile.favorite_decades;
    if (tasteProfile.rated_movies.length > 0)
      userContext.ratedMovies = tasteProfile.rated_movies.map((m) => ({
        title: m.title,
        rating: m.rating,
      }));
    if (recentSearchHistory.length > 0)
      userContext.recentSearches = recentSearchHistory.map((s) => s.query);

    const hasUserContext = Object.keys(userContext).length > 0;
    const hasPlatformFilters = platforms && platforms.length > 0;
    const maxRecommendations = hasPlatformFilters ? FILTERED_RECOMMENDATIONS : DEFAULT_RECOMMENDATIONS;

    // Check cache
    cleanExpiredCache();
    const cacheKey = getCacheKey(userId, query, contentTypes, conversationHistory);
    const cachedEntry = searchCache.get(cacheKey);
    let aiResult: AIRecommendationResult;

    if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL) {
      aiResult = cachedEntry.result;
    } else {
      aiResult = await gemini.generateRecommendationsWithResponse(
        query,
        contentTypes,
        language,
        undefined,
        maxRecommendations,
        hasUserContext ? userContext : undefined,
        conversationHistory,
        recentTitles.length > 0 ? recentTitles : undefined
      );
      if (!aiResult.isFallback) {
        searchCache.set(cacheKey, { result: aiResult, timestamp: Date.now() });
      }
    }

    // Fallback to trending if AI failed
    if (aiResult.isFallback) {
      const trending = await tmdb.getTrending(language);
      const filtered = trending.filter((item) => {
        if (includeMovies && item.media_type === "movie") return true;
        if (includeTvShows && item.media_type === "tv") return true;
        return false;
      });

      const fallbackResults: MovieResult[] = filtered.slice(0, 10).map((item) => ({
        tmdb_id: item.tmdb_id,
        title: item.title,
        media_type: item.media_type,
        overview: "",
        poster_path: item.poster_path,
        backdrop_path: null,
        vote_average: item.vote_average,
        vote_count: 0,
        genre_ids: [],
        popularity: 0,
      }));

      const [fallbackProviders, { credits: fallbackCredits, detailedInfo: fallbackDetailedInfo }] =
        await Promise.all([
          tmdb.getBatchWatchProviders(fallbackResults, country),
          tmdb.getBatchDetailsAndCredits(fallbackResults, language),
        ]);

      await Promise.all([
        db.incrementQuota(userId, weekKey, "search_count"),
        db.addSearchHistory(userId, query, fallbackResults.length),
        db.recordActivity(userId, today),
      ]);

      let remainingSearches = -1;
      if (!isPremium) {
        const updatedQuota = await db.getUserQuota(userId, today);
        remainingSearches = Math.max(0, FREE_TIER_LIMITS.searches - updatedQuota.search_count);
      }

      return c.json({
        recommendations: fallbackResults,
        streamingProviders: fallbackProviders,
        credits: fallbackCredits,
        detailedInfo: fallbackDetailedInfo,
        conversationalResponse: aiResult.conversationalResponse,
        totalResults: fallbackResults.length,
        isFallback: true,
        quota: { remainingSearches, isPremium },
      });
    }

    // Build title→reason map + index→reason map from AI result
    const reasonByTitle = new Map<string, string>();
    const reasonByIndex = new Map<number, string>();
    for (let i = 0; i < aiResult.recommendations.length; i++) {
      if (aiResult.reasons[i]) {
        reasonByTitle.set(aiResult.recommendations[i].toLowerCase(), aiResult.reasons[i]);
        reasonByIndex.set(i, aiResult.reasons[i]);
      }
    }

    // Enrich with TMDB data
    const enrichedResults = await tmdb.enrichRecommendations(
      aiResult.recommendations,
      includeMovies,
      includeTvShows,
      language
    );

    // Attach reasons to enriched results (try title match first, then index)
    let enrichedIdx = 0;
    for (const result of enrichedResults) {
      const reason = reasonByTitle.get(result.title.toLowerCase())
        || reasonByTitle.get((result.original_title || '').toLowerCase())
        || reasonByIndex.get(enrichedIdx);
      if (reason) {
        result.reason = reason;
      }
      enrichedIdx++;
    }

    const [rawStreamingProviders, { credits, detailedInfo }] = await Promise.all([
      tmdb.getBatchWatchProviders(enrichedResults, country),
      tmdb.getBatchDetailsAndCredits(enrichedResults, language),
    ]);

    // Smart filtering
    const { filteredResults, filteredProviders } = applySmartFilters(
      enrichedResults,
      rawStreamingProviders,
      { platforms, includeFlatrate, includeRent, includeBuy }
    );

    // Handle AI-detected platforms
    let finalResults = filteredResults;
    if (aiResult.detectedPlatforms && aiResult.detectedPlatforms.length > 0) {
      const platformFilteredResults = filteredResults.filter((movie) => {
        const movieProviders = filteredProviders[movie.tmdb_id] || [];
        return aiResult.detectedPlatforms!.some((requestedPlatform) => {
          const normalizedRequested = requestedPlatform.toLowerCase().replace(/\s+/g, "");
          return movieProviders.some((provider) => {
            const normalizedProvider = provider.provider_name.toLowerCase().replace(/\s+/g, "");
            return (
              normalizedProvider.includes(normalizedRequested) ||
              normalizedRequested.includes(normalizedProvider)
            );
          });
        });
      });

      if (platformFilteredResults.length >= MIN_RESULTS) {
        finalResults = platformFilteredResults;
      }
    }

    // Record usage
    await Promise.all([
      db.incrementQuota(userId, weekKey, "search_count"),
      db.addSearchHistory(userId, query, finalResults.length),
      db.recordActivity(userId, today),
    ]);

    let remainingSearches = -1;
    if (!isPremium) {
      const updatedQuota = await db.getUserQuota(userId, today);
      remainingSearches = Math.max(0, FREE_TIER_LIMITS.searches - updatedQuota.search_count);
    }

    const updatedConversationHistory = [
      ...(conversationHistory || []),
      { role: "user" as const, content: query },
      { role: "assistant" as const, content: aiResult.conversationalResponse },
    ];

    return c.json({
      recommendations: finalResults,
      streamingProviders: filteredProviders,
      credits,
      detailedInfo,
      conversationalResponse: aiResult.conversationalResponse,
      totalResults: finalResults.length,
      conversationHistory: updatedConversationHistory,
      quota: { remainingSearches, isPremium },
    });
  } catch (error) {
    console.error("Error in search:", error);
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid request data", details: error.issues }, 400);
    }
    captureException(error instanceof Error ? error : new Error(String(error)));
    return c.json({ error: "Failed to process recommendation request" }, 500);
  }
});

export default app;
