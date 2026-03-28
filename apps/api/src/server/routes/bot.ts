import { Router, type Request, type Response, type NextFunction } from "express";
import { prisma } from "../db/prisma.js";
import { ApiError } from "../errors.js";
import { notifyClient } from "../services/telegram-notifier.js";

function pluralPallet(n: number): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return "палет";
  if (last === 1) return "палета";
  if (last >= 2 && last <= 4) return "палеты";
  return "палет";
}

function pluralBox(n: number): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return "коробок";
  if (last === 1) return "коробка";
  if (last >= 2 && last <= 4) return "коробки";
  return "коробок";
}

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
      deliveryTypeId,
      mpAccountDate,
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

    const isFbs = deliveryTypeId !== undefined && Number(deliveryTypeId) === 1;
    let cityRecord;
    if (isFbs) {
      // Try cities_fbs first for FBS
      cityRecord = await (prisma as any).cityFbs.findUnique({ where: { shortName: city } });
      // If not found in cities_fbs, fallback to cities
      if (!cityRecord) {
        cityRecord = await (prisma as any).city.findUnique({ where: { shortName: city } });
      }
    } else {
      cityRecord = await (prisma as any).city.findUnique({ where: { shortName: city } });
    }
    if (!cityRecord) throw new ApiError(400, `City not found: ${city}`);

    const parsedWeight =
      weight !== undefined && weight !== null && weight !== "" ? Number(weight) : undefined;
    if (parsedWeight !== undefined && (!Number.isFinite(parsedWeight) || parsedWeight <= 0)) {
      throw new ApiError(400, "Invalid weight");
    }

    const parsedBoxTypeId =
      boxTypeId !== undefined && boxTypeId !== null && boxTypeId !== "" ? Number(boxTypeId) : undefined;

    if (packagingType === "boxes" && !isFbs) {
      if (parsedBoxTypeId === undefined || !Number.isFinite(parsedBoxTypeId)) {
        throw new ApiError(400, "boxTypeId is required for boxes");
      }
      const exists = await (prisma as any).boxType.findUnique({ where: { id: parsedBoxTypeId } });
      if (!exists) throw new ApiError(400, "Invalid boxTypeId");
    }
