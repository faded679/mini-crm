import express from "express";

import { requestIdMiddleware } from "./middleware/request-id.js";
import { errorHandler } from "./middleware/error-handler.js";
import { prisma } from "./db/prisma.js";
import { authRouter } from "./routes/auth.js";
import { adminRouter } from "./routes/admin.js";
import { botRouter } from "./routes/bot.js";

export async function createApp() {
  const router = express.Router();

  router.use(requestIdMiddleware);

  router.get("/health", async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  });

  router.use("/auth", authRouter);
  router.use("/admin", adminRouter);
  router.use("/bot", botRouter);

  router.use(errorHandler);

  return router;
}
