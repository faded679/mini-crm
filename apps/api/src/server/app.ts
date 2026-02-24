import express from "express";
import cors from "cors";
import { env } from "./env.js";
import { requestId } from "./middleware/request-id.js";
import { errorHandler } from "./middleware/error-handler.js";
import authRouter from "./routes/auth.js";
import adminRouter from "./routes/admin.js";
import botRouter from "./routes/bot.js";
import scheduleRouter from "./routes/schedule.js";
import { prisma } from "./db/prisma.js";

async function seedBoxTypes() {
  await (prisma as any).boxType.upsert({
    where: { name: "Маленькая" },
    update: { maxVolumeM3: 0.032 },
    create: { name: "Маленькая", maxVolumeM3: 0.032 },
  });
  await (prisma as any).boxType.upsert({
    where: { name: "Средняя" },
    update: { maxVolumeM3: 0.064 },
    create: { name: "Средняя", maxVolumeM3: 0.064 },
  });
  await (prisma as any).boxType.upsert({
    where: { name: "Большая" },
    update: { maxVolumeM3: 999999 },
    create: { name: "Большая", maxVolumeM3: 999999 },
  });
}

export function createApp() {
  const app = express();

  void seedBoxTypes();

  app.use(cors({ origin: env.CORS_ORIGINS.split(",") }));
  app.use(express.json());
  app.use(requestId);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/auth", authRouter);
  app.use("/admin", adminRouter);
  app.use("/bot", botRouter);
  app.use("/schedule", scheduleRouter);

  app.use(errorHandler);

  return app;
}