// Extract volume from comment for FBS requests
let extractedVolume: number | undefined;
if (isFbs && comment) {
  // First try pattern like "0.1 x 4" where 0.1 is unit volume and 4 is quantity
  const volumeMatch = comment.match(/(\d+\.?\d*)\s*x\s*(\d+\.?\d*)/);
  if (volumeMatch) {
    const unitVolume = Number(volumeMatch[1]);
    const quantity = Number(volumeMatch[2]);
    extractedVolume = unitVolume * quantity; // Total volume = unit volume × quantity
  } else {
    // Try simple pattern like "3 куба" or "3 м³"
    const simpleVolumeMatch = comment.match(/(\d+\.?\d*)\s*(?:куба|кубов|м³|м3)/i);
    if (simpleVolumeMatch) {
      extractedVolume = Number(simpleVolumeMatch[1]);
    }
  }
}
    const request = await prisma.shipmentRequest.create({
      data: {
        clientId: client.id,
        cityId: cityRecord.id,
...(extractedVolume !== undefined ? { volume: extractedVolume } : {}),
        city,
        deliveryDate: new Date(deliveryDate),
        size: size ?? "-",
        boxCount: Number(boxCount),
        ...(parsedBoxTypeId !== undefined ? { boxTypeId: parsedBoxTypeId } : {}),
        packagingType,
        comment: comment || null,
        status: "new",
        ...(parsedWeight !== undefined ? { weight: parsedWeight } : {}),
        ...(deliveryTypeId !== undefined && deliveryTypeId !== null ? { deliveryTypeId: Number(deliveryTypeId) } : {}),
        ...(mpAccountDate ? { mpAccountDate: new Date(mpAccountDate) } : {}),
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
  // Look up schedule by exact shipment date selected by client
  const schedule = isFbs
    ? await (prisma as any).deliveryScheduleFbs.findFirst({
        where: {
          cityId: cityRecord.id,
          deliveryDate: new Date(deliveryDate),
        },
      })
    : await (prisma as any).deliverySchedule.findFirst({
        where: {
          cityId: cityRecord.id,
          deliveryDate: new Date(deliveryDate),
        },
      });

      const shipmentDateStr = new Date(deliveryDate).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      // Build cargo line: "1 палета (301–400) кг"
      let cargoLine = "";
      if (Array.isArray(items) && items.length > 0) {
        cargoLine = items.map((it: any) => {
          const qty = Number(it.quantity) || 0;
          const unitLabel = String(it.unit ?? "шт");
          const parts = String(it.description ?? "").split(" — ");
          const typeName = parts.length > 1 ? parts[parts.length - 1] : "";
          const pkgWord = unitLabel === "пал" ? pluralPallet(qty) : pluralBox(qty);
          return typeName ? `${qty} ${pkgWord} (${typeName}) кг` : `${qty} ${pkgWord}`;
        }).join("\n");
      } else {
        const qty = Number(boxCount);
        cargoLine = `${qty} ${packagingType === "pallets" ? pluralPallet(qty) : pluralBox(qty)}`;
      }

      // Use schedule destination for nice city name, fallback to cityRecord.fullName or shortName
      const destination = schedule?.destination || cityRecord.fullName || city;

      let msg = `<b>Заявка №${request.id} принята</b> ✅\n\n`;
      msg += `<b>Направление:</b> Белгород → ${destination}\n`;
      msg += `<b>Поставка:</b> ${cargoLine}\n`;
      msg += `<b>Запланированная дата в л/к МП:</b> ${mpAccountDate ? new Date(mpAccountDate).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }) : shipmentDateStr}\n`;

      if (schedule?.acceptDays) {
        msg += `\nЧтобы груз попал в рейс, сдайте его на наш склад заранее:\n\n`;
        msg += schedule.acceptDays;
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

// GET /bot/request-detail/:id — single request with services (read-only for client)
router.get("/request-detail/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const request = await (prisma as any).shipmentRequest.findUnique({
      where: { id },
      include: {
        services: { orderBy: { id: "asc" } },
        boxType: true,
      },
    });
    if (!request) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(request);
  } catch (err) {
    next(err);
  }
});

