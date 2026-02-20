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
    const request = await (prisma as any).shipmentRequest.findUnique({
      where: { id },
      include: {
        client: true,
        history: { orderBy: { changedAt: "desc" } },
        fieldHistory: { orderBy: { changedAt: "desc" }, include: { manager: { select: { id: true, name: true } } } },
        services: { orderBy: { id: "asc" } },
      },
    });
    if (!request) throw new ApiError(404, "Request not found");
    res.json(request);
  } catch (err) {
    next(err);
  }
});

// --------------- Request Services ---------------

// POST /admin/requests/:id/services
router.post("/requests/:id/services", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestId = Number(req.params.id);
    const { description, unit, quantity, price } = req.body;
    const amount = (Number(quantity) || 0) * (Number(price) || 0);
    const service = await (prisma as any).requestService.create({
      data: { requestId, description: description || "", unit: unit || "шт", quantity: Number(quantity) || 1, price: Number(price) || 0, amount },
    });
    res.json(service);
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/requests/:id/services/:serviceId
router.patch("/requests/:id/services/:serviceId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const serviceId = Number(req.params.serviceId);
    const { description, unit, quantity, price } = req.body;
    const data: Record<string, unknown> = {};
    if (description !== undefined) data.description = description;
    if (unit !== undefined) data.unit = unit;
    if (quantity !== undefined) data.quantity = Number(quantity);
    if (price !== undefined) data.price = Number(price);
    if (quantity !== undefined || price !== undefined) {
      const existing = await (prisma as any).requestService.findUnique({ where: { id: serviceId } });
      const q = quantity !== undefined ? Number(quantity) : existing.quantity;
      const p = price !== undefined ? Number(price) : existing.price;
      data.amount = q * p;
    }
    const service = await (prisma as any).requestService.update({ where: { id: serviceId }, data });
    res.json(service);
  } catch (err) {
    next(err);
  }
});

// DELETE /admin/requests/:id/services/:serviceId
router.delete("/requests/:id/services/:serviceId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const serviceId = Number(req.params.serviceId);
    await (prisma as any).requestService.delete({ where: { id: serviceId } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// GET /admin/requests/:id/services/suggest — suggest service line from price_rates
router.get("/requests/:id/services/suggest", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestId = Number(req.params.id);
    const shipment = await (prisma as any).shipmentRequest.findUnique({
      where: { id: requestId },
      include: { cityRef: true },
    });
    if (!shipment) throw new ApiError(404, "Request not found");

    const unitMap: Record<string, string> = { pallets: "pallet", boxes: "kg" };
    const rateUnit = unitMap[shipment.packagingType] || "kg";
    const weight = shipment.weight ?? 0;

    const rates = await (prisma as any).priceRate.findMany({
      where: { cityId: shipment.cityId, unit: rateUnit },
      orderBy: { minWeightKg: "asc" },
    });

    let matched = rates.find((r: any) => {
      const min = r.minWeightKg ?? 0;
      const max = r.maxWeightKg ?? Infinity;
      return weight >= min && weight <= max;
    });

    if (!matched && shipment.volume) {
      const volRates = await (prisma as any).priceRate.findMany({
        where: { cityId: shipment.cityId, unit: "m3" },
        orderBy: { minVolumeM3: "asc" },
      });
      matched = volRates.find((r: any) => {
        const min = r.minVolumeM3 ?? 0;
        const max = r.maxVolumeM3 ?? Infinity;
        return shipment.volume >= min && shipment.volume <= max;
      });
    }

    if (!matched) {
      res.json({ found: false, message: "Подходящий тариф не найден" });
      return;
    }

    const cityName = shipment.cityRef?.fullName || shipment.city;
    const unitLabels: Record<string, string> = { pallet: "Паллет", kg: "кг", m3: "м³" };
    const unitLabel = unitLabels[matched.unit] || matched.unit;
    let rangeLabel = "";
    if (matched.minWeightKg != null || matched.maxWeightKg != null) {
      rangeLabel = `${matched.minWeightKg ?? 0}–${matched.maxWeightKg ?? "∞"} кг`;
    } else if (matched.minVolumeM3 != null || matched.maxVolumeM3 != null) {
      rangeLabel = `${matched.minVolumeM3 ?? 0}–${matched.maxVolumeM3 ?? "∞"} м³`;
    }

    const description = `${cityName} — ${unitLabel} — ${rangeLabel}`.trim();
    const qty = shipment.packagingType === "pallets" ? shipment.boxCount : 1;

    res.json({ found: true, description, unit: unitLabel, quantity: qty, price: matched.price, amount: qty * matched.price });
  } catch (err) {
    next(err);
  }
});

// --------------- Invoices ---------------

// Helper: next invoice number like "СЧ-000001"
async function nextInvoiceNumber(): Promise<string> {
  const last = await (prisma as any).invoice.findFirst({ orderBy: { id: "desc" } });
  const num = last ? last.id + 1 : 1;
  return `СЧ-${String(num).padStart(6, "0")}`;
}

// POST /admin/invoices  — create invoice + items, return invoice with items
router.post("/invoices", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { counterpartyId, requestId, date, items } = req.body as {
      counterpartyId: number;
      requestId?: number | null;
      date?: string;
      items: Array<{ description: string; quantity: number; unit: string; price: number; amount: number }>;
    };

    if (!Number.isFinite(counterpartyId)) throw new ApiError(400, "Invalid counterpartyId");
    if (!Array.isArray(items) || items.length === 0) throw new ApiError(400, "At least one item required");

    const cp = await prisma.counterparty.findUnique({ where: { id: counterpartyId } });
    if (!cp) throw new ApiError(404, "Counterparty not found");

    const number = await nextInvoiceNumber();

    const invoice = await (prisma as any).invoice.create({
      data: {
        number,
        date: date ? new Date(date) : new Date(),
        counterpartyId,
        requestId: requestId ?? null,
        items: {
          create: items.map((it) => ({
            description: it.description,
            quantity: it.quantity,
            unit: it.unit || "шт",
            price: it.price,
            amount: it.amount,
          })),
        },
      },
      include: { items: true, counterparty: true },
    });

    res.status(201).json(invoice);
  } catch (err) {
    next(err);
  }
});

