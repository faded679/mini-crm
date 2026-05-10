/**
 * Demo seed — fills the database with realistic fake data for demo purposes.
 * Safe to run repeatedly: clears all data first, then recreates.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function clearAll() {
  await prisma.requestPhoto.deleteMany();
  await prisma.requestService.deleteMany();
  await prisma.invoiceRequest.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.bankTransaction.deleteMany();
  await prisma.bankImportBatch.deleteMany();
  await prisma.counterpartyBalance.deleteMany();
  await prisma.counterpartyContact.deleteMany();
  await prisma.requestFieldHistory.deleteMany();
  await prisma.requestStatusHistory.deleteMany();
  await prisma.shipmentRequest.deleteMany();
  await prisma.counterparty.deleteMany();
  await prisma.client.deleteMany();
  await prisma.manager.deleteMany();
  await prisma.deliverySchedule.deleteMany();
  await prisma.priceRate.deleteMany();
  await prisma.city.deleteMany();
  await prisma.boxType.deleteMany();
  await prisma.palletType.deleteMany();
  await prisma.deliveryType.deleteMany();
  await prisma.servicePrice.deleteMany();
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function main() {
  console.log("Clearing all data...");
  await clearAll();
  console.log("Cleared.");

  // ─── Manager ───────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("demo1234", 10);
  await prisma.manager.create({
    data: { email: "demo@demo.com", name: "Менеджер Демо", passwordHash },
  });
  console.log("Created manager: demo@demo.com / demo1234");

  // ─── Cities ────────────────────────────────────────────────────────────────
  const cityData = [
    { shortName: "МСК-ВБ", fullName: "ВБ Электросталь" },
    { shortName: "КЛД-ВБ", fullName: "ВБ Коледино" },
    { shortName: "КРД-ВБ", fullName: "ВБ Краснодар" },
    { shortName: "ВРН-ВБ", fullName: "ВБ Воронеж" },
    { shortName: "КЗН-ВБ", fullName: "ВБ Казань" },
  ];
  const cities: any[] = [];
  for (const c of cityData) {
    cities.push(await prisma.city.create({ data: c }));
  }

  // ─── Box & Pallet types ────────────────────────────────────────────────────
  const box1 = await prisma.boxType.create({ data: { name: "Малая (до 0.1 м³)", minVolumeM3: 0, maxVolumeM3: 0.1 } });
  const box2 = await prisma.boxType.create({ data: { name: "Средняя (до 0.5 м³)", minVolumeM3: 0.1, maxVolumeM3: 0.5 } });
  const pallet1 = await prisma.palletType.create({ data: { name: "Стандартный (1 паллет)", minValue: 1, maxValue: 1 } });
  const pallet2 = await prisma.palletType.create({ data: { name: "Крупный (2+ паллеты)", minValue: 2 } });

  // ─── Delivery types ────────────────────────────────────────────────────────
  const dt1 = await prisma.deliveryType.create({ data: { name: "FBO", note: "Фулфилмент" } });
  const dt2 = await prisma.deliveryType.create({ data: { name: "FBS", note: "Отгрузка со склада" } });

  // ─── Price rates ───────────────────────────────────────────────────────────
  for (const city of cities) {
    await prisma.priceRate.create({ data: { cityId: city.id, unit: "boxes", boxTypeId: box1.id, price: 350 } });
    await prisma.priceRate.create({ data: { cityId: city.id, unit: "boxes", boxTypeId: box2.id, price: 550 } });
    await prisma.priceRate.create({ data: { cityId: city.id, unit: "pallet", palletTypeId: pallet1.id, price: 4500 } });
    await prisma.priceRate.create({ data: { cityId: city.id, unit: "pallet", palletTypeId: pallet2.id, price: 8000 } });
  }

  // ─── Delivery schedules ────────────────────────────────────────────────────
  for (const city of cities.slice(0, 3)) {
    for (let w = 0; w < 4; w++) {
      await prisma.deliverySchedule.create({
        data: {
          cityId: city.id,
          destination: city.fullName,
          deliveryDate: daysFromNow(3 + w * 7),
          acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00",
        },
      });
    }
  }

  // ─── Service prices ────────────────────────────────────────────────────────
  await prisma.servicePrice.createMany({
    data: [
      { name: "Паллетирование", price: 500, unit: "паллет" },
      { name: "Стрейч-плёнка", price: 200, unit: "рулон" },
      { name: "Маркировка короба", price: 50, unit: "шт" },
    ],
  });

  // ─── Clients ───────────────────────────────────────────────────────────────
  const clientsData = [
    { telegramId: "demo_tg_101", firstName: "Демо", lastName: "Клиент1", username: "demo_client_1", phone: "70000000001" },
    { telegramId: "demo_tg_102", firstName: "Демо", lastName: "Клиент2", username: "demo_client_2", phone: "70000000002" },
    { telegramId: "demo_tg_103", firstName: "Демо", lastName: "Клиент3", username: "demo_client_3", phone: "70000000003" },
    { telegramId: "demo_tg_104", firstName: "Демо", lastName: "Клиент4", username: null, phone: "70000000004" },
    { telegramId: "demo_tg_105", firstName: "Демо", lastName: "Клиент5", username: "demo_client_5", phone: "70000000005" },
  ];
  const clients: any[] = [];
  for (const c of clientsData) {
    clients.push(await prisma.client.create({ data: { ...c, consentGiven: true, consentAt: daysAgo(60) } }));
  }

  // ─── Counterparties ────────────────────────────────────────────────────────
  const cpData = [
    {
      name: 'Общество с ограниченной ответственностью "Торговый Дом Ромашка"',
      shortName: 'ООО "ТД Ромашка"',
      inn: "7701234567", kpp: "770101001",
      address: "г. Москва, ул. Ленина, д. 10, офис 5",
      account: "40702810100001234567",
      bik: "044525974",
      correspondentAccount: "30101810145250000974",
      bank: 'АО "ТИНЬКОФФ БАНК"',
      director: "Иванов Алексей Петрович",
      directorPost: "Генеральный директор",
      contract: "№ 12/2024 от 15.01.2024",
    },
    {
      name: 'Индивидуальный предприниматель Петрова Мария Сергеевна',
      shortName: "ИП Петрова М.С.",
      inn: "772234567890", kpp: null,
      address: "г. Москва, ул. Садовая, д. 25, кв. 3",
      account: "40802810200002345678",
      bik: "044525225",
      correspondentAccount: "30101810400000000225",
      bank: 'ПАО "СБЕРБАНК"',
      director: "Петрова Мария Сергеевна",
      directorPost: "ИП",
      contract: "№ 5/2024 от 01.03.2024",
    },
    {
      name: 'Общество с ограниченной ответственностью "СмартЛогистик"',
      shortName: 'ООО "СмартЛогистик"',
      inn: "5032198765", kpp: "503201001",
      address: "г. Красногорск, ул. Светлая, д. 1",
      account: "40702810300003456789",
      bik: "044525593",
      correspondentAccount: "30101810200000000593",
      bank: 'АО "АЛЬФА-БАНК"',
      director: "Сидоров Дмитрий Анатольевич",
      directorPost: "Директор",
      contract: "№ 8/2023 от 10.11.2023",
    },
  ];
  const counterparties: any[] = [];
  for (const cp of cpData) {
    counterparties.push(await prisma.counterparty.create({ data: cp }));
  }

  // Link clients to counterparties
  await prisma.counterpartyContact.create({ data: { counterpartyId: counterparties[0].id, clientId: clients[0].id } });
  await prisma.counterpartyContact.create({ data: { counterpartyId: counterparties[1].id, clientId: clients[1].id } });
  await prisma.counterpartyContact.create({ data: { counterpartyId: counterparties[2].id, clientId: clients[2].id } });

  // ─── Shipment Requests ─────────────────────────────────────────────────────
  const requestsData = [
    { clientId: clients[0].id, cityId: cities[0].id, city: cities[0].fullName, deliveryDate: daysFromNow(5), boxCount: 10, packagingType: "boxes" as const, deliveryTypeId: dt1.id, boxTypeId: box2.id, status: "new" as const, volume: 2.5, comment: "Хрупкий товар, осторожно" },
    { clientId: clients[1].id, cityId: cities[1].id, city: cities[1].fullName, deliveryDate: daysFromNow(8), boxCount: 3, packagingType: "pallets" as const, deliveryTypeId: dt1.id, palletTypeId: pallet1.id, status: "warehouse" as const, volume: 1.8 },
    { clientId: clients[2].id, cityId: cities[2].id, city: cities[2].fullName, deliveryDate: daysFromNow(12), boxCount: 20, packagingType: "boxes" as const, deliveryTypeId: dt2.id, boxTypeId: box1.id, status: "shipped" as const, volume: 1.2 },
    { clientId: clients[0].id, cityId: cities[0].id, city: cities[0].fullName, deliveryDate: daysAgo(5), boxCount: 5, packagingType: "pallets" as const, deliveryTypeId: dt1.id, palletTypeId: pallet2.id, status: "done" as const, volume: 3.0 },
    { clientId: clients[3].id, cityId: cities[3].id, city: cities[3].fullName, deliveryDate: daysFromNow(3), boxCount: 8, packagingType: "boxes" as const, deliveryTypeId: dt2.id, boxTypeId: box2.id, status: "new" as const, volume: 2.0 },
    { clientId: clients[4].id, cityId: cities[4].id, city: cities[4].fullName, deliveryDate: daysFromNow(15), boxCount: 15, packagingType: "boxes" as const, deliveryTypeId: dt1.id, boxTypeId: box1.id, status: "new" as const, volume: 0.9 },
    { clientId: clients[1].id, cityId: cities[0].id, city: cities[0].fullName, deliveryDate: daysAgo(15), boxCount: 12, packagingType: "boxes" as const, deliveryTypeId: dt1.id, boxTypeId: box2.id, status: "archived" as const, volume: 4.0 },
    { clientId: clients[2].id, cityId: cities[1].id, city: cities[1].fullName, deliveryDate: daysAgo(10), boxCount: 2, packagingType: "pallets" as const, deliveryTypeId: dt2.id, palletTypeId: pallet1.id, status: "done" as const, volume: 1.5 },
  ];
  const requests: any[] = [];
  for (const r of requestsData) {
    requests.push(await prisma.shipmentRequest.create({ data: { ...r, size: "стандарт", isRead: true } }));
  }

  // ─── Invoices ──────────────────────────────────────────────────────────────
  const inv1 = await prisma.invoice.create({
    data: {
      number: "2025-001",
      date: daysAgo(30),
      counterpartyId: counterparties[0].id,
      status: "paid",
      isPaid: true,
      paidAt: daysAgo(25),
      amount: 55000,
      items: {
        create: [
          { description: "Услуги по хранению и обработке товара", quantity: 10, unit: "паллет", price: 4500, amount: 45000 },
          { description: "Маркировка короба", quantity: 20, unit: "шт", price: 50, amount: 1000 },
          { description: "Стрейч-плёнка", quantity: 4, unit: "рулон", price: 200, amount: 800 },
          { description: "Паллетирование", quantity: 10, unit: "паллет", price: 820, amount: 8200 },
        ],
      },
    },
  });

  const inv2 = await prisma.invoice.create({
    data: {
      number: "2025-002",
      date: daysAgo(15),
      counterpartyId: counterparties[1].id,
      status: "sent",
      isPaid: false,
      amount: 16500,
      items: {
        create: [
          { description: "Доставка FBO ВБ Коледино", quantity: 3, unit: "паллет", price: 4500, amount: 13500 },
          { description: "Паллетирование", quantity: 3, unit: "паллет", price: 500, amount: 1500 },
          { description: "Стрейч-плёнка", quantity: 3, unit: "рулон", price: 200, amount: 600 },
          { description: "Маркировка", quantity: 18, unit: "шт", price: 50, amount: 900 },
        ],
      },
    },
  });

  const inv3 = await prisma.invoice.create({
    data: {
      number: "2025-003",
      date: daysAgo(45),
      counterpartyId: counterparties[2].id,
      status: "paid",
      isPaid: true,
      paidAt: daysAgo(40),
      amount: 38500,
      items: {
        create: [
          { description: "Доставка FBO ВБ Краснодар", quantity: 20, unit: "кор", price: 550, amount: 11000 },
          { description: "Обработка и маркировка", quantity: 20, unit: "шт", price: 50, amount: 1000 },
          { description: "Доставка FBO ВБ Электросталь", quantity: 10, unit: "кор", price: 350, amount: 3500 },
          { description: "Хранение товара", quantity: 7, unit: "дней", price: 3000, amount: 21000 },
          { description: "Разгрузка/погрузка", quantity: 1, unit: "услуга", price: 2000, amount: 2000 },
        ],
      },
    },
  });

  const inv4 = await prisma.invoice.create({
    data: {
      number: "2025-004",
      date: daysAgo(5),
      counterpartyId: counterparties[0].id,
      status: "awaiting_payment",
      isPaid: false,
      amount: 22500,
      items: {
        create: [
          { description: "Доставка FBO ВБ Электросталь", quantity: 5, unit: "паллет", price: 4500, amount: 22500 },
        ],
      },
    },
  });

  // Link requests to invoices
  await prisma.invoiceRequest.create({ data: { invoiceId: inv1.id, requestId: requests[3].id } });
  await prisma.invoiceRequest.create({ data: { invoiceId: inv2.id, requestId: requests[1].id } });
  await prisma.invoiceRequest.create({ data: { invoiceId: inv4.id, requestId: requests[0].id } });

  // ─── Bank import batch + transactions ──────────────────────────────────────
  const batch = await prisma.bankImportBatch.create({
    data: {
      fileName: "demo_bank_statement_2025.xml",
      periodStart: daysAgo(60),
      periodEnd: daysAgo(1),
      account: "40802810100002843508",
      totalIncoming: 93500,
      totalOutgoing: 0,
      openBalance: 0,
      closeBalance: 93500,
      recordCount: 3,
      source: "manual",
    },
  });

  await prisma.bankTransaction.create({
    data: {
      importBatchId: batch.id,
      documentNumber: "П-001",
      documentDate: daysAgo(25),
      amount: 55000,
      direction: "in",
      payerName: counterparties[0].name,
      payerInn: counterparties[0].inn,
      payerAccount: counterparties[0].account,
      payerBik: counterparties[0].bik,
      payerBank: counterparties[0].bank,
      recipientName: "ИП Соловьёв Артём Александрович",
      recipientInn: "302201915296",
      recipientAccount: "40802810100002843508",
      purpose: `Оплата по счёту № ${inv1.number} за услуги FBO`,
      counterpartyId: counterparties[0].id,
      invoiceNumbers: [inv1.number],
      status: "matched",
      matchedAt: daysAgo(25),
    },
  });

  await prisma.bankTransaction.create({
    data: {
      importBatchId: batch.id,
      documentNumber: "П-002",
      documentDate: daysAgo(40),
      amount: 38500,
      direction: "in",
      payerName: counterparties[2].name,
      payerInn: counterparties[2].inn,
      payerAccount: counterparties[2].account,
      payerBik: counterparties[2].bik,
      payerBank: counterparties[2].bank,
      recipientName: "ИП Соловьёв Артём Александрович",
      recipientInn: "302201915296",
      recipientAccount: "40802810100002843508",
      purpose: `Оплата по счёту № ${inv3.number} за логистику`,
      counterpartyId: counterparties[2].id,
      invoiceNumbers: [inv3.number],
      status: "matched",
      matchedAt: daysAgo(40),
    },
  });

  // Unmatched transaction to show in finance UI
  await prisma.bankTransaction.create({
    data: {
      importBatchId: batch.id,
      documentNumber: "П-003",
      documentDate: daysAgo(3),
      amount: 15000,
      direction: "in",
      payerName: "ООО Покупатель Тест",
      payerInn: "7709876543",
      payerAccount: "40702810500004567890",
      payerBik: "044525225",
      payerBank: 'ПАО "СБЕРБАНК"',
      recipientName: "ИП Соловьёв Артём Александрович",
      recipientInn: "302201915296",
      recipientAccount: "40802810100002843508",
      purpose: "Оплата за услуги, счёт 2025-005",
      status: "unmatched",
      invoiceNumbers: [],
    },
  });

  // ─── Counterparty balances ─────────────────────────────────────────────────
  await prisma.counterpartyBalance.create({
    data: { counterpartyId: counterparties[0].id, totalBilled: 77500, totalPaid: 55000, balance: -22500 },
  });
  await prisma.counterpartyBalance.create({
    data: { counterpartyId: counterparties[1].id, totalBilled: 16500, totalPaid: 0, balance: -16500 },
  });
  await prisma.counterpartyBalance.create({
    data: { counterpartyId: counterparties[2].id, totalBilled: 38500, totalPaid: 38500, balance: 0 },
  });

  console.log("Demo seed complete!");
  console.log("Login: demo@demo.com / demo1234");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
