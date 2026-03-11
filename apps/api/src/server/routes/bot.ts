import { Router, type Request, type Response, type NextFunction } from "express";
import { prisma } from "../db/prisma.js";
import { ApiError } from "../errors.js";
import { notifyClient } from "../services/telegram-notifier.js";

const router = Router();

// GET /bot/box-types — list available box types
router.get("/box-types", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const types = await (prisma as any).boxType.findMany({
      orderBy: { maxVolumeM3: "asc" },
    });
    res.json(types);
  } catch (err) {
    next(err);
  }
});

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
      size,
      weight,
      boxCount,
      boxTypeId,
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

    const parsedBoxTypeId =
      boxTypeId !== undefined && boxTypeId !== null && boxTypeId !== "" ? Number(boxTypeId) : undefined;

    if (packagingType === "boxes") {
      if (parsedBoxTypeId === undefined || !Number.isFinite(parsedBoxTypeId)) {
        throw new ApiError(400, "boxTypeId is required for boxes");
      }
      const exists = await (prisma as any).boxType.findUnique({ where: { id: parsedBoxTypeId } });
      if (!exists) throw new ApiError(400, "Invalid boxTypeId");
    }

    const request = await prisma.shipmentRequest.create({
      data: {
        clientId: client.id,
        cityId: cityRecord.id,
        city,
        deliveryDate: new Date(deliveryDate),
        size: size ?? "-",
        boxCount: Number(boxCount),
        ...(parsedBoxTypeId !== undefined ? { boxTypeId: parsedBoxTypeId } : {}),
        packagingType,
        comment: comment || null,
        status: "new",
        ...(parsedWeight !== undefined ? { weight: parsedWeight } : {}),
      } as any,
    });

    // Create service lines from items
    const items = req.body.items as { description: string; unit: string; quantity: number; price: number; amount: number }[] | undefined;
    if (Array.isArray(items) && items.length > 0) {
      await (prisma as any).requestService.createMany({
        data: items.map((it: any) => ({
          requestId: request.id,
          description: String(it.description ?? ""),
          unit: String(it.unit ?? "шт"),
          quantity: Number(it.quantity) || 0,
          price: Number(it.price) || 0,
          amount: Number(it.amount) || 0,
        })),
      });
    }

    const full = await (prisma as any).shipmentRequest.findUnique({
      where: { id: request.id },
      include: { services: true },
    });

    // Send Telegram notification to client
    try {
      const schedule = await (prisma as any).deliverySchedule.findFirst({
        where: {
          cityId: cityRecord.id,
          deliveryDate: new Date(deliveryDate),
        },
      });

      const dateStr = new Date(deliveryDate).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      const pkgLabel = packagingType === "pallets" ? "палет" : "коробок";
      const itemLines = Array.isArray(items) && items.length > 0
        ? items.map((it: any) => `${it.description ?? ""} x${it.quantity}`).join("\n")
        : `${Number(boxCount)} ${pkgLabel}`;

      let msg = `<b>Заявка №${request.id} добавлена</b>\n\n`;
      msg += `<b>Доставка:</b> Белгород — ${cityRecord.fullName ?? city}\n`;
      msg += `${itemLines}\n`;
      msg += `<b>Дата доставки на склад:</b> ${dateStr}\n`;

      if (schedule?.acceptDays) {
        msg += `\nОбратите внимание, чтобы ваш товар успел попасть на отгрузку, важно сдать товар на наш склад в:\n\n`;
        msg += `<b>${schedule.acceptDays}</b>`;
      }

      await notifyClient(String(telegramId), msg);
    } catch (notifErr) {
      console.error("Failed to send request notification:", notifErr);
    }

    res.status(201).json(full);
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

// POST /bot/phone — save client phone number
router.post("/phone", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { telegramId, phone } = req.body;

    if (!telegramId) throw new ApiError(400, "Missing telegramId");
    if (!phone) throw new ApiError(400, "Missing phone");

    const client = await (prisma as any).client.update({
      where: { telegramId: String(telegramId) },
      data: { phone: String(phone) },
    });

    res.json({ phone: client.phone });
  } catch (err) {
    next(err);
  }
});

// POST /bot/link-inn — link client to counterparty by INN (create counterparty if not exists)
router.post("/link-inn", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { telegramId, inn } = req.body;

    if (!telegramId) throw new ApiError(400, "Missing telegramId");
    if (!inn || !/^\d{10}$|^\d{12}$/.test(String(inn))) {
      throw new ApiError(400, "Invalid INN (must be 10 or 12 digits)");
    }

    const client = await prisma.client.findUnique({
      where: { telegramId: String(telegramId) },
    });
    if (!client) throw new ApiError(404, "Client not found");

    // Upsert counterparty by INN
    let counterparty = await (prisma as any).counterparty.findUnique({
      where: { inn: String(inn) },
    });

    if (!counterparty) {
      counterparty = await (prisma as any).counterparty.create({
        data: {
          name: `Организация ${inn}`,
          inn: String(inn),
        },
      });
    }

    // Create link if not exists
    const existingLink = await (prisma as any).counterpartyContact.findUnique({
      where: {
        counterpartyId_clientId: {
          counterpartyId: counterparty.id,
          clientId: client.id,
        },
      },
    });

    if (!existingLink) {
      await (prisma as any).counterpartyContact.create({
        data: {
          counterpartyId: counterparty.id,
          clientId: client.id,
        },
      });
    }

    res.json({
      counterpartyId: counterparty.id,
      name: counterparty.name,
      inn: counterparty.inn,
    });
  } catch (err) {
    next(err);
  }
});

// GET /bot/cities — list available cities/directions
router.get("/cities", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cities = await (prisma as any).city.findMany({ orderBy: { shortName: "asc" } });
    res.json(cities);
  } catch (err) {
    next(err);
  }
});

// GET /bot/pallet-types — list available pallet types
router.get("/pallet-types", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const types = await (prisma as any).palletType.findMany({ orderBy: { minValue: "asc" } });
    res.json(types);
  } catch (err) {
    next(err);
  }
});

// GET /bot/rates?cityId=N — price rates for a city
router.get("/rates", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cityId = Number(req.query.cityId);
    if (!Number.isFinite(cityId)) throw new ApiError(400, "cityId is required");

    const rates = await (prisma as any).priceRate.findMany({
      where: { cityId },
      include: { boxType: true, palletType: true },
      orderBy: [{ unit: "asc" }],
    });
    res.json(rates);
  } catch (err) {
    next(err);
  }
});

// GET /bot/schedule?cityId=N — delivery dates for a city
router.get("/schedule", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cityId = Number(req.query.cityId);
    if (!Number.isFinite(cityId)) throw new ApiError(400, "cityId is required");

    const schedules = await (prisma as any).deliverySchedule.findMany({
      where: { cityId, deliveryDate: { gte: new Date() } },
      orderBy: { deliveryDate: "asc" },
    });
    res.json(schedules);
  } catch (err) {
    next(err);
  }
});

export default router;
