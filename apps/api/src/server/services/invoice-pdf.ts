import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";

// ===================== РЕКВИЗИТЫ ИП (СТАТИЧНЫЕ) =====================
// TODO: заменить на реальные реквизиты ИП Соловьёв
const SELLER = {
  name: "ИП Соловьёв Александр Сергеевич",
  inn: "312345678901",
  address: "г. Москва, ул. Примерная, д. 1, кв. 1",
  account: "40802810900000000001",
  bik: "044525000",
  correspondentAccount: "30101810400000000225",
  bank: "АО «Банк»",
  director: "Соловьёв А.С.",
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
  invoiceDate: Date;
  counterparty: Counterparty;
  items: InvoiceItem[];
};

function formatDate(d: Date): string {
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
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

  const M = 36; // margin
  const doc = new PDFDocument({ size: "A4", margin: M });
  doc.registerFont("Main", FONT);
  doc.registerFont("Bold", FONT_BOLD);

  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer | string | Uint8Array) =>
    chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)),
  );

  // Generate QR code as data URL → buffer
  const qrText = `ST00012|Name=${SELLER.name}|PersonalAcc=${SELLER.account}|BankName=${SELLER.bank}|BIC=${SELLER.bik}|CorrespAcc=${SELLER.correspondentAccount}|PayeeINN=${SELLER.inn}|Sum=${Math.round(total * 100)}`;
  const qrDataUrl = await QRCode.toDataURL(qrText, { width: 100, margin: 1 });
  const qrBuffer = Buffer.from(qrDataUrl.replace(/^data:image\/png;base64,/, ""), "base64");

  // Load stamp image if exists
  const stampPath = path.join(__dirname, "..", "..", "..", "assets", "stamp.png");
  const hasStamp = fs.existsSync(stampPath);

  return await new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = 595.28 - M * 2; // usable width
    let y = M;

    // ============ ВЕРХНЯЯ ТАБЛИЦА (реквизиты банка) — СТАТИЧНАЯ ============
    const bankTableH = 80;
    drawRect(doc, M, y, W, bankTableH, 1);
    // vertical split: left = bank info, right = QR
    const bankLeftW = W - 110;
    drawLine(doc, M + bankLeftW, y, M + bankLeftW, y + bankTableH, 0.5);
    // horizontal split in left part
    drawLine(doc, M, y + 20, M + bankLeftW, y + 20, 0.5);
    drawLine(doc, M, y + 40, M + bankLeftW, y + 40, 0.5);
    drawLine(doc, M, y + 60, M + bankLeftW, y + 60, 0.5);

    // Bank info
    doc.font("Main").fontSize(7);
    doc.text(`${SELLER.bank}`, M + 3, y + 3, { width: bankLeftW - 6 });
    doc.text(`БИК`, M + 3, y + 23);
    doc.text(SELLER.bik, M + 80, y + 23);
    doc.text(`Корр. счёт`, M + 3, y + 43);
    doc.text(SELLER.correspondentAccount, M + 80, y + 43);
    doc.text(`Р/счёт`, M + 3, y + 63);
    doc.text(SELLER.account, M + 80, y + 63);

    // QR code
    doc.image(qrBuffer, M + bankLeftW + 5, y + 2, { width: 76, height: 76 });

    y += bankTableH + 4;

    // Seller info row
    const sellerRowH = 30;
    drawRect(doc, M, y, W, sellerRowH, 0.5);
    doc.fontSize(7).text("Получатель", M + 3, y + 2);
    doc.fontSize(8).font("Bold").text(SELLER.name, M + 3, y + 12, { width: W - 6 });
    doc.font("Main");
    doc.fontSize(7).text(`ИНН ${SELLER.inn}`, M + W - 150, y + 2);

    y += sellerRowH + 10;

    // ============ ЗАГОЛОВОК СЧЁТА ============
    doc.font("Bold").fontSize(14);
    doc.text(`Счёт на оплату № ${invoiceNumber} от ${formatDate(invoiceDate)}`, M, y, {
      width: W,
      align: "center",
    });
    doc.font("Main");
    y += 22;

    drawLine(doc, M, y, M + W, y, 1.5);
    y += 8;

    // ============ ИСПОЛНИТЕЛЬ (СТАТИЧНЫЙ) ============
    doc.fontSize(9);
    doc.font("Bold").text("Исполнитель:", M, y, { continued: true });
    doc.font("Main").text(` ${SELLER.name}, ИНН ${SELLER.inn}, ${SELLER.address}`);
    y = doc.y + 4;

    // ============ ЗАКАЗЧИК (ИЗ БД) ============
    doc.font("Bold").text("Заказчик:", M, y, { continued: true });
    const cpParts = [counterparty.name];
    if (counterparty.inn) cpParts.push(`ИНН ${counterparty.inn}`);
    if (counterparty.kpp) cpParts.push(`КПП ${counterparty.kpp}`);
    if (counterparty.address) cpParts.push(counterparty.address);
    doc.font("Main").text(` ${cpParts.join(", ")}`);
    y = doc.y + 4;

    // ============ ПРИМЕЧАНИЕ (ДОГОВОР ИЗ БД) ============
    if (counterparty.contract) {
      doc.font("Bold").text("Основание:", M, y, { continued: true });
      doc.font("Main").text(` ${counterparty.contract}`);
      y = doc.y + 4;
    }

    y += 6;
    drawLine(doc, M, y, M + W, y, 0.5);
    y += 8;

    // ============ ТАБЛИЦА УСЛУГ ============
    const colWidths = [28, W - 28 - 50 - 60 - 70 - 70, 50, 60, 70, 70];
    const colX = [M];
    for (let i = 1; i < colWidths.length; i++) colX.push(colX[i - 1] + colWidths[i - 1]);
    const headerH = 20;

    // Header
    drawRect(doc, M, y, W, headerH, 0.5);
    for (let i = 1; i < colX.length; i++) {
      drawLine(doc, colX[i], y, colX[i], y + headerH, 0.5);
    }
    doc.font("Bold").fontSize(7);
    const headers = ["№", "Наименование", "Кол-во", "Ед.", "Цена", "Сумма"];
    headers.forEach((h, i) => {
      doc.text(h, colX[i] + 2, y + 6, { width: colWidths[i] - 4, align: "center" });
    });
    y += headerH;

    // Rows
    doc.font("Main").fontSize(8);
    items.forEach((item, idx) => {
      const descH = Math.max(16, doc.heightOfString(item.description, { width: colWidths[1] - 6 }) + 8);
      drawRect(doc, M, y, W, descH, 0.5);
      for (let i = 1; i < colX.length; i++) {
        drawLine(doc, colX[i], y, colX[i], y + descH, 0.5);
      }
      const textY = y + 4;
      doc.text(String(idx + 1), colX[0] + 2, textY, { width: colWidths[0] - 4, align: "center" });
      doc.text(item.description, colX[1] + 3, textY, { width: colWidths[1] - 6 });
      doc.text(String(item.quantity), colX[2] + 2, textY, { width: colWidths[2] - 4, align: "center" });
      doc.text(item.unit, colX[3] + 2, textY, { width: colWidths[3] - 4, align: "center" });
      doc.text(formatMoney(item.price), colX[4] + 2, textY, { width: colWidths[4] - 4, align: "right" });
      doc.text(formatMoney(item.amount), colX[5] + 2, textY, { width: colWidths[5] - 4, align: "right" });
      y += descH;
    });

    y += 6;

    // ============ ИТОГО ============
    doc.font("Bold").fontSize(9);
    doc.text(`Итого: ${formatMoney(total)} руб.`, M, y, { width: W, align: "right" });
    y += 14;
    doc.text(`Без налога (НДС)`, M, y, { width: W, align: "right" });
    y += 14;
    doc.font("Bold").fontSize(10);
    doc.text(`Всего к оплате: ${formatMoney(total)} руб.`, M, y, { width: W, align: "right" });
    y += 16;

    // Сумма прописью
    doc.font("Main").fontSize(9);
    doc.text(`Всего наименований ${items.length}, на сумму ${formatMoney(total)} руб.`, M, y);
    y += 14;
    doc.font("Bold").fontSize(9);
    doc.text(numberToWordsRu(total), M, y);
    y += 20;

    drawLine(doc, M, y, M + W, y, 1);
    y += 12;

    // ============ ИСПОЛНИТЕЛЬ + ПЕЧАТЬ ============
    doc.font("Bold").fontSize(9);
    doc.text("Исполнитель", M, y);
    y += 14;

    // Signature line
    drawLine(doc, M + 80, y + 2, M + 220, y + 2, 0.5);
    doc.font("Main").fontSize(8);
    doc.text(`/${SELLER.director}/`, M + 225, y - 4);

    // Stamp image (if exists)
    if (hasStamp) {
      try {
        doc.image(stampPath, M + 300, y - 40, { width: 120 });
      } catch {
        // stamp file invalid, skip
      }
    }

    y += 30;

    doc.end();
  });
}
