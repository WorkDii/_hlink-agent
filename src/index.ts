import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { startSync } from "./sync_visitdrug";
import { startUpdateAdapter } from "./updateAdapter";

const app = new Hono();
app.get("/", (c) => {
  return c.json({ message: "Hello World 4" });
});

serve({
  fetch: app.fetch,
  port: 8989,
});

startSync();
startUpdateAdapter();