// PATCH /bot/requests/:id — update shipment request (client can only edit if status is "new")
router.patch("/requests/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { deliveryDate, packagingType, boxCount, mpAccountDate } = req.body;

    // Check if request exists and is editable
    const existing = await prisma.shipmentRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError(404, "Request not found");
    }

    if (existing.status !== "new") {
      throw new ApiError(403, "Can only edit requests with 'new' status");
    }

    // Build update data
    const updateData: any = {};
    
    if (deliveryDate !== undefined) {
      updateData.deliveryDate = new Date(deliveryDate);
    }
    
    if (packagingType !== undefined) {
      if (packagingType !== "pallets" && packagingType !== "boxes") {
        throw new ApiError(400, "Invalid packagingType");
      }
      updateData.packagingType = packagingType;
    }
    
    if (boxCount !== undefined) {
      const count = Number(boxCount);
      if (!Number.isInteger(count) || count < 1) {
        throw new ApiError(400, "Invalid boxCount");
      }
      updateData.boxCount = count;
    }
    
    if (mpAccountDate !== undefined) {
      updateData.mpAccountDate = mpAccountDate ? new Date(mpAccountDate) : null;
    }

    // Update the request
    const updated = await prisma.shipmentRequest.update({
      where: { id },
      data: updateData,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// GET /bot/consent/:telegramId — check consent status
router.get("/consent/:telegramId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { telegramId } = req.params;

    const client = await (prisma as any).client.findUnique({
      where: { telegramId },
      select: { 
        consentGiven: true, 
        consentAt: true, 
        phone: true,
        email: true,
        counterparties: { select: { id: true }, take: 1 }
      },
    });

    if (!client) {
      res.json({ consentGiven: false, hasPhone: false, hasEmail: false, hasInn: false });
      return;
    }

    res.json({ 
      consentGiven: client.consentGiven, 
      consentAt: client.consentAt,
      hasPhone: !!client.phone,
      hasEmail: !!client.email,
      hasInn: client.counterparties.length > 0
    });
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

// POST /bot/email — save client email
router.post("/email", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { telegramId, email } = req.body;

    if (!telegramId) throw new ApiError(400, "Missing telegramId");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      throw new ApiError(400, "Invalid email");
    }

    const client = await (prisma as any).client.update({
      where: { telegramId: String(telegramId) },
      data: { email: String(email) },
    });

    res.json({ email: client.email });
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

    // Validate INN through DaData API and get organization name
    const dadataToken = process.env.DADATA_TOKEN;
    let orgName = `Организация ${inn}`;
    let orgData: any = null;

    if (dadataToken) {
      try {
        const dadataRes = await fetch(
          "https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Token ${dadataToken}`,
            },
            body: JSON.stringify({ query: String(inn) }),
          },
        );

        if (dadataRes.ok) {
          const json = (await dadataRes.json()) as { suggestions: any[] };
          if (!json.suggestions || json.suggestions.length === 0) {
            throw new ApiError(400, "ИНН не найден в базе данных. Проверьте правильность ввода.");
          }
          // Get organization name from DaData
          orgData = json.suggestions[0]?.data;
          if (orgData) {
            orgName = orgData.name?.short_with_opf || orgData.name?.full_with_opf || orgData.name?.short || orgData.name?.full || orgName;
          }
        }
      } catch (err) {
        if (err instanceof ApiError) throw err;
        // If DaData fails, continue without validation (fallback)
      }
    }

    // Upsert counterparty by INN
    let counterparty = await (prisma as any).counterparty.findUnique({
      where: { inn: String(inn) },
    });

    if (!counterparty) {
      counterparty = await (prisma as any).counterparty.create({
        data: {
          name: orgName,
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
    const cities = await (prisma as any).city.findMany({ orderBy: { short_name: "asc" } });
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

// GET /bot/cities-fbs — list available FBS cities/directions
router.get("/cities-fbs", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cities = await (prisma as any).cityFbs.findMany({ orderBy: { shortName: "asc" } });
    res.json(cities);
  } catch (err) {
    next(err);
  }
});

// GET /bot/schedule-fbs?cityId=N — delivery dates for an FBS city
router.get("/schedule-fbs", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cityId = Number(req.query.cityId);
    if (!Number.isFinite(cityId)) throw new ApiError(400, "cityId is required");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const schedules = await (prisma as any).deliveryScheduleFbs.findMany({
      where: { cityId, deliveryDate: { gte: today } },
      orderBy: { deliveryDate: "asc" },
    });
    res.json(schedules);
  } catch (err) {
    next(err);
  }
});

// GET /bot/price-fbs?destination=X — FBS prices for a destination
router.get("/price-fbs", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const destination = req.query.destination as string | undefined;
    const where: any = {};
    if (destination) where.destination = destination;

    const prices = await (prisma as any).priceFbs.findMany({
      where,
      orderBy: [{ destination: "asc" }, { volume: "asc" }],
    });
    res.json(prices);
  } catch (err) {
    next(err);
  }
});

