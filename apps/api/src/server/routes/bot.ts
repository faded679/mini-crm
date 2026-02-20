import { Router, type Request, type Response, type NextFunction } from "express";
import { prisma } from "../db/prisma.js";
import { ApiError } from "../errors.js";

const router = Router();

// POST /bot/requests — create a shipment request
router.post("/requests", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      telegramId,
      username,
      firstName,
      lastName,
      city,
      deliveryDate,
      volume,
      size,
      weight,
      boxCount,
      packagingType,
      comment,
    } = req.body;

    if (!telegramId || !city || !deliveryDate || !boxCount || !packagingType) {
      throw new ApiError(400, "Missing required fields");
    }

    if (packagingType !== "pallets" && packagingType !== "boxes") {
      throw new ApiError(400, "Invalid packagingType");
    }

    const client = await prisma.client.upsert({
      where: { telegramId: String(telegramId) },
      update: { username, firstName, lastName },
      create: { telegramId: String(telegramId), username, firstName, lastName },
    });

    const cityRecord = await (prisma as any).city.findUnique({ where: { shortName: city } });
    if (!cityRecord) throw new ApiError(400, `City not found: ${city}`);

    const parsedWeight =
      weight !== undefined && weight !== null && weight !== "" ? Number(weight) : undefined;
    if (parsedWeight !== undefined && (!Number.isFinite(parsedWeight) || parsedWeight <= 0)) {
      throw new ApiError(400, "Invalid weight");
    }

    const request = await prisma.shipmentRequest.create({
      data: {
        clientId: client.id,
        cityId: cityRecord.id,
        city,
        deliveryDate: new Date(deliveryDate),
        volume: volume !== undefined ? Number(volume) : null,
        size: size ?? "-",
        boxCount: Number(boxCount),
        packagingType,
        comment: comment || null,
        status: "new",
        ...(parsedWeight !== undefined ? { weight: parsedWeight } : {}),
      } as any,
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

// GET /bot/consent/:telegramId — check consent status
router.get("/consent/:telegramId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { telegramId } = req.params;

    const client = await prisma.client.findUnique({
      where: { telegramId },
      select: { consentGiven: true, consentAt: true },
    });

    if (!client) {
      res.json({ consentGiven: false });
      return;
    }

    res.json({ consentGiven: client.consentGiven, consentAt: client.consentAt });
  } catch (err) {
    next(err);
  }
});

// POST /bot/consent — accept consent
router.post("/consent", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { telegramId, username, firstName, lastName } = req.body;

    if (!telegramId) {
      throw new ApiError(400, "Missing telegramId");
    }

    const client = await prisma.client.upsert({
      where: { telegramId: String(telegramId) },
      update: { username, firstName, lastName, consentGiven: true, consentAt: new Date() },
      create: {
        telegramId: String(telegramId),
        username,
        firstName,
        lastName,
        consentGiven: true,
        consentAt: new Date(),
      },
    });

    res.json({ consentGiven: client.consentGiven, consentAt: client.consentAt });
  } catch (err) {
    next(err);
  }
});

export default router;
