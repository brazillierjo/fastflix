import { Hono } from "hono";
import { z } from "zod";
import { db } from "../lib/db.js";
import { tmdb } from "../lib/tmdb.js";
import { authMiddleware, getUserId } from "../middleware/auth.js";
import type { StreamingProvider } from "../lib/types.js";

const addToWatchlistSchema = z.object({
  tmdbId: z.number().int().positive(),
  mediaType: z.enum(["movie", "tv"]),
  title: z.string().min(1).max(500),
  posterPath: z.string().nullable(),
  providers: z
    .array(
      z.object({
        provider_id: z.number(),
        provider_name: z.string(),
        logo_path: z.string().optional().default(""),
        display_priority: z.number().optional().default(0),
        availability_type: z
          .enum(["flatrate", "rent", "buy", "ads"])
          .optional()
          .default("flatrate"),
      })
    )
    .optional()
    .default([]),
  country: z.string().min(2).max(3),
});

const markWatchedSchema = z.object({
  watched: z.boolean(),
  rating: z.number().min(1).max(5).optional(),
  note: z.string().max(500).optional(),
});

const app = new Hono();

// All watchlist routes require auth
app.use("*", authMiddleware);

// GET /watchlist
app.get("/", async (c) => {
  try {
    const userId = getUserId(c);
    const mediaTypeParam = c.req.query("mediaType");
    const mediaType =
      mediaTypeParam === "movie" || mediaTypeParam === "tv" ? mediaTypeParam : undefined;

    const items = await db.getWatchlist(userId, mediaType);
    const count = await db.getWatchlistCount(userId);

    return c.json({ success: true, data: { items, count, mediaType: mediaType || "all" } });
  } catch (error) {
    console.error("/watchlist GET:", error);
    return c.json({ error: "Failed to fetch watchlist" }, 500);
  }
});

