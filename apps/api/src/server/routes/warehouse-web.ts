import { Router, type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { ApiError } from "../errors.js";
import { prisma } from "../db/prisma.js";

const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);
const UPLOADS_DIR = path.resolve(__dirname2, "../../../uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

function saveUploadedFile(file: Express.Multer.File): string {
  const ext = path.extname(file.originalname) || ".jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), file.buffer);
  return filename;
}

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "warehouse-secret-key-change-in-production";

// Middleware для проверки JWT токена кладовщика
async function requireWarehouseAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Unauthorized");
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { workerId: number };

    const worker = await (prisma as any).warehouseWorker.findUnique({
      where: { id: decoded.workerId, isActive: true },
    });

    if (!worker) {
      throw new ApiError(401, "Unauthorized");
    }

    (req as any).warehouseWorker = worker;
    next();
  } catch (err) {
    if (err instanceof ApiError) {
      next(err);
    } else {
      next(new ApiError(401, "Unauthorized"));
    }
  }
}

// POST /warehouse-web/login — авторизация кладовщика
router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    const worker = await (prisma as any).warehouseWorker.findUnique({
      where: { email, isActive: true },
    });

    if (!worker || !worker.password) {
      throw new ApiError(401, "Invalid credentials");
    }

    const isValid = await bcrypt.compare(password, worker.password);
    if (!isValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    const token = jwt.sign({ workerId: worker.id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      worker: {
        id: worker.id,
        name: worker.name,
        email: worker.email,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /warehouse-web/my-requests — получить заявки в статусе "warehouse"
router.get("/my-requests", requireWarehouseAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deliveryType } = req.query as { deliveryType?: string };

    const where: any = { status: "warehouse" };
    
    if (deliveryType && (deliveryType === "FBO" || deliveryType === "FBS")) {
      where.deliveryType = { name: deliveryType };
    }

    const requests = await (prisma as any).shipmentRequest.findMany({
      where,
      include: {
        client: {
          include: {
            counterparties: {
              include: {
                counterparty: true,
              },
            },
          },
        },
        deliveryType: true,
        boxType: true,
        palletType: true,
      },
      orderBy: { id: "asc" },
    });

    res.json(requests);
  } catch (err) {
    next(err);
  }
});

// PATCH /warehouse-web/requests/bulk-ship — массовая отгрузка заявок
router.patch("/requests/bulk-ship", requireWarehouseAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { requestIds } = req.body as { requestIds: number[] };

    if (!Array.isArray(requestIds) || requestIds.length === 0) {
      throw new ApiError(400, "requestIds array is required");
    }

    const worker = (req as any).warehouseWorker;

    // Обновляем статус всех заявок
    const result = await (prisma as any).shipmentRequest.updateMany({
      where: {
        id: { in: requestIds },
        status: "warehouse",
      },
      data: {
        status: "shipped",
      },
    });

    // Создаем записи в истории статусов для каждой заявки
    const historyRecords = requestIds.map((id) => ({
      requestId: id,
      oldStatus: "warehouse",
      newStatus: "shipped",
    }));

    await (prisma as any).requestStatusHistory.createMany({
      data: historyRecords,
    });

    res.json({ success: true, shipped: result.count });
  } catch (err) {
    next(err);
  }
});

// GET /warehouse-web/stats — простая статистика
router.get("/stats", requireWarehouseAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [inWarehouse, shippedToday] = await Promise.all([
      (prisma as any).shipmentRequest.count({
        where: { status: "warehouse" },
      }),
      (prisma as any).shipmentRequest.count({
        where: {
          status: "shipped",
          updatedAt: { gte: today },
        },
      }),
    ]);

    res.json({
      inWarehouse,
      shippedToday,
    });
  } catch (err) {
    next(err);
  }
});

