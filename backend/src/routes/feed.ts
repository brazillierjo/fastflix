/**
 * FastFlix Backend - Feed Routes (Hono)
 *
 * GET /  — For You feed
 *   Premium + taste profile → Gemini AI recommendations
 *   Free / no profile → TMDB trending
 *   Both paths → enriched with streaming providers, filtered by user preferences
 *
 * POST /feedback — like/dislike from swipe
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

const app = new Hono();

/* ================================================================
   GET / — For You feed
   ================================================================ */

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

  try {
    // ── 1. Load user data ──
    let isPremium = false;
    let preferences: Awaited<ReturnType<typeof db.getUserPreferences>> | null = null;
    let tasteProfile: Awaited<ReturnType<typeof db.getUserTasteProfile>> | null = null;

    try {
      [isPremium, preferences, tasteProfile] = await Promise.all([
        db.hasAccess(userId),
        db.getUserPreferences(userId),
        db.getUserTasteProfile(userId),
      ]);
    } catch (dbErr) {
      console.error("⚠️ /api/feed: DB calls failed, continuing with defaults:", dbErr);
    }

    const hasProfile =
      tasteProfile &&
      (tasteProfile.rated_movies.length > 0 || tasteProfile.favorite_genres.length > 0);

    // ── 2. Build items: AI for premium+profile, trending for everyone else ──
    let items: MovieResult[] = [];

    if (isPremium && hasProfile && tasteProfile && preferences) {
      try {
        items = await getAIRecommendations(
          tasteProfile,
          preferences,
          excludeIds,
          userId,
          language,
          page,
          size
        );
      } catch (aiErr) {
        console.error("⚠️ /api/feed: AI failed, falling back to trending:", aiErr);
      }
    }

    // Trending fallback (if AI didn't produce results, or user is free)
    let trendingTotal = 0;
    if (items.length === 0) {
      const trending = await tmdb.getTrending(language);
      trendingTotal = trending.length;
      const start = (page - 1) * size;
      items = trending.slice(start, start + size).map((t) => ({
        tmdb_id: t.tmdb_id,
        title: t.title,
        media_type: t.media_type,
        overview: t.overview || "",
        poster_path: t.poster_path,
        backdrop_path: t.backdrop_path || null,
        vote_average: t.vote_average,
        vote_count: 0,
        genre_ids: t.genre_ids || [],
        popularity: 0,
        release_date: t.release_date,
        first_air_date: t.first_air_date,
      }));
    }

    // ── 3. Fetch streaming providers ──
    const providers = await tmdb.getBatchWatchProviders(items, country);

    // ── 4. Filter providers by user preferences ──
    let filteredProviders: Record<number, StreamingProvider[]> = providers;
    if (preferences) {
      filteredProviders = filterProvidersByPreferences(providers, preferences);
    }

    // ── 5. Respond ──
    const hasMore = isPremium && hasProfile ? true : page * size < trendingTotal;

    return c.json({
      success: true,
      data: { items, providers: filteredProviders, hasMore, page },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ /api/feed:", msg, error);
    return c.json({ success: false, error: msg }, 500);
  }
});

/* ================================================================
   AI Recommendations (premium users with taste profile)
   ================================================================ */

async function getAIRecommendations(
  tasteProfile: Awaited<ReturnType<typeof db.getUserTasteProfile>>,
  preferences: Awaited<ReturnType<typeof db.getUserPreferences>>,
  excludeIds: Set<number>,
  userId: string,
  language: string,
  page: number,
  size: number
): Promise<MovieResult[]> {
  const [watchlist, searchHistory, trendingItems] = await Promise.all([
    db.getWatchlist(userId),
    db.getSearchHistory(userId, 5),
    tmdb.getTrending(language).catch(() => []),
  ]);

  // Exclusion set: watchlist + already rated + explicitly excluded
  const watchlistIds = new Set(watchlist.map((w) => w.tmdb_id));
  const watchedIds = getWatchedTmdbIds(tasteProfile);
  const allExcluded = new Set([...watchlistIds, ...watchedIds, ...excludeIds]);

  // User context for Gemini
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
  if (searchHistory.length > 0) userContext.recentSearches = searchHistory.map((s) => s.query);

  // Content types from preferences
  const contentTypes: string[] = [];
  if (preferences.contentType === "all" || preferences.contentType === "movies")
    contentTypes.push("movies");
  if (preferences.contentType === "all" || preferences.contentType === "tvshows")
    contentTypes.push("TV shows");
  if (contentTypes.length === 0) contentTypes.push("movies", "TV shows");

  // Themed query per page
  const themes = [
    "hidden gems and underrated titles",
    "critically acclaimed recent releases",
    "cult classics and timeless favorites",
    "international cinema and world movies",
    "award-winning performances and directors",
  ];
  const syntheticQuery = `Recommend ${themes[(page - 1) % themes.length]} matching this user's taste profile. Be creative and diverse.`;

  const recentTitles = trendingItems.slice(0, 10).map((t) => ({
    title: t.title,
    mediaType: t.media_type,
  }));

  // Call Gemini
  const aiResult = await gemini.generateRecommendationsWithResponse(
    syntheticQuery,
    contentTypes,
    language,
    undefined,
    size + 5,
    userContext,
    undefined,
    recentTitles.length > 0 ? recentTitles : undefined
  );

  if (aiResult.isFallback || aiResult.recommendations.length === 0) return [];

  // Enrich with TMDB metadata
  const enriched = await tmdb.enrichRecommendations(
    aiResult.recommendations,
    contentTypes.includes("movies"),
    contentTypes.includes("TV shows"),
    language
  );

  if (enriched.length === 0) return [];

  // Attach AI reasons
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

  // Filter excluded, compute match scores
  const filtered = enriched.filter((item) => !allExcluded.has(item.tmdb_id)).slice(0, size);

  for (const item of filtered) {
    item.matchScore = computeMatchScore(item.genre_ids, item.vote_average, tasteProfile);
  }

  return filtered;
}

/* ================================================================
   Provider filtering helper
   ================================================================ */

function filterProvidersByPreferences(
  providers: Record<number, StreamingProvider[]>,
  preferences: Awaited<ReturnType<typeof db.getUserPreferences>>
): Record<number, StreamingProvider[]> {
  const result: Record<number, StreamingProvider[]> = {};
  const platformSet = new Set(preferences.platforms);
  const hasTypeFilter =
    preferences.includeFlatrate || preferences.includeRent || preferences.includeBuy;

  for (const [idStr, itemProviders] of Object.entries(providers)) {
    let filtered = itemProviders;

    if (hasTypeFilter) {
      filtered = filtered.filter((p) => {
        if (p.availability_type === "flatrate" && preferences.includeFlatrate) return true;
        if (p.availability_type === "rent" && preferences.includeRent) return true;
        if (p.availability_type === "buy" && preferences.includeBuy) return true;
        if (p.availability_type === "ads" && preferences.includeFlatrate) return true;
        return false;
      });
    }

    if (platformSet.size > 0) {
      filtered = filtered.filter((p) => platformSet.has(p.provider_id));
    }

    if (filtered.length > 0) result[Number(idStr)] = filtered;
  }

  return result;
}

/* ================================================================
   POST /feedback — like/dislike from swipe
   ================================================================ */

const feedbackSchema = z.object({
  tmdb_id: z.number().int().positive(),
  type: z.enum(["like", "dislike"]),
  title: z.string().min(1).max(500),
  media_type: z.enum(["movie", "tv"]).optional(),
  poster_path: z.string().max(500).optional(),
});

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
