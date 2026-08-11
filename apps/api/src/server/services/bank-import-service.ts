import { prisma } from "../db/prisma.js";
import {
  parseBankStatement,
  filterIncomingPayments,
  extractInvoiceNumbers,
  type ParsedBankStatement,
  type BankDocument,
} from "./bank-parser.js";

export interface ImportResult {
  batchId: string;
  totalDocuments: number;
  incomingCount: number;
  importedCount: number;
  skippedDuplicates: number;
  matchedCount: number;
  unmatchedCount: number;
  transactions: {
    id: number;
    payerName: string;
    amount: number;
    status: string;
    counterpartyName?: string;
    invoiceNumbers: string[];
  }[];
}

/**
 * Import a bank statement file:
 * 1. Parse the 1CClientBankExchange format
 * 2. Filter only incoming payments
 * 3. Create import batch
 * 4. For each payment: match counterparty by INN, extract invoice numbers
 * 5. Deduplicate by unique constraint
 * 6. Recalculate balances for affected counterparties
 */
export async function importBankStatement(
  fileContent: string,
  fileName: string,
  source: string = "manual"
): Promise<ImportResult> {
  const parsed = parseBankStatement(fileContent);
  const incoming = filterIncomingPayments(parsed.documents);

  // Create import batch
  const batch = await (prisma as any).bankImportBatch.create({
    data: {
      fileName,
      periodStart: new Date(parseRuDate(parsed.summary.periodStart || parsed.header.periodStart)),
      periodEnd: new Date(parseRuDate(parsed.summary.periodEnd || parsed.header.periodEnd)),
      account: parsed.summary.account || parsed.header.account,
      totalIncoming: parsed.summary.totalIncoming,
      totalOutgoing: parsed.summary.totalOutgoing,
      openBalance: parsed.summary.openBalance,
      closeBalance: parsed.summary.closeBalance,
      recordCount: incoming.length,
      source,
    },
  });

  // Load all counterparties with INN for matching
  const counterparties = await prisma.counterparty.findMany({
    where: { inn: { not: null } },
    select: { id: true, inn: true, name: true },
  });
  const innMap = new Map(counterparties.map((cp) => [cp.inn!, cp]));

  let importedCount = 0;
  let skippedDuplicates = 0;
  let matchedCount = 0;
  let unmatchedCount = 0;
  const resultTransactions: ImportResult["transactions"] = [];

  for (const doc of incoming) {
    const invoiceNumbers = extractInvoiceNumbers(doc.purpose);
    const counterparty = innMap.get(doc.payerInn);
    const status = counterparty ? "matched" : "unmatched";

    try {
      const tx = await (prisma as any).bankTransaction.create({
        data: {
          documentNumber: doc.number,
          documentDate: new Date(parseRuDate(doc.date)),
          amount: doc.amount,
          direction: "incoming",
          payerName: doc.payerName,
          payerInn: doc.payerInn || null,
          payerAccount: doc.payerAccount || null,
          payerBik: doc.payerBik || null,
          payerBank: doc.payerBank || null,
          recipientName: doc.recipientName,
          recipientInn: doc.recipientInn || null,
          recipientAccount: doc.recipientAccount || null,
          purpose: doc.purpose,
          counterpartyId: counterparty?.id || null,
          invoiceNumbers,
          status,
          matchedAt: counterparty ? new Date() : null,
          importBatchId: batch.id,
          rawData: doc.rawFields as any,
        },
      });

      importedCount++;
      if (counterparty) matchedCount++;
      else unmatchedCount++;

      resultTransactions.push({
        id: tx.id,
        payerName: doc.payerName,
        amount: doc.amount,
        status,
        counterpartyName: counterparty?.name,
        invoiceNumbers,
      });
    } catch (err: any) {
      // Unique constraint violation = duplicate
      if (err.code === "P2002") {
        skippedDuplicates++;
      } else {
        throw err;
      }
    }
  }

  // Recalculate balances for all affected counterparties
  const affectedCpIds = new Set(
    resultTransactions
      .filter((t) => t.status === "matched")
      .map((t) => {
        const cp = counterparties.find((c) => c.name === t.counterpartyName);
        return cp?.id;
      })
      .filter(Boolean) as number[]
  );

  for (const cpId of affectedCpIds) {
    await recalculateBalance(cpId);
  }

  return {
    batchId: batch.id,
    totalDocuments: parsed.documents.length,
    incomingCount: incoming.length,
    importedCount,
    skippedDuplicates,
    matchedCount,
    unmatchedCount,
    transactions: resultTransactions,
  };
}