// GET /admin/invoices
router.get("/invoices", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const invoices = await (prisma as any).invoice.findMany({
      include: { items: true, counterparty: true },
      orderBy: { id: "desc" },
    });
    res.json(invoices);
  } catch (err) {
    next(err);
  }
});

// GET /admin/invoices/:id
router.get("/invoices/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid id");

    const invoice = await (prisma as any).invoice.findUnique({
      where: { id },
      include: { items: true, counterparty: true },
    });
    if (!invoice) throw new ApiError(404, "Invoice not found");

    res.json(invoice);
  } catch (err) {
    next(err);
  }
});

// DELETE /admin/invoices/:id
router.delete("/invoices/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid id");

    await (prisma as any).invoice.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// GET /admin/invoices/:id/pdf  — generate and download PDF
router.get("/invoices/:id/pdf", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid id");

    const invoice = await (prisma as any).invoice.findUnique({
      where: { id },
      include: { items: true, counterparty: true },
    });
    if (!invoice) throw new ApiError(404, "Invoice not found");

    const pdf = await generateInvoicePdfBuffer({
      invoiceNumber: invoice.number,
      invoiceDate: invoice.date.toISOString(),
      counterparty: invoice.counterparty,
      items: (invoice.items.map((it: any) => ({
        description: it.description,
        quantity: it.quantity,
        unit: it.unit,
        price: it.price,
        amount: it.amount,
      }))) as any,
    });

    const fileName = `Счет_${invoice.number}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.send(pdf);
  } catch (err) {
    next(err);
  }
});

// POST /admin/invoices/:id/send  — send PDF to client via Telegram
router.post("/invoices/:id/send", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { clientTelegramId } = req.body as { clientTelegramId: string };

    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid id");
    if (!clientTelegramId) throw new ApiError(400, "clientTelegramId required");

    const invoice = await (prisma as any).invoice.findUnique({
      where: { id },
      include: { items: true, counterparty: true },
    });
    if (!invoice) throw new ApiError(404, "Invoice not found");

    const total = invoice.items.reduce((s: number, it: any) => s + it.amount, 0);

    const pdf = await generateInvoicePdfBuffer({
      invoiceNumber: invoice.number,
      invoiceDate: invoice.date.toISOString(),
      counterparty: invoice.counterparty,
      items: (invoice.items.map((it: any) => ({
        description: it.description,
        quantity: it.quantity,
        unit: it.unit,
        price: it.price,
        amount: it.amount,
      }))) as any,
    });

    const fileName = `Счет_${invoice.number}.pdf`;
    await sendClientDocument(
      clientTelegramId,
      pdf,
      fileName,
      `Счёт ${invoice.number} на сумму ${total.toLocaleString("ru-RU")} руб.`,
    );

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Legacy endpoints for backward compat (RequestDetail still uses them)
// GET /admin/requests/:id/invoice.pdf?counterpartyId=...&amount=...
router.get("/requests/:id/invoice.pdf", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const counterpartyId = Number(req.query.counterpartyId);
    const amount = Number(req.query.amount);

    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid request id");
    if (!Number.isFinite(counterpartyId)) throw new ApiError(400, "Invalid counterpartyId");
    if (!Number.isFinite(amount) || amount <= 0) throw new ApiError(400, "Invalid amount");

    const shipReq = await prisma.shipmentRequest.findUnique({ where: { id }, include: { client: true } });
    if (!shipReq) throw new ApiError(404, "Request not found");

    const counterparty = await prisma.counterparty.findUnique({ where: { id: counterpartyId } });
    if (!counterparty) throw new ApiError(404, "Counterparty not found");

    const invoiceNumber = `З-${String(shipReq.id).padStart(6, "0")}`;
    const pdf = await generateInvoicePdfBuffer({
      invoiceNumber,
      invoiceDate: new Date().toISOString(),
      counterparty,
      items: ([{
        description: `Транспортные услуги по заявке №${shipReq.id}. ${shipReq.city}`,
        quantity: 1,
        unit: "усл",
        price: amount,
        amount,
      }]) as any,
    });
    const fileName = `Счет_заявка_${shipReq.id}.pdf`;

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

    const shipReq = await prisma.shipmentRequest.findUnique({ where: { id }, include: { client: true } });
    if (!shipReq) throw new ApiError(404, "Request not found");

    const counterparty = await prisma.counterparty.findUnique({ where: { id: counterpartyId } });
    if (!counterparty) throw new ApiError(404, "Counterparty not found");

    const invoiceNumber = `З-${String(shipReq.id).padStart(6, "0")}`;
    const pdf = await generateInvoicePdfBuffer({
      invoiceNumber,
      invoiceDate: new Date().toISOString(),
      counterparty,
      items: ([{
        description: `Транспортные услуги по заявке №${shipReq.id}. ${shipReq.city}`,
        quantity: 1,
        unit: "усл",
        price: amount,
        amount,
      }]) as any,
    });
    const fileName = `Счет_заявка_${shipReq.id}.pdf`;

    await sendClientDocument(
      shipReq.client.telegramId,
      pdf,
      fileName,
      `Счёт по заявке #${shipReq.id} на сумму ${amount.toLocaleString("ru-RU")} руб.`,
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

    const managerId = ((req as any).manager as { managerId: number }).managerId;

    const body = req.body as {
      city?: string;
      deliveryDate?: string;
      packagingType?: "pallets" | "boxes";
      volume?: number | null;
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

    if (body.volume !== undefined && body.volume !== null) {
      if (!Number.isFinite(body.volume) || body.volume <= 0) {
        throw new ApiError(400, "Invalid volume");
      }
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
        volume: body.volume === undefined ? undefined : body.volume,
        boxCount: body.boxCount,
        weight: body.weight === null ? (undefined as any) : (body.weight as any),
        comment: nextComment,
      } as any,
      include: { client: true },
    });

    // Log field-level changes (weight, boxCount, volume, packagingType, deliveryDate)
    const fieldChanges: { field: string; oldValue: string | null; newValue: string | null }[] = [];

    if (body.weight !== undefined && existing.weight !== updated.weight) {
      fieldChanges.push({
        field: "weight",
        oldValue: existing.weight == null ? null : String(existing.weight),
        newValue: updated.weight == null ? null : String(updated.weight),
      });
    }
    if (body.boxCount !== undefined && existing.boxCount !== updated.boxCount) {
      fieldChanges.push({
        field: "boxCount",
        oldValue: String(existing.boxCount),
        newValue: String(updated.boxCount),
      });
    }
    if (body.volume !== undefined && (existing as any).volume !== (updated as any).volume) {
      fieldChanges.push({
        field: "volume",
        oldValue: (existing as any).volume == null ? null : String((existing as any).volume),
        newValue: (updated as any).volume == null ? null : String((updated as any).volume),
      });
    }
    if (body.packagingType !== undefined && (existing as any).packagingType !== (updated as any).packagingType) {
      fieldChanges.push({
        field: "packagingType",
        oldValue: String((existing as any).packagingType),
        newValue: String((updated as any).packagingType),
      });
    }
    if (body.deliveryDate !== undefined && existing.deliveryDate.getTime() !== updated.deliveryDate.getTime()) {
      fieldChanges.push({
        field: "deliveryDate",
        oldValue: existing.deliveryDate.toISOString(),
        newValue: updated.deliveryDate.toISOString(),
      });
    }

    if (fieldChanges.length) {
      await (prisma as any).requestFieldHistory.createMany({
        data: fieldChanges.map((fc) => ({
          requestId: id,
          managerId,
          field: fc.field,
          oldValue: fc.oldValue,
          newValue: fc.newValue,
        })),
      });
    }

    const changedFields: string[] = [];
    if (body.city !== undefined && existing.city !== updated.city) changedFields.push("город");
    if (body.deliveryDate !== undefined && existing.deliveryDate.getTime() !== updated.deliveryDate.getTime()) {
      changedFields.push("дата");
    }
    if (body.packagingType !== undefined && (existing as any).packagingType !== (updated as any).packagingType) {
      changedFields.push("упаковка");
    }
    if (body.boxCount !== undefined && existing.boxCount !== updated.boxCount) changedFields.push("кол-во мест");
    if (body.volume !== undefined && (existing as any).volume !== (updated as any).volume) changedFields.push("объём");
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

