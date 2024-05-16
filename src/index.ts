import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { env } from "./env";

const app = new Hono();
app.get("/", (c) => {
  return c.json({ env });
});

serve({
  fetch: app.fetch,
  port: 8989,
});
