import PDFDocument from "pdfkit";
import type { Counterparty, ShipmentRequest } from "@prisma/client";

type CompanyRequisites = {
  name: string;
  inn: string;
  kpp: string;
  ogrn?: string;
  address: string;
  account: string;
  bik: string;
  correspondentAccount: string;
  bank: string;
  director: string;
};

const COMPANY: CompanyRequisites = {
  name: "ООО \"Пример Логистика\"",
  inn: "7700000000",
  kpp: "770001001",
  ogrn: "1027700000000",
  address: "109000, г. Москва, ул. Примерная, д. 1",
  account: "40702810900000000001",
  bik: "044525000",
  correspondentAccount: "30101810400000000225",
  bank: "АО \"Банк Пример\"",
  director: "Иванов Иван Иванович",
};

export async function generateInvoicePdfBuffer(params: {
  request: ShipmentRequest;
  counterparty: Counterparty;
  amountRub: number;
}): Promise<Buffer> {
  const { request, counterparty, amountRub } = params;

  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const chunks: Buffer[] = [];

  doc.on("data", (c: Buffer | string | Uint8Array) =>
    chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)),
  );

  return await new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text("СЧЁТ НА ОПЛАТУ", { align: "center" });
    doc.moveDown(0.5);

    doc.fontSize(11).text(`Заявка №${request.id} от ${new Date().toLocaleDateString("ru-RU")}`, {
      align: "center",
    });

    doc.moveDown(1);

    doc.fontSize(12).text("Поставщик:", { continued: true }).fontSize(12).text(` ${COMPANY.name}`);
    doc.fontSize(10)
      .text(`ИНН/КПП: ${COMPANY.inn}/${COMPANY.kpp}`)
      .text(`ОГРН: ${COMPANY.ogrn ?? "—"}`)
      .text(`Адрес: ${COMPANY.address}`)
      .text(`Банк: ${COMPANY.bank}`)
      .text(`БИК: ${COMPANY.bik}`)
      .text(`Корр. счёт: ${COMPANY.correspondentAccount}`)
      .text(`Р/счёт: ${COMPANY.account}`)
      .text(`Директор: ${COMPANY.director}`);

    doc.moveDown(1);

    doc.fontSize(12).text("Покупатель:", { continued: true }).fontSize(12).text(` ${counterparty.name}`);
    doc.fontSize(10)
      .text(`ИНН/КПП: ${counterparty.inn ?? "—"}/${counterparty.kpp ?? "—"}`)
      .text(`ОГРН: ${counterparty.ogrn ?? "—"}`)
      .text(`Адрес: ${counterparty.address ?? "—"}`)
      .text(`Банк: ${counterparty.bank ?? "—"}`)
      .text(`БИК: ${counterparty.bik ?? "—"}`)
      .text(`Корр. счёт: ${counterparty.correspondentAccount ?? "—"}`)
      .text(`Р/счёт: ${counterparty.account ?? "—"}`)
      .text(`Директор: ${counterparty.director ?? "—"}`)
      .text(`Договор: ${counterparty.contract ?? "—"}`);

    doc.moveDown(1);

    doc.fontSize(12).text("Назначение платежа:");
    doc.fontSize(10).text(
      `Транспортные услуги по заявке №${request.id}. Город: ${request.city}. Дата доставки: ${new Date(
        request.deliveryDate,
      ).toLocaleDateString("ru-RU")}.`,
    );

    doc.moveDown(1);

    doc.fontSize(12).text(`Итого к оплате: ${amountRub.toLocaleString("ru-RU")} руб.`, {
      align: "right",
    });

    doc.moveDown(2);

    doc.fontSize(10).text("Подпись поставщика ______________________", { align: "left" });

    doc.end();
  });
}
