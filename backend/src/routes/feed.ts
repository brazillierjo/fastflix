/**
 * FastFlix Backend - Feed Routes (Hono)
 * Swipe Discovery: feedback endpoint + future feed endpoint
 */

import { Hono } from "hono";
import { z } from "zod";
import { db } from "../lib/db.js";
import { authMiddleware, getUserId } from "../middleware/auth.js";
import { rateLimitMiddleware } from "../middleware/rate-limit.js";

const feedbackSchema = z.object({
  tmdb_id: z.number().int().positive(),
  type: z.enum(["like", "dislike"]),
  title: z.string().min(1).max(500),
  media_type: z.enum(["movie", "tv"]).optional(),
  poster_path: z.string().max(500).optional(),
});

const app = new Hono();

/**
 * POST /feedback
 * Submit like/dislike feedback from swipe discovery mode.
 * Maps to the taste profile rating system: like=5, dislike=1
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
