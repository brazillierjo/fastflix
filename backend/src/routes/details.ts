/**
 * FastFlix Backend - Details Routes (Hono)
 * Combines: details, similar, person, tmdb-search
 */

import { Hono } from "hono";
import { z } from "zod";
import { tmdb } from "../lib/tmdb.js";
import { db } from "../lib/db.js";
import { authMiddleware, getUserId } from "../middleware/auth.js";
import { rateLimitMiddleware } from "../middleware/rate-limit.js";

// Validation schemas
const similarParamsSchema = z.object({
  tmdbId: z
    .string()
    .regex(/^\d+$/, "TMDB ID must be a number")
    .transform(Number),
});

const similarQuerySchema = z.object({
  type: z.enum(["movie", "tv"]).default("movie"),
  language: z.string().default("fr-FR"),
  country: z.string().default("FR"),
});

const personParamsSchema = z.object({
  personId: z
    .string()
    .regex(/^\d+$/, "Person ID must be a number")
    .transform(Number),
});

const personQuerySchema = z.object({
  language: z.string().default("fr-FR"),
});

const app = new Hono();

/**
 * GET /
 * Fetch full details, credits, and providers for a single movie/TV show
 * Query params: tmdbId, mediaType, language, country
 */
app.get("/details", authMiddleware, rateLimitMiddleware("standard"), async (c) => {
  try {
    const userId = getUserId(c);

    const tmdbId = parseInt(c.req.query("tmdbId") || "0", 10);
    const mediaType = (c.req.query("mediaType") || "movie") as "movie" | "tv";
    const language = c.req.query("language") || "fr-FR";
    const country = c.req.query("country") || "FR";

    if (!tmdbId) {
      return c.json({ error: "tmdbId is required" }, 400);
    }

    // Fetch details, credits, and providers in parallel
    const [fullDetails, detailedInfo, creditsResult, providers] = await Promise.all([
      tmdb.getFullDetails(tmdbId, mediaType, language),
      mediaType === "movie"
        ? tmdb.getMovieDetails(tmdbId, language)
        : tmdb.getTVDetails(tmdbId, language),
      tmdb.getCredits(tmdbId, mediaType, language),
      tmdb.getWatchProviders(tmdbId, mediaType, country),
    ]);

    c.header("Cache-Control", "private, max-age=1800");
    return c.json({
      success: true,
      data: {
        overview: fullDetails?.overview || "",
        backdrop_path: fullDetails?.backdrop_path || null,
        poster_path: fullDetails?.poster_path || null,
        vote_average: fullDetails?.vote_average || 0,
        title: fullDetails?.title || "",
        providers,
        credits: creditsResult.cast,
        crew: creditsResult.crew,
        detailedInfo: detailedInfo || {},
      },
    });
  } catch (error) {
    console.error("❌ /api/details:", error);
    return c.json({ error: "Failed to fetch details" }, 500);
  }
});

/**
 * GET /similar/:tmdbId
 * Get similar movies or TV shows, enriched with streaming providers
 * Query params: type (movie|tv), language, country
 */
app.get("/similar/:tmdbId", authMiddleware, rateLimitMiddleware("standard"), async (c) => {
  try {
    const tmdbIdRaw = c.req.param("tmdbId");
    const validatedParams = similarParamsSchema.parse({ tmdbId: tmdbIdRaw });
    const tmdbIdNum = validatedParams.tmdbId;

    const validatedQuery = similarQuerySchema.parse({
      type: c.req.query("type") || undefined,
      language: c.req.query("language") || undefined,
      country: c.req.query("country") || undefined,
    });

    const { type: mediaType, language, country } = validatedQuery;

    // Fetch similar items from TMDB
    const similar = await tmdb.getSimilar(tmdbIdNum, mediaType, language);

    // Enrich with streaming providers
    const providers = await tmdb.getBatchWatchProviders(similar, country);

    return c.json({
      success: true,
      data: {
        items: similar,
        streamingProviders: providers,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid request parameters", details: error.issues }, 400);
    }

    return c.json({ error: "Failed to fetch similar content" }, 500);
  }
});

/**
 * GET /person/:personId
 * Get person details with movie and TV credits
 * Query params: language
 */
app.get("/person/:personId", authMiddleware, rateLimitMiddleware("standard"), async (c) => {
  try {
    const personIdRaw = c.req.param("personId");
    const validatedParams = personParamsSchema.parse({ personId: personIdRaw });
    const personId = validatedParams.personId;

    const validatedQuery = personQuerySchema.parse({
      language: c.req.query("language") || undefined,
    });

    const { language } = validatedQuery;

    // Fetch person details from TMDB
    const person = await tmdb.getPersonDetails(personId, language);

    if (!person) {
      return c.json({ error: "Person not found" }, 404);
    }

    return c.json({
      success: true,
      data: person,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid request parameters", details: error.issues }, 400);
    }

    return c.json({ error: "Failed to fetch person details" }, 500);
  }
});

/**
 * GET /tmdb-search
 * Lightweight multi-search for movies, TV shows, and actors
 * Query params: q, language
 */
app.get("/tmdb-search", authMiddleware, rateLimitMiddleware("standard"), async (c) => {
  try {
    const query = c.req.query("q")?.trim();
    const language = c.req.query("language") || "fr-FR";

    if (!query || query.length < 2) {
      return c.json({ error: "Query must be at least 2 characters" }, 400);
    }

    const results = await tmdb.searchMultiAll(query, language, 10);

    return c.json({
      success: true,
      data: { results },
    });
  } catch {
    return c.json({ error: "Search failed" }, 500);
  }
});

export default app;
