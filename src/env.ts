import z from "zod";
import { config } from "dotenv";
import { existsSync } from "fs";

config({
  path: existsSync(".env") ? ".env" : ".env.development",
});

const envSchema = z.object({
  HLINK_TOKEN: z.string(),
  HLINK_URL: z.string(),
  PCU_CODE: z.string().length(5),
  HCODE: z.string().length(5),
  JHCIS_DB_SERVER: z.string(),
  JHCIS_DB_USER: z.string(),
  JHCIS_DB_PASSWORD: z.string(),
  JHCIS_DB_PORT: z.string(),
  JHCIS_DB: z.string(),
});

export const env = envSchema.safeParse(process.env);
