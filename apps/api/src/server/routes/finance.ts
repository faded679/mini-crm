import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth } from "../auth/middleware.js";
import { ApiError } from "../errors.js";
import { prisma } from "../db/prisma.js";
import {
  importBankStatement,
  matchTransaction,
  ignoreTransaction,
  getAllBalances,
  getCounterpartyTransactions,
  recalculateBalance,
} from "../services/bank-import-service.js";
import { generateReconciliationPdfBuffer, type ReconciliationEntry } from "../services/reconciliation-pdf.js";

const router = Router();
router.use(requireAuth);

// POST /admin/finance/import — upload and import bank statement file
router.post("/import", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileContent, fileName } = req.body as {
      fileContent: string;
      fileName: string;
    };

    if (!fileContent || !fileName) {
      throw new ApiError(400, "fileContent and fileName are required");
    }

    const result = await importBankStatement(fileContent, fileName, "manual");
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// GET /admin/finance/transactions — list all transactions with filters
router.get("/transactions", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, counterpartyId, dateFrom, dateTo } = req.query as {
      status?: string;
      counterpartyId?: string;
      dateFrom?: string;
      dateTo?: string;
    };

    const where: any = {};
    if (status) where.status = status;
    if (counterpartyId) where.counterpartyId = Number(counterpartyId);
    if (dateFrom || dateTo) {
      where.documentDate = {};
      if (dateFrom) where.documentDate.gte = new Date(dateFrom);
      if (dateTo) where.documentDate.lte = new Date(dateTo);
    }

    const transactions = await (prisma as any).bankTransaction.findMany({
      where,
      include: {
        counterparty: {
          select: { id: true, name: true, shortName: true, inn: true },
        },
      },
      orderBy: { documentDate: "desc" },
    });

    res.json(transactions);
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/finance/transactions/:id/match — manually match transaction to counterparty
router.patch("/transactions/:id/match", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { counterpartyId } = req.body as { counterpartyId: number };

    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid transaction id");
    if (!Number.isFinite(counterpartyId)) throw new ApiError(400, "Invalid counterpartyId");

    await matchTransaction(id, counterpartyId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/finance/transactions/:id/ignore — mark transaction as ignored
router.patch("/transactions/:id/ignore", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid transaction id");

    await ignoreTransaction(id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// GET /admin/finance/balances — get all counterparty balances
router.get("/balances", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const balances = await getAllBalances();
    res.json(balances);
  } catch (err) {
    next(err);
  }
});

// GET /admin/finance/counterparty/:id/transactions — transactions for specific org
router.get("/counterparty/:id/transactions", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const counterpartyId = Number(req.params.id);
    if (!Number.isFinite(counterpartyId)) throw new ApiError(400, "Invalid counterpartyId");

    const transactions = await getCounterpartyTransactions(counterpartyId);
    res.json(transactions);
  } catch (err) {
    next(err);
  }
});

// GET /admin/finance/counterparty/:id/summary — full financial summary for an org
router.get("/counterparty/:id/summary", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const counterpartyId = Number(req.params.id);
    if (!Number.isFinite(counterpartyId)) throw new ApiError(400, "Invalid counterpartyId");

    const { dateFrom, dateTo } = req.query as { dateFrom?: string; dateTo?: string };

    // Get counterparty info
    const counterparty = await (prisma as any).counterparty.findUnique({
      where: { id: counterpartyId },
      select: { id: true, name: true, shortName: true, inn: true },
    });
    if (!counterparty) throw new ApiError(404, "Counterparty not found");

    // Get balance
    const balance = await (prisma as any).counterpartyBalance.findUnique({
      where: { counterpartyId },
    });

    // Date filters
    const dateFilter: any = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) { const d = new Date(dateTo); d.setHours(23, 59, 59, 999); dateFilter.lte = d; }

    // Get invoices
    const invoiceWhere: any = { counterpartyId };
    if (dateFrom || dateTo) invoiceWhere.date = dateFilter;
    const invoices = await (prisma as any).invoice.findMany({
      where: invoiceWhere,
      include: { items: true },
      orderBy: { date: "asc" },
    });

    // Get matched payments
    const paymentWhere: any = { counterpartyId, status: "matched" };
    if (dateFrom || dateTo) paymentWhere.documentDate = dateFilter;
    const payments = await (prisma as any).bankTransaction.findMany({
      where: paymentWhere,
      orderBy: { documentDate: "asc" },
    });

    res.json({
      counterparty,
      balance: balance || { totalBilled: 0, totalPaid: 0, balance: 0 },
      invoices,
      payments,
    });
  } catch (err) {
    next(err);
  }
});

// POST /admin/finance/recalculate/:id — force recalculate balance for a counterparty
router.post("/recalculate/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const counterpartyId = Number(req.params.id);
    if (!Number.isFinite(counterpartyId)) throw new ApiError(400, "Invalid counterpartyId");

    await recalculateBalance(counterpartyId);
    const balance = await (prisma as any).counterpartyBalance.findUnique({
      where: { counterpartyId },
    });
    res.json(balance);
  } catch (err) {
    next(err);
  }
});

