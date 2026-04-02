/**
 * FastFlix Backend - Feed Routes (Hono)
 * Swipe Discovery: paginated feed + feedback endpoint
 */

import { Hono } from "hono";
import { z } from "zod";
import { db } from "../lib/db.js";
import { tmdb } from "../lib/tmdb.js";
import { gemini } from "../lib/gemini.js";
import { computeMatchScore, getWatchedTmdbIds } from "../lib/affinity.js";
import { authMiddleware, getUserId } from "../middleware/auth.js";
import { rateLimitMiddleware } from "../middleware/rate-limit.js";
import type { StreamingProvider, UserContext } from "../lib/types.js";

const feedbackSchema = z.object({
  tmdb_id: z.number().int().positive(),
  type: z.enum(["like", "dislike"]),
  title: z.string().min(1).max(500),
  media_type: z.enum(["movie", "tv"]).optional(),
  poster_path: z.string().max(500).optional(),
});

const app = new Hono();

/**
 * GET /
 * Paginated feed for swipe discovery.
 * Premium: AI-powered recs. Free: paginated trending.
 */
app.get("/", authMiddleware, rateLimitMiddleware("ai"), async (c) => {
  try {
    const userId = getUserId(c);
    const page = parseInt(c.req.query("page") || "1", 10);
    const size = Math.min(parseInt(c.req.query("size") || "10", 10), 20);
    const language = c.req.query("language") || "fr-FR";
    const country = c.req.query("country") || "FR";
    const excludeParam = c.req.query("exclude") || "";
    const excludeIds = new Set(
      excludeParam
        .split(",")
        .map((id) => parseInt(id, 10))
        .filter((id) => !isNaN(id))
    );

    const isPremium = await db.hasAccess(userId);

    if (isPremium) {
      // ── Premium: AI-powered feed ──
      const [tasteProfile, watchlist, recentSearchHistory, preferences, trendingItems] =
        await Promise.all([
          db.getUserTasteProfile(userId),
          db.getWatchlist(userId),
          db.getSearchHistory(userId, 5),
          db.getUserPreferences(userId),
          tmdb.getTrending(language).catch(() => []),
        ]);

      const hasProfile =
        tasteProfile.rated_movies.length > 0 || tasteProfile.favorite_genres.length > 0;

      if (!hasProfile) {
        // No profile → fall through to trending
        return serveTrending(c, language, country, page, size);
      }

      // Build exclusion set
      const watchlistIds = new Set(watchlist.map((item) => item.tmdb_id));
      const watchedIds = getWatchedTmdbIds(tasteProfile);
      const allExcluded = new Set([...watchlistIds, ...watchedIds, ...excludeIds]);

      // Build user context
      const userContext: UserContext = {};
      if (tasteProfile.favorite_genres.length > 0)
        userContext.favoriteGenres = tasteProfile.favorite_genres;
      if (tasteProfile.disliked_genres.length > 0)
        userContext.dislikedGenres = tasteProfile.disliked_genres;
      if (tasteProfile.favorite_decades.length > 0)
        userContext.favoriteDecades = tasteProfile.favorite_decades;
      if (tasteProfile.rated_movies.length > 0) {
        userContext.ratedMovies = tasteProfile.rated_movies.map((m) => ({
          title: m.title,
          rating: m.rating,
        }));
      }
      if (recentSearchHistory.length > 0)
        userContext.recentSearches = recentSearchHistory.map((s) => s.query);

      // Content types
      const contentTypes: string[] = [];
      if (preferences.contentType === "all" || preferences.contentType === "movies")
        contentTypes.push("movies");
      if (preferences.contentType === "all" || preferences.contentType === "tvshows")
        contentTypes.push("TV shows");
      if (contentTypes.length === 0) contentTypes.push("movies", "TV shows");

      // Synthetic query with page variation
      const themes = [
        "hidden gems and underrated titles",
        "critically acclaimed recent releases",
        "cult classics and timeless favorites",
        "international cinema and world movies",
        "award-winning performances and directors",
      ];
      const themeForPage = themes[(page - 1) % themes.length];
      const syntheticQuery = `Recommend ${themeForPage} matching this user's taste profile. Be creative and diverse.`;

      const recentTitles = trendingItems.slice(0, 10).map((item) => ({
        title: item.title,
        mediaType: item.media_type,
      }));

      const aiResult = await gemini.generateRecommendationsWithResponse(
        syntheticQuery,
        contentTypes,
        language,
        undefined,
        size + 5, // request extra to compensate for filtered out items
        userContext,
        undefined,
        recentTitles.length > 0 ? recentTitles : undefined
      );

      if (aiResult.isFallback || aiResult.recommendations.length === 0) {
        return serveTrending(c, language, country, page, size);
      }

      // Build reason map
      const reasonByTitle = new Map<string, string>();
      for (let i = 0; i < aiResult.recommendations.length; i++) {
        if (aiResult.reasons[i]) {
          reasonByTitle.set(aiResult.recommendations[i].toLowerCase(), aiResult.reasons[i]);
        }
      }

      // Enrich with TMDB
      const includeMovies = contentTypes.includes("movies");
      const includeTvShows = contentTypes.includes("TV shows");
      const enriched = await tmdb.enrichRecommendations(
        aiResult.recommendations,
        includeMovies,
        includeTvShows,
        language
      );

      // Attach reasons
      for (const item of enriched) {
        const reason =
          reasonByTitle.get(item.title.toLowerCase()) ||
          reasonByTitle.get((item.original_title || "").toLowerCase());
        if (reason) item.reason = reason;
      }

      // Filter excluded
      const filtered = enriched.filter((item) => !allExcluded.has(item.tmdb_id));
      const items = filtered.slice(0, size);

      // Fetch providers
      const rawProviders = await tmdb.getBatchWatchProviders(items, country);

      // Filter by user preferences
      const providersMap: { [key: number]: StreamingProvider[] } = {};
      for (const [idStr, itemProviders] of Object.entries(rawProviders)) {
        let result = itemProviders;
        if (preferences.includeFlatrate || preferences.includeRent || preferences.includeBuy) {
          result = result.filter((p) => {
            if (p.availability_type === "flatrate" && preferences.includeFlatrate) return true;
            if (p.availability_type === "rent" && preferences.includeRent) return true;
            if (p.availability_type === "buy" && preferences.includeBuy) return true;
            if (p.availability_type === "ads" && preferences.includeFlatrate) return true;
            return false;
          });
        }
        if (preferences.platforms.length > 0) {
          const pSet = new Set(preferences.platforms);
          result = result.filter((p) => pSet.has(p.provider_id));
        }
        if (result.length > 0) providersMap[Number(idStr)] = result;
      }

      // Match scores
      for (const item of items) {
        item.matchScore = computeMatchScore(item.genre_ids, item.vote_average, tasteProfile);
      }

      return c.json({
        success: true,
        data: { items, providers: providersMap, hasMore: true, page },
      });
    }

    // ── Free: paginated trending ──
    return serveTrending(c, language, country, page, size);
  } catch (error) {
    console.error("❌ /api/feed:", error);
    return c.json({ error: "Failed to load feed" }, 500);
  }
});

