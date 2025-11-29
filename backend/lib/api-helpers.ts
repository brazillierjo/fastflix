/**
 * FastFlix Backend - API Helpers
 * Utility functions for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter, RATE_LIMITS } from './rate-limiter';

/**
 * Extract client IP from request
 */
export function getClientIP(request: NextRequest): string {
  // Try various headers for IP (Vercel, Cloudflare, etc.)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwardedFor) return forwardedFor.split(',')[0].trim();

  return 'unknown';
}

/**
 * Apply rate limiting to a request
 * @param request - Next.js request object
 * @param endpoint - Endpoint name (search, checkLimit, webhook)
 * @param deviceId - Optional device ID for per-device limiting
 * @returns Response with 429 status if rate limited, null otherwise
 */
export async function applyRateLimit(
  request: NextRequest,
  endpoint: 'search' | 'checkLimit' | 'webhook',
  deviceId?: string
): Promise<NextResponse | null> {
  const ip = getClientIP(request);

  // Check IP-based rate limit
  const ipLimit = RATE_LIMITS.perIP[endpoint];
  const ipKey = `ip:${endpoint}:${ip}`;
  const ipAllowed = await rateLimiter.checkLimit(ipKey, ipLimit.maxRequests, ipLimit.windowMs);

  if (!ipAllowed) {
    const resetTime = await rateLimiter.getResetTime(ipKey);
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        reason: 'Too many requests from your IP address',
        retryAfter: resetTime,
      },
      {
        status: 429,
        headers: {
          'Retry-After': resetTime.toString(),
          'X-RateLimit-Limit': ipLimit.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toString(),
        },
      }
    );
  }

  // Check device-based rate limit (if applicable and deviceId provided)
  if (deviceId && (endpoint === 'search' || endpoint === 'checkLimit')) {
    const deviceLimit = RATE_LIMITS.perDevice[endpoint];
    const deviceKey = `device:${endpoint}:${deviceId}`;
    const deviceAllowed = await rateLimiter.checkLimit(
      deviceKey,
      deviceLimit.maxRequests,
      deviceLimit.windowMs
    );

    if (!deviceAllowed) {
      const resetTime = await rateLimiter.getResetTime(deviceKey);
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          reason: 'Too many requests from your device',
          retryAfter: resetTime,
        },
        {
          status: 429,
          headers: {
            'Retry-After': resetTime.toString(),
            'X-RateLimit-Limit': deviceLimit.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetTime.toString(),
          },
        }
      );
    }
  }

  // Not rate limited
  return null;
}
