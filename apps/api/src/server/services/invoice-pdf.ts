import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ===================== РЕКВИЗИТЫ ИП (СТАТИЧНЫЕ) =====================
const SELLER = {
  name: "ИП Соловьёв Артём Александрович",
  inn: "302201915296",
  address: "309167, РОССИЯ, БЕЛГОРОДСКАЯ ОБЛ, КРАСНОЯРУСЖКИЙ Р-Н, ПОСЕЛОК СТЕПНОЕ, УЛ САДОВАЯ, Д 9/1",
  account: "40802810100002843508",
  bik: "044525974",
  correspondentAccount: "30101810145250000974",
  bank: 'АО "ТИНЬКОФФ БАНК" Г. Москва',
  director: "Соловьёв А.А.",
  directorFull: "Соловьёв Артём Александрович",
};

type InvoiceItem = {
  description: string;
  quantity: number;
  unit: string;
  price: number;
  amount: number;
};

type Counterparty = {
  name: string;
  inn?: string | null;
  kpp?: string | null;
  address?: string | null;
  account?: string | null;
  bik?: string | null;
  correspondentAccount?: string | null;
  bank?: string | null;
  director?: string | null;
  contract?: string | null;
};

export type InvoicePdfParams = {
  invoiceNumber: string;
  invoiceDate: string;
  counterparty: Counterparty;
  items: InvoiceItem[];
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
}

