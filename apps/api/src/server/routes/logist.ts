import { Router, type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ApiError } from "../errors.js";
import { prisma } from "../db/prisma.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "logist-secret-key-change-in-production";

async function requireLogistAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Unauthorized");
    }
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { logistId: number };
    const logist = await (prisma as any).logist.findUnique({
      where: { id: decoded.logistId, isActive: true },
    });
    if (!logist) throw new ApiError(401, "Unauthorized");
    (req as any).logist = logist;
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(new ApiError(401, "Unauthorized"));
  }
}

// POST /logist/login
router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) throw new ApiError(400, "Email and password are required");

    const logist = await (prisma as any).logist.findUnique({
      where: { email, isActive: true },
    });

    if (!logist) throw new ApiError(401, "Неверный email или пароль");

    const isValid = await bcrypt.compare(password, logist.passwordHash);
    if (!isValid) throw new ApiError(401, "Неверный email или пароль");

    const token = jwt.sign({ logistId: logist.id }, JWT_SECRET, { expiresIn: "30d" });

    res.json({
      token,
      logist: { id: logist.id, name: logist.name, email: logist.email },
    });
  } catch (err) {
    next(err);
  }
});

// GET /logist/me
router.get("/me", requireLogistAuth, async (req: Request, res: Response) => {
  const logist = (req as any).logist;
  res.json({ id: logist.id, name: logist.name, email: logist.email });
});

// GET /logist/cities — список всех городов FBO + FBS
router.get("/cities", requireLogistAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [fbo, fbs] = await Promise.all([
      (prisma as any).city.findMany({ orderBy: { shortName: "asc" }, select: { id: true, shortName: true, fullName: true } }),
      (prisma as any).cityFbs.findMany({ orderBy: { shortName: "asc" }, select: { id: true, shortName: true, fullName: true } }),
    ]);
    res.json({
      fbo: fbo.map((c: any) => ({ ...c, type: "fbo" })),
      fbs: fbs.map((c: any) => ({ ...c, type: "fbs" })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /logist/requests?city=&date=&deliveryType=fbo|fbs
// Возвращает заявки на указанную дату и направление
router.get("/requests", requireLogistAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { city, date, deliveryType } = req.query as { city?: string; date?: string; deliveryType?: string };

    if (!city || !date) throw new ApiError(400, "city and date are required");

    const dayStart = new Date(date + "T00:00:00");
    const dayEnd = new Date(date + "T23:59:59");

    const requests = await (prisma as any).shipmentRequest.findMany({
      where: {
        city,
        deliveryDate: { gte: dayStart, lte: dayEnd },
        status: { not: "archived" },
        ...(deliveryType === "fbs"
          ? { deliveryType: { name: "FBS" } }
          : deliveryType === "fbo"
          ? { deliveryType: { name: { not: "FBS" } } }
          : {}),
      },
      include: {
        client: {
          include: {
            counterparties: { include: { counterparty: true } },
          },
        },
        deliveryType: true,
        carrierRecord: true,
      },
      orderBy: { id: "asc" },
    });

    res.json(
      requests.map((r: any) => ({
        id: r.id,
        city: r.city,
        deliveryDate: r.deliveryDate,
        boxCount: r.boxCount,
        packagingType: r.packagingType,
        volume: r.volume,
        weight: r.weight,
        status: r.status,
        deliveryType: r.deliveryType?.name || null,
        clientName:
          r.client.counterparties?.[0]?.counterparty?.shortName ||
          r.client.counterparties?.[0]?.counterparty?.name ||
          `${r.client.firstName ?? ""} ${r.client.lastName ?? ""}`.trim() ||
          `#${r.client.id}`,
        carrierRecord: r.carrierRecord
          ? {
              id: r.carrierRecord.id,
              driverName: r.carrierRecord.driverName,
              carBrand: r.carrierRecord.carBrand,
              carNumber: r.carrierRecord.carNumber,
            }
          : null,
      }))
    );
  } catch (err) {
    next(err);
  }
});

// POST /logist/carriers — создать запись перевозчика и привязать заявки
router.post("/carriers", requireLogistAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logist = (req as any).logist;
    const {
      carBrand,
      carNumber,
      driverName,
      driverPhone,
      logistInfo,
      city,
      deliveryDate,
      deliveryType,
      comment,
      requestIds,
    } = req.body as {
      carBrand: string;
      carNumber: string;
      driverName: string;
      driverPhone: string;
      logistInfo?: string;
      city: string;
      deliveryDate: string;
      deliveryType: string;
      comment?: string;
      requestIds: number[];
    };

    if (!carBrand || !carNumber || !driverName || !driverPhone || !city || !deliveryDate) {
      throw new ApiError(400, "Заполните все обязательные поля");
    }
    if (!Array.isArray(requestIds) || requestIds.length === 0) {
      throw new ApiError(400, "Выберите хотя бы одну заявку");
    }

    const record = await (prisma as any).carrierRecord.create({
      data: {
        logistId: logist.id,
        carBrand: carBrand.trim(),
        carNumber: carNumber.trim().toUpperCase(),
        driverName: driverName.trim(),
        driverPhone: driverPhone.trim(),
        logistInfo: logistInfo?.trim() || null,
        city: city.trim(),
        deliveryDate: new Date(deliveryDate),
        deliveryType: deliveryType || "fbo",
        comment: comment?.trim() || null,
      },
    });

    await (prisma as any).shipmentRequest.updateMany({
      where: { id: { in: requestIds } },
      data: { carrierRecordId: record.id },
    });

    const fullRecord = await (prisma as any).carrierRecord.findUnique({
      where: { id: record.id },
      include: { requests: { select: { id: true, city: true, deliveryDate: true } } },
    });

    res.status(201).json(fullRecord);
  } catch (err) {
    next(err);
  }
});

// GET /logist/carriers — история записей логиста
router.get("/carriers", requireLogistAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logist = (req as any).logist;
    const records = await (prisma as any).carrierRecord.findMany({
      where: { logistId: logist.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        requests: {
          select: { id: true, city: true, deliveryDate: true, status: true },
        },
      },
    });
    res.json(records);
  } catch (err) {
    next(err);
  }
});

// DELETE /logist/carriers/:id/unlink — отвязать заявку от перевозчика
router.delete("/carriers/:id/unlink", requireLogistAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const carrierId = Number(req.params.id);
    const { requestId } = req.body as { requestId: number };
    if (!Number.isFinite(carrierId) || !Number.isFinite(requestId)) {
      throw new ApiError(400, "Invalid id");
    }
    await (prisma as any).shipmentRequest.updateMany({
      where: { id: requestId, carrierRecordId: carrierId },
      data: { carrierRecordId: null },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