// GET /warehouse-web/requests/new — заявки со статусом "new"
router.get("/requests/new", requireWarehouseAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deliveryType } = req.query as { deliveryType?: string };
    const where: any = { status: "new" };
    if (deliveryType && (deliveryType === "FBO" || deliveryType === "FBS")) {
      where.deliveryType = { name: deliveryType };
    }
    const requests = await (prisma as any).shipmentRequest.findMany({
      where,
      include: {
        client: {
          include: {
            counterparties: { include: { counterparty: true }, take: 1 },
          },
        },
        deliveryType: true,
        boxType: true,
        palletType: true,
        photos: true,
        services: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
});

// GET /warehouse-web/requests/:id — детали заявки
router.get("/requests/:id", requireWarehouseAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid ID");

    const request = await (prisma as any).shipmentRequest.findUnique({
      where: { id },
      include: {
        client: {
          include: {
            counterparties: { include: { counterparty: true }, take: 1 },
          },
        },
        deliveryType: true,
        boxType: true,
        palletType: true,
        photos: { orderBy: { uploadedAt: "desc" } },
        services: { orderBy: { id: "asc" } },
      },
    });
    if (!request) throw new ApiError(404, "Request not found");

    // Resolve city name
    const isFbs = request.deliveryType?.name === "FBS";
    let cityRef;
    if (isFbs) {
      cityRef = await (prisma as any).cityFbs.findUnique({ where: { shortName: request.city }, select: { shortName: true, fullName: true } });
    }
    if (!cityRef) {
      cityRef = await (prisma as any).city.findUnique({ where: { shortName: request.city }, select: { shortName: true, fullName: true } });
    }
    (request as any).cityRef = cityRef || { shortName: request.city, fullName: request.city };

    res.json(request);
  } catch (err) {
    next(err);
  }
});

