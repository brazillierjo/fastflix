/**
 * FastFlix Backend - RevenueCat Webhook Endpoint
 * Handles subscription events from RevenueCat
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { applyRateLimit } from '@/lib/api-helpers';
import { revenueCatWebhookSchema } from '@/lib/validation';
import { verifyRevenueCatSignature } from '@/lib/webhook-verification';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (IP only for webhooks)
    const rateLimitResponse = await applyRateLimit(request, 'webhook');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Get raw body for signature verification
    const rawBody = await request.text();

    // Verify webhook signature (if secret is configured)
    const signature = request.headers.get('X-Revenuecat-Signature');
    const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET;

    const isValidSignature = verifyRevenueCatSignature(rawBody, signature, webhookSecret);

    if (!isValidSignature) {
      console.error('❌ Invalid webhook signature - rejecting request');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse and validate webhook payload
    const payload = JSON.parse(rawBody);
    const validationResult = revenueCatWebhookSchema.safeParse(payload);

    if (!validationResult.success) {
      console.error('❌ Invalid webhook payload:', validationResult.error);
      return NextResponse.json(
        {
          error: 'Invalid payload',
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { event } = validationResult.data;

    console.log(
      `📬 RevenueCat webhook received: ${event.type} for ${event.app_user_id} (${event.environment})`
    );

    // Extract userId from app_user_id
    // After Phase 4, app_user_id will be the authenticated user's ID
    const userId = event.app_user_id;

    // Verify that the user exists in our database
    const user = await db.getUserById(userId);

    if (!user) {
      console.warn(`⚠️ User ${userId} not found in database - webhook event will be ignored`);
      // Return 200 to acknowledge receipt, but don't process
      return NextResponse.json({
        received: true,
        warning: 'User not found - event not processed',
      });
    }

    console.log(`👤 Processing webhook for user: ${user.email}`);

    // Handle different event types
    switch (event.type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'UNCANCELLATION':
      case 'NON_RENEWING_PURCHASE':
        // Activate subscription
        await db.upsertSubscriptionByUserId({
          user_id: userId,
          revenuecat_user_id: event.app_user_id,
          status: 'active',
          expires_at: event.expiration_at_ms
            ? new Date(event.expiration_at_ms).toISOString()
            : null,
          product_id: event.product_id || null,
        });
        console.log(`✅ Subscription activated for user ${user.email}`);
        break;

      case 'CANCELLATION':
        // Mark as cancelled but keep expiration date
        await db.upsertSubscriptionByUserId({
          user_id: userId,
          revenuecat_user_id: event.app_user_id,
          status: 'cancelled',
          expires_at: event.expiration_at_ms
            ? new Date(event.expiration_at_ms).toISOString()
            : null,
          product_id: event.product_id || null,
        });
        console.log(`⚠️ Subscription cancelled for user ${user.email}`);
        break;

      case 'EXPIRATION':
        // Mark as expired
        await db.upsertSubscriptionByUserId({
          user_id: userId,
          revenuecat_user_id: event.app_user_id,
          status: 'expired',
          expires_at: event.expiration_at_ms
            ? new Date(event.expiration_at_ms).toISOString()
            : null,
          product_id: event.product_id || null,
        });
        console.log(`❌ Subscription expired for user ${user.email}`);
        break;

      case 'PRODUCT_CHANGE':
        // Update product ID
        await db.upsertSubscriptionByUserId({
          user_id: userId,
          revenuecat_user_id: event.app_user_id,
          status: 'active',
          expires_at: event.expiration_at_ms
            ? new Date(event.expiration_at_ms).toISOString()
            : null,
          product_id: event.product_id || null,
        });
        console.log(`🔄 Product changed for user ${user.email}`);
        break;

      case 'BILLING_ISSUE':
        // Mark as billing issue
        await db.upsertSubscriptionByUserId({
          user_id: userId,
          revenuecat_user_id: event.app_user_id,
          status: 'billing_issue',
          expires_at: event.expiration_at_ms
            ? new Date(event.expiration_at_ms).toISOString()
            : null,
          product_id: event.product_id || null,
        });
        console.log(`💳 Billing issue for user ${user.email}`);
        break;

      case 'SUBSCRIBER_ALIAS':
        // Handle subscriber alias (user ID change)
        console.log(`🔗 Subscriber alias event for user ${user.email}`);
        break;

      case 'TEST':
        // Test event from RevenueCat dashboard
        console.log(`🧪 Test event received for user ${user.email}`);
        // Treat test events as INITIAL_PURCHASE for testing purposes
        await db.upsertSubscriptionByUserId({
          user_id: userId,
          revenuecat_user_id: event.app_user_id,
          status: 'active',
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

    // Return success response
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Error processing RevenueCat webhook:', error);
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
