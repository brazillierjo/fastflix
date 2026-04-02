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
import type { MovieResult, StreamingProvider, UserContext } from "../lib/types.js";

const feedbackSchema = z.object({
  tmdb_id: z.number().int().positive(),
  type: z.enum(["like", "dislike"]),
  title: z.string().min(1).max(500),
  media_type: z.enum(["movie", "tv"]).optional(),
  poster_path: z.string().max(500).optional(),
});

const app = new Hono();

// ── Helper types ──

type FeedResult = {
  items: MovieResult[];
  providers: Record<number, StreamingProvider[]>;
};

// ── Helper functions ──

/**
 * Build an AI-powered feed for premium users with a taste profile.
 * Returns null when AI or TMDB fails so the caller can fall back to trending.
 */
async function buildAIFeed(
  tasteProfile: Awaited<ReturnType<typeof db.getUserTasteProfile>>,
  preferences: Awaited<ReturnType<typeof db.getUserPreferences>>,
  excludeIds: Set<number>,
  userId: string,
  language: string,
  country: string,
  page: number,
  size: number
): Promise<FeedResult | null> {
  // 1. Fetch watchlist, search history, trending in parallel
  const [watchlist, recentSearchHistory, trendingItems] = await Promise.all([
    db.getWatchlist(userId),
    db.getSearchHistory(userId, 5),
    tmdb.getTrending(language).catch(() => []),
  ]);

  // 2. Build exclusion set (watchlist + watched + excludeIds)
  const watchlistIds = new Set(watchlist.map((item) => item.tmdb_id));
  const watchedIds = getWatchedTmdbIds(tasteProfile);
  const allExcluded = new Set([...watchlistIds, ...watchedIds, ...excludeIds]);

  // 3. Build userContext from tasteProfile
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

  // 4. Determine content types from preferences
  const contentTypes: string[] = [];
  if (preferences.contentType === "all" || preferences.contentType === "movies")
    contentTypes.push("movies");
  if (preferences.contentType === "all" || preferences.contentType === "tvshows")
    contentTypes.push("TV shows");
  if (contentTypes.length === 0) contentTypes.push("movies", "TV shows");

  // 5. Call Gemini with synthetic query (page-varied themes)
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

  // 6. If fallback or empty recommendations → return null
  if (aiResult.isFallback || aiResult.recommendations.length === 0) {
    return null;
  }

  // 7. Enrich with TMDB
  const includeMovies = contentTypes.includes("movies");
  const includeTvShows = contentTypes.includes("TV shows");
  const enriched = await tmdb.enrichRecommendations(
    aiResult.recommendations,
    includeMovies,
    includeTvShows,
    language
  );

  // 8. If enrichment returns empty → return null
  if (enriched.length === 0) {
    return null;
  }

  // 9. Attach AI reasons to items
  const reasonByTitle = new Map<string, string>();
  for (let i = 0; i < aiResult.recommendations.length; i++) {
    if (aiResult.reasons[i]) {
      reasonByTitle.set(aiResult.recommendations[i].toLowerCase(), aiResult.reasons[i]);
    }
  }
  for (const item of enriched) {
    const reason =
      reasonByTitle.get(item.title.toLowerCase()) ||
      reasonByTitle.get((item.original_title || "").toLowerCase());
    if (reason) item.reason = reason;
  }

  // 10. Filter excluded items, slice to size
  const filtered = enriched.filter((item) => !allExcluded.has(item.tmdb_id));
  const items = filtered.slice(0, size);

  // 11. If no items remain → return null
  if (items.length === 0) {
    return null;
  }

  // 12. Fetch providers
  const rawProviders = await tmdb.getBatchWatchProviders(items, country);

  // 13. Filter providers by user preferences (platforms, flatrate/rent/buy)
  const providersMap: Record<number, StreamingProvider[]> = {};
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

  // 14. Compute matchScore for each item
  for (const item of items) {
    item.matchScore = computeMatchScore(item.genre_ids, item.vote_average, tasteProfile);
  }

  // 15. Return { items, providers }
  return { items, providers: providersMap };
}

/**
 * Build a paginated trending feed with providers (fallback for free / non-AI paths).
 */
async function buildTrendingFeed(
  language: string,
  country: string,
  preferences: Awaited<ReturnType<typeof db.getUserPreferences>> | null,
  page: number,
  size: number
): Promise<[MovieResult[], Record<number, StreamingProvider[]>, boolean]> {
  const trending = await tmdb.getTrending(language);
  const start = (page - 1) * size;
  const items: MovieResult[] = trending.slice(start, start + size).map((item) => ({
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
  const providers = await tmdb.getBatchWatchProviders(items, country);
  return [items, providers, hasMore];
}

// ── Routes ──

/**
 * GET /
 * Paginated feed for swipe discovery.
 * Premium + profile: AI-powered recs. Otherwise: paginated trending.
 * Never returns 500 — always falls back to trending or empty data.
 */
app.get("/", authMiddleware, rateLimitMiddleware("standard"), async (c) => {
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

  const respond = (
    items: MovieResult[],
    providers: Record<number, StreamingProvider[]>,
    hasMore: boolean
  ) => c.json({ success: true, data: { items, providers, hasMore, page } });

  try {
    const [isPremium, tasteProfile, preferences] = await Promise.all([
      db.hasAccess(userId),
      db.getUserTasteProfile(userId),
      db.getUserPreferences(userId),
    ]);

    const hasProfile =
      tasteProfile.rated_movies.length > 0 || tasteProfile.favorite_genres.length > 0;

    // Premium + profile: try AI feed
    if (isPremium && hasProfile) {
      try {
        const result = await buildAIFeed(
          tasteProfile,
          preferences,
          excludeIds,
          userId,
          language,
          country,
          page,
          size
        );
        if (result) return respond(result.items, result.providers, true);
      } catch (aiError) {
        console.error("⚠️ /api/feed: AI feed failed, falling back to trending:", aiError);
      }
    }

    // Fallback: trending with providers
    return respond(...(await buildTrendingFeed(language, country, preferences, page, size)));
  } catch (error) {
    console.error("❌ /api/feed:", error);
    return respond([], {}, false);
  }
});

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
