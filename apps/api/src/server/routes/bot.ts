import { Router } from "express";
import { z } from "zod";

import { prisma } from "../db/prisma.js";

export const botRouter = Router();

const createRequestSchema = z.object({
  telegramId: z.union([z.string(), z.number(), z.bigint()]).transform((v) => BigInt(v)),
  telegramUsername: z.string().optional(),
  destinationCity: z.string().min(1),
  deliveryDate: z.string().min(1),
  cargoSize: z.string().min(1),
  cargoWeightKg: z.number().positive(),
  boxesCount: z.number().int().positive(),
  comment: z.string().optional().nullable(),
});

botRouter.post("/requests", async (req, res, next) => {
  try {
    const body = createRequestSchema.parse(req.body);

    const client = await prisma.client.upsert({
      where: { telegramId: body.telegramId },
      update: {
        telegramUsername: body.telegramUsername,
      },
      create: {
        telegramId: body.telegramId,
        telegramUsername: body.telegramUsername,
      },
    });

    const request = await prisma.shipmentRequest.create({
      data: {
        clientId: client.id,
        destinationCity: body.destinationCity,
        deliveryDate: new Date(body.deliveryDate),
        cargoSize: body.cargoSize,
        cargoWeightKg: body.cargoWeightKg as any,
        boxesCount: body.boxesCount,
        comment: body.comment ?? null,
      },
    });

    res.json({ data: request });
  } catch (e) {
    next(e);
  }
});

botRouter.get("/requests", async (req, res, next) => {
  try {
    const telegramId = BigInt(req.query.telegramId as string);

    const client = await prisma.client.findUnique({ where: { telegramId } });
    if (!client) {
      res.json({ data: [] });
      return;
    }

    const requests = await prisma.shipmentRequest.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: "desc" },
    });

    res.json({ data: requests });
  } catch (e) {
    next(e);
  }
});
