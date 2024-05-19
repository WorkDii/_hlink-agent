import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { env } from "./env";
import { startSync } from "./sync_visitdrug";

const app = new Hono();
app.get("/", (c) => {
  return c.json({ message: "Hello World 3" });
});

serve({
  fetch: app.fetch,
  port: 8989,
});
startSync();
