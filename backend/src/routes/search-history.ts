/**
 * FastFlix Backend - Search History Route (Hono)
 * GET: Retrieve recent search history
 */

import { Hono } from "hono";
import { db } from "../lib/db.js";
import { authMiddleware, getUserId } from "../middleware/auth.js";
import { rateLimitMiddleware } from "../middleware/rate-limit.js";

const app = new Hono();

/**
 * GET /
 * Return last 20 searches for the authenticated user
 */
app.get("/", authMiddleware, rateLimitMiddleware("readonly"), async (c) => {
  try {
    const userId = getUserId(c);
    const history = await db.getSearchHistory(userId, 20);

    return c.json({
      success: true,
      data: { history },
    });
  } catch (error) {
    console.error("❌ /api/search/history:", error);
    return c.json({ error: "Failed to fetch search history" }, 500);
  }
});

export default app;
