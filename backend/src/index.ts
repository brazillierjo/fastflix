import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });
config({ path: ".env" });

import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { initSentry, sentryMiddleware, captureException } from "./lib/sentry.js";

// Import routes
import healthRoute from "./routes/health.js";
import authRoute from "./routes/auth.js";
import searchRoute from "./routes/search.js";
import watchlistRoute from "./routes/watchlist.js";
import userRoute from "./routes/user.js";
import discoveryRoute from "./routes/discovery.js";
import detailsRoute from "./routes/details.js";
import providersRoute from "./routes/providers.js";
import webhookRoute from "./routes/webhook.js";
import quotasRoute from "./routes/quotas.js";
import searchHistoryRoute from "./routes/search-history.js";
import notificationsRoute from "./routes/notifications.js";

// Initialize Sentry
initSentry();

const app = new Hono();

// ===========================================
// GLOBAL MIDDLEWARE
// ===========================================
app.use("*", sentryMiddleware);
app.use("*", logger());
app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: (origin) => {
      // Allow localhost in development
      if (
        origin?.includes("localhost") ||
        origin?.includes("127.0.0.1") ||
        origin?.startsWith("http://10.") ||
        origin?.startsWith("http://192.168.")
      ) {
        return origin;
      }
      // Allow all origins for mobile app (no CORS issues from native apps)
      return origin || "*";
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// ===========================================
// PUBLIC ROUTES (no auth required)
// ===========================================
app.route("/api/health", healthRoute);

// ===========================================
// AUTH ROUTES
// ===========================================
app.route("/api/auth", authRoute);

// ===========================================
// SEARCH ROUTES
// ===========================================
app.route("/api/search", searchRoute);
app.route("/api/search/history", searchHistoryRoute);

// ===========================================
// DISCOVERY ROUTES
// ===========================================
app.route("/api", discoveryRoute);

// ===========================================
// DETAILS ROUTES
// ===========================================
app.route("/api", detailsRoute);

// ===========================================
// WATCHLIST ROUTES
// ===========================================
app.route("/api/watchlist", watchlistRoute);

// ===========================================
// USER ROUTES
// ===========================================
app.route("/api/user", userRoute);

// ===========================================
// PROVIDERS ROUTES
// ===========================================
app.route("/api/providers", providersRoute);

// ===========================================
// WEBHOOK ROUTES
// ===========================================
app.route("/api/subscription/webhook", webhookRoute);

// ===========================================
// QUOTAS ROUTES
// ===========================================
app.route("/api/quotas", quotasRoute);

// ===========================================
// NOTIFICATIONS ROUTES
// ===========================================
app.route("/api/notifications", notificationsRoute);

// ===========================================
// ERROR HANDLING
// ===========================================
app.notFound((c) => {
  return c.json({ error: "Not Found" }, 404);
});

app.onError((err, c) => {
  captureException(err instanceof Error ? err : new Error(String(err)), {
    url: c.req.url,
    method: c.req.method,
  });
  return c.json({ error: "Internal Server Error" }, 500);
});

// ===========================================
// SERVER STARTUP
// ===========================================
const port = parseInt(process.env.PORT || "3002", 10);

console.log(`Starting FastFlix API on port ${port}...`);

const server = serve({
  fetch: app.fetch,
  port,
});

// Graceful shutdown
process.on("SIGTERM", () => {
  server.close();
  process.exit(0);
});
process.on("SIGINT", () => {
  server.close();
  process.exit(0);
});

console.log(`FastFlix API running at http://localhost:${port}`);

export default app;
