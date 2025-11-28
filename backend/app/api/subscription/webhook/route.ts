/**
 * FastFlix Backend - RevenueCat Webhook Endpoint
 * Handles subscription events from RevenueCat
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { applyRateLimit } from '@/lib/api-helpers';

/**
 * RevenueCat webhook event types
 */
type RevenueCatEventType =
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'CANCELLATION'
  | 'EXPIRATION'
  | 'PRODUCT_CHANGE'
  | 'UNCANCELLATION'
  | 'NON_RENEWING_PURCHASE'
  | 'BILLING_ISSUE'
  | 'SUBSCRIBER_ALIAS';

interface RevenueCatWebhookEvent {
  type: RevenueCatEventType;
  app_user_id: string;
  product_id?: string;
  expiration_at_ms?: number;
  presented_offering_id?: string;
  environment: 'PRODUCTION' | 'SANDBOX';
}

interface RevenueCatWebhookPayload {
  event: RevenueCatWebhookEvent;
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (IP only for webhooks)
    const rateLimitResponse = await applyRateLimit(request, 'webhook');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Parse webhook payload
    const payload: RevenueCatWebhookPayload = await request.json();
    const { event } = payload;

    console.log(`📬 RevenueCat webhook received: ${event.type} for ${event.app_user_id}`);

    // Extract device ID from app_user_id
    // Assuming app_user_id is the device_id (adjust based on your implementation)
    const deviceId = event.app_user_id;

    // Handle different event types
    switch (event.type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'UNCANCELLATION':
      case 'NON_RENEWING_PURCHASE':
        // Activate subscription
        await db.upsertSubscription({
          device_id: deviceId,
          revenuecat_user_id: event.app_user_id,
          status: 'active',
          expires_at: event.expiration_at_ms
            ? new Date(event.expiration_at_ms).toISOString()
            : null,
          product_id: event.product_id || null,
        });
        console.log(`✅ Subscription activated for ${deviceId}`);
        break;

      case 'CANCELLATION':
        // Mark as cancelled but keep expiration date
        await db.upsertSubscription({
          device_id: deviceId,
          revenuecat_user_id: event.app_user_id,
          status: 'cancelled',
          expires_at: event.expiration_at_ms
            ? new Date(event.expiration_at_ms).toISOString()
            : null,
          product_id: event.product_id || null,
        });
        console.log(`⚠️ Subscription cancelled for ${deviceId}`);
        break;

      case 'EXPIRATION':
        // Mark as expired
        await db.upsertSubscription({
          device_id: deviceId,
          revenuecat_user_id: event.app_user_id,
          status: 'expired',
          expires_at: event.expiration_at_ms
            ? new Date(event.expiration_at_ms).toISOString()
            : null,
          product_id: event.product_id || null,
        });
        console.log(`❌ Subscription expired for ${deviceId}`);
        break;

      case 'PRODUCT_CHANGE':
        // Update product ID
        await db.upsertSubscription({
          device_id: deviceId,
          revenuecat_user_id: event.app_user_id,
          status: 'active',
          expires_at: event.expiration_at_ms
            ? new Date(event.expiration_at_ms).toISOString()
            : null,
          product_id: event.product_id || null,
        });
        console.log(`🔄 Product changed for ${deviceId}`);
        break;

      case 'BILLING_ISSUE':
        // Mark as billing issue
        await db.upsertSubscription({
          device_id: deviceId,
          revenuecat_user_id: event.app_user_id,
          status: 'billing_issue',
          expires_at: event.expiration_at_ms
            ? new Date(event.expiration_at_ms).toISOString()
            : null,
          product_id: event.product_id || null,
        });
        console.log(`💳 Billing issue for ${deviceId}`);
        break;

      case 'SUBSCRIBER_ALIAS':
        // Handle subscriber alias (user ID change)
        console.log(`🔗 Subscriber alias event for ${deviceId}`);
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