// --------------- Cities ---------------

// GET /admin/cities
router.get("/cities", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cities = await (prisma as any).city.findMany({
      orderBy: { shortName: "asc" },
    });
    res.json(cities);
  } catch (err) {
    next(err);
  }
});

// POST /admin/cities
router.post("/cities", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shortName, fullName } = req.body as { shortName?: string; fullName?: string };
    if (!shortName?.trim()) throw new ApiError(400, "shortName is required");

    const created = await (prisma as any).city.create({
      data: { shortName: shortName.trim(), fullName: (fullName?.trim() || shortName.trim()) },
    });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/cities/:id
router.patch("/cities/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid id");

    const { shortName, fullName } = req.body as { shortName?: string; fullName?: string };
    const data: any = {};
    if (shortName?.trim()) data.shortName = shortName.trim();
    if (fullName?.trim()) data.fullName = fullName.trim();
    if (Object.keys(data).length === 0) throw new ApiError(400, "Nothing to update");

    const updated = await (prisma as any).city.update({
      where: { id },
      data,
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /admin/cities/:id
router.delete("/cities/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid id");

    const ratesCount = await (prisma as any).priceRate.count({ where: { cityId: id } });
    const requestsCount = await (prisma as any).shipmentRequest.count({ where: { cityId: id } });
    const schedulesCount = await (prisma as any).deliverySchedule.count({ where: { cityId: id } });
    if (ratesCount + requestsCount + schedulesCount > 0) {
      throw new ApiError(400, "Cannot delete city with existing rates, requests or schedules");
    }

    await (prisma as any).city.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// Legacy alias: GET /admin/directions -> GET /admin/cities
router.get("/directions", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cities = await (prisma as any).city.findMany({ orderBy: { shortName: "asc" } });
    res.json(cities.map((c: any) => ({ id: c.id, name: c.shortName, createdAt: c.createdAt, updatedAt: c.updatedAt })));
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
    if (req.query.cityId) {
      where.cityId = Number(req.query.cityId);
    } else if (req.query.directionId) {
      where.cityId = Number(req.query.directionId);
    }
    const rates = await (prisma as any).priceRate.findMany({
      where,
      include: { city: true },
      orderBy: [{ cityId: "asc" }, { unit: "asc" }],
    });
    res.json(rates);
  } catch (err) {
    next(err);
  }
});