function formatMoney(n: number): string {
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function numberToWordsRu(n: number): string {
  const units = ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
  const teens = ["десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"];
  const tens = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"];
  const hundreds = ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"];

  const intPart = Math.floor(n);
  const kopPart = Math.round((n - intPart) * 100);

  if (intPart === 0) return `ноль руб. ${String(kopPart).padStart(2, "0")} коп.`;

  let result = "";
  const h = Math.floor(intPart / 100) % 10;
  const t = Math.floor(intPart / 10) % 10;
  const u = intPart % 10;

  if (intPart >= 1000) {
    const th = Math.floor(intPart / 1000);
    if (th >= 100) result += hundreds[Math.floor(th / 100) % 10] + " ";
    const tt = Math.floor(th / 10) % 10;
    const tu = th % 10;
    if (tt === 1) {
      result += teens[tu] + " ";
    } else {
      if (tt > 1) result += tens[tt] + " ";
      if (tu === 1) result += "одна ";
      else if (tu === 2) result += "две ";
      else if (tu > 0) result += units[tu] + " ";
    }
    result += "тысяч ";
    if (th % 10 === 1 && th % 100 !== 11) result = result.replace("тысяч ", "тысяча ");
    else if ([2, 3, 4].includes(th % 10) && ![12, 13, 14].includes(th % 100)) result = result.replace("тысяч ", "тысячи ");
  }

  if (h > 0) result += hundreds[h] + " ";
  if (t === 1) {
    result += teens[u] + " ";
  } else {
    if (t > 1) result += tens[t] + " ";
    if (u > 0) result += units[u] + " ";
  }

  result = result.trim();
  result = result.charAt(0).toUpperCase() + result.slice(1);
  return `${result} руб. ${String(kopPart).padStart(2, "0")} коп.`;
}

// Helpers to draw table lines
function drawLine(doc: PDFKit.PDFDocument, x1: number, y1: number, x2: number, y2: number, width = 0.5) {
  doc.lineWidth(width).moveTo(x1, y1).lineTo(x2, y2).stroke("#000");
}

function drawRect(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, lineW = 0.5) {
  doc.lineWidth(lineW).rect(x, y, w, h).stroke("#000");
}

// Resolve TTF font path for Cyrillic support
function findFont(name: string): string {
  const candidates = [
    // assets folder (local dev or Docker COPY)
    path.join(__dirname, "..", "..", "..", "assets", "fonts", `${name}.ttf`),
    // Debian/Ubuntu system fonts
    `/usr/share/fonts/truetype/dejavu/${name}.ttf`,
    `/usr/share/fonts/truetype/dejavu/${name}.ttf`,
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(`Шрифт ${name}.ttf не найден. Кандидаты: ${candidates.join(", ")}`);
}

export async function generateInvoicePdfBuffer(params: InvoicePdfParams): Promise<Buffer> {
  const { invoiceNumber, invoiceDate, counterparty, items } = params;
  const total = items.reduce((s, i) => s + i.amount, 0);

  const FONT = findFont("DejaVuSans");
  const FONT_BOLD = fs.existsSync(FONT.replace("DejaVuSans", "DejaVuSans-Bold"))
    ? FONT.replace("DejaVuSans", "DejaVuSans-Bold")
    : FONT;

  const M = 40; // margin
  const doc = new PDFDocument({ size: "A4", margin: M });
  doc.registerFont("Main", FONT);
  doc.registerFont("Bold", FONT_BOLD);

  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer | string | Uint8Array) =>
    chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)),
  );

  // No QR code needed

  return await new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = 595.28 - M * 2;
    let y = M;

    // ============ WARNING TEXT ============
    doc.font("Main").fontSize(7).fillColor("#333");
    doc.text(
      "Внимание! Оплата данного счета означает согласие с условиями поставки товара. Уведомление об оплате обязательно, в противном случае не гарантируется наличие товара на складе. Товар отпускается по факту прихода денег на р/с Поставщика, самовывозом, при наличии доверенности и паспорта.",
      M, y, { width: W, lineGap: 0 },
    );
    doc.fillColor("#000");
    y = doc.y + 10;

    // ============ BANK DETAILS TABLE ============
    const bkW = W;
    const leftColW = bkW * 0.55;
    const rightLabelW = bkW * 0.10;
    const rightValueW = bkW * 0.35;
    const rowH = 16;

    const tableY = y;

    // Outer border
    drawRect(doc, M, tableY, bkW, rowH * 4, 0.8);

    // Vertical dividers
    drawLine(doc, M + leftColW, tableY, M + leftColW, tableY + rowH * 4, 0.8);
    drawLine(doc, M + leftColW + rightLabelW, tableY, M + leftColW + rightLabelW, tableY + rowH * 4, 0.8);

    // Horizontal lines
    drawLine(doc, M, tableY + rowH, M + bkW, tableY + rowH, 0.8);
    drawLine(doc, M, tableY + rowH * 2, M + bkW, tableY + rowH * 2, 0.8);
    drawLine(doc, M, tableY + rowH * 3, M + bkW, tableY + rowH * 3, 0.8);

    // Additional vertical line in row 3 left (between ИНН and КПП)
    const innKppDivider = M + 140;
    drawLine(doc, innKppDivider, tableY + rowH * 2, innKppDivider, tableY + rowH * 3, 0.8);

    // Left column labels (small gray text)
    doc.font("Main").fontSize(7).fillColor("#666");
    doc.text("Банк получателя", M + 2, tableY + 2);
    
    // Row 1 left: Bank name
    doc.font("Main").fontSize(8.5).fillColor("#000");
    doc.text(SELLER.bank, M + 2, tableY + 9, { width: leftColW - 4, lineGap: 0 });

    // Row 1 right: БИК label and value
    doc.font("Main").fontSize(8.5).fillColor("#000");
    doc.text("БИК", M + leftColW + 2, tableY + 9);
    doc.text(SELLER.bik, M + leftColW + rightLabelW + 2, tableY + 9);

    // Row 2 right: Сч. № label and value
    doc.text("Сч. №", M + leftColW + 2, tableY + rowH + 9);
    doc.text(SELLER.correspondentAccount, M + leftColW + rightLabelW + 2, tableY + rowH + 9);

    // Row 3 left: ИНН
    doc.text("ИНН", M + 2, tableY + rowH * 2 + 9);
    doc.text(SELLER.inn, M + 30, tableY + rowH * 2 + 9);

    // Row 3 left: КПП
    doc.text("КПП", innKppDivider + 2, tableY + rowH * 2 + 9);

    // Row 3 right: Сч. № label and value
    doc.text("Сч. №", M + leftColW + 2, tableY + rowH * 2 + 9);
    doc.text(SELLER.account, M + leftColW + rightLabelW + 2, tableY + rowH * 2 + 9);

    // Row 4 left label
    doc.font("Main").fontSize(7).fillColor("#666");
    doc.text("Получатель", M + 2, tableY + rowH * 3 + 2);

    // Row 4 left: Получатель name
    doc.font("Main").fontSize(8.5).fillColor("#000");
    doc.text(SELLER.name, M + 2, tableY + rowH * 3 + 9, { width: leftColW - 4, lineGap: 0 });

    doc.fillColor("#000");
    y = tableY + rowH * 4 + 4;

    // ============ TITLE ============
    y += 8;
    doc.font("Bold").fontSize(14).fillColor("#000");
    doc.text(`Счет на оплату № ${invoiceNumber} от ${formatDate(invoiceDate)}`, M, y, {
      width: W,
      align: "left",
    });
    y = doc.y + 6;
    drawLine(doc, M, y, M + W, y, 1.5);
    y += 8;

    // ============ SELLER ============
    doc.font("Main").fontSize(9);
    doc.font("Bold").text("Исполнитель:", M, y, { continued: true, width: W });
    doc.font("Main").text(
      `  ${SELLER.name}, ИНН ${SELLER.inn}, ${SELLER.address}`,
      { width: W, lineGap: 0 },
    );
    y = doc.y + 4;

    // ============ BUYER ============
    doc.font("Bold").text("Заказчик:", M, y, { continued: true, width: W });
    const cpParts = [counterparty.name];
    if (counterparty.inn) cpParts.push(`ИНН ${counterparty.inn}`);
    doc.font("Main").text(`  ${cpParts.join(", ")}`, { width: W, lineGap: 0 });
    y = doc.y + 4;

    // ============ NOTE ============
    if (counterparty.contract) {
      doc.font("Bold").text("Примечание:", M, y, { continued: true, width: W });
      doc.font("Main").text(`  ${counterparty.contract}`, { width: W, lineGap: 0 });
      y = doc.y + 4;
    }

    y += 6;

    // ============ TABLE ============
    const colWidths = [24, W - 24 - 42 - 46 - 62 - 62, 42, 46, 62, 62];
    const colX = [M];
    for (let i = 1; i < colWidths.length; i++) colX.push(colX[i - 1] + colWidths[i - 1]);
    const headerH = 16;

    // Header
    drawRect(doc, M, y, W, headerH, 1.5);
    for (let i = 1; i < colX.length; i++) drawLine(doc, colX[i], y, colX[i], y + headerH, 0.8);
    doc.font("Bold").fontSize(8);
    const headers = ["№", "Наименование товара, работ, услуг", "Коли-\nчество", "Ед.\nизм.", "Цена", "Сумма"];
    headers.forEach((h, i) => {
      doc.text(h, colX[i] + 2, y + 4, { width: colWidths[i] - 4, align: "center", lineGap: 0 });
    });
    y += headerH;

    // Rows
    doc.font("Main").fontSize(7.8);
    items.forEach((item, idx) => {
      const descH = Math.max(14, doc.heightOfString(item.description, { width: colWidths[1] - 4 }) + 4);
      drawRect(doc, M, y, W, descH, 0.8);
      for (let i = 1; i < colX.length; i++) drawLine(doc, colX[i], y, colX[i], y + descH, 0.8);
      const textY = y + 2;
      doc.text(String(idx + 1), colX[0] + 2, textY, { width: colWidths[0] - 4, align: "center", lineGap: 0 });
      doc.text(item.description, colX[1] + 2, textY, { width: colWidths[1] - 4, lineGap: 0 });
      doc.text(String(item.quantity), colX[2] + 2, textY, { width: colWidths[2] - 4, align: "right", lineGap: 0 });
      doc.text(item.unit, colX[3] + 2, textY, { width: colWidths[3] - 4, align: "left", lineGap: 0 });
      doc.text(formatMoney(item.price), colX[4] + 2, textY, { width: colWidths[4] - 4, align: "right", lineGap: 0 });
      doc.text(formatMoney(item.amount), colX[5] + 2, textY, { width: colWidths[5] - 4, align: "right", lineGap: 0 });
      y += descH;
    });

    // ============ TOTALS ============
    const totalRowH = 14;
    drawRect(doc, M, y, W, totalRowH, 0.8);
    for (let i = 1; i < colX.length; i++) drawLine(doc, colX[i], y, colX[i], y + totalRowH, 0.8);
    doc.font("Bold").fontSize(8);
    doc.text("Итого:", M, y + 3, { width: W - colWidths[5] - 4, align: "right" });
    doc.text(formatMoney(total), M + W - colWidths[5] + 2, y + 3, { width: colWidths[5] - 4, align: "right" });
    y += totalRowH;
    
    drawRect(doc, M, y, W, totalRowH, 0.8);
    for (let i = 1; i < colX.length; i++) drawLine(doc, colX[i], y, colX[i], y + totalRowH, 0.8);
    doc.text("В том числе НДС:", M, y + 3, { width: W - colWidths[5] - 4, align: "right" });
    doc.font("Main").text("-", M + W - colWidths[5] + 2, y + 3, { width: colWidths[5] - 4, align: "right" });
    y += totalRowH;
    
    drawRect(doc, M, y, W, totalRowH, 0.8);
    for (let i = 1; i < colX.length; i++) drawLine(doc, colX[i], y, colX[i], y + totalRowH, 0.8);
    doc.font("Bold").text("Всего к оплате:", M, y + 3, { width: W - colWidths[5] - 4, align: "right" });
    doc.text(formatMoney(total), M + W - colWidths[5] + 2, y + 3, { width: colWidths[5] - 4, align: "right" });
    y += totalRowH + 10;

    // ============ AMOUNT IN WORDS ============
    doc.font("Main").fontSize(9);
    doc.text(`Всего наименований ${items.length}, на сумму ${formatMoney(total)} руб.`, M, y, { lineGap: 0 });
    y = doc.y + 2;
    doc.font("Bold").fontSize(9);
    doc.text(numberToWordsRu(total) + " Без НДС.", M, y, { width: W, lineGap: 0 });
    y = doc.y + 10;
    doc.end();
  });
}

