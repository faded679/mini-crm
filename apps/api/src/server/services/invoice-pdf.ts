import PDFDocument from "pdfkit";
import QRCode from "qrcode";
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

  // Generate QR code
  const qrText = `ST00012|Name=${SELLER.name}|PersonalAcc=${SELLER.account}|BankName=${SELLER.bank}|BIC=${SELLER.bik}|CorrespAcc=${SELLER.correspondentAccount}|PayeeINN=${SELLER.inn}|Sum=${Math.round(total * 100)}`;
  const qrDataUrl = await QRCode.toDataURL(qrText, { width: 120, margin: 1 });
  const qrBuffer = Buffer.from(qrDataUrl.replace(/^data:image\/png;base64,/, ""), "base64");

  return await new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = 595.28 - M * 2;
    let y = M;

    // ============ WARNING TEXT ============
    doc.font("Main").fontSize(6).fillColor("#333");
    doc.text(
      "Внимание! Оплата данного счета означает согласие с условиями поставки товара. Уведомление об оплате обязательно, в противном случае не гарантируется наличие товара на складе. Товар отпускается по факту прихода денег на р/с Поставщика, самовывозом, при наличии доверенности и паспорта.",
      M, y, { width: W - 100, lineGap: 1 },
    );
    doc.fillColor("#000");

    // QR code top-right
    doc.image(qrBuffer, M + W - 88, y - 4, { width: 88, height: 88 });

    y = Math.max(doc.y + 8, M + 50);

    // ============ BANK DETAILS TABLE ============
    const bkW = W;
    const bkLeft = 310; // left column width
    const bkRight = bkW - bkLeft;
    const rowH = 16;

    // Row 1: Bank name | BИК + value
    drawRect(doc, M, y, bkW, rowH * 2);
    drawLine(doc, M + bkLeft, y, M + bkLeft, y + rowH * 2);
    // BIK label+value
    doc.font("Main").fontSize(7);
    doc.text(SELLER.bank, M + 3, y + 3, { width: bkLeft - 6 });
    doc.text("БИК", M + bkLeft + 3, y + 3);
    doc.text(SELLER.bik, M + bkLeft + 50, y + 3);
    // Row 2: (bank continues) | Сч. №
    drawLine(doc, M, y + rowH, M + bkW, y + rowH);
    doc.text("Сч. №", M + bkLeft + 3, y + rowH + 3);
    doc.text(SELLER.correspondentAccount, M + bkLeft + 50, y + rowH + 3);
    y += rowH * 2;

    // Row 3–4: ИНН + КПП | Сч. №
    drawRect(doc, M, y, bkW, rowH * 2);
    drawLine(doc, M + bkLeft, y, M + bkLeft, y + rowH * 2);
    doc.font("Main").fontSize(6);
    doc.text("Банк получателя", M + 3, y - rowH * 2 + 2, { width: 60 });
    doc.fontSize(7);
    // ИНН
    doc.text("ИНН", M + 3, y + 3);
    doc.text(SELLER.inn, M + 32, y + 3);
    // КПП
    doc.text("КПП", M + 130, y + 3);
    // Сч. №
    doc.text("Сч. №", M + bkLeft + 3, y + 3);
    doc.text(SELLER.account, M + bkLeft + 50, y + 3);
    drawLine(doc, M, y + rowH, M + bkLeft, y + rowH);
    // Получатель
    doc.text(SELLER.name, M + 3, y + rowH + 3, { width: bkLeft - 6 });
    y += rowH * 2;

    // Получатель label
    doc.font("Main").fontSize(6);
    doc.text("Получатель", M + 3, y + 2, { width: 60 });
    y += 14;

    // ============ TITLE ============
    y += 6;
    doc.font("Bold").fontSize(13).fillColor("#000");
    doc.text(`Счет на оплату № ${invoiceNumber} от ${formatDate(invoiceDate)}`, M, y, {
      width: W,
      align: "left",
    });
    y = doc.y + 4;
    drawLine(doc, M, y, M + W, y, 1.5);
    y += 10;

    // ============ SELLER ============
    doc.font("Main").fontSize(8);
    doc.font("Bold").text("Исполнитель:", M, y, { continued: true, width: W });
    doc.font("Main").text(
      `   ${SELLER.name}, ИНН ${SELLER.inn}, ${SELLER.address}`,
      { width: W },
    );
    y = doc.y + 4;

    // ============ BUYER ============
    doc.font("Bold").text("Заказчик:", M, y, { continued: true, width: W });
    const cpParts = [counterparty.name];
    if (counterparty.inn) cpParts.push(`ИНН ${counterparty.inn}`);
    doc.font("Main").text(`   ${cpParts.join(", ")}`, { width: W });
    y = doc.y + 4;

    // ============ NOTE ============
    if (counterparty.contract) {
      doc.font("Bold").text("Примечание:", M, y, { continued: true, width: W });
      doc.font("Main").text(`   ${counterparty.contract}`, { width: W });
      y = doc.y + 4;
    }

    y += 6;

    // ============ TABLE ============
    const colWidths = [24, W - 24 - 42 - 46 - 62 - 62, 42, 46, 62, 62];
    const colX = [M];
    for (let i = 1; i < colWidths.length; i++) colX.push(colX[i - 1] + colWidths[i - 1]);
    const headerH = 18;

    // Header
    drawRect(doc, M, y, W, headerH);
    for (let i = 1; i < colX.length; i++) drawLine(doc, colX[i], y, colX[i], y + headerH);
    doc.font("Bold").fontSize(7);
    const headers = ["№", "Товары (работы, услуги)", "Кол-во", "Ед. изм.", "Цена", "Сумма"];
    headers.forEach((h, i) => {
      doc.text(h, colX[i] + 2, y + 5, { width: colWidths[i] - 4, align: "center" });
    });
    y += headerH;

    // Rows
    doc.font("Main").fontSize(7.5);
    items.forEach((item, idx) => {
      const descH = Math.max(15, doc.heightOfString(item.description, { width: colWidths[1] - 6 }) + 6);
      drawRect(doc, M, y, W, descH);
      for (let i = 1; i < colX.length; i++) drawLine(doc, colX[i], y, colX[i], y + descH);
      const textY = y + 3;
      doc.text(String(idx + 1), colX[0] + 2, textY, { width: colWidths[0] - 4, align: "center" });
      doc.text(item.description, colX[1] + 3, textY, { width: colWidths[1] - 6 });
      doc.text(String(item.quantity), colX[2] + 2, textY, { width: colWidths[2] - 4, align: "center" });
      doc.text(item.unit, colX[3] + 2, textY, { width: colWidths[3] - 4, align: "center" });
      doc.text(formatMoney(item.price), colX[4] + 2, textY, { width: colWidths[4] - 4, align: "right" });
      doc.text(formatMoney(item.amount), colX[5] + 2, textY, { width: colWidths[5] - 4, align: "right" });
      y += descH;
    });

    y += 8;

    // ============ TOTALS ============
    doc.font("Bold").fontSize(8);
    doc.text("Итого:", M, y, { width: W - 66, align: "right" });
    doc.text(formatMoney(total), M + W - 64, y, { width: 62, align: "right" });
    y += 14;
    doc.text("Без налога (НДС)", M, y, { width: W - 66, align: "right" });
    doc.font("Main").text("-", M + W - 64, y, { width: 62, align: "right" });
    y += 16;

    // ============ AMOUNT IN WORDS ============
    doc.font("Main").fontSize(8);
    doc.text(`Всего наименований ${items.length}, на сумму ${formatMoney(total)} руб.`, M, y);
    y = doc.y + 3;
    doc.font("Bold").fontSize(8);
    doc.text(`${numberToWordsRu(total)} Без НДС.`, M, y, { width: W });
    y = doc.y + 16;

    drawLine(doc, M, y, M + W, y, 0.5);
    y += 16;

    // ============ SIGNATURES ============
    const sigMid = M + W / 2;

    doc.font("Bold").fontSize(9);
    doc.text("Руководитель", M, y);
    doc.text("Бухгалтер", sigMid + 10, y);
    y += 3;

    // Signature lines
    drawLine(doc, M + 80, y + 12, sigMid - 10, y + 12, 0.5);
    drawLine(doc, sigMid + 70, y + 12, M + W, y + 12, 0.5);

    // Draw signature scribble for Руководитель
    drawSignature(doc, M + 100, y + 4);

    // Draw signature scribble for Бухгалтер
    drawSignature(doc, sigMid + 90, y + 4);

    y += 16;

    // ============ STAMP ============
    drawStamp(doc, M + W / 2 - 20, y + 10, 52);

    y += 120;
    doc.end();
  });
}