/**
 * Find an already-matched payment linked to an invoice number.
 * Checks invoiceNumbers[] first, then common purpose text patterns
 * (bank imports / T-Bank / manual marks use different wording).
 */
export async function findMatchedPaymentForInvoice(
  counterpartyId: number,
  invoiceNumber: string
): Promise<{ id: number; documentNumber: string; amount: number } | null> {
  if (!invoiceNumber) return null;

  const byArray = await (prisma as any).bankTransaction.findFirst({
    where: {
      counterpartyId,
      direction: "incoming",
      status: "matched",
      invoiceNumbers: { has: invoiceNumber },
    },
    select: { id: true, documentNumber: true, amount: true },
    orderBy: { id: "asc" },
  });
  if (byArray) return byArray;

  // Fallback: purpose text variants used across import / T-Bank / manual mark
  const purposePatterns = [
    `Счёт №${invoiceNumber}`,
    `Счет №${invoiceNumber}`,
    `счёта №${invoiceNumber}`,
    `счета №${invoiceNumber}`,
    `счету №${invoiceNumber}`,
  ];

  for (const pattern of purposePatterns) {
    const byPurpose = await (prisma as any).bankTransaction.findFirst({
      where: {
        counterpartyId,
        direction: "incoming",
        status: "matched",
        purpose: { contains: pattern, mode: "insensitive" },
      },
      select: { id: true, documentNumber: true, amount: true },
      orderBy: { id: "asc" },
    });
    if (byPurpose) return byPurpose;
  }

  return null;
}

/**
 * Ignore MANUAL-* payment rows created by "Отметить оплаченным" for this invoice.
 * Does NOT touch real bank imports or T-Bank payments.
 */
export async function ignoreManualPaymentsForInvoice(
  counterpartyId: number,
  invoiceNumber: string
): Promise<number> {
  if (!invoiceNumber) return 0;

  const manuals = await (prisma as any).bankTransaction.findMany({
    where: {
      counterpartyId,
      direction: "incoming",
      status: "matched",
      documentNumber: { startsWith: "MANUAL-" },
      OR: [
        { invoiceNumbers: { has: invoiceNumber } },
        { purpose: { contains: `счету №${invoiceNumber}`, mode: "insensitive" } },
        { purpose: { contains: `счёта №${invoiceNumber}`, mode: "insensitive" } },
        { purpose: { contains: `счета №${invoiceNumber}`, mode: "insensitive" } },
        { purpose: { contains: `Счёт №${invoiceNumber}`, mode: "insensitive" } },
        { purpose: { contains: `Счет №${invoiceNumber}`, mode: "insensitive" } },
      ],
    },
    select: { id: true },
  });

  if (manuals.length === 0) return 0;

  await (prisma as any).bankTransaction.updateMany({
    where: { id: { in: manuals.map((t: { id: number }) => t.id) } },
    data: { status: "ignored" },
  });

  return manuals.length;
}

/**
 * Prepaid not yet assigned to paid invoices.
 * available = matched incoming payments − sum of already paid (non-cancelled) invoices.
 * This is NOT the same as −counterpartyBalance.balance (unpaid invoices already reduce that).
 */
