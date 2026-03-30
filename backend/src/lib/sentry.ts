/**
 * Sentry Error Monitoring Integration for Hono
 */

import * as Sentry from "@sentry/node";
import { createMiddleware } from "hono/factory";
import type { Context, Next } from "hono";

/**
 * Initialize Sentry with configuration from environment
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    console.log("[sentry] DSN not configured, error tracking disabled");
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    beforeSend(event) {
      const status = event.extra?.statusCode as number | undefined;
      if (status && status < 500 && status !== 429) {
        return null;
      }
      return event;
    },
  });

  console.log("[sentry] Initialized for error tracking");
}

/**
 * Sentry middleware for Hono — captures errors and sends them to Sentry
 */
export const sentryMiddleware = createMiddleware(async (c: Context, next: Next) => {
  try {
    await next();
  } catch (err) {
    Sentry.withScope((scope) => {
      scope.setTag("url", c.req.url);
      scope.setTag("method", c.req.method);
      scope.setExtra("headers", Object.fromEntries(c.req.raw.headers.entries()));

      try {
        const user = c.get("user") as { id: string; email: string } | undefined;
        if (user) {
          scope.setUser({ id: user.id, email: user.email });
        }
      } catch {
        // No user context available
      }

      Sentry.captureException(err);
    });

    throw err;
  }
});

/**
 * Manually capture an exception
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureException(error);
  });
}

/**
 * Manually capture a message
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = "info"): void {
  Sentry.captureMessage(message, level);
}
