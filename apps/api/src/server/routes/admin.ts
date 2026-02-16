import { Router } from "express";
import { z } from "zod";

import { requireManagerAuth } from "../auth/middleware.js";
import { prisma } from "../db/prisma.js";
import { ApiError } from "../errors.js";
import { telegramNotifier } from "../services/telegram-notifier.js";

export const adminRouter = Router();

adminRouter.use(requireManagerAuth);

adminRouter.get("/requests", async (req, res) => {
  const status = req.query.status as string | undefined;

  const where = status
    ? {
        status: status as any,
      }
    : undefined;

  const requests = await prisma.shipmentRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      client: true,
    },
  });

  res.json({ data: requests });
});

adminRouter.get("/requests/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const request = await prisma.shipmentRequest.findUnique({
      where: { id },
      include: { client: true, history: { orderBy: { changedAt: "desc" } } },
    });

    if (!request) {
      throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Request not found" });
    }

    res.json({ data: request });
  } catch (e) {
    next(e);
  }
});

const patchStatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "DONE"]),
});

adminRouter.patch("/requests/:id/status", async (req, res, next) => {
  try {
    const id = req.params.id;
    const body = patchStatusSchema.parse(req.body);

    const existing = await prisma.shipmentRequest.findUnique({ where: { id }, include: { client: true } });
    if (!existing) {
      throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Request not found" });
    }

    if (existing.status === body.status) {
      res.json({ data: existing });
      return;
    }

    const updated = await prisma.shipmentRequest.update({
      where: { id },
      data: {
        status: body.status as any,
        assignedManagerId: body.status === "IN_PROGRESS" ? (req as any).manager.sub : existing.assignedManagerId,
        history: {
          create: {
            oldStatus: existing.status,
            newStatus: body.status as any,
            changedByManagerId: (req as any).manager.sub,
          },
        },
      },
      include: { client: true },
    });

    await telegramNotifier.notifyStatusChanged({
      telegramId: updated.client.telegramId,
      requestId: updated.id,
      newStatus: updated.status,
    });

    res.json({ data: updated });
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/clients", async (_req, res) => {
  const clients = await prisma.client.findMany({
    orderBy: { registeredAt: "desc" },
    include: {
      _count: {
        select: { requests: true },
      },
    },
  });

  res.json({
    data: clients.map((c) => ({
      id: c.id,
      telegramId: c.telegramId,
      telegramUsername: c.telegramUsername,
      registeredAt: c.registeredAt,
      requestsCount: c._count.requests,
    })),
  });
});
