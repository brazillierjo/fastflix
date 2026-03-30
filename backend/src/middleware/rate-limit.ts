import type { Context, Next } from "hono";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
if (process.env.NODE_ENV !== "test") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetTime < now) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
}

export function checkRateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || entry.resetTime < now) {
    store.set(identifier, { count: 1, resetTime: now + config.windowMs });
    return { success: true, remaining: config.maxRequests - 1, resetTime: now + config.windowMs };
  }

  entry.count++;

  if (entry.count > config.maxRequests) {
    return { success: false, remaining: 0, resetTime: entry.resetTime };
  }

  return { success: true, remaining: config.maxRequests - entry.count, resetTime: entry.resetTime };
}

export function getRateLimitIdentifier(c: Context, userId?: string): string {
  if (userId) return `user:${userId}`;
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0].trim();
    if (ip && ip !== "unknown") return `ip:${ip}`;
  }
  const realIp = c.req.header("x-real-ip");
  if (realIp && realIp !== "unknown") return `ip:${realIp}`;
  return "anonymous";
}

export const RATE_LIMITS = {
  ai: { windowMs: 60 * 1000, maxRequests: 20 },
  standard: { windowMs: 60 * 1000, maxRequests: 60 },
  readonly: { windowMs: 60 * 1000, maxRequests: 120 },
  anonymous: { windowMs: 60 * 1000, maxRequests: 10 },
  webhook: { windowMs: 60 * 1000, maxRequests: 100 },
  premium: { windowMs: 60 * 1000, maxRequests: 60 },
  free: { windowMs: 60 * 1000, maxRequests: 10 },
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

/**
 * Rate limit middleware factory
 */
export function rateLimitMiddleware(type: RateLimitType = "standard") {
  return async (c: Context, next: Next) => {
    const userId = c.get("userId") as string | undefined;
    const identifier = getRateLimitIdentifier(c, userId);
    const result = checkRateLimit(identifier, RATE_LIMITS[type]);

    c.header("X-RateLimit-Remaining", result.remaining.toString());
    c.header("X-RateLimit-Reset", Math.ceil(result.resetTime / 1000).toString());

    if (!result.success) {
      c.header("Retry-After", Math.ceil((result.resetTime - Date.now()) / 1000).toString());
      return c.json({ error: "Too many requests. Please try again later." }, 429);
    }

    await next();
  };
}

export function clearRateLimitStore(): void {
  store.clear();
}