// Draw a realistic-looking signature scribble
function drawSignature(doc: PDFKit.PDFDocument, x: number, y: number) {
  doc.save();
  doc.strokeColor("#1a237e").lineWidth(0.8);
  doc.moveTo(x, y + 8)
    .bezierCurveTo(x + 10, y - 2, x + 20, y + 12, x + 30, y + 2)
    .bezierCurveTo(x + 40, y - 6, x + 50, y + 10, x + 60, y + 4)
    .bezierCurveTo(x + 70, y - 2, x + 80, y + 8, x + 90, y + 2)
    .stroke();
  doc.moveTo(x + 15, y + 5)
    .bezierCurveTo(x + 25, y - 4, x + 45, y + 14, x + 55, y)
    .stroke();
  doc.restore();
}

// Draw a round blue stamp programmatically
function drawStamp(doc: PDFKit.PDFDocument, cx: number, cy: number, r: number) {
  doc.save();

  // Outer circle
  doc.strokeColor("#1a4da0").lineWidth(2);
  doc.circle(cx, cy, r).stroke();

  // Inner circle
  doc.lineWidth(1.5);
  doc.circle(cx, cy, r - 6).stroke();

  // Center text
  doc.fillColor("#1a4da0");
  doc.font("Bold").fontSize(8);
  doc.text("СОЛОВЬЕВ", cx - 28, cy - 8, { width: 56, align: "center" });
  doc.font("Main").fontSize(6);
  doc.text("Артём Александрович", cx - 38, cy + 2, { width: 76, align: "center" });

  // Curved text around the top: ИП
  doc.font("Main").fontSize(6);
  const topText = "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ";
  const angleStart = Math.PI + 0.35;
  const angleEnd = 2 * Math.PI - 0.35;
  const arcR = r - 12;
  for (let i = 0; i < topText.length; i++) {
    const angle = angleStart + (i / (topText.length - 1)) * (angleEnd - angleStart);
    const tx = cx + arcR * Math.cos(angle);
    const ty = cy + arcR * Math.sin(angle);
    doc.save();
    doc.translate(tx, ty);
    doc.rotate((angle * 180) / Math.PI + 90);
    doc.text(topText[i], -3, -4, { width: 8, lineBreak: false });
    doc.restore();
  }

  // Curved text around the bottom: ОГРНИП
  const bottomText = `ОГРНИП 323312100037191`;
  const bAngleStart = 0.35;
  const bAngleEnd = Math.PI - 0.35;
  for (let i = 0; i < bottomText.length; i++) {
    const angle = bAngleStart + (i / (bottomText.length - 1)) * (bAngleEnd - bAngleStart);
    const tx = cx + arcR * Math.cos(angle);
    const ty = cy + arcR * Math.sin(angle);
    doc.save();
    doc.translate(tx, ty);
    doc.rotate((angle * 180) / Math.PI - 90);
    doc.text(bottomText[i], -3, -4, { width: 8, lineBreak: false });
    doc.restore();
  }

  doc.restore();
}