// GET /bot/service-prices — list additional services for mini-app
router.get("/service-prices", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await (prisma as any).servicePrice.findMany({ orderBy: { id: "asc" } });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// GET /bot/client-service-prices?deliveryType=FBS — list client additional services filtered by delivery type
router.get("/client-service-prices", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deliveryTypeName = req.query.deliveryType as string | undefined;
    const where: any = {};
    
    if (deliveryTypeName) {
      const deliveryType = await (prisma as any).deliveryType.findFirst({
        where: { name: deliveryTypeName }
      });
      if (deliveryType) {
        where.deliveryTypeId = deliveryType.id;
      }
    }

    const items = await (prisma as any).clientServicePrice.findMany({ 
      where,
      orderBy: { id: "asc" },
      include: { deliveryType: true }
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// ===================== WEB (public site) =====================

// POST /bot/auth/call — stub: initiate phone call auth
router.post("/auth/call", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.body;
    if (!phone) throw new ApiError(400, "Missing phone");
    // TODO: integrate real call-based auth
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /bot/auth/verify — stub: verify code (accepts any code)
router.post("/auth/verify", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, code } = req.body;
    if (!phone) throw new ApiError(400, "Missing phone");
    if (!code) throw new ApiError(400, "Missing code");
    // TODO: verify real code; for now accept anything
    // Upsert client by phone
    let client = await (prisma as any).client.findFirst({ where: { phone: String(phone) } });
    if (!client) {
      client = await (prisma as any).client.create({
        data: {
          telegramId: `web_${phone}`,
          phone: String(phone),
          consentGiven: true,
          consentAt: new Date(),
        },
      });
    }
    res.json({ token: `stub_${phone}`, clientId: client.id, phone: client.phone });
  } catch (err) {
    next(err);
  }
});

// POST /bot/requests-web — create request from public website (by phone)
router.post("/requests-web", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      phone,
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
      deliveryTypeId,
      mpAccountDate,
    } = req.body;

    if (!phone || !city || !deliveryDate || !boxCount || !packagingType) {
      throw new ApiError(400, "Missing required fields");
    }

    if (packagingType !== "pallets" && packagingType !== "boxes") {
      throw new ApiError(400, "Invalid packagingType");
    }

    // Find or create client by phone
    let client = await (prisma as any).client.findFirst({ where: { phone: String(phone) } });
    if (!client) {
      client = await (prisma as any).client.create({
        data: {
          telegramId: `web_${phone}`,
          phone: String(phone),
          firstName: firstName || null,
          lastName: lastName || null,
          consentGiven: true,
          consentAt: new Date(),
        },
      });
    } else if (firstName || lastName) {
      client = await (prisma as any).client.update({
        where: { id: client.id },
        data: {
          ...(firstName ? { firstName } : {}),
          ...(lastName ? { lastName } : {}),
        },
      });
    }

    const isFbs = deliveryTypeId !== undefined && Number(deliveryTypeId) === 1;
    let cityRecord;
    if (isFbs) {
      // Try cities_fbs first for FBS
      cityRecord = await (prisma as any).cityFbs.findUnique({ where: { shortName: city } });
      // If not found in cities_fbs, fallback to cities
      if (!cityRecord) {
        cityRecord = await (prisma as any).city.findUnique({ where: { shortName: city } });
      }
    } else {
       cityRecord = await (prisma as any).city.findUnique({ where: { shortName: city } });
    }
    if (!cityRecord) throw new ApiError(400, `City not found: ${city}`);

    const parsedWeight =
      weight !== undefined && weight !== null && weight !== "" ? Number(weight) : undefined;
    if (parsedWeight !== undefined && (!Number.isFinite(parsedWeight) || parsedWeight <= 0)) {
      throw new ApiError(400, "Invalid weight");
    }

    const parsedBoxTypeId =
      boxTypeId !== undefined && boxTypeId !== null && boxTypeId !== "" ? Number(boxTypeId) : undefined;

    if (packagingType === "boxes" && !isFbs) {
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
        ...(deliveryTypeId !== undefined && deliveryTypeId !== null ? { deliveryTypeId: Number(deliveryTypeId) } : {}),
        ...(mpAccountDate ? { mpAccountDate: new Date(mpAccountDate) } : {}),
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

    res.status(201).json(full);
  } catch (err) {
    next(err);
  }
});

// GET /bot/requests-by-phone/:phone — list client requests by phone (requires JWT)
router.get("/requests-by-phone/:phone", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.params;

    // Проверяем JWT токен
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const jwt = await import("jsonwebtoken");
      const JWT_SECRET = process.env.JWT_SECRET || "public-client-secret-change-me";
      try {
        const decoded = jwt.default.verify(authHeader.slice(7), JWT_SECRET) as any;
        const tokenPhone = String(decoded.phone || "");
        const tokenPhoneDigits = tokenPhone.replace(/\D/g, "");
        const reqPhoneDigits = String(phone).replace(/\D/g, "");
        if (tokenPhoneDigits !== reqPhoneDigits) {
          res.status(403).json({ error: "Access denied" });
          return;
        }
      } catch {
        res.status(401).json({ error: "Invalid token" });
        return;
      }
    }

    const phoneStr = String(phone);
    const phoneWithPlus = phoneStr.startsWith("+") ? phoneStr : "+" + phoneStr;
    const phoneWithoutPlus = phoneStr.startsWith("+") ? phoneStr.slice(1) : phoneStr;
    const client = await (prisma as any).client.findFirst({ 
      where: { OR: [{ phone: phoneWithPlus }, { phone: phoneWithoutPlus }] } 
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
