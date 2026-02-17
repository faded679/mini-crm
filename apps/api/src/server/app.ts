import express from "express";
import cors from "cors";
import { env } from "./env.js";
import { requestId } from "./middleware/request-id.js";
import { errorHandler } from "./middleware/error-handler.js";
import authRouter from "./routes/auth.js";
import adminRouter from "./routes/admin.js";
import botRouter from "./routes/bot.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.CORS_ORIGINS.split(",") }));
  app.use(express.json());
  app.use(requestId);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/auth", authRouter);
  app.use("/admin", adminRouter);
  app.use("/bot", botRouter);

  app.use(errorHandler);

  return app;
}
