import { Router, type Request, type Response, type NextFunction } from "express";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../auth/middleware.js";
import { ApiError } from "../errors.js";
import { notifyClient } from "../services/telegram-notifier.js";
import { sendClientDocument } from "../services/telegram-notifier.js";
import { RequestStatus } from "@prisma/client";
import { generateInvoicePdfBuffer } from "../services/invoice-pdf.js";
import { generateActPdfBuffer } from "../services/act-pdf.js";

const router = Router();
router.use(requireAuth);

type CounterpartyPayload = {
  name: string;
  shortName?: string | null;
  orgType?: string | null;
  orgStatus?: string | null;
  inn?: string | null;
  kpp?: string | null;
  ogrn?: string | null;
  address?: string | null;
  account?: string | null;
  bik?: string | null;
  correspondentAccount?: string | null;
  bank?: string | null;
  director?: string | null;
  directorPost?: string | null;
  contract?: string | null;
  contactClientIds?: number[];
};

// --------------- DaData ---------------

function dadataStatusRu(status?: string | null) {
  const s = status ?? "";
  const map: Record<string, string> = {
    ACTIVE: "Действующая",
    LIQUIDATING: "Ликвидируется",
    LIQUIDATED: "Ликвидирована",
    BANKRUPT: "Банкротство",
    REORGANIZING: "Реорганизация",
  };
  return map[s] ?? s;
}

function dadataTypeRu(type?: string | null) {
  const t = type ?? "";
  if (t === "LEGAL") return "Юридическое лицо";
  if (t === "INDIVIDUAL") return "Индивидуальный предприниматель";
  return t;
}

// POST /admin/tools/dadata/party
router.post("/tools/dadata/party", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = process.env.DADATA_TOKEN;
    if (!token) throw new ApiError(500, "DADATA_TOKEN not configured");

    const { query, branchType, kpp, type: orgType } = req.body as {
      query?: string;
      branchType?: string;
      kpp?: string;
      type?: string;
    };
    if (!query?.trim()) throw new ApiError(400, "query (INN or OGRN) is required");

    const body: Record<string, unknown> = { query: query.trim() };
    if (branchType) body.branch_type = branchType;
    if (kpp) body.kpp = kpp;
    if (orgType) body.type = orgType;

    const dadataRes = await fetch(
      "https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(body),
      },
    );

    if (!dadataRes.ok) {
      const text = await dadataRes.text();
      throw new ApiError(dadataRes.status, `DaData error: ${text}`);
    }

    const json = (await dadataRes.json()) as { suggestions: any[] };
    const s = json.suggestions?.[0];
    if (!s) {
      res.json({ found: false, message: "Организация не найдена" });
      return;
    }

    const d = s.data;
    res.json({
      found: true,
      name: d.name?.full_with_opf ?? s.value,
      shortName: d.name?.short_with_opf ?? null,
      orgType: dadataTypeRu(d.type) || null,
      orgStatus: dadataStatusRu(d.state?.status) || null,
      inn: d.inn ?? null,
      kpp: d.kpp ?? null,
      ogrn: d.ogrn ?? null,
      address: d.address?.value ?? null,
      director: d.management?.name ?? null,
      directorPost: d.management?.post ?? null,
    });
  } catch (err) {
    next(err);
  }
});

