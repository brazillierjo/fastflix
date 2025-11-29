/**
 * FastFlix Backend - Validation Schemas
 * Zod schemas for API request validation
 */

import { z } from 'zod';

/**
 * Search request schema
 * Note: deviceId is now optional since authentication is required
 */
export const searchRequestSchema = z.object({
  deviceId: z.string().min(1).max(255).optional(), // Kept for backward compatibility
  query: z.string().min(1, 'Query is required').max(500),
  includeMovies: z.boolean().default(true),
  includeTvShows: z.boolean().default(true),
  platform: z.enum(['ios', 'android']).optional(), // Optional with auth
  appVersion: z.string().min(1).max(50).optional(), // Optional with auth
  language: z.string().optional().default('fr-FR'),
  country: z.string().optional().default('FR'),
});

/**
 * RevenueCat webhook event types
 */
const revenueCatEventTypes = z.enum([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'CANCELLATION',
  'EXPIRATION',
  'PRODUCT_CHANGE',
  'UNCANCELLATION',
  'NON_RENEWING_PURCHASE',
  'BILLING_ISSUE',
  'SUBSCRIBER_ALIAS',
  'TEST',
]);

/**
 * RevenueCat webhook schema
 */
export const revenueCatWebhookSchema = z.object({
  event: z.object({
    type: revenueCatEventTypes,
    app_user_id: z.string().min(1, 'App User ID is required'),
    product_id: z.string().optional(),
    expiration_at_ms: z.number().optional(),
    presented_offering_id: z.string().optional(),
    environment: z.enum(['PRODUCTION', 'SANDBOX']),
  }),
});