/**
 * Serve paginated trending as fallback
 */
async function serveTrending(
  c: { json: (data: unknown) => Response; header: (key: string, value: string) => void },
  language: string,
  country: string,
  page: number,
  size: number
) {
  const trending = await tmdb.getTrending(language);
  const start = (page - 1) * size;
  const items = trending.slice(start, start + size).map((item) => ({
    tmdb_id: item.tmdb_id,
    title: item.title,
    media_type: item.media_type,
    overview: item.overview || "",
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path || null,
    vote_average: item.vote_average,
    vote_count: 0,
    genre_ids: item.genre_ids || [],
    popularity: 0,
    release_date: item.release_date,
    first_air_date: item.first_air_date,
  }));

  const hasMore = start + size < trending.length;

  return c.json({
    success: true,
    data: { items, providers: {}, hasMore, page },
  });
}

/**
 * POST /feedback
 * Submit like/dislike feedback from swipe discovery mode.
 */
app.post("/feedback", authMiddleware, rateLimitMiddleware("standard"), async (c) => {
  try {
    const body = await c.req.json();
    const validatedData = feedbackSchema.parse(body);
    const userId = getUserId(c);

    const rating = validatedData.type === "like" ? 5 : 1;

    await db.rateMovie(
      userId,
      validatedData.tmdb_id,
      rating,
      validatedData.title,
      validatedData.media_type,
      validatedData.poster_path
    );

    db.invalidateForYouCache(userId).catch(() => {});

    return c.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid request data", details: error.issues }, 400);
    }
    return c.json({ error: "Failed to submit feedback" }, 500);
  }
});

export default app;