// POST /admin/requests — create request from admin panel
router.post("/requests", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clientId, cityId, deliveryDate, packagingType, boxTypeId, boxCount, weight, comment } = req.body as {
      clientId: number;
      cityId: number;
      deliveryDate: string;
      packagingType: "pallets" | "boxes";
      boxTypeId?: number;
      boxCount: number;
      weight?: number;
      comment?: string;
    };

    if (!clientId) throw new ApiError(400, "clientId is required");
    if (!cityId) throw new ApiError(400, "cityId is required");
    if (!deliveryDate) throw new ApiError(400, "deliveryDate is required");
    if (!packagingType) throw new ApiError(400, "packagingType is required");
    if (!boxCount || boxCount < 1) throw new ApiError(400, "boxCount is required");

    const client = await (prisma as any).client.findUnique({ where: { id: clientId } });
    if (!client) throw new ApiError(404, "Client not found");

    const city = await (prisma as any).city.findUnique({ where: { id: cityId } });
    if (!city) throw new ApiError(404, "City not found");

    const created = await (prisma as any).shipmentRequest.create({
      data: {
        clientId,
        cityId,
        city: city.shortName,
        deliveryDate: new Date(deliveryDate),
        packagingType,
        boxCount,
        size: "-",
        ...(boxTypeId ? { boxTypeId } : {}),
        ...(weight != null ? { weight } : {}),
        ...(comment ? { comment } : {}),
        status: "new",
        isRead: true,
      },
      include: { client: true, boxType: true, services: true },
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// GET /admin/requests
router.get("/requests", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await (prisma as any).shipmentRequest.findMany({
      include: { client: true, boxType: true, services: true, deliveryType: true },
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
        client: {
          include: {
            counterparties: {
              include: {
                counterparty: true,
              },
            },
          },
        },
        boxType: true,
        deliveryType: true,
        history: { orderBy: { changedAt: "desc" } },
        fieldHistory: { orderBy: { changedAt: "desc" }, include: { manager: { select: { id: true, name: true } } } },
        services: { orderBy: { id: "asc" } },
      },
    });
    if (!request) throw new ApiError(404, "Request not found");
    if (!request.isRead) {
      await (prisma as any).shipmentRequest.update({ where: { id }, data: { isRead: true } });
      request.isRead = true;
    }
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

    let matched: any = null;
    if ((shipment as any).packagingType === "boxes") {
      const btId = (shipment as any).boxTypeId;
      if (btId) {
        matched = await (prisma as any).priceRate.findFirst({
          where: { cityId: shipment.cityId, unit: "boxes", boxTypeId: btId },
        });
      }
    } else {
      matched = await (prisma as any).priceRate.findFirst({
        where: { cityId: shipment.cityId, unit: "pallet" },
      });
    }

    if (!matched) {
      res.json({ found: false, message: "Подходящий тариф не найден" });
      return;
    }

    const cityName = shipment.cityRef?.fullName || shipment.city;
    const unitLabels: Record<string, string> = { pallet: "паллет", boxes: "коробка" };
    const unitLabel = unitLabels[matched.unit] || matched.unit;
    const boxTypeName = (shipment as any).boxTypeId
      ? (await (prisma as any).boxType.findUnique({ where: { id: (shipment as any).boxTypeId } }))?.name
      : null;
    const description = `${cityName}${matched.unit === "boxes" && boxTypeName ? ` - ${boxTypeName}` : ""}`.trim();
    const qty = (shipment as any).boxCount || 1;

    res.json({
      found: true,
      description,
      unit: unitLabel,
      quantity: qty,
      price: matched.price,
      amount: qty * matched.price,
    });
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

// PATCH /admin/invoices/:id/payment
router.patch("/invoices/:id/payment", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid id");

    const { isPaid } = req.body as { isPaid: boolean };
    if (typeof isPaid !== "boolean") throw new ApiError(400, "isPaid must be boolean");

    const updated = await (prisma as any).invoice.update({
      where: { id },
      data: {
        isPaid,
        paidAt: isPaid ? new Date() : null,
      },
      include: { items: true, counterparty: true },
    });

    res.json(updated);
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

// GET /admin/invoices/:id/act-pdf  — generate and download Act PDF
router.get("/invoices/:id/act-pdf", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid id");

    const invoice = await (prisma as any).invoice.findUnique({
      where: { id },
      include: { items: true, counterparty: true },
    });
    if (!invoice) throw new ApiError(404, "Invoice not found");

    const pdf = await generateActPdfBuffer({
      actNumber: invoice.number,
      actDate: invoice.date.toISOString(),
      invoiceNumber: invoice.number,
      invoiceDate: invoice.date.toISOString(),
      counterparty: invoice.counterparty,
      items: invoice.items.map((it: any) => ({
        description: it.description,
        quantity: it.quantity,
        unit: it.unit,
        price: it.price,
        amount: it.amount,
      })),
    });

    const fileName = `Акт_${invoice.number}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.send(pdf);
  } catch (err) {
    next(err);
  }
});

// POST /admin/invoices/:id/send-act  — send Act PDF to client via Telegram
router.post("/invoices/:id/send-act", async (req: Request, res: Response, next: NextFunction) => {
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

    const pdf = await generateActPdfBuffer({
      actNumber: invoice.number,
      actDate: invoice.date.toISOString(),
      invoiceNumber: invoice.number,
      invoiceDate: invoice.date.toISOString(),
      counterparty: invoice.counterparty,
      items: invoice.items.map((it: any) => ({
        description: it.description,
        quantity: it.quantity,
        unit: it.unit,
        price: it.price,
        amount: it.amount,
      })),
    });
    const fileName = `Акт_${invoice.number}.pdf`;

    await sendClientDocument(
      clientTelegramId,
      pdf,
      fileName,
      `Акт выполненных работ ${invoice.number} на сумму ${total.toLocaleString("ru-RU")} руб.`,
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

// POST /admin/requests/bulk-status
router.post("/requests/bulk-status", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids, status } = req.body as { ids: number[]; status: RequestStatus };

    if (!Array.isArray(ids) || ids.length === 0) throw new ApiError(400, "ids must be a non-empty array");
    if (!Object.values(RequestStatus).includes(status)) throw new ApiError(400, "Invalid status");

    const requests = await prisma.shipmentRequest.findMany({
      where: { id: { in: ids } },
      include: { client: true },
    });

    const statusLabels: Record<RequestStatus, string> = {
      new: "Новый",
      warehouse: "Склад",
      shipped: "Отгружен",
      done: "Выполнена",
    };

    await prisma.$transaction(async (tx) => {
      for (const r of requests) {
        if (r.status === status) continue;

        await tx.shipmentRequest.update({ where: { id: r.id }, data: { status } });
        await tx.requestStatusHistory.create({
          data: { requestId: r.id, oldStatus: r.status, newStatus: status },
        });
      }
    });

    // Notify clients outside transaction
    for (const r of requests) {
      if (r.status === status) continue;
      try {
        await notifyClient(
          r.client.telegramId,
          `Статус вашей заявки #${r.id} изменён: <b>${statusLabels[status]}</b>`,
        );
      } catch { /* ignore notification errors */ }
    }

    res.json({ updated: requests.filter((r) => r.status !== status).length });
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
      boxTypeId?: number | null;
      volume?: number | null;
      boxCount?: number;
      weight?: number | null;
      comment?: string | null;
      deliveryTypeId?: number | null;
      mpAccountDate?: string | null;
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

    if (body.boxTypeId !== undefined && body.boxTypeId !== null) {
      if (!Number.isFinite(body.boxTypeId) || body.boxTypeId <= 0) {
        throw new ApiError(400, "Invalid boxTypeId");
      }
      const exists = await (prisma as any).boxType.findUnique({ where: { id: Number(body.boxTypeId) } });
      if (!exists) throw new ApiError(400, "Invalid boxTypeId");
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
        boxTypeId:
          (body.packagingType ?? existing.packagingType) === "boxes"
            ? body.boxTypeId === undefined
              ? undefined
              : body.boxTypeId === null
                ? null
                : Number(body.boxTypeId)
            : null,
        volume: body.volume === undefined ? undefined : body.volume,
        boxCount: body.boxCount,
        weight: body.weight === undefined ? undefined : (body.weight as any),
        comment: nextComment,
        deliveryTypeId: body.deliveryTypeId === undefined ? undefined : body.deliveryTypeId,
        mpAccountDate: body.mpAccountDate === undefined ? undefined : body.mpAccountDate === null ? null : new Date(body.mpAccountDate),
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

// --------------- Delivery Types ---------------

// GET /admin/delivery-types
router.get("/delivery-types", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const types = await (prisma as any).deliveryType.findMany({
      orderBy: { name: "asc" },
    });
    res.json(types);
  } catch (err) {
    next(err);
  }
});

