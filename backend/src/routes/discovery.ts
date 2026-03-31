/**
 * FastFlix Backend - Discovery Routes (Hono)
 * Combines: home, daily-pick, trending, trending/public, new-releases, for-you
 */

import { Hono } from "hono";
import { db } from "../lib/db.js";
import { tmdb } from "../lib/tmdb.js";
import { gemini } from "../lib/gemini.js";
import { computeAffinityScore, getWatchedTmdbIds } from "../lib/affinity.js";
import { authMiddleware, getUserId } from "../middleware/auth.js";
import { rateLimitMiddleware } from "../middleware/rate-limit.js";
import type {
  DailyPick,
  TrendingItem,
  HomeResponse,
  StreamingProvider,
  MovieResult,
  UserContext,
} from "../lib/types.js";
import { FREE_TIER_LIMITS } from "../lib/types.js";

/**
 * Generate a deterministic index from userId and date
 */
function getDailyIndex(userId: string, date: string, maxIndex: number): number {
  let hash = 0;
  const seed = `${userId}-${date}`;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash) % maxIndex;
}

const app = new Hono();

/**
 * GET / (home)
 * Aggregate endpoint returning daily pick, trending, recent searches, and quota
 */
app.get("/home", authMiddleware, rateLimitMiddleware("standard"), async (c) => {
  try {
    const userId = getUserId(c);

    const language = c.req.query("language") || "fr-FR";
    const country = c.req.query("country") || "FR";

    const today = new Date().toISOString().split("T")[0];

    // Fetch everything in parallel
    const [isPremium, trending, recentSearches, quota, preferences, tasteProfile] =
      await Promise.all([
        db.hasAccess(userId),
        tmdb.getTrending(language),
        db.getSearchHistory(userId, 5),
        db.getUserQuota(userId, today),
        db.getUserPreferences(userId),
        db.getUserTasteProfile(userId),
      ]);

    // Build set of already-watched TMDB IDs to exclude
    const watchedIds = getWatchedTmdbIds(tasteProfile);

    // User filter helpers
    const allowFlatrate = preferences.includeFlatrate;
    const allowRent = preferences.includeRent;
    const allowBuy = preferences.includeBuy;
    const hasAvailabilityFilter = allowFlatrate || allowRent || allowBuy;
    const platformSet =
      preferences.platforms.length > 0 ? new Set(preferences.platforms) : null;
    const hasFilters = hasAvailabilityFilter || platformSet !== null;

    function filterProviders(providers: StreamingProvider[]) {
      let filtered = providers;
      if (hasAvailabilityFilter) {
        filtered = filtered.filter((p) => {
          if (p.availability_type === "flatrate" && allowFlatrate) return true;
          if (p.availability_type === "rent" && allowRent) return true;
          if (p.availability_type === "buy" && allowBuy) return true;
          if (p.availability_type === "ads" && allowFlatrate) return true;
          return false;
        });
      }
      if (platformSet) {
        filtered = filtered.filter((p) => platformSet.has(p.provider_id));
      }
      return filtered;
    }

    // Fetch providers for all trending items so we can filter properly
    const allTrendingAsResults = trending.map((item) => ({
      tmdb_id: item.tmdb_id,
      title: item.title,
      media_type: item.media_type,
      overview: "",
      poster_path: item.poster_path,
      backdrop_path: null,
      vote_average: item.vote_average,
      vote_count: 0,
      genre_ids: item.genre_ids || [],
      popularity: 0,
    }));
    const trendingProviders = await tmdb.getBatchWatchProviders(allTrendingAsResults, country);

    // Build daily pick from trending items that match user's filters + taste
    let dailyPick: DailyPick | null = null;
    if (trending.length > 0) {
      // Find eligible items: matching providers, not already watched, not disliked genres
      const eligibleForPick = trending.filter((item) => {
        if (watchedIds.has(item.tmdb_id)) return false;
        if (hasFilters) {
          const itemProviders = trendingProviders[item.tmdb_id] || [];
          if (filterProviders(itemProviders).length === 0) return false;
        }
        const score = computeAffinityScore(item.genre_ids || [], tasteProfile);
        if (score < 0) return false;
        return true;
      });

      // Sort eligible items by affinity (best match first)
      eligibleForPick.sort((a, b) => {
        const scoreA = computeAffinityScore(a.genre_ids || [], tasteProfile);
        const scoreB = computeAffinityScore(b.genre_ids || [], tasteProfile);
        return scoreB - scoreA;
      });

      // Pick deterministically from top affinity candidates
      const pickSource = eligibleForPick.length > 0 ? eligibleForPick : trending;
      const topCandidates = pickSource.slice(0, Math.min(5, pickSource.length));
      const index = getDailyIndex(userId, today, topCandidates.length);
      const picked = topCandidates[index];

      const [details, rawProviders] = await Promise.all([
        tmdb.getFullDetails(picked.tmdb_id, picked.media_type, language),
        tmdb.getWatchProviders(picked.tmdb_id, picked.media_type, country),
      ]);

      const filteredPickProviders = hasFilters ? filterProviders(rawProviders) : rawProviders;

      dailyPick = {
        tmdb_id: picked.tmdb_id,
        title: details?.title || picked.title,
        overview: details?.overview || "",
        poster_path: details?.poster_path || picked.poster_path,
        backdrop_path: details?.backdrop_path || null,
        vote_average: details?.vote_average || picked.vote_average,
        media_type: picked.media_type,
        genres: details?.genres || [],
        providers: filteredPickProviders,
      };
    }

    // Build filtered trending list: exclude watched, filter by providers, sort by affinity
    const trendingEligible: (TrendingItem & { _affinityScore: number })[] = [];
    for (const item of trending) {
      if (watchedIds.has(item.tmdb_id)) continue;
      if (dailyPick && item.tmdb_id === dailyPick.tmdb_id) continue;

      const itemProviders = filterProviders(trendingProviders[item.tmdb_id] || []);

      if (hasFilters && itemProviders.length === 0) continue;

      trendingEligible.push({
        ...item,
        _affinityScore: computeAffinityScore(item.genre_ids || [], tasteProfile),
        providers: itemProviders.map((p) => ({
          provider_name: p.provider_name,
          logo_path: p.logo_path,
        })),
      });
    }

    // Sort by affinity score (best match first), keep original order as tiebreaker
    trendingEligible.sort((a, b) => b._affinityScore - a._affinityScore);

    // Take top 10 and strip internal score field
    const trendingTop10: TrendingItem[] = trendingEligible
      .slice(0, 10)
      .map(({ _affinityScore, ...item }) => item);

    const response: HomeResponse = {
      dailyPick,
      trending: trendingTop10,
      recentSearches,
      quota: {
        used: quota.search_count,
        limit: isPremium ? -1 : FREE_TIER_LIMITS.searches,
        isPremium,
      },
    };

    c.header("Cache-Control", "private, max-age=300");
    return c.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("❌ /api/home:", error);
    return c.json({ error: "Failed to load home data" }, 500);
  }
});

