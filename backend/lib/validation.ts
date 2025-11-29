/**
 * FastFlix Backend - Validation Schemas
 * Zod schemas for API request validation
 */

import { z } from 'zod';

/**
 * Device ID validation schema
 */
export const deviceIdSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required').max(255),
});

/**
 * Check limit request schema
 */
export const checkLimitSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required').max(255),
});

/**
 * Search request schema
 */
export const searchRequestSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required').max(255),
  query: z.string().min(1, 'Query is required').max(500),
  includeMovies: z.boolean().default(true),
  includeTvShows: z.boolean().default(true),
  platform: z.enum(['ios', 'android']),
  appVersion: z.string().min(1).max(50),
  language: z.string().optional().default('fr-FR'),
  country: z.string().optional().default('FR'),
  isProUser: z.boolean().optional(), // Subscription status from frontend (temporary)
});

/**
 * RevenueCat webhook schema (simplified - adjust based on actual webhook payload)
 */
export const revenueCatWebhookSchema = z.object({
  event: z.object({
    type: z.string(),
    app_user_id: z.string(),
    product_id: z.string().optional(),
    expiration_at_ms: z.number().optional(),
  }),
});
