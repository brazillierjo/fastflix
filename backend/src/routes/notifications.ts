/**
 * FastFlix Backend - Notifications Route (Hono)
 * POST: Register push notification token
 */

import { Hono } from "hono";
import { z } from "zod";
import { db } from "../lib/db.js";
import { authMiddleware, getUserId } from "../middleware/auth.js";
import { rateLimitMiddleware } from "../middleware/rate-limit.js";

// Validation schema for push token registration
const registerPushTokenSchema = z.object({
  token: z
    .string()
    .min(1, "Push token is required")
    .max(500)
    .regex(/^ExponentPushToken\[.+\]$|^[A-Za-z0-9_:.-]+$/, "Invalid push token format"),
  platform: z.enum(["ios", "android"]).default("ios"),
});

const app = new Hono();

/**
 * POST /
 * Save a push token for the authenticated user
 */
app.post("/", authMiddleware, rateLimitMiddleware("standard"), async (c) => {
  try {
    const userId = getUserId(c);

    // Parse and validate request body
    const body = await c.req.json();
    const validatedData = registerPushTokenSchema.parse(body);

    // Save push token
    await db.savePushToken(userId, validatedData.token, validatedData.platform);

    return c.json({
      success: true,
      data: { registered: true },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid request data", details: error.issues }, 400);
    }

    console.error("Error registering push token:", error);
    return c.json({ error: "Failed to register push token" }, 500);
  }
});

export default app;
