/**
 * RevenueCat Webhook Verification
 * Verifies webhook signatures to ensure requests are from RevenueCat
 */

import crypto from 'crypto';

/**
 * Verify RevenueCat webhook signature
 *
 * @param payload - The raw request body as a string
 * @param signature - The X-Revenuecat-Signature header value
 * @param secret - Your RevenueCat webhook secret (optional)
 * @returns true if signature is valid, false otherwise
 *
 * Note: Signature verification is optional but recommended for production.
 * Configure your webhook secret in RevenueCat dashboard > Integrations > Webhooks
 */
export function verifyRevenueCatSignature(
  payload: string,
  signature: string | null,
  secret?: string
): boolean {
  // If no secret is configured, skip verification (development mode)
  if (!secret) {
    console.warn('⚠️ RevenueCat webhook secret not configured - skipping signature verification');
    return true;
  }

  // If no signature provided, reject
  if (!signature) {
    console.error('❌ No signature provided in X-Revenuecat-Signature header');
    return false;
  }

  try {
    // Compute HMAC-SHA256 of the payload
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const computedSignature = hmac.digest('hex');

    // Compare signatures (timing-safe comparison)
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature)
    );

    if (!isValid) {
      console.error('❌ Invalid RevenueCat webhook signature');
    }

    return isValid;
  } catch (error) {
    console.error('❌ Error verifying webhook signature:', error);
    return false;
  }
}
