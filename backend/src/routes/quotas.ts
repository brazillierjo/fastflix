/**
 * FastFlix Backend - Quotas Route (Hono)
 * GET: Retrieve current daily quota usage and limits
 */

import { Hono } from "hono";
import { db } from "../lib/db.js";
import { FREE_TIER_LIMITS, PREMIUM_LIMITS } from "../lib/types.js";
import { authMiddleware, getUserId } from "../middleware/auth.js";
import { rateLimitMiddleware } from "../middleware/rate-limit.js";

const app = new Hono();

/**
 * GET /
 * Return current quota usage for the week and applicable limits
 */
app.get("/", authMiddleware, rateLimitMiddleware("readonly"), async (c) => {
  try {
    const userId = getUserId(c);

    // Weekly key for search quota
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(
      ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
    );
    const weekKey = `${now.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;

    // Get current search quota (weekly)
    const searchQuota = await db.getUserQuota(userId, weekKey);

    // Check if user is premium
    const isPremium = await db.hasAccess(userId);
    const limits = isPremium ? PREMIUM_LIMITS : FREE_TIER_LIMITS;

    return c.json({
      success: true,
      data: {
        period: weekKey,
        isPremium,
        usage: {
          searches: searchQuota.search_count,
        },
        limits: {
          searches: limits.searches,
        },
        remaining: {
          searches:
            limits.searches === -1
              ? -1
              : Math.max(0, limits.searches - searchQuota.search_count),
        },
      },
    });
  } catch (error) {
    console.error("❌ /api/quotas:", error);
    return c.json({ error: "Failed to fetch quota information" }, 500);
  }
});

export default app;
