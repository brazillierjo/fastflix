/**
 * FastFlix Backend - RevenueCat Webhook Route (Hono)
 * Handles subscription events from RevenueCat
 */

import { Hono } from "hono";
import { db } from "../lib/db.js";
import { revenueCatWebhookSchema } from "../lib/validation.js";
import { verifyRevenueCatSignature } from "../lib/webhook-verification.js";
import { invalidateSubscriptionCache } from "../lib/revenuecat.js";
import { rateLimitMiddleware } from "../middleware/rate-limit.js";

const app = new Hono();

/**
 * POST /
 * Handle RevenueCat webhook events
 */
app.post("/", rateLimitMiddleware("webhook"), async (c) => {
  try {
    // Get raw body for signature verification
    const rawBody = await c.req.text();

    // Verify webhook signature (if secret is configured)
    const signature = c.req.header("X-Revenuecat-Signature");
    const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET;

    const isValidSignature = verifyRevenueCatSignature(rawBody, signature || null, webhookSecret);

    if (!isValidSignature) {
      console.error("❌ Invalid webhook signature - rejecting request");
      return c.json({ error: "Invalid signature" }, 401);
    }

    // Parse and validate webhook payload
    const payload = JSON.parse(rawBody);
    const validationResult = revenueCatWebhookSchema.safeParse(payload);

    if (!validationResult.success) {
      console.error("❌ Invalid webhook payload:", validationResult.error);
      return c.json(
        {
          error: "Invalid payload",
          details: validationResult.error.format(),
        },
        400
      );
    }

    const { event } = validationResult.data;

    console.log(
      `📬 RevenueCat webhook received: ${event.type} for ${event.app_user_id} (${event.environment})`
    );

    // Extract userId from app_user_id
    const userId = event.app_user_id;

    // Verify that the user exists in our database
    const user = await db.getUserById(userId);

    if (!user) {
      console.warn(`⚠️ User ${userId} not found in database - webhook event will be ignored`);
      // Return 200 to acknowledge receipt, but don't process
      return c.json({
        received: true,
        warning: "User not found - event not processed",
      });
    }

    console.log(`👤 Processing webhook for user: ${user.email}`);

    // Handle different event types
    switch (event.type) {
      case "INITIAL_PURCHASE":
      case "RENEWAL":
      case "UNCANCELLATION":
      case "NON_RENEWING_PURCHASE":
        // Activate subscription
        await db.upsertSubscriptionByUserId({
          user_id: userId,
          revenuecat_user_id: event.app_user_id,
          status: "active",
          expires_at: event.expiration_at_ms
            ? new Date(event.expiration_at_ms).toISOString()
            : null,
          product_id: event.product_id || null,
        });
        console.log(`✅ Subscription activated for user ${user.email}`);
        break;

      case "CANCELLATION":
        // Mark as cancelled but keep expiration date
        await db.upsertSubscriptionByUserId({
          user_id: userId,
          revenuecat_user_id: event.app_user_id,
          status: "cancelled",
          expires_at: event.expiration_at_ms
            ? new Date(event.expiration_at_ms).toISOString()
            : null,
          product_id: event.product_id || null,
        });
        console.log(`⚠️ Subscription cancelled for user ${user.email}`);
        break;

      case "EXPIRATION":
        // Mark as expired
        await db.upsertSubscriptionByUserId({
          user_id: userId,
          revenuecat_user_id: event.app_user_id,
          status: "expired",
          expires_at: event.expiration_at_ms
            ? new Date(event.expiration_at_ms).toISOString()
            : null,
          product_id: event.product_id || null,
        });
        console.log(`❌ Subscription expired for user ${user.email}`);
        break;

      case "PRODUCT_CHANGE":
        // Update product ID
        await db.upsertSubscriptionByUserId({
          user_id: userId,
          revenuecat_user_id: event.app_user_id,
          status: "active",
          expires_at: event.expiration_at_ms
            ? new Date(event.expiration_at_ms).toISOString()
            : null,
          product_id: event.product_id || null,
        });
        console.log(`🔄 Product changed for user ${user.email}`);
        break;

      case "BILLING_ISSUE":
        // Mark as billing issue
        await db.upsertSubscriptionByUserId({
          user_id: userId,
          revenuecat_user_id: event.app_user_id,
          status: "billing_issue",
          expires_at: event.expiration_at_ms
            ? new Date(event.expiration_at_ms).toISOString()
            : null,
          product_id: event.product_id || null,
        });
        console.log(`💳 Billing issue for user ${user.email}`);
        break;

      case "SUBSCRIBER_ALIAS":
        // Handle subscriber alias (user ID change)
        console.log(`🔗 Subscriber alias event for user ${user.email}`);
        break;

      case "TEST":
        // Test event from RevenueCat dashboard
        console.log(`🧪 Test event received for user ${user.email}`);
        await db.upsertSubscriptionByUserId({
          user_id: userId,
          revenuecat_user_id: event.app_user_id,
          status: "active",
          expires_at: event.expiration_at_ms
            ? new Date(event.expiration_at_ms).toISOString()
            : null,
          product_id: event.product_id || null,
        });
        console.log(`✅ Test subscription activated for user ${user.email}`);
        break;

      default:
        console.warn(`⚠️ Unknown event type: ${event.type}`);
    }

    // Invalidate subscription cache so next API call fetches fresh data
    invalidateSubscriptionCache(userId);

    // Return success response
    return c.json({ received: true });
  } catch (error) {
    console.error("❌ Error processing RevenueCat webhook:", error);
    return c.json({ error: "Webhook processing failed" }, 500);
  }
});

export default app;
