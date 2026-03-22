import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./env.js";
import { requestId } from "./middleware/request-id.js";
import { errorHandler } from "./middleware/error-handler.js";
import authRouter from "./routes/auth.js";
import adminRouter from "./routes/admin.js";
import botRouter from "./routes/bot.js";
import scheduleRouter from "./routes/schedule.js";
import webhooksRouter from "./routes/webhooks.js";
import invoicesRouter from "./routes/invoices.js";
import requestsRouter from "./routes/requests.js";
import publicAuthRouter from "./routes/public-auth.js";
import { prisma } from "./db/prisma.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    update: { maxVolumeM3: 0.096 },
    create: { name: "Большая", maxVolumeM3: 0.096 },
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

  // Serve static assets
  app.use("/assets", express.static(path.join(__dirname, "../../assets")));

  app.use("/auth", authRouter);
  app.use("/public-auth", publicAuthRouter);
  app.use("/admin", adminRouter);
  app.use("/admin/invoices", invoicesRouter);
  app.use("/admin/requests", requestsRouter);
  app.use("/bot", botRouter);
  app.use("/schedule", scheduleRouter);
  app.use("/webhooks", webhooksRouter);

  app.use(errorHandler);

  return app;
}
