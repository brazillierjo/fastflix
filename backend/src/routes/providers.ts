/**
 * FastFlix Backend - Providers Routes (Hono)
 * Combines: providers (auth), providers/public (no auth)
 */

import { Hono } from "hono";
import { tmdb } from "../lib/tmdb.js";
import { authMiddleware } from "../middleware/auth.js";
import { rateLimitMiddleware } from "../middleware/rate-limit.js";

const app = new Hono();

/**
 * GET /
 * Get list of available streaming providers for a country (auth required)
 * Query params: country (ISO 3166-1 alpha-2, default: 'FR')
 */
app.get("/", authMiddleware, rateLimitMiddleware("standard"), async (c) => {
  try {
    const country = c.req.query("country") || "FR";

    // Validate country code (2 letters)
    if (!/^[A-Z]{2}$/.test(country)) {
      return c.json(
        { error: "Invalid country code. Use ISO 3166-1 alpha-2 format (e.g., FR, US)" },
        400
      );
    }

    // Get providers from TMDB
    const providers = await tmdb.getAvailableProviders(country);

    return c.json({
      success: true,
      data: {
        country,
        providers,
        totalResults: providers.length,
      },
    });
  } catch (error) {
    console.error("❌ /api/providers:", error);
    return c.json({ error: "Failed to fetch providers" }, 500);
  }
});

/**
 * GET /public
 * Public providers endpoint - no auth required
 * Used by the setup screen before the user signs in
 * Query params: country
 */
app.get("/public", rateLimitMiddleware("anonymous"), async (c) => {
  try {
    const country = c.req.query("country") || "FR";

    if (!/^[A-Z]{2}$/.test(country)) {
      return c.json({ error: "Invalid country code" }, 400);
    }

    const providers = await tmdb.getAvailableProviders(country);

    c.header("Cache-Control", "public, max-age=86400");
    return c.json({
      success: true,
      data: { country, providers },
    });
  } catch (error) {
    console.error("❌ /api/providers/public:", error);
    return c.json({ error: "Failed to fetch providers" }, 500);
  }
});

export default app;
