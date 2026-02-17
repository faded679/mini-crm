import { Router, type Request, type Response, type NextFunction } from "express";
import { prisma } from "../db/prisma.js";
import { ApiError } from "../errors.js";

const router = Router();

// POST /bot/requests — create a shipment request
router.post("/requests", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { telegramId, username, firstName, lastName, city, deliveryDate, size, weight, boxCount, comment } = req.body;

    if (!telegramId || !city || !deliveryDate || !size || !weight || !boxCount) {
      throw new ApiError(400, "Missing required fields");
    }

    const client = await prisma.client.upsert({
      where: { telegramId: String(telegramId) },
      update: { username, firstName, lastName },
      create: { telegramId: String(telegramId), username, firstName, lastName },
    });

    const request = await prisma.shipmentRequest.create({
      data: {
        clientId: client.id,
        city,
        deliveryDate: new Date(deliveryDate),
        size,
        weight: Number(weight),
        boxCount: Number(boxCount),
        comment: comment || null,
      },
    });

    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
});

// GET /bot/requests/:telegramId — list client's requests
router.get("/requests/:telegramId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { telegramId } = req.params;

    const client = await prisma.client.findUnique({
      where: { telegramId },
    });

    if (!client) {
      res.json([]);
      return;
    }

    const requests = await prisma.shipmentRequest.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: "desc" },
    });

    res.json(requests);
  } catch (err) {
    next(err);
  }
});

export default router;