// PATCH /warehouse-web/requests/:id/volume — обновить объём (FBS)
router.patch("/requests/:id/volume", requireWarehouseAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { volume } = req.body;
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid ID");
    if (!volume || Number(volume) <= 0) throw new ApiError(400, "Invalid volume");

    const request = await (prisma as any).shipmentRequest.findUnique({ where: { id } });
    if (!request) throw new ApiError(404, "Not found");
    if (request.status !== "new") throw new ApiError(400, "Can only edit new requests");

    const worker = (req as any).warehouseWorker;
    const updated = await (prisma as any).shipmentRequest.update({ where: { id }, data: { volume: Number(volume) } });
    await (prisma as any).requestFieldHistory.create({
      data: { requestId: id, managerId: 1, field: "volume", oldValue: request.volume?.toString() || null, newValue: String(volume) },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// PATCH /warehouse-web/requests/:id/packaging — обновить кол-во / boxTypeId
router.patch("/requests/:id/packaging", requireWarehouseAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { boxCount, boxTypeId, palletTypeId } = req.body;
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid ID");

    const request = await (prisma as any).shipmentRequest.findUnique({
      where: { id },
      include: { services: { orderBy: { id: "asc" }, take: 1 } },
    });
    if (!request) throw new ApiError(404, "Not found");
    if (request.status !== "new") throw new ApiError(400, "Can only edit new requests");

    const data: any = {};
    if (boxCount !== undefined) data.boxCount = Number(boxCount);
    if (boxTypeId !== undefined) data.boxTypeId = boxTypeId ? Number(boxTypeId) : null;
    if (palletTypeId !== undefined) data.palletTypeId = palletTypeId ? Number(palletTypeId) : null;

    const updated = await (prisma as any).shipmentRequest.update({ where: { id }, data });

    if (boxCount !== undefined) {
      await (prisma as any).requestFieldHistory.create({
        data: { requestId: id, managerId: 1, field: "boxCount", oldValue: request.boxCount?.toString() || null, newValue: String(boxCount) },
      });
    }

    // Пересчитываем цену первой транспортной услуги при смене типа коробки/палеты или кол-ва
    const newBoxTypeId = boxTypeId !== undefined ? (boxTypeId ? Number(boxTypeId) : null) : request.boxTypeId;
    const newPalletTypeId = palletTypeId !== undefined ? (palletTypeId ? Number(palletTypeId) : null) : request.palletTypeId;
    const newBoxCount = boxCount !== undefined ? Number(boxCount) : request.boxCount;

    if ((boxTypeId !== undefined || palletTypeId !== undefined || boxCount !== undefined) && request.cityId) {
      // Ищем тариф по городу + тип упаковки + тип коробки/палеты
      const unit = request.packagingType === "pallets" ? "pallet" : "boxes";
      const rateWhere: any = { cityId: request.cityId, unit };
      if (unit === "boxes" && newBoxTypeId) rateWhere.boxTypeId = newBoxTypeId;
      if (unit === "pallet" && newPalletTypeId) rateWhere.palletTypeId = newPalletTypeId;

      const rate = await (prisma as any).priceRate.findFirst({ where: rateWhere });
      if (rate && request.services && request.services.length > 0) {
        const firstService = request.services[0];
        const newPrice = rate.price;
        const newAmount = newPrice * newBoxCount;
        const desc = rate.comment || firstService.description;
        await (prisma as any).requestService.update({
          where: { id: firstService.id },
          data: { price: newPrice, amount: newAmount, quantity: newBoxCount, description: desc },
        });
      }
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// PATCH /warehouse-web/requests/:id/packaging-type — сменить boxes<->pallets
router.patch("/requests/:id/packaging-type", requireWarehouseAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { packagingType } = req.body;
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid ID");
    if (packagingType !== "boxes" && packagingType !== "pallets") throw new ApiError(400, "Invalid packaging type");

    const request = await (prisma as any).shipmentRequest.findUnique({ where: { id } });
    if (!request) throw new ApiError(404, "Not found");
    if (request.status !== "new") throw new ApiError(400, "Can only edit new requests");

    const updated = await (prisma as any).shipmentRequest.update({ where: { id }, data: { packagingType } });
    await (prisma as any).requestFieldHistory.create({
      data: { requestId: id, managerId: 1, field: "packagingType", oldValue: request.packagingType, newValue: packagingType },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// PATCH /warehouse-web/requests/:id/status — перевести new -> warehouse
router.patch("/requests/:id/status", requireWarehouseAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid ID");

    const request = await (prisma as any).shipmentRequest.findUnique({ where: { id } });
    if (!request) throw new ApiError(404, "Not found");
    if (request.status !== "new") throw new ApiError(400, "Can only move new requests to warehouse");

    const worker = (req as any).warehouseWorker;
    const updated = await (prisma as any).shipmentRequest.update({ where: { id }, data: { status: "warehouse" } });
    await (prisma as any).requestStatusHistory.create({
      data: { requestId: id, oldStatus: "new", newStatus: "warehouse" },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// POST /warehouse-web/requests/:id/photo — загрузить фото (файл)
router.post("/requests/:id/photo", requireWarehouseAuth, upload.single("photo"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid ID");

    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file || !file.buffer) throw new ApiError(400, "No photo uploaded");
    if (!file.mimetype.startsWith("image/")) throw new ApiError(400, "Only images allowed");

    const request = await (prisma as any).shipmentRequest.findUnique({ where: { id } });
    if (!request) throw new ApiError(404, "Not found");

    const filename = saveUploadedFile(file);
    const worker = (req as any).warehouseWorker;
    const photo = await (prisma as any).requestPhoto.create({
      data: {
        requestId: id,
        fileId: `upload:${filename}`,
        fileUrl: `/uploads/${filename}`,
        uploadedBy: worker.telegramId || `web_${worker.id}`,
      },
    });
    res.json(photo);
  } catch (err) {
    next(err);
  }
});

// DELETE /warehouse-web/requests/:id/photo/:photoId — удалить фото
router.delete("/requests/:id/photo/:photoId", requireWarehouseAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const photoId = Number(req.params.photoId);
    if (!Number.isFinite(id) || !Number.isFinite(photoId)) throw new ApiError(400, "Invalid ID");

    const photo = await (prisma as any).requestPhoto.findUnique({ where: { id: photoId } });
    if (!photo || photo.requestId !== id) throw new ApiError(404, "Photo not found");

    // Delete file if it's an upload
    if (photo.fileUrl && photo.fileUrl.startsWith("/uploads/")) {
      const filePath = path.join(UPLOADS_DIR, path.basename(photo.fileUrl));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await (prisma as any).requestPhoto.delete({ where: { id: photoId } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /warehouse-web/requests/:id/services — добавить доп. услугу
router.post("/requests/:id/services", requireWarehouseAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { servicePriceId, quantity } = req.body;
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid ID");
    if (!servicePriceId) throw new ApiError(400, "servicePriceId required");

    const qty = quantity ? Number(quantity) : 1;
    const request = await (prisma as any).shipmentRequest.findUnique({ where: { id } });
    if (!request) throw new ApiError(404, "Not found");

    const servicePrice = await (prisma as any).servicePrice.findUnique({ where: { id: Number(servicePriceId) } });
    if (!servicePrice) throw new ApiError(404, "Service not found");

    const service = await (prisma as any).requestService.create({
      data: { requestId: id, description: servicePrice.name, quantity: qty, price: servicePrice.price, amount: qty * servicePrice.price },
    });
    res.status(201).json(service);
  } catch (err) {
    next(err);
  }
});

// DELETE /warehouse-web/requests/:id/services/:serviceId — удалить услугу
router.delete("/requests/:id/services/:serviceId", requireWarehouseAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const serviceId = Number(req.params.serviceId);
    if (!Number.isFinite(id) || !Number.isFinite(serviceId)) throw new ApiError(400, "Invalid ID");

    const svc = await (prisma as any).requestService.findUnique({ where: { id: serviceId } });
    if (!svc || svc.requestId !== id) throw new ApiError(404, "Service not found");

    await (prisma as any).requestService.delete({ where: { id: serviceId } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// GET /warehouse-web/box-types
router.get("/box-types", requireWarehouseAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await (prisma as any).boxType.findMany({ orderBy: { maxVolumeM3: "asc" } }));
  } catch (err) { next(err); }
});

// GET /warehouse-web/pallet-types
router.get("/pallet-types", requireWarehouseAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await (prisma as any).palletType.findMany({ orderBy: { minValue: "asc" } }));
  } catch (err) { next(err); }
});

// GET /warehouse-web/service-prices
router.get("/service-prices", requireWarehouseAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await (prisma as any).servicePrice.findMany({ orderBy: { id: "asc" } }));
  } catch (err) { next(err); }
});

// GET /warehouse-web/cities
router.get("/cities", requireWarehouseAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await (prisma as any).city.findMany({ orderBy: { shortName: "asc" } }));
  } catch (err) { next(err); }
});

// GET /warehouse-web/cities-fbs
router.get("/cities-fbs", requireWarehouseAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const citiesFbs = await (prisma as any).cityFbs.findMany({ orderBy: { shortName: "asc" } });
    // Enrich with fullName from City table (for service description)
    const cities = await (prisma as any).city.findMany({ select: { shortName: true, fullName: true } });
    const cityMap = new Map(cities.map((c: any) => [c.shortName, c.fullName]));
    const enriched = citiesFbs.map((c: any) => ({ ...c, cityFullName: cityMap.get(c.shortName) || c.fullName }));
    res.json(enriched);
  } catch (err) { next(err); }
});

