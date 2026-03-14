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
  director: "Соловьёв Артём Александрович",
};

type ActItem = {
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

export type ActPdfParams = {
  actNumber: string;
  actDate: string;
  invoiceNumber: string;
  invoiceDate: string;
  counterparty: Counterparty;
  items: ActItem[];
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
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

  if (intPart === 0) return `ноль рублей ${String(kopPart).padStart(2, "0")} копеек`;

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
  return `${result} рублей ${String(kopPart).padStart(2, "0")} копеек`;
}

function drawLine(doc: PDFKit.PDFDocument, x1: number, y1: number, x2: number, y2: number, width = 0.5) {
  doc.lineWidth(width).moveTo(x1, y1).lineTo(x2, y2).stroke("#000");
}

function drawRect(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, lineW = 0.5) {
  doc.lineWidth(lineW).rect(x, y, w, h).stroke("#000");
}

function findFont(name: string): string {
  const candidates = [
    path.join(__dirname, "..", "..", "..", "assets", "fonts", `${name}.ttf`),
    `/usr/share/fonts/truetype/dejavu/${name}.ttf`,
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(`Шрифт ${name}.ttf не найден. Кандидаты: ${candidates.join(", ")}`);
}


export async function generateActPdfBuffer(params: ActPdfParams): Promise<Buffer> {
  const { actNumber, actDate, invoiceNumber, invoiceDate, counterparty, items } = params;
  const total = items.reduce((s, i) => s + i.amount, 0);

  const FONT = findFont("DejaVuSans");
  const FONT_BOLD = fs.existsSync(FONT.replace("DejaVuSans", "DejaVuSans-Bold"))
    ? FONT.replace("DejaVuSans", "DejaVuSans-Bold")
    : FONT;

  const M = 28;
  const doc = new PDFDocument({ size: "A4", margin: M });
  doc.registerFont("Main", FONT);
  doc.registerFont("Bold", FONT_BOLD);

  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer | string | Uint8Array) =>
    chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)),
  );

  return await new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = 595.28 - M * 2;
    let y = M;

    // ============ TITLE ============
    doc.font("Bold").fontSize(14).fillColor("#000");
    doc.text(`Акт № ${actNumber} от ${formatDate(actDate)} г.`, M, y, { width: W });
    y = doc.y + 4;
    drawLine(doc, M, y, M + W, y, 1.5);
    y += 8;

    // ============ ИСПОЛНИТЕЛЬ ============
    const labelW = 85;
    doc.font("Main").fontSize(9);
    doc.text("Исполнитель:", M, y, { width: labelW, continued: true });
    doc.font("Bold").text(
      `  ${SELLER.name}, ИНН ${SELLER.inn}, ${SELLER.address}, д/но ${SELLER.account}, в банке ${SELLER.bank}, БИК ${SELLER.bik}, к/с ${SELLER.correspondentAccount}`,
      { width: W, lineGap: 0 },
    );
    y = doc.y + 4;

    // ============ ЗАКАЗЧИК ============
    doc.font("Main").text("Заказчик:", M, y, { width: labelW, continued: true });
    const cpParts = [counterparty.name];
    if (counterparty.inn) cpParts.push(`ИНН ${counterparty.inn}`);
    if (counterparty.account) cpParts.push(`р/с ${counterparty.account}`);
    if (counterparty.bank) cpParts.push(`в банке ${counterparty.bank}`);
    if (counterparty.bik) cpParts.push(`БИК ${counterparty.bik}`);
    if (counterparty.correspondentAccount) cpParts.push(`к/с ${counterparty.correspondentAccount}`);
    doc.font("Bold").text(`  ${cpParts.join(", ")}`, { width: W, lineGap: 0 });
    y = doc.y + 4;

    // ============ ОСНОВАНИЕ ============
    doc.font("Main").text("Основание:", M, y, { width: labelW, continued: true });
    doc.font("Main").text(`  По счету № ${invoiceNumber} от ${formatDateShort(invoiceDate)}`, { width: W, lineGap: 0 });
    y = doc.y + 8;

    // ============ TABLE ============
    const colWidths = [28, W - 28 - 40 - 40 - 70 - 70, 40, 40, 70, 70];
    const colX = [M];
    for (let i = 1; i < colWidths.length; i++) colX.push(colX[i - 1] + colWidths[i - 1]);
    const headerH = 18;

    // Header
    drawRect(doc, M, y, W, headerH, 0.8);
    for (let i = 1; i < colX.length; i++) drawLine(doc, colX[i], y, colX[i], y + headerH, 0.8);
    doc.font("Bold").fontSize(8);
    const headers = ["№", "Наименование работ, услуг", "Кол-во", "Ед.", "Цена", "Сумма"];
    headers.forEach((h, i) => {
      doc.text(h, colX[i] + 2, y + 5, { width: colWidths[i] - 4, align: "center", lineGap: 0 });
    });
    y += headerH;

    // Rows
    doc.font("Main").fontSize(8);
    items.forEach((item, idx) => {
      const descH = Math.max(16, doc.heightOfString(item.description, { width: colWidths[1] - 6 }) + 6);
      drawRect(doc, M, y, W, descH, 0.8);
      for (let i = 1; i < colX.length; i++) drawLine(doc, colX[i], y, colX[i], y + descH, 0.8);
      const textY = y + 3;
      doc.text(String(idx + 1), colX[0] + 2, textY, { width: colWidths[0] - 4, align: "center", lineGap: 0 });
      doc.text(item.description, colX[1] + 2, textY, { width: colWidths[1] - 4, lineGap: 0 });
      doc.text(String(item.quantity), colX[2] + 2, textY, { width: colWidths[2] - 4, align: "center", lineGap: 0 });
      doc.text(item.unit, colX[3] + 2, textY, { width: colWidths[3] - 4, align: "center", lineGap: 0 });
      doc.text(formatMoney(item.price), colX[4] + 2, textY, { width: colWidths[4] - 4, align: "right", lineGap: 0 });
      doc.text(formatMoney(item.amount), colX[5] + 2, textY, { width: colWidths[5] - 4, align: "right", lineGap: 0 });
      y += descH;
    });

    // ============ TOTALS (in table rows) ============
    const totalRowH = 14;
    drawRect(doc, M, y, W, totalRowH, 0.8);
    for (let i = 1; i < colX.length; i++) drawLine(doc, colX[i], y, colX[i], y + totalRowH, 0.8);
    doc.font("Bold").fontSize(8);
    doc.text("Итого:", M, y + 3, { width: W - colWidths[5] - 4, align: "right" });
    doc.text(formatMoney(total), M + W - colWidths[5] + 2, y + 3, { width: colWidths[5] - 4, align: "right" });
    y += totalRowH;
    
    drawRect(doc, M, y, W, totalRowH, 0.8);
    for (let i = 1; i < colX.length; i++) drawLine(doc, colX[i], y, colX[i], y + totalRowH, 0.8);
    doc.text("Без налога (НДС)", M, y + 3, { width: W - colWidths[5] - 4, align: "right" });
    doc.font("Main").text("-", M + W - colWidths[5] + 2, y + 3, { width: colWidths[5] - 4, align: "right" });
    y += totalRowH + 10;

    // ============ AMOUNT IN WORDS ============
    doc.font("Main").fontSize(9);
    doc.text(`Всего оказано услуг ${items.length}, на сумму ${formatMoney(total)} руб.`, M, y, { lineGap: 0 });
    y = doc.y + 2;
    doc.font("Bold").fontSize(9);
    doc.text(numberToWordsRu(total), M, y, { width: W, lineGap: 0 });
    y = doc.y + 10;

    // ============ DISCLAIMER ============
    doc.font("Main").fontSize(9);
    doc.text(
      "Вышеперечисленные услуги выполнены полностью и в срок. Заказчик претензий по объёму, качеству и срокам оказания услуг не имеет.",
      M, y, { width: W, lineGap: 0 },
    );
    y = doc.y + 10;
    doc.end();
  });
}