export async function getUnallocatedPrepaid(counterpartyId: number): Promise<{
  totalPaid: number;
  paidInvoicesSum: number;
  available: number;
}> {
  const txAgg = await (prisma as any).bankTransaction.aggregate({
    where: {
      counterpartyId,
      direction: "incoming",
      status: "matched",
    },
    _sum: { amount: true },
  });
  const totalPaid = Number(txAgg._sum.amount) || 0;

  const paidInvoices = await (prisma as any).invoice.findMany({
    where: {
      counterpartyId,
      isPaid: true,
      status: { not: "cancelled" },
    },
    include: { items: true },
  });

  const paidInvoicesSum = paidInvoices.reduce((sum: number, invoice: any) => {
    const invoiceTotal = (invoice.items || []).reduce(
      (itemSum: number, item: any) => itemSum + (Number(item.amount) || 0),
      0
    );
    return sum + invoiceTotal;
  }, 0);

  return {
    totalPaid,
    paidInvoicesSum,
    available: Math.max(0, totalPaid - paidInvoicesSum),
  };
}

/**
 * Recalculate balance for a counterparty
 * - totalBilled: sum of invoice item amounts excluding cancelled invoices
 * - totalPaid: sum of all matched incoming bank transactions
 * - balance: totalBilled - totalPaid (positive = debt, negative = prepaid)
 */
export async function recalculateBalance(counterpartyId: number): Promise<void> {
  // Get non-cancelled invoices for this counterparty with their items
  const invoices = await (prisma as any).invoice.findMany({
    where: {
      counterpartyId,
      status: { not: "cancelled" },
    },
    include: { items: true },
  });

  // Sum all invoice items (this is the actual billed amount)
  const totalBilled = invoices.reduce((sum: number, invoice: any) => {
    const invoiceTotal = invoice.items.reduce((itemSum: number, item: any) => {
      return itemSum + (Number(item.amount) || 0);
    }, 0);
    return sum + invoiceTotal;
  }, 0);

  // Sum of all matched incoming transactions
  const txAgg = await (prisma as any).bankTransaction.aggregate({
    where: {
      counterpartyId,
      direction: "incoming",
      status: "matched",
    },
    _sum: { amount: true },
  });
  const totalPaid = txAgg._sum.amount || 0;

  // Balance = what they owe us (positive = debt, negative = prepaid)
  const balance = totalBilled - totalPaid;

  await (prisma as any).counterpartyBalance.upsert({
    where: { counterpartyId },
    update: { totalBilled, totalPaid, balance, lastUpdated: new Date() },
    create: { counterpartyId, totalBilled, totalPaid, balance },
  });
}

/**
 * Manually match an unmatched transaction to a counterparty
 */
export async function matchTransaction(
  transactionId: number,
  counterpartyId: number
): Promise<void> {
  await (prisma as any).bankTransaction.update({
    where: { id: transactionId },
    data: {
      counterpartyId,
      status: "matched",
      matchedAt: new Date(),
    },
  });
  await recalculateBalance(counterpartyId);
}

/**
 * Ignore a transaction (e.g. internal transfer wrongly parsed)
 */
export async function ignoreTransaction(transactionId: number): Promise<void> {
  const tx = await (prisma as any).bankTransaction.update({
    where: { id: transactionId },
    data: { status: "ignored" },
  });
  if (tx.counterpartyId) {
    await recalculateBalance(tx.counterpartyId);
  }
}

/**
 * Get all balances for dashboard
 */
export async function getAllBalances() {
  return (prisma as any).counterpartyBalance.findMany({
    include: {
      counterparty: {
        select: { id: true, name: true, shortName: true, inn: true },
      },
    },
    orderBy: { balance: "asc" },
  });
}

/**
 * Get transactions for a specific counterparty (for org finance tab)
 */
export async function getCounterpartyTransactions(counterpartyId: number) {
  return (prisma as any).bankTransaction.findMany({
    where: { counterpartyId, status: "matched" },
    orderBy: { documentDate: "desc" },
  });
}

/**
 * Parse Russian date format DD.MM.YYYY to YYYY-MM-DD
 */
function parseRuDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  const parts = dateStr.split(".");
  if (parts.length !== 3) return dateStr;
  const [day, month, year] = parts;
  // Handle 2-digit year
  const fullYear = year.length === 2 ? `20${year}` : year;
  return `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}
