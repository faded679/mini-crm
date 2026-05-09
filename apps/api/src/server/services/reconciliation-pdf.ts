import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SELLER = {
  name: "ИП Соловьёв Артём Александрович",
  inn: "302201915296",
  kpp: "",
  address: "309167, РОССИЯ, БЕЛГОРОДСКАЯ ОБЛ, КРАСНОЯРУСЖКИЙ Р-Н, ПОСЕЛОК СТЕПНОЕ, УЛ САДОВАЯ, Д 9/1",
  account: "40802810100002843508",
  bik: "044525974",
  correspondentAccount: "30101810145250000974",
  bank: 'АО "ТИНЬКОФФ БАНК" Г. Москва',
  director: "Соловьёв Артём Александрович",
};

export type ReconciliationEntry = {
  date: string;
  description: string;
  debit: number;
  credit: number;
};

export type ReconciliationPdfParams = {
  counterparty: {
    name: string;
    inn?: string | null;
    kpp?: string | null;
    address?: string | null;
    director?: string | null;
  };
  dateFrom: string;
  dateTo: string;
  entries: ReconciliationEntry[];
  openingBalance: number;
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
}

function fmtMoney(n: number): string {
  if (n === 0) return "";
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtMoneyZero(n: number): string {
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function findFont(name: string): string {
  const candidates = [
    path.join(__dirname, "..", "..", "..", "assets", "fonts", `${name}.ttf`),
    `/usr/share/fonts/truetype/dejavu/${name}.ttf`,
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(`Шрифт ${name}.ttf не найден`);
}

function drawLine(doc: PDFKit.PDFDocument, x1: number, y1: number, x2: number, y2: number, w = 0.5) {
  doc.lineWidth(w).moveTo(x1, y1).lineTo(x2, y2).stroke("#000");
}

export async function generateReconciliationPdfBuffer(params: ReconciliationPdfParams): Promise<Buffer> {
  const { counterparty, dateFrom, dateTo, entries, openingBalance } = params;

  const FONT = findFont("DejaVuSans");
  const FONT_BOLD = fs.existsSync(FONT.replace("DejaVuSans", "DejaVuSans-Bold"))
    ? FONT.replace("DejaVuSans", "DejaVuSans-Bold")
    : FONT;

  const M = 28;
  const doc = new PDFDocument({ size: "A4", margin: M });
  doc.registerFont("Main", FONT);
  doc.registerFont("Bold", FONT_BOLD);

  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer | string | Uint8Array) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));

  return new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = 595.28 - M * 2;
    let y = M;

    // ====== ЗАГОЛОВОК ======
    doc.font("Bold").fontSize(13).fillColor("#000");
    doc.text("АКТ СВЕРКИ ВЗАИМНЫХ РАСЧЁТОВ", M, y, { width: W, align: "center" });
    y = doc.y + 3;

    doc.font("Main").fontSize(10);
    doc.text(`за период с ${fmtDateLong(dateFrom)} по ${fmtDateLong(dateTo)}`, M, y, { width: W, align: "center" });
    y = doc.y + 8;

    // ====== СТОРОНЫ ======
    const halfW = (W - 10) / 2;

    // Левый блок — мы
    doc.font("Bold").fontSize(9).text("Сторона 1", M, y, { width: halfW });
    const y1start = doc.y + 2;
    doc.font("Main").fontSize(8);
    doc.text(`${SELLER.name}`, M, y1start, { width: halfW });
    doc.text(`ИНН: ${SELLER.inn}`, M, doc.y, { width: halfW });
    const yLeft = doc.y;

    // Правый блок — контрагент
    const rx = M + halfW + 10;
    doc.font("Bold").fontSize(9).text("Сторона 2", rx, y, { width: halfW });
    const y2start = doc.y + 2;
    doc.font("Main").fontSize(8);
    doc.text(counterparty.name, rx, y2start, { width: halfW });
    if (counterparty.inn) doc.text(`ИНН: ${counterparty.inn}${counterparty.kpp ? `, КПП: ${counterparty.kpp}` : ""}`, rx, doc.y, { width: halfW });
    const yRight = doc.y;

    y = Math.max(yLeft, yRight) + 12;

    drawLine(doc, M, y, M + W, y, 0.8);
    y += 10;

    // ====== ТАБЛИЦА ======
    // Колонки: Дата | Документ | Дебет (мы) | Кредит (мы) | Дата | Документ | Дебет (они) | Кредит (они)
    // Упрощённый вид: левая половина — наши операции, правая — их
    // Стандартный формат акта сверки: 5 колонок
    // №  | Документ/Описание | Сумма по дебету | Сумма по кредиту | Баланс

    const colW = [22, W - 22 - 75 - 75 - 75, 75, 75, 75];
    const colX: number[] = [M];
    for (let i = 1; i < colW.length; i++) colX.push(colX[i - 1] + colW[i - 1]);

    const hdrH = 28;

    // Заголовок таблицы
    doc.lineWidth(0.8).rect(M, y, W, hdrH).stroke("#000");
    for (let i = 1; i < colX.length; i++) drawLine(doc, colX[i], y, colX[i], y + hdrH, 0.8);

    doc.font("Bold").fontSize(7.5);
    const hdrs = ["№", "Документ", "Начислено\n(дебет)", "Оплачено\n(кредит)", "Баланс"];
    hdrs.forEach((h, i) => {
      doc.text(h, colX[i] + 2, y + 4, { width: colW[i] - 4, align: "center", lineGap: 0 });
    });
    y += hdrH;

    // Строка: сальдо на начало
    const rowH0 = 14;
    doc.lineWidth(0.8).rect(M, y, W, rowH0).stroke("#000");
    for (let i = 1; i < colX.length; i++) drawLine(doc, colX[i], y, colX[i], y + rowH0, 0.8);
    doc.font("Bold").fontSize(8);
    doc.text("", colX[0] + 2, y + 3, { width: colW[0] - 4, align: "center" });
    doc.text(`Сальдо на начало периода (${fmtDate(dateFrom)})`, colX[1] + 2, y + 3, { width: colW[1] - 4 });
    if (openingBalance > 0) {
      doc.text(fmtMoneyZero(openingBalance), colX[2] + 2, y + 3, { width: colW[2] - 4, align: "right" });
      doc.text("", colX[3] + 2, y + 3, { width: colW[3] - 4, align: "right" });
    } else if (openingBalance < 0) {
      doc.text("", colX[2] + 2, y + 3, { width: colW[2] - 4, align: "right" });
      doc.text(fmtMoneyZero(Math.abs(openingBalance)), colX[3] + 2, y + 3, { width: colW[3] - 4, align: "right" });
    }
    doc.text(fmtMoneyZero(openingBalance), colX[4] + 2, y + 3, { width: colW[4] - 4, align: "right" });
    y += rowH0;

    // Строки операций
    let balance = openingBalance;
    let rowNum = 1;

    for (const entry of entries) {
      const descText = `${fmtDate(entry.date)} — ${entry.description}`;
      const descH = Math.max(14, doc.font("Main").fontSize(8).heightOfString(descText, { width: colW[1] - 6 }) + 6);

      doc.lineWidth(0.8).rect(M, y, W, descH).stroke("#000");
      for (let i = 1; i < colX.length; i++) drawLine(doc, colX[i], y, colX[i], y + descH, 0.8);

      balance += entry.credit - entry.debit;

      doc.font("Main").fontSize(8);
      doc.text(String(rowNum++), colX[0] + 2, y + 3, { width: colW[0] - 4, align: "center", lineGap: 0 });
      doc.text(descText, colX[1] + 2, y + 3, { width: colW[1] - 6, lineGap: 0 });
      doc.text(fmtMoney(entry.debit), colX[2] + 2, y + 3, { width: colW[2] - 4, align: "right", lineGap: 0 });
      doc.text(fmtMoney(entry.credit), colX[3] + 2, y + 3, { width: colW[3] - 4, align: "right", lineGap: 0 });
      doc.text(fmtMoneyZero(balance), colX[4] + 2, y + 3, { width: colW[4] - 4, align: "right", lineGap: 0 });

      y += descH;

      // Новая страница если нужно
      if (y > 750) {
        doc.addPage();
        y = M;
      }
    }

    // Итоги оборотов
    const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
    const totalCredit = entries.reduce((s, e) => s + e.credit, 0);

    const rowHTot = 14;
    doc.lineWidth(0.8).rect(M, y, W, rowHTot).stroke("#000");
    for (let i = 1; i < colX.length; i++) drawLine(doc, colX[i], y, colX[i], y + rowHTot, 0.8);
    doc.font("Bold").fontSize(8);
    doc.text("", colX[0] + 2, y + 3, { width: colW[0] - 4 });
    doc.text("Обороты за период:", colX[1] + 2, y + 3, { width: colW[1] - 4 });
    doc.text(fmtMoneyZero(totalDebit), colX[2] + 2, y + 3, { width: colW[2] - 4, align: "right" });
    doc.text(fmtMoneyZero(totalCredit), colX[3] + 2, y + 3, { width: colW[3] - 4, align: "right" });
    y += rowHTot;

    // Сальдо на конец
    const closingBalance = openingBalance + totalCredit - totalDebit;
    doc.lineWidth(0.8).rect(M, y, W, rowHTot).stroke("#000");
    for (let i = 1; i < colX.length; i++) drawLine(doc, colX[i], y, colX[i], y + rowHTot, 0.8);
    doc.text("", colX[0] + 2, y + 3, { width: colW[0] - 4 });
    doc.text(`Сальдо на конец периода (${fmtDate(dateTo)}):`, colX[1] + 2, y + 3, { width: colW[1] - 4 });
    if (closingBalance > 0) {
      doc.text(fmtMoneyZero(closingBalance), colX[2] + 2, y + 3, { width: colW[2] - 4, align: "right" });
      doc.text("", colX[3] + 2, y + 3, { width: colW[3] - 4, align: "right" });
    } else if (closingBalance < 0) {
      doc.text("", colX[2] + 2, y + 3, { width: colW[2] - 4, align: "right" });
      doc.text(fmtMoneyZero(Math.abs(closingBalance)), colX[3] + 2, y + 3, { width: colW[3] - 4, align: "right" });
    } else {
      doc.text("0,00", colX[2] + 2, y + 3, { width: colW[2] - 4, align: "right" });
      doc.text("0,00", colX[3] + 2, y + 3, { width: colW[3] - 4, align: "right" });
    }
    y += rowHTot + 16;

    // ====== ИТОГ ТЕКСТОМ ======
    doc.font("Main").fontSize(9);
    if (Math.abs(closingBalance) < 0.01) {
      doc.text("По данным бухгалтерского учёта задолженность отсутствует.", M, y, { width: W });
    } else if (closingBalance < 0) {
      doc.text(`По данным бухгалтерского учёта задолженность в пользу Стороны 1 составляет ${fmtMoneyZero(Math.abs(closingBalance))} руб.`, M, y, { width: W });
    } else {
      doc.text(`По данным бухгалтерского учёта задолженность в пользу Стороны 2 составляет ${fmtMoneyZero(closingBalance)} руб.`, M, y, { width: W });
    }
    y = doc.y + 20;

    // ====== ПОДПИСИ ======
    if (y > 680) {
      doc.addPage();
      y = M;
    }

    drawLine(doc, M, y, M + W, y, 0.5);
    y += 16;

    doc.font("Bold").fontSize(10);
    doc.text("Сторона 1 (Исполнитель)", M, y, { width: halfW });
    doc.text("Сторона 2 (Заказчик)", M + halfW + 10, y, { width: halfW });
    y += 14;

    doc.font("Main").fontSize(8);
    doc.text(SELLER.name, M, y, { width: halfW });
    doc.text(counterparty.name, M + halfW + 10, y, { width: halfW });
    y += 12;
    doc.text(`ИНН: ${SELLER.inn}`, M, y, { width: halfW });
    if (counterparty.inn) doc.text(`ИНН: ${counterparty.inn}`, M + halfW + 10, y, { width: halfW });
    y += 28;

    // Линии подписей
    drawLine(doc, M, y, M + halfW - 20, y, 0.5);
    drawLine(doc, M + halfW + 10, y, M + W, y, 0.5);

    const stampPath = path.join(__dirname, "..", "..", "..", "assets", "examples", "печать2.png");
    if (fs.existsSync(stampPath)) {
      doc.image(stampPath, M + 10, y - 55, { width: 90, height: 90 });
    }

    doc.font("Main").fontSize(7);
    doc.text(`ИП ${SELLER.director}`, M, y + 3, { width: halfW - 20 });
    const cpDirector = counterparty.director || counterparty.name;
    doc.text(cpDirector, M + halfW + 10, y + 3, { width: halfW - 20 });

    doc.end();
  });
}
