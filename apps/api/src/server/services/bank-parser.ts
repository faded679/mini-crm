/**
 * Parser for 1CClientBankExchange format (v1.03)
 * Parses bank statement files exported from Russian banks for 1C integration.
 */

export interface BankStatementHeader {
  formatVersion: string;
  encoding: string;
  sender: string;
  receiver: string;
  createdDate: string;
  createdTime: string;
  periodStart: string;
  periodEnd: string;
  account: string;
}

export interface BankStatementSummary {
  account: string;
  periodStart: string;
  periodEnd: string;
  openBalance: number;
  totalIncoming: number;
  totalOutgoing: number;
  closeBalance: number;
}

export interface BankDocument {
  documentType: string;       // "Платежное поручение", "Банковский ордер", etc.
  number: string;
  date: string;               // DD.MM.YYYY
  amount: number;
  direction: "incoming" | "outgoing";

  payerName: string;
  payerInn: string;
  payerAccount: string;
  payerBik: string;
  payerBank: string;
  payerKpp: string;

  recipientName: string;
  recipientInn: string;
  recipientAccount: string;
  recipientBik: string;
  recipientBank: string;
  recipientKpp: string;

  purpose: string;
  rawFields: Record<string, string>;
}

export interface ParsedBankStatement {
  header: BankStatementHeader;
  summary: BankStatementSummary;
  documents: BankDocument[];
}

function parseDate(dateStr: string): string {
  // Convert DD.MM.YYYY to ISO date string
  const [day, month, year] = dateStr.split(".");
  return `${year}-${month}-${day}`;
}

function parseAmount(amountStr: string): number {
  return parseFloat(amountStr.replace(",", ".")) || 0;
}

export function parseBankStatement(content: string): ParsedBankStatement {
  const lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  const header: BankStatementHeader = {
    formatVersion: "",
    encoding: "",
    sender: "",
    receiver: "",
    createdDate: "",
    createdTime: "",
    periodStart: "",
    periodEnd: "",
    account: "",
  };

  const summary: BankStatementSummary = {
    account: "",
    periodStart: "",
    periodEnd: "",
    openBalance: 0,
    totalIncoming: 0,
    totalOutgoing: 0,
    closeBalance: 0,
  };

  const documents: BankDocument[] = [];

  let currentSection: "header" | "account" | "document" | null = "header";
  let currentDocFields: Record<string, string> = {};
  let currentDocType = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Section boundaries
    if (trimmed === "КонецФайла") break;

    if (trimmed === "СекцияРасчСчет") {
      currentSection = "account";
      continue;
    }
    if (trimmed === "КонецРасчСчет") {
      currentSection = null;
      continue;
    }
    if (trimmed.startsWith("СекцияДокумент=")) {
      currentSection = "document";
      currentDocType = trimmed.split("=", 2)[1];
      currentDocFields = {};
      continue;
    }
    if (trimmed === "КонецДокумента") {
      if (currentSection === "document") {
        documents.push(buildDocument(currentDocType, currentDocFields));
      }
      currentSection = null;
      continue;
    }

    // Parse key=value
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.substring(0, eqIdx);
    const value = trimmed.substring(eqIdx + 1);

    switch (currentSection) {
      case "header":
        switch (key) {
          case "ВерсияФормата": header.formatVersion = value; break;
          case "Кодировка": header.encoding = value; break;
          case "Отправитель": header.sender = value; break;
          case "Получатель": header.receiver = value; break;
          case "ДатаСоздания": header.createdDate = value; break;
          case "ВремяСоздания": header.createdTime = value; break;
          case "ДатаНачала": header.periodStart = value; break;
          case "ДатаКонца": header.periodEnd = value; break;
          case "РасчСчет": header.account = value; break;
        }
        break;

      case "account":
        switch (key) {
          case "РасчСчет": summary.account = value; break;
          case "ДатаНачала": summary.periodStart = value; break;
          case "ДатаКонца": summary.periodEnd = value; break;
          case "НачальныйОстаток": summary.openBalance = parseAmount(value); break;
          case "ВсегоПоступило": summary.totalIncoming = parseAmount(value); break;
          case "ВсегоСписано": summary.totalOutgoing = parseAmount(value); break;
          case "КонечныйОстаток": summary.closeBalance = parseAmount(value); break;
        }
        break;

      case "document":
        currentDocFields[key] = value;
        break;
    }
  }

  return { header, summary, documents };
}

function buildDocument(docType: string, fields: Record<string, string>): BankDocument {
  const hasIncoming = "ДатаПоступило" in fields;
  const hasOutgoing = "ДатаСписано" in fields;

  return {
    documentType: docType,
    number: fields["Номер"] || "",
    date: fields["Дата"] || "",
    amount: parseAmount(fields["Сумма"] || "0"),
    direction: hasIncoming ? "incoming" : "outgoing",

    payerName: fields["Плательщик"] || fields["Плательщик1"] || "",
    payerInn: fields["ПлательщикИНН"] || "",
    payerAccount: fields["ПлательщикРасчСчет"] || fields["ПлательщикСчет"] || "",
    payerBik: fields["ПлательщикБИК"] || "",
    payerBank: fields["ПлательщикБанк1"] || "",
    payerKpp: fields["ПлательщикКПП"] || "",

    recipientName: fields["Получатель"] || fields["Получатель1"] || "",
    recipientInn: fields["ПолучательИНН"] || "",
    recipientAccount: fields["ПолучательРасчСчет"] || fields["ПолучательСчет"] || "",
    recipientBik: fields["ПолучательБИК"] || "",
    recipientBank: fields["ПолучательБанк1"] || "",
    recipientKpp: fields["ПолучательКПП"] || "",

    purpose: fields["НазначениеПлатежа"] || "",
    rawFields: { ...fields },
  };
}

/**
 * Extract invoice numbers from payment purpose string.
 * Handles common patterns:
 *   - "Счет на оплату № 4136814196 от 17 марта 2026 г."
 *   - "СЧ-000133 от 18 марта 2026 г. и СЧ-000110 от 16 марта 2026 г."
 *   - "Платеж по счету № 4136814181 от 13.03.26"
 */
export function extractInvoiceNumbers(purpose: string): string[] {
  const numbers: string[] = [];

  // Pattern: "СЧ-NNNNNN"
  const schPattern = /СЧ-\d+/gi;
  let match = schPattern.exec(purpose);
  while (match) {
    numbers.push(match[0].toUpperCase());
    match = schPattern.exec(purpose);
  }

  // Pattern: "счет(у|а)? (на оплату)? №? NNNNN" or "по счету № NNNNN"
  const invoicePattern = /(?:счет[уа]?\s*(?:на\s*оплату\s*)?)?[№#]\s*(\S+)/gi;
  match = invoicePattern.exec(purpose);
  while (match) {
    const num = match[1].replace(/[,.]$/, "");
    // Avoid duplicates and skip if already captured by СЧ- pattern
    if (num && !numbers.includes(num.toUpperCase()) && !num.toUpperCase().startsWith("СЧ-")) {
      numbers.push(num);
    }
    match = invoicePattern.exec(purpose);
  }

  return numbers;
}

/**
 * Filter only incoming payments (поступления) from parsed documents
 */
export function filterIncomingPayments(documents: BankDocument[]): BankDocument[] {
  return documents.filter((doc) => doc.direction === "incoming");
}
