import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { config } from "dotenv";
import z from "zod";

const IS_PRODUCTION = process.env.NODE_ENV === "production";
config({
  path: IS_PRODUCTION ? ".env" : ".env.development",
});

const envSchema = z.object({
  HLINK_TOKEN: z.string(),
  HLINK_URL: z.string(),
  PCU_CODE: z.string().length(5),
  HCODE: z.string().length(5),
  JHCIS_SERVER: z.string(),
  JHCIS_USER: z.string(),
  JHCIS_PASSWORD: z.string(),
  JHCIS_DB: z.string(),
  JHCIS_PORT: z.string(),
});

const app = new Hono();
app.get("/", (c) => {
  const env = envSchema.safeParse(process.env);
  return c.json({ env });
});

serve({
  fetch: app.fetch,
  port: 8989,
});
