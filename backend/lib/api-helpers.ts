/**
 * FastFlix Backend - API Helpers
 * Utility functions for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter, RATE_LIMITS } from './rate-limiter';
import { isProductionEnv } from './env';

/**
 * Security headers for all API responses
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
} as const;

/**
 * Create a JSON response with security headers
 */
export function jsonResponse<T>(
  data: T,
  options: { status?: number; headers?: Record<string, string> } = {}
): NextResponse<T> {
  const { status = 200, headers = {} } = options;
  return NextResponse.json(data, {
    status,
    headers: {
      ...SECURITY_HEADERS,
      ...headers,
    },
  });
}

/**
 * Create an error response with sanitized message
 * In production, detailed error messages are hidden from clients
 */
export function errorResponse(
  message: string,
  options: {
    status?: number;
    publicMessage?: string;
    headers?: Record<string, string>;
  } = {}
): NextResponse {
  const { status = 500, publicMessage, headers = {} } = options;

  // Log the full error for debugging (server-side only)
  if (status >= 500) {
    console.error(`[API Error ${status}] ${message}`);
  }

  // In production, use a generic message unless a public one is provided
  const clientMessage = isProductionEnv()
    ? publicMessage || getGenericErrorMessage(status)
    : message;

  return NextResponse.json(
    { error: clientMessage },
    {
      status,
      headers: {
        ...SECURITY_HEADERS,
        ...headers,
      },
    }
  );
}

/**
 * Get a generic error message based on status code
 */
function getGenericErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Invalid request';
    case 401:
      return 'Authentication required';
    case 403:
      return 'Access denied';
    case 404:
      return 'Not found';
    case 429:
      return 'Too many requests';
    case 500:
    default:
      return 'An unexpected error occurred';
  }
}

/**
 * Mask sensitive data for logging
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***@***';
  const maskedLocal = local.length > 2 ? `${local[0]}***${local[local.length - 1]}` : '***';
  return `${maskedLocal}@${domain}`;
}

/**
 * Mask user ID for logging
 */
export function maskUserId(id: string): string {
  if (id.length <= 8) return '***';
  return `${id.slice(0, 4)}...${id.slice(-4)}`;
}

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
        retryAfter: resetTime,
      },
      {
        status: 429,
        headers: {
          ...SECURITY_HEADERS,
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
          retryAfter: resetTime,
        },
        {
          status: 429,
          headers: {
            ...SECURITY_HEADERS,
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
