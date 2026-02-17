import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("1d"),
  TELEGRAM_BOT_TOKEN: z.string().default(""),
  CORS_ORIGINS: z.string().default("http://localhost:5173"),
  PORT: z.coerce.number().default(3000),
});

export const env = envSchema.parse(process.env);