/**
 * GET /daily-pick
 * Get a deterministic daily recommendation for the authenticated user
 */
app.get("/daily-pick", authMiddleware, rateLimitMiddleware("standard"), async (c) => {
  try {
    const userId = getUserId(c);

    const language = c.req.query("language") || "fr-FR";
    const country = c.req.query("country") || "FR";

    // Fetch trending items from TMDB
    const trending = await tmdb.getTrending(language);

    if (trending.length === 0) {
      return c.json({
        success: true,
        data: { dailyPick: null },
      });
    }

    // Pick one deterministically based on userId + today's date
    const today = new Date().toISOString().split("T")[0];
    const index = getDailyIndex(userId, today, trending.length);
    const picked = trending[index];

    // Enrich with full details and streaming providers
    const [details, providers] = await Promise.all([
      tmdb.getFullDetails(picked.tmdb_id, picked.media_type, language),
      tmdb.getWatchProviders(picked.tmdb_id, picked.media_type, country),
    ]);

    // Filter providers by user preferences
    const preferences = await db.getUserPreferences(userId);
    let filteredProviders = providers;
    if (preferences.platforms.length > 0) {
      const platformSet = new Set(preferences.platforms);
      filteredProviders = providers.filter((p) => platformSet.has(p.provider_id));
      // Fall back to all providers if none match
      if (filteredProviders.length === 0) {
        filteredProviders = providers;
      }
    }

    const dailyPick: DailyPick = {
      tmdb_id: picked.tmdb_id,
      title: details?.title || picked.title,
      overview: details?.overview || "",
      poster_path: details?.poster_path || picked.poster_path,
      backdrop_path: details?.backdrop_path || null,
      vote_average: details?.vote_average || picked.vote_average,
      media_type: picked.media_type,
      genres: details?.genres || [],
      providers: filteredProviders,
    };

    c.header("Cache-Control", "public, max-age=3600");
    return c.json({
      success: true,
      data: { dailyPick },
    });
  } catch (error) {
    console.error("❌ /api/daily-pick:", error);
    return c.json({ error: "Failed to generate daily pick" }, 500);
  }
});

