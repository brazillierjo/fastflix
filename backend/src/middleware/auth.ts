/**
 * Auth middleware for Hono — validates JWT and loads user from DB
 */

import type { Context, Next } from "hono";
import { extractTokenFromHeader, verifyJWT } from "../lib/auth.js";
import { db } from "../lib/db.js";
import type { User } from "../lib/types.js";

/**
 * Auth middleware — requires valid JWT and existing user
 */
export async function authMiddleware(c: Context, next: Next) {
  try {
    const authHeader = c.req.header("Authorization");
    const token = extractTokenFromHeader(authHeader || null);

    if (!token) {
      return c.json({ error: "Missing authentication token" }, 401);
    }

    const payload = verifyJWT(token);

    if (!payload) {
      return c.json({ error: "Invalid or expired token" }, 401);
    }

    const user = await db.getUserById(payload.userId);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    c.set("user", user);
    c.set("userId", user.id);

    await next();
  } catch (error) {
    console.error("Authentication error:", error);
    return c.json({ error: "Authentication failed" }, 500);
  }
}

/**
 * Optional auth — sets user if present but doesn't require it
 */
export async function optionalAuthMiddleware(c: Context, next: Next) {
  try {
    const authHeader = c.req.header("Authorization");
    const token = extractTokenFromHeader(authHeader || null);

    if (token) {
      const payload = verifyJWT(token);
      if (payload) {
        const user = await db.getUserById(payload.userId);
        if (user) {
          c.set("user", user);
          c.set("userId", user.id);
        }
      }
    }
  } catch {
    // Silently ignore auth errors for optional auth
  }

  await next();
}

/**
 * Helper to get the authenticated user from context
 */
export function getUser(c: Context): User {
  return c.get("user") as User;
}

export function getUserId(c: Context): string {
  return c.get("userId") as string;
}