// GET /warehouse-web/clients — список клиентов с организациями
router.get("/clients", requireWarehouseAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const clients = await (prisma as any).client.findMany({
      include: { counterparties: { include: { counterparty: true }, take: 1 } },
      orderBy: { id: "asc" },
    });
    res.json(clients);
  } catch (err) { next(err); }
});

// GET /warehouse-web/rates
router.get("/rates", requireWarehouseAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await (prisma as any).priceRate.findMany());
  } catch (err) { next(err); }
});

// GET /warehouse-web/schedule-fbs
router.get("/schedule-fbs", requireWarehouseAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await (prisma as any).deliveryScheduleFbs.findMany({
      include: { cityRef: true },
      orderBy: { deliveryDate: "asc" },
    }));
  } catch (err) { next(err); }
});

// GET /warehouse-web/price-fbs
router.get("/price-fbs", requireWarehouseAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await (prisma as any).priceFbs.findMany());
  } catch (err) { next(err); }
});

// PATCH /warehouse-web/requests/:id/comment — обновить комментарий
router.patch("/requests/:id/comment", requireWarehouseAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid ID");
    const { comment } = req.body as { comment?: string | null };

    const request = await (prisma as any).shipmentRequest.findUnique({ where: { id } });
    if (!request) throw new ApiError(404, "Not found");

    const updated = await (prisma as any).shipmentRequest.update({
      where: { id },
      data: { comment: comment === null || comment === undefined ? null : String(comment).trim() || null },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// POST /warehouse-web/create-request — создать заявку от кладовщика
router.post("/create-request", requireWarehouseAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clientId, cityId, deliveryDate, packagingType, boxCount, boxTypeId, palletTypeId, volume, deliveryTypeId, items, comment } = req.body;
    console.log("[warehouse-web] create-request payload:", JSON.stringify({ clientId, cityId, deliveryDate, packagingType, boxCount, boxTypeId, palletTypeId, volume, deliveryTypeId }));
    if (!clientId || !deliveryDate || !deliveryTypeId) throw new ApiError(400, "Missing required fields");

    const worker = (req as any).warehouseWorker;

    // Resolve city: for FBS (deliveryTypeId=1), cityId is CityFbs.id — need to find/create matching City
    const isFbs = Number(deliveryTypeId) === 1;
    let finalCityId: number;
    let cityShortName = "";

    if (isFbs) {
      const cityFbs = await (prisma as any).cityFbs.findUnique({ where: { id: Number(cityId) } });
      if (!cityFbs) throw new ApiError(404, "CityFbs not found");
      cityShortName = cityFbs.shortName;
      // Find matching City by shortName, create if not found
      const city = await (prisma as any).city.findUnique({ where: { shortName: cityFbs.shortName } });
      if (city) {
        finalCityId = city.id;
      } else {
        const newCity = await (prisma as any).city.create({ data: { shortName: cityFbs.shortName, fullName: cityFbs.fullName || cityFbs.shortName } });
        finalCityId = newCity.id;
      }
    } else {
      const city = await (prisma as any).city.findUnique({ where: { id: Number(cityId) } });
      if (!city) throw new ApiError(404, "City not found");
      finalCityId = city.id;
      cityShortName = city.shortName;
    }

    const request = await (prisma as any).shipmentRequest.create({
      data: {
        clientId: Number(clientId),
        cityId: finalCityId,
        city: cityShortName,
        deliveryDate: new Date(deliveryDate),
        packagingType: packagingType || "boxes",
        boxCount: boxCount ? Number(boxCount) : 1,
        boxTypeId: boxTypeId ? Number(boxTypeId) : null,
        palletTypeId: palletTypeId ? Number(palletTypeId) : null,
        volume: volume ? Number(volume) : null,
        deliveryTypeId: Number(deliveryTypeId),
        status: "new",
        size: "",
        ...(comment ? { comment: String(comment).trim() } : {}),
      },
    });

    // Create service lines from items
    if (items && Array.isArray(items) && items.length > 0) {
      await (prisma as any).requestService.createMany({
        data: items.map((it: any) => ({
          requestId: request.id,
          description: String(it.description ?? ""),
          unit: it.unit || "",
          quantity: Number(it.quantity) || 1,
          price: Number(it.price) || 0,
          amount: Number(it.amount) || 0,
        })),
      });
    }

    await (prisma as any).requestStatusHistory.create({
      data: { requestId: request.id, oldStatus: "new", newStatus: "new" },
    });

    console.log("[warehouse-web] created request #" + request.id, "cityId:", request.cityId, "status:", request.status);
    res.status(201).json({ ...request, cityFullName: cityShortName });
  } catch (err) {
    next(err);
  }
});

export default router;