/**
 * GET /trending
 * Fetch trending movies and TV shows, optionally filtered by user's preferred platforms
 */
app.get("/trending", authMiddleware, rateLimitMiddleware("standard"), async (c) => {
  try {
    const userId = getUserId(c);

    const language = c.req.query("language") || "fr-FR";
    const country = c.req.query("country") || "FR";

    // Fetch trending from TMDB
    const trending = await tmdb.getTrending(language);

    // Get user preferences to optionally filter by platforms
    const preferences = await db.getUserPreferences(userId);
    let filteredTrending = trending;

    if (preferences.platforms.length > 0) {
      // Fetch providers for trending items to filter
      const trendingAsMovieResults = trending.map((item) => ({
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

      const providers = await tmdb.getBatchWatchProviders(trendingAsMovieResults, country);
      const platformSet = new Set(preferences.platforms);

      const platformFiltered = trending.filter((item) => {
        const itemProviders = providers[item.tmdb_id] || [];
        return itemProviders.some((p) => platformSet.has(p.provider_id));
      });

      // Only use filtered results if we have enough
      if (platformFiltered.length >= 5) {
        filteredTrending = platformFiltered;
      }
    }

    // Return top 20 items
    const top20 = filteredTrending.slice(0, 20);

    c.header("Cache-Control", "public, max-age=3600");
    return c.json({
      success: true,
      data: { items: top20 },
    });
  } catch (error) {
    console.error("❌ /api/trending:", error);
    return c.json({ error: "Failed to fetch trending" }, 500);
  }
});

/**
 * GET /trending/public
 * Public trending endpoint - no auth required, used by guest users
 */
app.get("/trending/public", rateLimitMiddleware("anonymous"), async (c) => {
  try {
    const language = c.req.query("language") || "fr-FR";
    const country = c.req.query("country") || "FR";

    const trending = await tmdb.getTrending(language);
    const top20 = trending.slice(0, 20);

    // Fetch providers for trending items
    const trendingAsResults = top20.map((item) => ({
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
    const providers = await tmdb.getBatchWatchProviders(trendingAsResults, country);
    const itemsWithProviders = top20.map((item) => ({
      ...item,
      providers: (providers[item.tmdb_id] || []).map((p) => ({
        provider_name: p.provider_name,
        logo_path: p.logo_path,
      })),
    }));

    c.header("Cache-Control", "public, max-age=3600");
    return c.json({ success: true, data: { items: itemsWithProviders } });
  } catch (error) {
    console.error("❌ /api/trending/public:", error);
    return c.json({ error: "Failed to fetch trending" }, 500);
  }
});

/**
 * GET /new-releases
 * Fetch movies and TV shows released this week, grouped by user's platforms
 */
app.get("/new-releases", authMiddleware, rateLimitMiddleware("standard"), async (c) => {
  try {
    const userId = getUserId(c);
    const language = c.req.query("language") || "fr-FR";
    const country = c.req.query("country") || "FR";

    // Get user's preferences and taste profile in parallel
    const [preferences, tasteProfile] = await Promise.all([
      db.getUserPreferences(userId),
      db.getUserTasteProfile(userId),
    ]);
    const watchedIds = getWatchedTmdbIds(tasteProfile);
    const userPlatformIds = preferences.platforms.length > 0 ? preferences.platforms : [];
    const allowFlatrate = preferences.includeFlatrate;
    const allowRent = preferences.includeRent;
    const allowBuy = preferences.includeBuy;
    const hasAvailabilityFilter = allowFlatrate || allowRent || allowBuy;
    const platformSet = userPlatformIds.length > 0 ? new Set(userPlatformIds) : null;
    const hasFilters = hasAvailabilityFilter || platformSet !== null;

    // Calculate date range for "this week"
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const dateFrom = weekAgo.toISOString().split("T")[0];
    const dateTo = now.toISOString().split("T")[0];

    // Fetch recent movies and TV from TMDB discover
    const params: Record<string, string> = {
      "primary_release_date.gte": dateFrom,
      "primary_release_date.lte": dateTo,
      sort_by: "popularity.desc",
      "vote_count.gte": "5",
      language,
      watch_region: country,
      page: "1",
    };

    const tvParams: Record<string, string> = {
      "first_air_date.gte": dateFrom,
      "first_air_date.lte": dateTo,
      sort_by: "popularity.desc",
      "vote_count.gte": "3",
      language,
      watch_region: country,
      page: "1",
    };

    // If user has platform preferences, filter by them
    if (userPlatformIds.length > 0) {
      params.with_watch_providers = userPlatformIds.join("|");
      params.watch_region = country;
      tvParams.with_watch_providers = userPlatformIds.join("|");
      tvParams.watch_region = country;
    }

    const [moviesData, tvData] = await Promise.all([
      tmdb.makePublicRequest("/discover/movie", params),
      tmdb.makePublicRequest("/discover/tv", tvParams),
    ]);

    // Combine and format results
    interface TMDBResult {
      id: number;
      title?: string;
      name?: string;
      poster_path: string | null;
      vote_average: number;
      overview: string;
      release_date?: string;
      first_air_date?: string;
      genre_ids?: number[];
    }

    const allMovies = ((moviesData as { results?: TMDBResult[] }).results || [])
      .filter((item: TMDBResult) => !watchedIds.has(item.id))
      .map((item: TMDBResult) => ({
        tmdb_id: item.id,
        title: item.title || item.name || "",
        poster_path: item.poster_path,
        vote_average: item.vote_average,
        overview: item.overview,
        media_type: "movie" as const,
        release_date: item.release_date,
        genre_ids: item.genre_ids || [],
      }));

    const allTvShows = ((tvData as { results?: TMDBResult[] }).results || [])
      .filter((item: TMDBResult) => !watchedIds.has(item.id))
      .map((item: TMDBResult) => ({
        tmdb_id: item.id,
        title: item.name || item.title || "",
        poster_path: item.poster_path,
        vote_average: item.vote_average,
        overview: item.overview,
        media_type: "tv" as const,
        release_date: item.first_air_date,
        genre_ids: item.genre_ids || [],
      }));

    // Fetch providers for all items
    const allItems = [...allMovies, ...allTvShows];
    const rawProvidersMap: Record<number, StreamingProvider[]> = {};

    // Batch fetch providers (5 at a time)
    for (let i = 0; i < allItems.length; i += 5) {
      const batch = allItems.slice(i, i + 5);
      const results = await Promise.all(
        batch.map((item) =>
          tmdb
            .getWatchProviders(item.tmdb_id, item.media_type, country)
            .then((providers) => ({ id: item.tmdb_id, providers }))
            .catch(() => ({ id: item.tmdb_id, providers: [] as StreamingProvider[] }))
        )
      );
      for (const { id, providers } of results) {
        rawProvidersMap[id] = providers;
      }
    }

    // Filter providers by user's availability & platform preferences
    const providersMap: Record<number, { provider_name: string; logo_path: string }[]> = {};
    const matchingIds = new Set<number>();

    for (const [idStr, itemProviders] of Object.entries(rawProvidersMap)) {
      const id = Number(idStr);
      let filtered = itemProviders;

      if (hasAvailabilityFilter) {
        filtered = filtered.filter((p) => {
          if (p.availability_type === "flatrate" && allowFlatrate) return true;
          if (p.availability_type === "rent" && allowRent) return true;
          if (p.availability_type === "buy" && allowBuy) return true;
          if (p.availability_type === "ads" && allowFlatrate) return true;
          return false;
        });
      }

      if (platformSet) {
        filtered = filtered.filter((p) => platformSet.has(p.provider_id));
      }

      if (filtered.length > 0) {
        matchingIds.add(id);
        providersMap[id] = filtered.map((p) => ({
          provider_name: p.provider_name,
          logo_path: p.logo_path,
        }));
      }
    }

    // Only keep items that have matching providers (when filters are active)
    // Then sort by affinity (user's favorite genres first)
    const movies = (
      hasFilters ? allMovies.filter((m) => matchingIds.has(m.tmdb_id)) : allMovies
    ).sort((a, b) => {
      const scoreA = computeAffinityScore(a.genre_ids, tasteProfile);
      const scoreB = computeAffinityScore(b.genre_ids, tasteProfile);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return b.vote_average - a.vote_average;
    });
    const tvShows = (
      hasFilters ? allTvShows.filter((m) => matchingIds.has(m.tmdb_id)) : allTvShows
    ).sort((a, b) => {
      const scoreA = computeAffinityScore(a.genre_ids, tasteProfile);
      const scoreB = computeAffinityScore(b.genre_ids, tasteProfile);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return b.vote_average - a.vote_average;
    });

    // For items without filters, populate providersMap with unfiltered data
    if (!hasFilters) {
      for (const [idStr, itemProviders] of Object.entries(rawProvidersMap)) {
        const id = Number(idStr);
        if (!providersMap[id]) {
          providersMap[id] = itemProviders.map((p) => ({
            provider_name: p.provider_name,
            logo_path: p.logo_path,
          }));
        }
      }
    }

    c.header("Cache-Control", "public, max-age=3600");
    return c.json({
      success: true,
      data: {
        movies,
        tvShows,
        providers: providersMap,
        dateRange: { from: dateFrom, to: dateTo },
      },
    });
  } catch (error) {
    console.error("❌ /api/new-releases:", error);
    return c.json({ error: "Failed to fetch new releases" }, 500);
  }
});

/**
 * GET /for-you
 * Personalized recommendations powered by Gemini AI
 */
app.get("/for-you", authMiddleware, rateLimitMiddleware("ai"), async (c) => {
  try {
    const userId = getUserId(c);

    const language = c.req.query("language") || "fr-FR";
    const country = c.req.query("country") || "FR";

    // Fetch taste profile, watchlist, search history, preferences, and trending in parallel
    const [tasteProfile, watchlist, recentSearchHistory, preferences, trendingItems] =
      await Promise.all([
        db.getUserTasteProfile(userId),
        db.getWatchlist(userId),
        db.getSearchHistory(userId, 5),
        db.getUserPreferences(userId),
        tmdb.getTrending(language).catch(() => []),
      ]);

    // Check if user has a meaningful taste profile
    const hasProfile =
      tasteProfile.rated_movies.length > 0 || tasteProfile.favorite_genres.length > 0;

    if (!hasProfile) {
      return c.json({
        success: true,
        data: {
          recommendations: [],
          streamingProviders: {},
          hasProfile: false,
        },
      });
    }

    // Build exclusion set: watchlist + already watched/rated
    const watchlistTmdbIds = new Set(watchlist.map((item) => item.tmdb_id));
    const watchedTmdbIds = getWatchedTmdbIds(tasteProfile);
    const excludeIds = new Set([...watchlistTmdbIds, ...watchedTmdbIds]);

    // Enrich taste profile with watchlist genre signals
    const watchlistGenreSignal = analyzeWatchlistGenres(watchlist);

    // Build user context for Gemini
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

    // Build a synthetic query that guides Gemini to discover great content for this user
    const syntheticQuery = buildPersonalizedQuery(tasteProfile, watchlistGenreSignal);

    // Content types based on user preferences
    const contentTypes: string[] = [];
    if (preferences.contentType === "all" || preferences.contentType === "movies") {
      contentTypes.push("movies");
    }
    if (preferences.contentType === "all" || preferences.contentType === "tvshows") {
      contentTypes.push("TV shows");
    }
    if (contentTypes.length === 0) contentTypes.push("movies", "TV shows");

    // Recent trending titles for Gemini awareness
    const recentTitles = trendingItems.slice(0, 15).map((item) => ({
      title: item.title,
      mediaType: item.media_type,
    }));

    // Call Gemini AI for personalized recommendations
    const aiResult = await gemini.generateRecommendationsWithResponse(
      syntheticQuery,
      contentTypes,
      language,
      undefined,
      20, // max recommendations
      userContext,
      undefined, // no conversation history for for-you
      recentTitles.length > 0 ? recentTitles : undefined
    );

    // If Gemini failed, fall back to trending
    if (aiResult.isFallback || aiResult.recommendations.length === 0) {
      console.log("⚠️ For You: Gemini returned no results, falling back to trending");
      return c.json({
        success: true,
        data: {
          recommendations: [],
          streamingProviders: {},
          hasProfile: true,
        },
      });
    }

    // Build title→reason map from AI result
    const reasonMap = new Map<string, string>();
    for (let i = 0; i < aiResult.recommendations.length; i++) {
      if (aiResult.reasons[i]) {
        reasonMap.set(aiResult.recommendations[i].toLowerCase(), aiResult.reasons[i]);
      }
    }

    // Enrich recommendations with TMDB data
    const includeMovies = contentTypes.includes("movies");
    const includeTvShows = contentTypes.includes("TV shows");
    const enrichedResults = await tmdb.enrichRecommendations(
      aiResult.recommendations,
      includeMovies,
      includeTvShows,
      language
    );

    // Attach reasons to enriched results
    for (const result of enrichedResults) {
      const reason = reasonMap.get(result.title.toLowerCase())
        || reasonMap.get((result.original_title || "").toLowerCase());
      if (reason) {
        result.reason = reason;
      }
    }

    // Filter out already-watched and watchlisted items
    const filteredResults = enrichedResults.filter((item) => !excludeIds.has(item.tmdb_id));

    // Take top 20
    const top20 = filteredResults.slice(0, 20);

    // Fetch streaming providers for all results in parallel
    const [rawProvidersMap] = await Promise.all([tmdb.getBatchWatchProviders(top20, country)]);

    // Filter by user's availability type + platform preferences
    const allowFlatrate = preferences.includeFlatrate;
    const allowRent = preferences.includeRent;
    const allowBuy = preferences.includeBuy;
    const hasAvailabilityFilter = allowFlatrate || allowRent || allowBuy;

    const filteredProvidersMap: { [key: number]: StreamingProvider[] } = {};
    for (const [tmdbIdStr, itemProviders] of Object.entries(rawProvidersMap)) {
      const tmdbId = Number(tmdbIdStr);
      let filtered = itemProviders;

      if (hasAvailabilityFilter) {
        filtered = filtered.filter((p) => {
          if (p.availability_type === "flatrate" && allowFlatrate) return true;
          if (p.availability_type === "rent" && allowRent) return true;
          if (p.availability_type === "buy" && allowBuy) return true;
          if (p.availability_type === "ads" && allowFlatrate) return true;
          return false;
        });
      }

      if (preferences.platforms.length > 0) {
        const pSet = new Set(preferences.platforms);
        filtered = filtered.filter((p) => pSet.has(p.provider_id));
      }

      if (filtered.length > 0) {
        filteredProvidersMap[tmdbId] = filtered;
      }
    }

    // Only keep recommendations with matching providers (if user has filters)
    const hasFilters = hasAvailabilityFilter || preferences.platforms.length > 0;
    const finalRecommendations = hasFilters
      ? top20.filter((item) => filteredProvidersMap[item.tmdb_id]?.length > 0)
      : top20;

    c.header("Cache-Control", "private, max-age=1800");
    return c.json({
      success: true,
      data: {
        recommendations: finalRecommendations,
        streamingProviders: filteredProvidersMap,
        hasProfile: true,
      },
    });
  } catch (error) {
    console.error("❌ /api/for-you:", error);
    return c.json({ error: "Failed to load personalized recommendations" }, 500);
  }
});

/**
 * Analyze watchlist to extract implicit genre preferences
 */
function analyzeWatchlistGenres(
  watchlist: { tmdb_id: number; media_type: string; title: string }[]
): string[] {
  if (watchlist.length === 0) return [];
  const titles = watchlist.slice(0, 10).map((item) => item.title);
  return titles;
}

/**
 * Build a synthetic query that guides Gemini to find great personalized content
 */
function buildPersonalizedQuery(
  tasteProfile: {
    favorite_genres: string[];
    disliked_genres: string[];
    favorite_decades: string[];
    rated_movies: { title: string; rating: number; tmdb_id: number }[];
  },
  watchlistTitles: string[]
): string {
  const parts: string[] = [];

  parts.push("Recommend me great movies and TV shows I would love based on my taste.");

  const loved = tasteProfile.rated_movies.filter((m) => m.rating >= 4);
  if (loved.length > 0) {
    const titles = loved.slice(0, 8).map((m) => m.title);
    parts.push(`I loved: ${titles.join(", ")}.`);
  }

  const disliked = tasteProfile.rated_movies.filter((m) => m.rating >= 1 && m.rating <= 2);
  if (disliked.length > 0) {
    const titles = disliked.slice(0, 5).map((m) => m.title);
    parts.push(`I did NOT like: ${titles.join(", ")}.`);
  }

  if (watchlistTitles.length > 0) {
    parts.push(`I'm interested in watching: ${watchlistTitles.slice(0, 5).join(", ")}.`);
  }

  if (tasteProfile.favorite_genres.length > 0) {
    parts.push(`I enjoy ${tasteProfile.favorite_genres.join(", ")}.`);
  }

  if (tasteProfile.favorite_decades.length > 0) {
    parts.push(`I prefer content from: ${tasteProfile.favorite_decades.join(", ")}.`);
  }

  parts.push("Suggest a diverse mix — hidden gems, classics, and recent titles. Surprise me!");

  return parts.join(" ");
}

export default app;
