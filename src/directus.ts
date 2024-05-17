import { createDirectus, staticToken, rest } from "@directus/sdk";
import { env } from "./env";

export const directusClient = createDirectus(env.HLINK_URL)
  .with(staticToken(env.HLINK_TOKEN))
  .with(rest());
