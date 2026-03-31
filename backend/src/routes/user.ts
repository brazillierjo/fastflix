import { Hono } from "hono";
import { z } from "zod";
import { db } from "../lib/db.js";
import { tmdb } from "../lib/tmdb.js";
import { authMiddleware, getUserId } from "../middleware/auth.js";

const updatePreferencesSchema = z.object({
  country: z.string().length(2).optional(),
  contentType: z.enum(["all", "movies", "tvshows"]).optional(),
  platforms: z.array(z.number()).optional(),
  includeFlatrate: z.boolean().optional(),
  includeRent: z.boolean().optional(),
  includeBuy: z.boolean().optional(),
});

const updateTasteProfileSchema = z.object({
  favorite_genres: z.array(z.string().max(50)).max(20).optional(),
  disliked_genres: z.array(z.string().max(50)).max(20).optional(),
  favorite_decades: z.array(z.string().max(10)).max(10).optional(),
});

const rateMovieSchema = z.object({
  tmdb_id: z.number().int().positive(),
  rating: z.number().int().min(0).max(5),
  title: z.string().min(1).max(500),
  media_type: z.enum(["movie", "tv"]).optional(),
  poster_path: z.string().max(500).optional(),
});

const deleteRatingSchema = z.object({
  tmdb_id: z.number().int().positive(),
});

const favoriteActorSchema = z.object({
  tmdb_id: z.number().int().positive(),
  name: z.string().min(1).max(500),
  profile_path: z.string().max(500).optional(),
  known_for_department: z.string().max(200).optional(),
});

const unfavoriteActorSchema = z.object({
  tmdb_id: z.number().int().positive(),
});

const app = new Hono();

app.use("*", authMiddleware);

// GET /user/preferences
app.get("/preferences", async (c) => {
  try {
    const preferences = await db.getUserPreferences(getUserId(c));
    return c.json({ success: true, data: { preferences } });
  } catch {
    return c.json({ error: "Failed to fetch preferences" }, 500);
  }
});

// PUT /user/preferences
app.put("/preferences", async (c) => {
  try {
    const body = await c.req.json();
    const validatedData = updatePreferencesSchema.parse(body);
    const updatedPreferences = await db.updateUserPreferences(getUserId(c), validatedData);
    return c.json({ success: true, data: { preferences: updatedPreferences } });
  } catch (error) {
    if (error instanceof z.ZodError) return c.json({ error: "Invalid request data", details: error.issues }, 400);
    return c.json({ error: "Failed to update preferences" }, 500);
  }
});

// GET /user/taste-profile
app.get("/taste-profile", async (c) => {
  try {
    const profile = await db.getUserTasteProfile(getUserId(c));
    return c.json({ success: true, data: { profile } });
  } catch {
    return c.json({ error: "Failed to fetch taste profile" }, 500);
  }
});

// PUT /user/taste-profile
app.put("/taste-profile", async (c) => {
  try {
    const body = await c.req.json();
    const validatedData = updateTasteProfileSchema.parse(body);
    const updatedProfile = await db.updateTasteProfile(getUserId(c), validatedData);
    return c.json({ success: true, data: { profile: updatedProfile } });
  } catch (error) {
    if (error instanceof z.ZodError) return c.json({ error: "Invalid request data", details: error.issues }, 400);
    return c.json({ error: "Failed to update taste profile" }, 500);
  }
});

// POST /user/taste-profile/rate
app.post("/taste-profile/rate", async (c) => {
  try {
    const body = await c.req.json();
    const validatedData = rateMovieSchema.parse(body);
    const updatedProfile = await db.rateMovie(
      getUserId(c), validatedData.tmdb_id, validatedData.rating,
      validatedData.title, validatedData.media_type, validatedData.poster_path
    );
    return c.json({ success: true, data: { profile: updatedProfile } });
  } catch (error) {
    if (error instanceof z.ZodError) return c.json({ error: "Invalid request data", details: error.issues }, 400);
    return c.json({ error: "Failed to rate movie" }, 500);
  }
});

// DELETE /user/taste-profile/rate
app.delete("/taste-profile/rate", async (c) => {
  try {
    const body = await c.req.json();
    const validatedData = deleteRatingSchema.parse(body);
    const updatedProfile = await db.removeRating(getUserId(c), validatedData.tmdb_id);
    return c.json({ success: true, data: { profile: updatedProfile } });
  } catch (error) {
    if (error instanceof z.ZodError) return c.json({ error: "Invalid request data", details: error.issues }, 400);
    return c.json({ error: "Failed to remove rating" }, 500);
  }
});

// POST /user/taste-profile/favorite-actors
app.post("/taste-profile/favorite-actors", async (c) => {
  try {
    const body = await c.req.json();
    const validatedData = favoriteActorSchema.parse(body);
    const updatedProfile = await db.favoriteActor(
      getUserId(c), validatedData.tmdb_id, validatedData.name,
      validatedData.profile_path, validatedData.known_for_department
    );
    return c.json({ success: true, data: { profile: updatedProfile } });
  } catch (error) {
    if (error instanceof z.ZodError) return c.json({ error: "Invalid request data", details: error.issues }, 400);
    return c.json({ error: "Failed to favorite actor" }, 500);
  }
});

// DELETE /user/taste-profile/favorite-actors
app.delete("/taste-profile/favorite-actors", async (c) => {
  try {
    const body = await c.req.json();
    const validatedData = unfavoriteActorSchema.parse(body);
    const updatedProfile = await db.unfavoriteActor(getUserId(c), validatedData.tmdb_id);
    return c.json({ success: true, data: { profile: updatedProfile } });
  } catch (error) {
    if (error instanceof z.ZodError) return c.json({ error: "Invalid request data", details: error.issues }, 400);
    return c.json({ error: "Failed to unfavorite actor" }, 500);
  }
});

// POST /user/taste-profile/backfill-posters
app.post("/taste-profile/backfill-posters", async (c) => {
  try {
    const userId = getUserId(c);
    const profile = await db.getUserTasteProfile(userId);
    const ratedMovies = [...profile.rated_movies];
    let updated = 0;

    for (const movie of ratedMovies) {
      if (movie.poster_path) continue;
      try {
        const mediaType = movie.media_type || "movie";
        let details = mediaType === "tv"
          ? await tmdb.getTVDetails(movie.tmdb_id) : await tmdb.getMovieDetails(movie.tmdb_id);
        if (!details?.poster_path) {
          details = mediaType === "tv"
            ? await tmdb.getMovieDetails(movie.tmdb_id) : await tmdb.getTVDetails(movie.tmdb_id);
        }
        if (details?.poster_path) { movie.poster_path = details.poster_path; updated++; }
      } catch { /* skip */ }
    }

    if (updated > 0) await db.updateTasteProfile(userId, { rated_movies: ratedMovies });
    return c.json({ success: true, data: { updated, total: ratedMovies.length } });
  } catch {
    return c.json({ error: "Failed to backfill posters" }, 500);
  }
});

// GET /user/stats
app.get("/stats", async (c) => {
  try {
    const stats = await db.getUserStats(getUserId(c));
    return c.json({ success: true, data: stats });
  } catch {
    return c.json({ error: "Failed to fetch user stats" }, 500);
  }
});

// POST /user/delete (soft delete)
app.post("/delete", async (c) => {
  try {
    await db.softDeleteUser(getUserId(c));
    return c.json({ success: true, message: "Account deleted successfully" });
  } catch {
    return c.json({ error: "Failed to delete account" }, 500);
  }
});

export default app;