// POST /watchlist
app.post("/", async (c) => {
  try {
    const userId = getUserId(c);
    const body = await c.req.json();
    const validatedData = addToWatchlistSchema.parse(body);

    const watchlistItem = await db.addToWatchlist(userId, validatedData);
    const today = new Date().toISOString().split("T")[0];
    await db.recordActivity(userId, today);

    return c.json({ success: true, data: { item: watchlistItem } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid request data", details: error.issues }, 400);
    }
    return c.json({ error: "Failed to add to watchlist" }, 500);
  }
});

// DELETE /watchlist/:id
app.delete("/:id", async (c) => {
  try {
    const userId = getUserId(c);
    const id = c.req.param("id");
    if (!id) return c.json({ error: "Missing item ID" }, 400);

    const deleted = await db.removeFromWatchlist(userId, id);
    if (!deleted) return c.json({ error: "Item not found in watchlist" }, 404);

    const today = new Date().toISOString().split("T")[0];
    await db.recordActivity(userId, today);

    return c.json({ success: true, data: { deleted: true } });
  } catch {
    return c.json({ error: "Failed to remove from watchlist" }, 500);
  }
});

// PUT /watchlist/:id/watched
app.put("/:id/watched", async (c) => {
  try {
    const userId = getUserId(c);
    const id = c.req.param("id");
    if (!id) return c.json({ error: "Missing item ID" }, 400);

    const body = await c.req.json();
    const validatedData = markWatchedSchema.parse(body);

    const updatedItem = await db.markWatchlistWatched(userId, id, {
      watched: validatedData.watched,
      rating: validatedData.rating,
      note: validatedData.note,
    });

    if (!updatedItem) return c.json({ error: "Item not found in watchlist" }, 404);

    const today = new Date().toISOString().split("T")[0];
    await db.recordActivity(userId, today);

    if (validatedData.rating !== undefined && validatedData.watched) {
      await db.rateMovie(userId, updatedItem.tmdb_id, validatedData.rating, updatedItem.title);
    }

    return c.json({ success: true, data: { item: updatedItem } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid request data", details: error.issues }, 400);
    }
    return c.json({ error: "Failed to update watched status" }, 500);
  }
});

// POST /watchlist/refresh-providers
app.post("/refresh-providers", async (c) => {
  try {
    const userId = getUserId(c);
    const itemsToRefresh = await db.getWatchlistItemsNeedingRefresh(userId);

    if (itemsToRefresh.length === 0) {
      return c.json({ success: true, data: { refreshed: 0, message: "All providers are up to date" } });
    }

    const refreshPromises = itemsToRefresh.map(async (item) => {
      try {
        const providers = await tmdb.getWatchProviders(item.tmdb_id, item.media_type, item.country);
        await db.updateWatchlistProviders(item.id, providers);
        return { id: item.id, success: true };
      } catch {
        return { id: item.id, success: false };
      }
    });

    const results = await Promise.all(refreshPromises);
    const successCount = results.filter((r) => r.success).length;

    return c.json({
      success: true,
      data: { refreshed: successCount, total: itemsToRefresh.length },
    });
  } catch {
    return c.json({ error: "Failed to refresh providers" }, 500);
  }
});

// GET /watchlist/check-availability
app.get("/check-availability", async (c) => {
  try {
    const userId = getUserId(c);
    const itemsToCheck = await db.getWatchlistItemsNeedingRefresh(userId);
    const unwatchedItems = itemsToCheck.filter((item) => !item.watched);

    if (unwatchedItems.length === 0) {
      return c.json({ success: true, data: { changes: [], checkedCount: 0 } });
    }

    interface ProviderChange {
      watchlistId: string;
      title: string;
      newProviders: Array<{ name: string; logo: string }>;
      removedProviders: Array<{ name: string; logo: string }>;
    }
    const changes: ProviderChange[] = [];

    const checkPromises = unwatchedItems.map(async (item) => {
      try {
        const currentProviders = await tmdb.getWatchProviders(item.tmdb_id, item.media_type, item.country);
        const oldProviderIds = new Set(item.providers.map((p: StreamingProvider) => p.provider_id));
        const currentProviderIds = new Set(currentProviders.map((p) => p.provider_id));

        const newProviders = currentProviders
          .filter((p) => !oldProviderIds.has(p.provider_id))
          .map((p) => ({ name: p.provider_name, logo: p.logo_path }));

        const removedProviders = item.providers
          .filter((p: StreamingProvider) => !currentProviderIds.has(p.provider_id))
          .map((p: StreamingProvider) => ({ name: p.provider_name, logo: p.logo_path }));

        await db.updateWatchlistProviders(item.id, currentProviders);

        if (newProviders.length > 0 || removedProviders.length > 0) {
          changes.push({ watchlistId: item.id, title: item.title, newProviders, removedProviders });
        }
      } catch {
        // Skip items that fail
      }
    });

    await Promise.all(checkPromises);

    return c.json({ success: true, data: { changes, checkedCount: unwatchedItems.length } });
  } catch {
    return c.json({ error: "Failed to check availability" }, 500);
  }
});

// GET /watchlist/check/:tmdbId/:mediaType
app.get("/check/:tmdbId/:mediaType", async (c) => {
  try {
    const userId = getUserId(c);
    const tmdbIdRaw = c.req.param("tmdbId");
    const mediaType = c.req.param("mediaType");

    // Validate tmdbId
    const tmdbIdNum = parseInt(tmdbIdRaw, 10);
    if (isNaN(tmdbIdNum)) {
      return c.json({ error: "Invalid TMDB ID" }, 400);
    }

    // Validate mediaType
    if (mediaType !== "movie" && mediaType !== "tv") {
      return c.json({ error: "Invalid media type" }, 400);
    }

    // Check if in watchlist
    const result = await db.isInWatchlist(userId, tmdbIdNum, mediaType);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ /api/watchlist/check:", error);
    return c.json({ error: "Failed to check watchlist" }, 500);
  }
});

export default app;
