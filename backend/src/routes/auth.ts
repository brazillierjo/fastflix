import { Hono } from "hono";
import { randomUUID } from "crypto";
import { z } from "zod";
import { verifyAppleToken, verifyGoogleToken, generateJWT } from "../lib/auth.js";
import { db } from "../lib/db.js";
import { authMiddleware, getUser, getUserId } from "../middleware/auth.js";
import type { AuthResponse } from "../lib/types.js";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***@***";
  const maskedLocal = local.length > 2 ? `${local[0]}***${local[local.length - 1]}` : "***";
  return `${maskedLocal}@${domain}`;
}

const appleAuthSchema = z.object({
  identityToken: z.string().min(1).max(10000),
  user: z
    .object({
      email: z.string().email().max(255).optional(),
      name: z
        .object({
          firstName: z.string().max(100).optional(),
          lastName: z.string().max(100).optional(),
        })
        .optional(),
    })
    .optional(),
});

const googleAuthSchema = z.object({
  idToken: z.string().min(1).max(10000),
});

const app = new Hono();

// POST /auth/apple
app.post("/apple", async (c) => {
  try {
    const body = await c.req.json();
    const validationResult = appleAuthSchema.safeParse(body);

    if (!validationResult.success) {
      return c.json({ error: "Invalid request" }, 400);
    }

    const { identityToken, user } = validationResult.data;

    console.log("[Auth] Verifying Apple identity token...");
    const applePayload = await verifyAppleToken(identityToken);

    const providerUserId = applePayload.sub;
    const email = applePayload.email || user?.email;

    if (!email) {
      return c.json({ error: "Email is required for authentication" }, 400);
    }

    let existingUser = await db.getUserByProvider("apple", providerUserId);
    if (!existingUser) {
      existingUser = await db.getUserByEmail(email);
    }

    let dbUser;

    if (existingUser) {
      console.log(`[Auth] Existing user found: ${maskEmail(email)}`);
      dbUser = existingUser;
    } else {
      const deletedUser = await db.getDeletedUserByProvider("apple", providerUserId);
      if (deletedUser) {
        console.log(`[Auth] Reactivating deleted user: ${maskEmail(email)}`);
        dbUser = await db.reactivateUser(deletedUser.id);
      } else {
        console.log(`[Auth] Creating new user: ${maskEmail(email)}`);
        const userName = user?.name
          ? `${user.name.firstName || ""} ${user.name.lastName || ""}`.trim()
          : null;

        dbUser = await db.createUser({
          id: randomUUID(),
          email,
          name: userName,
          avatar_url: null,
          auth_provider: "apple",
          provider_user_id: providerUserId,
        });
      }
    }

    const token = generateJWT(dbUser.id, dbUser.email);
    const response: AuthResponse = { user: dbUser, token };
    console.log(`[Auth] Apple Sign In successful: ${maskEmail(email)}`);
    return c.json(response);
  } catch (error) {
    console.error("[Auth] Error in Apple Sign In:", error);
    return c.json({ error: "Apple Sign In failed" }, 500);
  }
});

// POST /auth/google
app.post("/google", async (c) => {
  try {
    const body = await c.req.json();
    const validationResult = googleAuthSchema.safeParse(body);

    if (!validationResult.success) {
      return c.json({ error: "Invalid request" }, 400);
    }

    const { idToken } = validationResult.data;

    console.log("[Auth] Verifying Google ID token...");
    const googlePayload = await verifyGoogleToken(idToken);

    const providerUserId = googlePayload.sub;
    const email = googlePayload.email;

    if (!email) {
      return c.json({ error: "Email is required for authentication" }, 400);
    }

    let existingUser = await db.getUserByProvider("google", providerUserId);
    if (!existingUser) {
      existingUser = await db.getUserByEmail(email);
    }

    let dbUser;

    if (existingUser) {
      console.log(`[Auth] Existing user found: ${maskEmail(email)}`);
      dbUser = existingUser;
    } else {
      const deletedUser = await db.getDeletedUserByProvider("google", providerUserId);
      if (deletedUser) {
        console.log(`[Auth] Reactivating deleted user: ${maskEmail(email)}`);
        dbUser = await db.reactivateUser(deletedUser.id);
      } else {
        console.log(`[Auth] Creating new user: ${maskEmail(email)}`);
        dbUser = await db.createUser({
          id: randomUUID(),
          email,
          name: googlePayload.name || null,
          avatar_url: googlePayload.picture || null,
          auth_provider: "google",
          provider_user_id: providerUserId,
        });
      }
    }

    const token = generateJWT(dbUser.id, dbUser.email);
    const response: AuthResponse = { user: dbUser, token };
    console.log(`[Auth] Google Sign In successful: ${maskEmail(email)}`);
    return c.json(response);
  } catch (error) {
    console.error("[Auth] Error in Google Sign In:", error);
    return c.json({ error: "Google Sign In failed" }, 500);
  }
});

// GET /auth/me
app.get("/me", authMiddleware, async (c) => {
  try {
    const user = getUser(c);
    const userId = getUserId(c);
    const subscriptionDetails = await db.getSubscriptionDetails(userId);

    return c.json({
      user,
      subscription: {
        isActive: subscriptionDetails.isActive,
        status: subscriptionDetails.status,
        productId: subscriptionDetails.productId,
        expiresAt: subscriptionDetails.expiresAt,
        createdAt: subscriptionDetails.createdAt,
        willRenew: subscriptionDetails.willRenew,
      },
    });
  } catch (error) {
    return c.json({ error: "Failed to get user info" }, 500);
  }
});

export default app;