// POST /admin/delivery-types
router.post("/delivery-types", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, note } = req.body as { name?: string; note?: string };
    if (!name?.trim()) throw new ApiError(400, "name is required");

    const created = await (prisma as any).deliveryType.create({
      data: { name: name.trim(), note: note?.trim() || null },
    });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/delivery-types/:id
router.patch("/delivery-types/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid id");

    const { name, note } = req.body as { name?: string; note?: string | null };
    const data: any = {};
    if (name?.trim()) data.name = name.trim();
    if (note !== undefined) data.note = note?.trim() || null;
    if (Object.keys(data).length === 0) throw new ApiError(400, "Nothing to update");

    const updated = await (prisma as any).deliveryType.update({
      where: { id },
      data,
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /admin/delivery-types/:id
router.delete("/delivery-types/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid id");

    const requestsCount = await (prisma as any).shipmentRequest.count({ where: { deliveryTypeId: id } });
    if (requestsCount > 0) {
      throw new ApiError(400, "Нельзя удалить тип поставки: есть связанные заявки");
    }

    await (prisma as any).deliveryType.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// GET /admin/clients
router.get("/clients", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        _count: { select: { requests: true } },
        counterparties: {
          include: {
            counterparty: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
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
        counterparties: {
          include: {
            counterparty: true,
          },
          orderBy: { createdAt: "desc" },
        },
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

// DELETE /admin/clients/:id
router.delete("/clients/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid id");

    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) throw new ApiError(404, "Client not found");

    // Delete related records in order (cascade)
    // 1. Delete request status history
    await prisma.requestStatusHistory.deleteMany({
      where: {
        request: {
          clientId: id,
        },
      },
    });

    // 2. Delete shipment requests
    await prisma.shipmentRequest.deleteMany({
      where: { clientId: id },
    });

    // 3. Delete counterparty contacts
    await prisma.counterpartyContact.deleteMany({
      where: { clientId: id },
    });

    // 4. Delete the client
    await prisma.client.delete({
      where: { id },
    });

    res.status(204).send();
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

    const created = await (prisma as any).counterparty.create({
      data: {
        name: body.name.trim(),
        shortName: body.shortName ?? null,
        orgType: body.orgType ?? null,
        orgStatus: body.orgStatus ?? null,
        inn: body.inn ?? null,
        kpp: body.kpp ?? null,
        ogrn: body.ogrn ?? null,
        address: body.address ?? null,
        account: body.account ?? null,
        bik: body.bik ?? null,
        correspondentAccount: body.correspondentAccount ?? null,
        bank: body.bank ?? null,
        director: body.director ?? null,
        directorPost: body.directorPost ?? null,
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

    const updated = await (prisma as any).counterparty.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name.trim() : undefined,
        shortName: body.shortName !== undefined ? body.shortName : undefined,
        orgType: body.orgType !== undefined ? body.orgType : undefined,
        orgStatus: body.orgStatus !== undefined ? body.orgStatus : undefined,
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
        directorPost: body.directorPost !== undefined ? body.directorPost : undefined,
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

    const invoicesCount = await (prisma as any).invoice.count({ where: { counterpartyId: id } });
    if (invoicesCount > 0) {
      throw new ApiError(400, "Нельзя удалить организацию: есть счета");
    }

    await prisma.counterpartyContact.deleteMany({ where: { counterpartyId: id } });

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

// --------------- Cities FBS ---------------

// GET /admin/cities-fbs
router.get("/cities-fbs", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cities = await (prisma as any).cityFbs.findMany({
      orderBy: { shortName: "asc" },
    });
    res.json(cities);
  } catch (err) {
    next(err);
  }
});

// POST /admin/cities-fbs
router.post("/cities-fbs", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shortName, fullName } = req.body as { shortName?: string; fullName?: string };
    if (!shortName?.trim()) throw new ApiError(400, "shortName is required");

    const created = await (prisma as any).cityFbs.create({
      data: { shortName: shortName.trim(), fullName: (fullName?.trim() || shortName.trim()) },
    });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/cities-fbs/:id
router.patch("/cities-fbs/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid id");

    const { shortName, fullName } = req.body as { shortName?: string; fullName?: string };
    const data: any = {};
    if (shortName?.trim()) data.shortName = shortName.trim();
    if (fullName?.trim()) data.fullName = fullName.trim();
    if (Object.keys(data).length === 0) throw new ApiError(400, "Nothing to update");

    const updated = await (prisma as any).cityFbs.update({
      where: { id },
      data,
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /admin/cities-fbs/:id
router.delete("/cities-fbs/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid id");

    await (prisma as any).cityFbs.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// --------------- Rates ---------------

const VALID_UNITS = ["pallet", "boxes"];

// --------------- Pallet Types ---------------

router.get("/pallet-types", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const types = await (prisma as any).palletType.findMany({
      orderBy: { minValue: "asc" },
    });
    res.json(types);
  } catch (err) {
    next(err);
  }
});

router.post("/pallet-types", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, minValue, maxValue, comment } = req.body as {
      name?: string;
      minValue?: number;
      maxValue?: number | null;
      comment?: string | null;
    };
    if (!name?.trim()) throw new ApiError(400, "name is required");
    if (minValue === undefined || !Number.isFinite(minValue)) throw new ApiError(400, "Invalid minValue");

    const created = await (prisma as any).palletType.create({
      data: {
        name: name.trim(),
        minValue,
        maxValue: maxValue !== undefined && maxValue !== null ? maxValue : null,
        comment: comment?.trim() || null,
      },
    });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.patch("/pallet-types/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid id");

    const { name, minValue, maxValue, comment } = req.body as {
      name?: string;
      minValue?: number;
      maxValue?: number | null;
      comment?: string | null;
    };

    const data: any = {};
    if (name !== undefined) data.name = name.trim();
    if (minValue !== undefined) data.minValue = minValue;
    if (maxValue !== undefined) data.maxValue = maxValue;
    if (comment !== undefined) data.comment = comment?.trim() || null;

    const updated = await (prisma as any).palletType.update({ where: { id }, data });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete("/pallet-types/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid id");

    const ratesCount = await (prisma as any).priceRate.count({ where: { palletTypeId: id } });
    if (ratesCount > 0) throw new ApiError(400, "Cannot delete pallet type with existing rates");

    await (prisma as any).palletType.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// --------------- Box Types ---------------

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

router.post("/box-types", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, minVolumeM3, maxVolumeM3 } = req.body as {
      name?: string;
      minVolumeM3?: number;
      maxVolumeM3?: number;
    };
    if (!name?.trim()) throw new ApiError(400, "name is required");
    if (maxVolumeM3 === undefined || !Number.isFinite(maxVolumeM3) || maxVolumeM3! <= 0) {
      throw new ApiError(400, "Invalid maxVolumeM3");
    }

    const created = await (prisma as any).boxType.create({
      data: {
        name: name.trim(),
        minVolumeM3: minVolumeM3 !== undefined && Number.isFinite(minVolumeM3) ? minVolumeM3 : 0,
        maxVolumeM3,
      },
    });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.patch("/box-types/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid id");

    const { name, minVolumeM3, maxVolumeM3 } = req.body as {
      name?: string;
      minVolumeM3?: number;
      maxVolumeM3?: number;
    };

    const data: any = {};
    if (name !== undefined) data.name = name.trim();
    if (minVolumeM3 !== undefined) {
      if (!Number.isFinite(minVolumeM3) || minVolumeM3! < 0) throw new ApiError(400, "Invalid minVolumeM3");
      data.minVolumeM3 = minVolumeM3;
    }
    if (maxVolumeM3 !== undefined) {
      if (!Number.isFinite(maxVolumeM3) || maxVolumeM3! <= 0) throw new ApiError(400, "Invalid maxVolumeM3");
      data.maxVolumeM3 = maxVolumeM3;
    }

    const updated = await (prisma as any).boxType.update({ where: { id }, data });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete("/box-types/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid id");

    const ratesCount = await (prisma as any).priceRate.count({ where: { boxTypeId: id } });
    if (ratesCount > 0) throw new ApiError(400, "Cannot delete box type with existing rates");

    await (prisma as any).boxType.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// --------------- Service Prices ---------------

router.get("/service-prices", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await (prisma as any).servicePrice.findMany({ orderBy: { id: "asc" } });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

router.post("/service-prices", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, price, unit, comment } = req.body as {
      name?: string;
      price?: number;
      unit?: string;
      comment?: string | null;
    };
    if (!name?.trim()) throw new ApiError(400, "name is required");
    if (price === undefined || !Number.isFinite(price) || price < 0) throw new ApiError(400, "Invalid price");

    const created = await (prisma as any).servicePrice.create({
      data: {
        name: name.trim(),
        price,
        unit: unit?.trim() || "услуга",
        comment: comment?.trim() || null,
      },
    });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.patch("/service-prices/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid id");

    const { name, price, unit, comment } = req.body as {
      name?: string;
      price?: number;
      unit?: string;
      comment?: string | null;
    };

    const data: any = {};
    if (name !== undefined) data.name = name.trim();
    if (price !== undefined) {
      if (!Number.isFinite(price) || price! < 0) throw new ApiError(400, "Invalid price");
      data.price = price;
    }
    if (unit !== undefined) data.unit = unit.trim();
    if (comment !== undefined) data.comment = comment?.trim() || null;

    const updated = await (prisma as any).servicePrice.update({ where: { id }, data });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete("/service-prices/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid id");
    await (prisma as any).servicePrice.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

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
      include: { city: true, boxType: true, palletType: true },
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
    const { cityId, directionId, unit, price, comment, boxTypeId, palletTypeId } = req.body as {
      cityId?: number;
      directionId?: number;
      unit?: string;
      price?: number;
      comment?: string | null;
      boxTypeId?: number | null;
      palletTypeId?: number | null;
    };

    const resolvedCityId = cityId ?? directionId;
    if (!Number.isFinite(resolvedCityId)) throw new ApiError(400, "Invalid cityId");
    if (!unit || !VALID_UNITS.includes(unit)) throw new ApiError(400, "Invalid unit (pallet|boxes)");
    if (!Number.isFinite(price) || price! <= 0) throw new ApiError(400, "Invalid price");

    const parsedBoxTypeId =
      boxTypeId !== undefined && boxTypeId !== null ? Number(boxTypeId) : null;
    if (unit === "boxes") {
      if (!Number.isFinite(parsedBoxTypeId) || parsedBoxTypeId! <= 0) {
        throw new ApiError(400, "boxTypeId is required for boxes");
      }
      const exists = await (prisma as any).boxType.findUnique({ where: { id: parsedBoxTypeId } });
      if (!exists) throw new ApiError(400, "Invalid boxTypeId");
    }

    const parsedPalletTypeId =
      palletTypeId !== undefined && palletTypeId !== null ? Number(palletTypeId) : null;
    if (unit === "pallet" && parsedPalletTypeId !== null) {
      const exists = await (prisma as any).palletType.findUnique({ where: { id: parsedPalletTypeId } });
      if (!exists) throw new ApiError(400, "Invalid palletTypeId");
    }

    const created = await (prisma as any).priceRate.create({
      data: {
        cityId: resolvedCityId,
        unit,
        boxTypeId: unit === "boxes" ? parsedBoxTypeId : null,
        palletTypeId: unit === "pallet" ? parsedPalletTypeId : null,
        price,
        comment: comment?.trim() || null,
      },
      include: { city: true, boxType: true, palletType: true },
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

    const { cityId, directionId, unit, price, comment, boxTypeId, palletTypeId } = req.body as {
      cityId?: number;
      directionId?: number;
      unit?: string;
      price?: number;
      comment?: string | null;
      boxTypeId?: number | null;
      palletTypeId?: number | null;
    };

    if (unit !== undefined && !VALID_UNITS.includes(unit)) {
      throw new ApiError(400, "Invalid unit (pallet|boxes)");
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
    if (boxTypeId !== undefined) {
      data.boxTypeId = boxTypeId === null ? null : Number(boxTypeId);
    }
    if (palletTypeId !== undefined) {
      data.palletTypeId = palletTypeId === null ? null : Number(palletTypeId);
    }

    const existing = await (prisma as any).priceRate.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Not found");

    const finalUnit = unit ?? existing.unit;
    const finalBoxTypeId =
      boxTypeId !== undefined ? (boxTypeId === null ? null : Number(boxTypeId)) : existing.boxTypeId;
    if (finalUnit === "boxes") {
      if (!Number.isFinite(finalBoxTypeId) || finalBoxTypeId <= 0) {
        throw new ApiError(400, "boxTypeId is required for boxes");
      }
      const exists = await (prisma as any).boxType.findUnique({ where: { id: finalBoxTypeId } });
      if (!exists) throw new ApiError(400, "Invalid boxTypeId");
      data.boxTypeId = finalBoxTypeId;
      data.palletTypeId = null;
    } else {
      data.boxTypeId = null;
      const finalPalletTypeId =
        palletTypeId !== undefined ? (palletTypeId === null ? null : Number(palletTypeId)) : existing.palletTypeId;
      if (finalPalletTypeId !== null) {
        const exists = await (prisma as any).palletType.findUnique({ where: { id: finalPalletTypeId } });
        if (!exists) throw new ApiError(400, "Invalid palletTypeId");
      }
      data.palletTypeId = finalPalletTypeId;
    }

    const updated = await (prisma as any).priceRate.update({
      where: { id },
      data,
      include: { city: true, boxType: true, palletType: true },
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

// --------------- Schedule FBS ---------------

// GET /admin/schedule-fbs
router.get("/schedule-fbs", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const schedules = await (prisma as any).deliveryScheduleFbs.findMany({
      orderBy: [{ deliveryDate: "asc" }, { destination: "asc" }],
    });
    res.json(schedules);
  } catch (err) {
    next(err);
  }
});

// POST /admin/schedule-fbs
router.post("/schedule-fbs", async (req: Request, res: Response, next: NextFunction) => {
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

    const created = await (prisma as any).deliveryScheduleFbs.create({ data });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/schedule-fbs/:id
router.patch("/schedule-fbs/:id", async (req: Request, res: Response, next: NextFunction) => {
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

    const updated = await (prisma as any).deliveryScheduleFbs.update({ where: { id }, data });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /admin/schedule-fbs/:id
router.delete("/schedule-fbs/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid id");

    await (prisma as any).deliveryScheduleFbs.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// --------------- Broadcast ---------------

// POST /admin/broadcast — send message to all clients (or selected)
router.post("/broadcast", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, clientIds } = req.body as {
      message: string;
      clientIds?: number[];
    };

    if (!message || !message.trim()) throw new ApiError(400, "Message is required");

    let clients: any[];
    if (Array.isArray(clientIds) && clientIds.length > 0) {
      clients = await prisma.client.findMany({
        where: { id: { in: clientIds } },
      });
    } else {
      clients = await prisma.client.findMany();
    }

    let sent = 0;
    let failed = 0;
    for (const client of clients) {
      try {
        await notifyClient(client.telegramId, message);
        sent++;
      } catch {
        failed++;
      }
    }

    res.json({ ok: true, sent, failed, total: clients.length });
  } catch (err) {
    next(err);
  }
});

export default router;
