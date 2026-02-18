import { Router, type Request, type Response, type NextFunction } from "express";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../auth/middleware.js";
import { ApiError } from "../errors.js";
import { notifyClient } from "../services/telegram-notifier.js";
import { sendClientDocument } from "../services/telegram-notifier.js";
import { RequestStatus } from "@prisma/client";
import { generateInvoicePdfBuffer } from "../services/invoice-pdf.js";

const router = Router();
router.use(requireAuth);

type CounterpartyPayload = {
  name: string;
  inn?: string | null;
  kpp?: string | null;
  ogrn?: string | null;
  address?: string | null;
  account?: string | null;
  bik?: string | null;
  correspondentAccount?: string | null;
  bank?: string | null;
  director?: string | null;
  contract?: string | null;
  contactClientIds?: number[];
};

// GET /admin/requests
router.get("/requests", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await prisma.shipmentRequest.findMany({
      include: { client: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
});

// GET /admin/requests/:id
router.get("/requests/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const request = await prisma.shipmentRequest.findUnique({
      where: { id },
      include: { client: true, history: { orderBy: { changedAt: "desc" } } },
    });
    if (!request) throw new ApiError(404, "Request not found");
    res.json(request);
  } catch (err) {
    next(err);
  }
});

// GET /admin/requests/:id/invoice.pdf?counterpartyId=...&amount=...
router.get("/requests/:id/invoice.pdf", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const counterpartyId = Number(req.query.counterpartyId);
    const amount = Number(req.query.amount);

    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid request id");
    if (!Number.isFinite(counterpartyId)) throw new ApiError(400, "Invalid counterpartyId");
    if (!Number.isFinite(amount) || amount <= 0) throw new ApiError(400, "Invalid amount");

    const request = await prisma.shipmentRequest.findUnique({ where: { id }, include: { client: true } });
    if (!request) throw new ApiError(404, "Request not found");

    const counterparty = await prisma.counterparty.findUnique({ where: { id: counterpartyId } });
    if (!counterparty) throw new ApiError(404, "Counterparty not found");

    const pdf = await generateInvoicePdfBuffer({ request, counterparty, amountRub: amount });
    const fileName = `Счет_заявка_${request.id}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.send(pdf);
  } catch (err) {
    next(err);
  }
});

// POST /admin/requests/:id/invoice/send
router.post("/requests/:id/invoice/send", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { counterpartyId, amount } = req.body as { counterpartyId: number; amount: number };

    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid request id");
    if (!Number.isFinite(counterpartyId)) throw new ApiError(400, "Invalid counterpartyId");
    if (!Number.isFinite(amount) || amount <= 0) throw new ApiError(400, "Invalid amount");

    const request = await prisma.shipmentRequest.findUnique({ where: { id }, include: { client: true } });
    if (!request) throw new ApiError(404, "Request not found");

    const counterparty = await prisma.counterparty.findUnique({ where: { id: counterpartyId } });
    if (!counterparty) throw new ApiError(404, "Counterparty not found");

    const pdf = await generateInvoicePdfBuffer({ request, counterparty, amountRub: amount });
    const fileName = `Счет_заявка_${request.id}.pdf`;

    await sendClientDocument(
      request.client.telegramId,
      pdf,
      fileName,
      `Счёт по заявке #${request.id} на сумму ${amount.toLocaleString("ru-RU")} руб.`,
    );

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/requests/:id/status
router.patch("/requests/:id/status", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body as { status: RequestStatus };

    if (!Object.values(RequestStatus).includes(status)) {
      throw new ApiError(400, "Invalid status");
    }

    const existing = await prisma.shipmentRequest.findUnique({
      where: { id },
      include: { client: true },
    });
    if (!existing) throw new ApiError(404, "Request not found");

    const updated = await prisma.shipmentRequest.update({
      where: { id },
      data: { status },
    });

    await prisma.requestStatusHistory.create({
      data: {
        requestId: id,
        oldStatus: existing.status,
        newStatus: status,
      },
    });

    const statusLabels: Record<RequestStatus, string> = {
      new: "Новый",
      warehouse: "Склад",
      shipped: "Отгружен",
      done: "Выполнена",
    };

    await notifyClient(
      existing.client.telegramId,
      `Статус вашей заявки #${id} изменён: <b>${statusLabels[status]}</b>`,
    );

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/requests/:id
router.patch("/requests/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid request id");

    const body = req.body as {
      city?: string;
      deliveryDate?: string;
      packagingType?: "pallets" | "boxes";
      boxCount?: number;
      weight?: number | null;
      comment?: string | null;
    };

    const existing = await prisma.shipmentRequest.findUnique({
      where: { id },
      include: { client: true },
    });
    if (!existing) throw new ApiError(404, "Request not found");

    const nextCity = body.city !== undefined ? String(body.city).trim() : undefined;
    if (nextCity !== undefined && !nextCity) throw new ApiError(400, "City is required");

    const nextDeliveryDate =
      body.deliveryDate !== undefined ? new Date(String(body.deliveryDate)) : undefined;
    if (nextDeliveryDate !== undefined && !Number.isFinite(nextDeliveryDate.getTime())) {
      throw new ApiError(400, "Invalid deliveryDate");
    }

    if (body.packagingType !== undefined && body.packagingType !== "pallets" && body.packagingType !== "boxes") {
      throw new ApiError(400, "Invalid packagingType");
    }

    if (body.boxCount !== undefined) {
      if (!Number.isFinite(body.boxCount) || body.boxCount <= 0) {
        throw new ApiError(400, "Invalid boxCount");
      }
    }

    if (body.weight !== undefined && body.weight !== null) {
      if (!Number.isFinite(body.weight) || body.weight <= 0) {
        throw new ApiError(400, "Invalid weight");
      }
    }

    const nextComment =
      body.comment !== undefined
        ? body.comment === null
          ? null
          : String(body.comment).trim() || null
        : undefined;

    const updated = await prisma.shipmentRequest.update({
      where: { id },
      data: {
        city: nextCity,
        deliveryDate: nextDeliveryDate,
        packagingType: body.packagingType as any,
        boxCount: body.boxCount,
        weight: body.weight === null ? (undefined as any) : (body.weight as any),
        comment: nextComment,
      } as any,
      include: { client: true },
    });

    const changedFields: string[] = [];
    if (body.city !== undefined && existing.city !== updated.city) changedFields.push("город");
    if (body.deliveryDate !== undefined && existing.deliveryDate.getTime() !== updated.deliveryDate.getTime()) {
      changedFields.push("дата");
    }
    if (body.packagingType !== undefined && (existing as any).packagingType !== (updated as any).packagingType) {
      changedFields.push("упаковка");
    }
    if (body.boxCount !== undefined && existing.boxCount !== updated.boxCount) changedFields.push("кол-во мест");
    if (body.weight !== undefined && existing.weight !== updated.weight) changedFields.push("вес");
    if (body.comment !== undefined && existing.comment !== updated.comment) changedFields.push("комментарий");

    if (changedFields.length) {
      await notifyClient(
        existing.client.telegramId,
        `Заявка #${id} обновлена менеджером (изменено: ${changedFields.join(", ")}).`,
      );
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// GET /admin/clients
router.get("/clients", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const clients = await prisma.client.findMany({
      include: { _count: { select: { requests: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(clients);
  } catch (err) {
    next(err);
  }
});

// GET /admin/clients/:id
router.get("/clients/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid id");

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        requests: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!client) throw new ApiError(404, "Client not found");

    res.json(client);
  } catch (err) {
    next(err);
  }
});

// GET /admin/counterparties
router.get("/counterparties", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const counterparties = await prisma.counterparty.findMany({
      include: {
        contacts: {
          include: {
            client: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(counterparties);
  } catch (err) {
    next(err);
  }
});

// POST /admin/counterparties
router.post("/counterparties", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as CounterpartyPayload;
    if (!body?.name?.trim()) throw new ApiError(400, "Name is required");

    const contactClientIds = Array.isArray(body.contactClientIds) ? body.contactClientIds : [];

    const created = await prisma.counterparty.create({
      data: {
        name: body.name.trim(),
        inn: body.inn ?? null,
        kpp: body.kpp ?? null,
        ogrn: body.ogrn ?? null,
        address: body.address ?? null,
        account: body.account ?? null,
        bik: body.bik ?? null,
        correspondentAccount: body.correspondentAccount ?? null,
        bank: body.bank ?? null,
        director: body.director ?? null,
        contract: body.contract ?? null,
        contacts: {
          create: contactClientIds.map((clientId) => ({ clientId })),
        },
      },
      include: {
        contacts: { include: { client: true } },
      },
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/counterparties/:id
router.patch("/counterparties/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid id");

    const body = req.body as CounterpartyPayload;
    const contactClientIds = Array.isArray(body.contactClientIds) ? body.contactClientIds : undefined;

    const existing = await prisma.counterparty.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Counterparty not found");

    const updated = await prisma.counterparty.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name.trim() : undefined,
        inn: body.inn !== undefined ? body.inn : undefined,
        kpp: body.kpp !== undefined ? body.kpp : undefined,
        ogrn: body.ogrn !== undefined ? body.ogrn : undefined,
        address: body.address !== undefined ? body.address : undefined,
        account: body.account !== undefined ? body.account : undefined,
        bik: body.bik !== undefined ? body.bik : undefined,
        correspondentAccount:
          body.correspondentAccount !== undefined ? body.correspondentAccount : undefined,
        bank: body.bank !== undefined ? body.bank : undefined,
        director: body.director !== undefined ? body.director : undefined,
        contract: body.contract !== undefined ? body.contract : undefined,
        contacts:
          contactClientIds !== undefined
            ? {
                deleteMany: {},
                create: contactClientIds.map((clientId) => ({ clientId })),
              }
            : undefined,
      },
      include: {
        contacts: { include: { client: true } },
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /admin/counterparties/:id
router.delete("/counterparties/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid id");

    await prisma.counterparty.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// --------------- Directions ---------------

// GET /admin/directions
router.get("/directions", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const directions = await (prisma as any).direction.findMany({
      orderBy: { name: "asc" },
    });
    res.json(directions);
  } catch (err) {
    next(err);
  }
});

// POST /admin/directions
router.post("/directions", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body as { name?: string };
    if (!name?.trim()) throw new ApiError(400, "Name is required");

    const created = await (prisma as any).direction.create({
      data: { name: name.trim() },
    });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/directions/:id
router.patch("/directions/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid id");

    const { name } = req.body as { name?: string };
    if (!name?.trim()) throw new ApiError(400, "Name is required");

    const updated = await (prisma as any).direction.update({
      where: { id },
      data: { name: name.trim() },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /admin/directions/:id
router.delete("/directions/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid id");

    const ratesCount = await (prisma as any).priceRate.count({ where: { directionId: id } });
    if (ratesCount > 0) {
      throw new ApiError(400, "Cannot delete direction with existing rates");
    }

    await (prisma as any).direction.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// --------------- Rates ---------------

const VALID_UNITS = ["pallet", "kg", "m3"];

function toIntOrNull(v: any) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return NaN;
  return Math.trunc(n);
}

function toFloatOrNull(v: any) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return NaN;
  return n;
}

function validateTier(unit: string, payload: any) {
  const minWeightKg = toIntOrNull(payload.minWeightKg);
  const maxWeightKg = toIntOrNull(payload.maxWeightKg);
  const minVolumeM3 = toFloatOrNull(payload.minVolumeM3);
  const maxVolumeM3 = toFloatOrNull(payload.maxVolumeM3);

  if (Number.isNaN(minWeightKg) || Number.isNaN(maxWeightKg) || Number.isNaN(minVolumeM3) || Number.isNaN(maxVolumeM3)) {
    throw new ApiError(400, "Invalid tier bounds");
  }

  if (unit === "pallet") {
    if (minVolumeM3 !== null || maxVolumeM3 !== null) throw new ApiError(400, "Volume bounds not allowed for pallet");
    if (minWeightKg !== null && minWeightKg < 0) throw new ApiError(400, "minWeightKg must be >= 0");
    if (maxWeightKg !== null && maxWeightKg < 0) throw new ApiError(400, "maxWeightKg must be >= 0");
    if (minWeightKg !== null && maxWeightKg !== null && minWeightKg > maxWeightKg) {
      throw new ApiError(400, "minWeightKg must be <= maxWeightKg");
    }
    return { minWeightKg, maxWeightKg, minVolumeM3: null, maxVolumeM3: null };
  }

  if (unit === "m3") {
    if (minWeightKg !== null || maxWeightKg !== null) throw new ApiError(400, "Weight bounds not allowed for m3");
    if (minVolumeM3 !== null && minVolumeM3 < 0) throw new ApiError(400, "minVolumeM3 must be >= 0");
    if (maxVolumeM3 !== null && maxVolumeM3 < 0) throw new ApiError(400, "maxVolumeM3 must be >= 0");
    if (minVolumeM3 !== null && maxVolumeM3 !== null && minVolumeM3 > maxVolumeM3) {
      throw new ApiError(400, "minVolumeM3 must be <= maxVolumeM3");
    }
    return { minWeightKg: null, maxWeightKg: null, minVolumeM3, maxVolumeM3 };
  }

  // kg
  if (minWeightKg !== null || maxWeightKg !== null || minVolumeM3 !== null || maxVolumeM3 !== null) {
    throw new ApiError(400, "No bounds allowed for kg unit");
  }
  return { minWeightKg: null, maxWeightKg: null, minVolumeM3: null, maxVolumeM3: null };
}

// GET /admin/rates
router.get("/rates", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where: any = {};
    if (req.query.directionId) {
      where.directionId = Number(req.query.directionId);
    }
    const rates = await (prisma as any).priceRate.findMany({
      where,
      include: { direction: true },
      orderBy: [{ directionId: "asc" }, { unit: "asc" }],
    });
    res.json(rates);
  } catch (err) {
    next(err);
  }
});

// POST /admin/rates
router.post("/rates", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { directionId, unit, price, comment } = req.body as {
      directionId?: number;
      unit?: string;
      price?: number;
      comment?: string | null;
      minWeightKg?: number | null;
      maxWeightKg?: number | null;
      minVolumeM3?: number | null;
      maxVolumeM3?: number | null;
    };

    if (!Number.isFinite(directionId)) throw new ApiError(400, "Invalid directionId");
    if (!unit || !VALID_UNITS.includes(unit)) throw new ApiError(400, "Invalid unit (pallet|kg|m3)");
    if (!Number.isFinite(price) || price! <= 0) throw new ApiError(400, "Invalid price");

    const tier = validateTier(unit, req.body);

    const created = await (prisma as any).priceRate.create({
      data: {
        directionId,
        unit,
        ...tier,
        price,
        comment: comment?.trim() || null,
      },
      include: { direction: true },
    });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/rates/:id
router.patch("/rates/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid id");

    const { directionId, unit, price, comment } = req.body as {
      directionId?: number;
      unit?: string;
      price?: number;
      comment?: string | null;
      minWeightKg?: number | null;
      maxWeightKg?: number | null;
      minVolumeM3?: number | null;
      maxVolumeM3?: number | null;
    };

    if (unit !== undefined && !VALID_UNITS.includes(unit)) {
      throw new ApiError(400, "Invalid unit (pallet|kg|m3)");
    }
    if (price !== undefined && (!Number.isFinite(price) || price <= 0)) {
      throw new ApiError(400, "Invalid price");
    }

    const data: any = {};
    if (directionId !== undefined) data.directionId = directionId;
    if (unit !== undefined) data.unit = unit;
    if (price !== undefined) data.price = price;
    if (comment !== undefined) data.comment = comment?.trim() || null;

    const existing = await (prisma as any).priceRate.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Not found");
    const finalUnit = unit ?? existing.unit;
    const hasTierFields =
      req.body.minWeightKg !== undefined ||
      req.body.maxWeightKg !== undefined ||
      req.body.minVolumeM3 !== undefined ||
      req.body.maxVolumeM3 !== undefined ||
      unit !== undefined;

    if (hasTierFields) {
      const tier = validateTier(finalUnit, {
        minWeightKg: req.body.minWeightKg ?? existing.minWeightKg,
        maxWeightKg: req.body.maxWeightKg ?? existing.maxWeightKg,
        minVolumeM3: req.body.minVolumeM3 ?? existing.minVolumeM3,
        maxVolumeM3: req.body.maxVolumeM3 ?? existing.maxVolumeM3,
      });
      data.minWeightKg = tier.minWeightKg;
      data.maxWeightKg = tier.maxWeightKg;
      data.minVolumeM3 = tier.minVolumeM3;
      data.maxVolumeM3 = tier.maxVolumeM3;
    }

    const updated = await (prisma as any).priceRate.update({
      where: { id },
      data,
      include: { direction: true },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /admin/rates/:id
router.delete("/rates/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid id");

    await (prisma as any).priceRate.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