// POST /admin/rates
router.post("/rates", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cityId, directionId, unit, price, comment } = req.body as {
      cityId?: number;
      directionId?: number;
      unit?: string;
      price?: number;
      comment?: string | null;
      minWeightKg?: number | null;
      maxWeightKg?: number | null;
      minVolumeM3?: number | null;
      maxVolumeM3?: number | null;
    };

    const resolvedCityId = cityId ?? directionId;
    if (!Number.isFinite(resolvedCityId)) throw new ApiError(400, "Invalid cityId");
    if (!unit || !VALID_UNITS.includes(unit)) throw new ApiError(400, "Invalid unit (pallet|kg|m3)");
    if (!Number.isFinite(price) || price! <= 0) throw new ApiError(400, "Invalid price");

    const tier = validateTier(unit, req.body);

    const created = await (prisma as any).priceRate.create({
      data: {
        cityId: resolvedCityId,
        unit,
        ...tier,
        price,
        comment: comment?.trim() || null,
      },
      include: { city: true },
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

    const { cityId, directionId, unit, price, comment } = req.body as {
      cityId?: number;
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
    const resolvedCityId = cityId ?? directionId;
    if (resolvedCityId !== undefined) data.cityId = resolvedCityId;
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
      include: { city: true },
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

// --------------- Delivery Schedule ---------------

// GET /admin/schedule
router.get("/schedule", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const schedules = await (prisma as any).deliverySchedule.findMany({
      orderBy: [{ deliveryDate: "asc" }, { destination: "asc" }],
    });
    res.json(schedules);
  } catch (err) {
    next(err);
  }
});

// POST /admin/schedule
router.post("/schedule", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cityId, destination, deliveryDate, acceptDays } = req.body as {
      cityId?: number;
      destination?: string;
      deliveryDate?: string;
      acceptDays?: string;
    };

    if (!deliveryDate) throw new ApiError(400, "deliveryDate is required");
    if (!acceptDays?.trim()) throw new ApiError(400, "acceptDays is required");

    const data: any = {
      deliveryDate: new Date(deliveryDate),
      acceptDays: acceptDays.trim(),
    };

    if (cityId !== undefined) {
      if (!Number.isFinite(cityId)) throw new ApiError(400, "Invalid cityId");
      data.cityId = cityId;
      data.destination = destination?.trim() || "";
    } else {
      if (!destination?.trim()) throw new ApiError(400, "destination is required");
      data.destination = destination.trim();
    }

    const created = await (prisma as any).deliverySchedule.create({ data });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/schedule/:id
router.patch("/schedule/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid id");

    const { cityId, destination, deliveryDate, acceptDays } = req.body as {
      cityId?: number;
      destination?: string;
      deliveryDate?: string;
      acceptDays?: string;
    };

    const data: any = {};
    if (deliveryDate !== undefined) data.deliveryDate = new Date(deliveryDate);
    if (acceptDays !== undefined) {
      if (!acceptDays?.trim()) throw new ApiError(400, "acceptDays is required");
      data.acceptDays = acceptDays.trim();
    }
    if (cityId !== undefined) {
      if (!Number.isFinite(cityId)) throw new ApiError(400, "Invalid cityId");
      data.cityId = cityId;
    }
    if (destination !== undefined) data.destination = destination.trim();
    if (Object.keys(data).length === 0) throw new ApiError(400, "Nothing to update");

    const updated = await (prisma as any).deliverySchedule.update({ where: { id }, data });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /admin/schedule/:id
router.delete("/schedule/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid id");

    await (prisma as any).deliverySchedule.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