// POST /admin/finance/recalculate-all — recalculate balances for all counterparties
router.post("/recalculate-all", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Get all counterparties
    const counterparties = await (prisma as any).counterparty.findMany({
      select: { id: true },
    });

    let recalculated = 0;
    for (const cp of counterparties) {
      await recalculateBalance(cp.id);
      recalculated++;
    }

    res.json({ success: true, recalculated });
  } catch (err) {
    next(err);
  }
});

// GET /admin/finance/import-history — list all import batches
router.get("/import-history", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const batches = await (prisma as any).bankImportBatch.findMany({
      orderBy: { importedAt: "desc" },
    });
    res.json(batches);
  } catch (err) {
    next(err);
  }
});

// POST /admin/finance/import-from-email — fetch & import bank statements from email
router.post("/import-from-email", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || "http://172.17.0.1:5001";
    const daysBack = Number(req.body?.days_back) || 3;

    const fetchRes = await fetch(`${EMAIL_SERVICE_URL}/fetch-bank-statements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days_back: daysBack, mark_read: false }),
      signal: AbortSignal.timeout(60000),
    });

    if (!fetchRes.ok) {
      const text = await fetchRes.text();
      throw new ApiError(502, `Email service error: ${text}`);
    }

    const data = (await fetchRes.json()) as { statements: { filename: string; content: string }[]; count: number };

    const results = [];
    for (const stmt of data.statements || []) {
      try {
        const result = await importBankStatement(stmt.content, stmt.filename, "email-manual");
        results.push({ filename: stmt.filename, ...result });
      } catch (err: any) {
        results.push({ filename: stmt.filename, error: err.message });
      }
    }

    res.json({ statementsFound: data.count, results });
  } catch (err) {
    next(err);
  }
});

// GET /admin/finance/counterparty/:id/reconciliation-pdf — generate reconciliation act PDF
router.get("/counterparty/:id/reconciliation-pdf", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const counterpartyId = Number(req.params.id);
    if (!Number.isFinite(counterpartyId)) throw new ApiError(400, "Invalid counterpartyId");

    const { dateFrom, dateTo } = req.query as { dateFrom?: string; dateTo?: string };

    const counterparty = await (prisma as any).counterparty.findUnique({
      where: { id: counterpartyId },
      select: { id: true, name: true, shortName: true, inn: true, kpp: true, address: true, director: true },
    });
    if (!counterparty) throw new ApiError(404, "Counterparty not found");

    // Date range
    const from = dateFrom ? new Date(dateFrom) : new Date(new Date().getFullYear(), 0, 1);
    const to = dateTo ? new Date(dateTo) : new Date();
    to.setHours(23, 59, 59, 999);

    // Invoices in period
    const invoices = await (prisma as any).invoice.findMany({
      where: {
        counterpartyId,
        date: { gte: from, lte: to },
      },
      include: { items: true },
      orderBy: { date: "asc" },
    });

    // Payments in period
    const payments = await (prisma as any).bankTransaction.findMany({
      where: {
        counterpartyId,
        status: "matched",
        documentDate: { gte: from, lte: to },
      },
      orderBy: { documentDate: "asc" },
    });

    // Build entries
    const entries: ReconciliationEntry[] = [];

    for (const inv of invoices) {
      const total = inv.items.reduce((s: number, it: any) => s + (Number(it.amount) || 0), 0);
      entries.push({
        date: inv.date.toISOString(),
        description: `Счёт №${inv.number}`,
        debit: total,
        credit: 0,
      });
    }

    for (const p of payments) {
      entries.push({
        date: p.documentDate.toISOString(),
        description: `Оплата: ${p.purpose.slice(0, 80)}`,
        debit: 0,
        credit: p.amount,
      });
    }

    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const pdfBuffer = await generateReconciliationPdfBuffer({
      counterparty: {
        name: counterparty.name,
        inn: counterparty.inn,
        kpp: counterparty.kpp,
        address: counterparty.address,
        director: counterparty.director,
      },
      dateFrom: from.toISOString(),
      dateTo: to.toISOString(),
      entries,
      openingBalance: 0,
    });

    const safeName = (counterparty.shortName || counterparty.name).replace(/[^\wА-яа-я\s]/gi, "").slice(0, 40);
    const fromStr = from.toLocaleDateString("ru-RU").replace(/\./g, "-");
    const toStr = to.toLocaleDateString("ru-RU").replace(/\./g, "-");
    const filename = `Акт_сверки_${safeName}_${fromStr}_${toStr}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});

// DELETE /admin/finance/transactions/:id — удалить запись оплаты (только для директора)
router.delete("/transactions/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new ApiError(400, "Invalid transaction id");

    const manager = (req as any).manager;
    if (manager?.role !== "director") {
      throw new ApiError(403, "Только руководитель может удалять записи оплаты");
    }

    const tx = await (prisma as any).bankTransaction.findUnique({
      where: { id },
      include: { counterparty: true },
    });
    if (!tx) throw new ApiError(404, "Transaction not found");

    await (prisma as any).bankTransaction.delete({ where: { id } });

    if (tx.counterpartyId) {
      await recalculateBalance(tx.counterpartyId);
    }

    res.json({ success: true, message: "Payment record deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
