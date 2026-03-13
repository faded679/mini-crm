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

// Draw a signature scribble
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

  // Curved text around the top
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

  // Curved text around the bottom
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

export async function generateActPdfBuffer(params: ActPdfParams): Promise<Buffer> {
  const { actNumber, actDate, invoiceNumber, invoiceDate, counterparty, items } = params;
  const total = items.reduce((s, i) => s + i.amount, 0);

  const FONT = findFont("DejaVuSans");
  const FONT_BOLD = fs.existsSync(FONT.replace("DejaVuSans", "DejaVuSans-Bold"))
    ? FONT.replace("DejaVuSans", "DejaVuSans-Bold")
    : FONT;

  const M = 40;
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
    doc.font("Bold").fontSize(13).fillColor("#1a3c7a");
    doc.text(`Акт № ${actNumber} от ${formatDate(actDate)} г.`, M, y, { width: W });
    doc.fillColor("#000");
    y = doc.y + 8;

    drawLine(doc, M, y, M + W, y, 1);
    y += 10;

    // ============ ИСПОЛНИТЕЛЬ ============
    const labelW = 75;
    doc.font("Main").fontSize(8);
    doc.text("Исполнитель:", M, y, { width: labelW });
    doc.font("Bold").text(
      `${SELLER.name}, ИНН ${SELLER.inn}, ${SELLER.address}, р/с ${SELLER.account}, в банке ${SELLER.bank}, БИК ${SELLER.bik}, к/с ${SELLER.correspondentAccount}`,
      M + labelW, y, { width: W - labelW },
    );
    y = doc.y + 6;

    // ============ ЗАКАЗЧИК ============
    doc.font("Main").text("Заказчик:", M, y, { width: labelW });
    const cpParts = [counterparty.name];
    if (counterparty.inn) cpParts.push(`ИНН ${counterparty.inn}`);
    if (counterparty.account) cpParts.push(`р/с ${counterparty.account}`);
    if (counterparty.bank) cpParts.push(`в банке ${counterparty.bank}`);
    if (counterparty.bik) cpParts.push(`БИК ${counterparty.bik}`);
    if (counterparty.correspondentAccount) cpParts.push(`к/с ${counterparty.correspondentAccount}`);
    doc.font("Bold").text(cpParts.join(", "), M + labelW, y, { width: W - labelW });
    y = doc.y + 6;

    // ============ ОСНОВАНИЕ ============
    doc.font("Main").text("Основание:", M, y, { width: labelW });
    doc.font("Main").text(`По счету № ${invoiceNumber} от ${formatDateShort(invoiceDate)}`, M + labelW, y, { width: W - labelW });
    y = doc.y + 12;

    // ============ TABLE ============
    const colWidths = [24, W - 24 - 42 - 36 - 62 - 62, 42, 36, 62, 62];
    const colX = [M];
    for (let i = 1; i < colWidths.length; i++) colX.push(colX[i - 1] + colWidths[i - 1]);
    const headerH = 18;

    // Header
    drawRect(doc, M, y, W, headerH);
    for (let i = 1; i < colX.length; i++) drawLine(doc, colX[i], y, colX[i], y + headerH);
    doc.font("Bold").fontSize(7);
    const headers = ["№", "Наименование работ, услуг", "Кол-во", "Ед.", "Цена", "Сумма"];
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
    doc.text(`Всего оказано услуг ${items.length}, на сумму ${formatMoney(total)} руб.`, M, y);
    y = doc.y + 3;
    doc.font("Bold").fontSize(8);
    doc.text(numberToWordsRu(total), M, y, { width: W });
    y = doc.y + 14;

    // ============ DISCLAIMER ============
    doc.font("Main").fontSize(8);
    doc.text(
      "Вышеперечисленные услуги выполнены полностью и в срок. Заказчик претензий по объёму, качеству и срокам оказания услуг не имеет.",
      M, y, { width: W },
    );
    y = doc.y + 16;

    drawLine(doc, M, y, M + W, y, 0.5);
    y += 16;

    // ============ SIGNATURES ============
    const halfW = W / 2;

    doc.font("Bold").fontSize(10);
    doc.text("ИСПОЛНИТЕЛЬ", M, y);
    doc.text("ЗАКАЗЧИК", M + halfW + 10, y);

    const sigY = y + 4;

    // Signature scribble for ИСПОЛНИТЕЛЬ
    drawSignature(doc, M + 10, sigY + 6);

    // Signature lines
    drawLine(doc, M, sigY + 22, M + halfW - 20, sigY + 22, 0.5);
    drawLine(doc, M + halfW + 10, sigY + 22, M + W, sigY + 22, 0.5);

    // Names under lines
    doc.font("Main").fontSize(7);
    doc.text(`ИП ${SELLER.director}`, M, sigY + 26);
    const cpDirector = counterparty.director || counterparty.name;
    doc.text(cpDirector, M + halfW + 10, sigY + 26);

    // ============ STAMP ============
    drawStamp(doc, M + 90, sigY + 60, 48);

    y = sigY + 120;
    doc.end();
  });
}
