import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "FastFlix API (Hono)",
    version: "1.0.0",
  });
});

export default app;
