import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { startSync } from "./visitdrug/sync";

const app = new Hono();
app.get("/", (c) => {
  return c.json({ message: "Hello World 10" });
});

serve({
  fetch: app.fetch,
  port: 8989,
});

startSync();
