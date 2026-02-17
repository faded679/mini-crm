import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_MANAGER_EMAIL ?? "admin@example.com";
  const password = process.env.SEED_MANAGER_PASSWORD ?? "admin12345";
  const name = process.env.SEED_MANAGER_NAME ?? "Admin";

  const passwordHash = await bcrypt.hash(password, 10);

  const manager = await prisma.manager.upsert({
    where: { email },
    update: { name, passwordHash },
    create: { email, name, passwordHash },
  });

  console.log(`Seeded manager: ${manager.email}`);

  // Seed delivery schedule
  await prisma.deliverySchedule.deleteMany();

  const scheduleData: { destination: string; deliveryDate: string; acceptDays: string }[] = [
    // ВБ Электросталь — вт/ср рейсы
    { destination: "ВБ Электросталь", deliveryDate: "2025-02-04", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
    { destination: "ВБ Электросталь", deliveryDate: "2025-02-11", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
    { destination: "ВБ Электросталь", deliveryDate: "2025-02-18", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
    { destination: "ВБ Электросталь", deliveryDate: "2025-02-25", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
    // ВБ Электросталь — сб рейсы
    { destination: "ВБ Электросталь", deliveryDate: "2025-02-08", acceptDays: "Четверг: 9:00–18:00, Пятница: 9:00–15:00" },
    { destination: "ВБ Электросталь", deliveryDate: "2025-02-15", acceptDays: "Четверг: 9:00–18:00, Пятница: 9:00–15:00" },
    { destination: "ВБ Электросталь", deliveryDate: "2025-02-22", acceptDays: "Четверг: 9:00–18:00, Пятница: 9:00–15:00" },
    // ВБ Коледино / ВБ Подольск
    { destination: "ВБ Коледино", deliveryDate: "2025-02-04", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
    { destination: "ВБ Коледино", deliveryDate: "2025-02-11", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
    { destination: "ВБ Коледино", deliveryDate: "2025-02-18", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
    { destination: "ВБ Коледино", deliveryDate: "2025-02-25", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
    { destination: "ВБ Коледино", deliveryDate: "2025-02-08", acceptDays: "Четверг: 9:00–18:00, Пятница: 9:00–15:00" },
    { destination: "ВБ Коледино", deliveryDate: "2025-02-15", acceptDays: "Четверг: 9:00–18:00, Пятница: 9:00–15:00" },
    { destination: "ВБ Коледино", deliveryDate: "2025-02-22", acceptDays: "Четверг: 9:00–18:00, Пятница: 9:00–15:00" },
    { destination: "ВБ Подольск", deliveryDate: "2025-02-04", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
    { destination: "ВБ Подольск", deliveryDate: "2025-02-11", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
    { destination: "ВБ Подольск", deliveryDate: "2025-02-18", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
    { destination: "ВБ Подольск", deliveryDate: "2025-02-25", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
    { destination: "ВБ Подольск", deliveryDate: "2025-02-08", acceptDays: "Четверг: 9:00–18:00, Пятница: 9:00–15:00" },
    { destination: "ВБ Подольск", deliveryDate: "2025-02-15", acceptDays: "Четверг: 9:00–18:00, Пятница: 9:00–15:00" },
    { destination: "ВБ Подольск", deliveryDate: "2025-02-22", acceptDays: "Четверг: 9:00–18:00, Пятница: 9:00–15:00" },
    // ВБ Рязань
    { destination: "ВБ Рязань", deliveryDate: "2025-02-07", acceptDays: "Среда: 9:00–18:00, Четверг: 9:00–15:00" },
    { destination: "ВБ Рязань", deliveryDate: "2025-02-14", acceptDays: "Среда: 9:00–18:00, Четверг: 9:00–15:00" },
    { destination: "ВБ Рязань", deliveryDate: "2025-02-21", acceptDays: "Среда: 9:00–18:00, Четверг: 9:00–15:00" },
    { destination: "ВБ Рязань", deliveryDate: "2025-02-28", acceptDays: "Среда: 9:00–18:00, Четверг: 9:00–15:00" },
    // ВБ Котовск
    { destination: "ВБ Котовск", deliveryDate: "2025-02-04", acceptDays: "Пятница: 9:00–18:00, Понедельник: 9:00–18:00" },
    { destination: "ВБ Котовск", deliveryDate: "2025-02-11", acceptDays: "Пятница: 9:00–18:00, Понедельник: 9:00–18:00" },
    { destination: "ВБ Котовск", deliveryDate: "2025-02-18", acceptDays: "Пятница: 9:00–18:00, Понедельник: 9:00–18:00" },
    { destination: "ВБ Котовск", deliveryDate: "2025-02-25", acceptDays: "Пятница: 9:00–18:00, Понедельник: 9:00–18:00" },
    // ВБ СЦ Курск / ВБ Тула (Алексин) — 3 рейса в неделю
    { destination: "ВБ СЦ Курск", deliveryDate: "2025-02-04", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
    { destination: "ВБ СЦ Курск", deliveryDate: "2025-02-11", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
    { destination: "ВБ СЦ Курск", deliveryDate: "2025-02-18", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
    { destination: "ВБ СЦ Курск", deliveryDate: "2025-02-25", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
    { destination: "ВБ СЦ Курск", deliveryDate: "2025-02-06", acceptDays: "Среда: 9:00–18:00, Четверг: 9:00–18:00" },
    { destination: "ВБ СЦ Курск", deliveryDate: "2025-02-13", acceptDays: "Среда: 9:00–18:00, Четверг: 9:00–18:00" },
    { destination: "ВБ СЦ Курск", deliveryDate: "2025-02-20", acceptDays: "Среда: 9:00–18:00, Четверг: 9:00–18:00" },
    { destination: "ВБ СЦ Курск", deliveryDate: "2025-02-27", acceptDays: "Среда: 9:00–18:00, Четверг: 9:00–18:00" },
    { destination: "ВБ СЦ Курск", deliveryDate: "2025-02-07", acceptDays: "Четверг: 9:00–18:00, Пятница: 9:00–15:00" },
    { destination: "ВБ СЦ Курск", deliveryDate: "2025-02-14", acceptDays: "Четверг: 9:00–18:00, Пятница: 9:00–15:00" },
    { destination: "ВБ СЦ Курск", deliveryDate: "2025-02-21", acceptDays: "Четверг: 9:00–18:00, Пятница: 9:00–15:00" },
    { destination: "ВБ СЦ Курск", deliveryDate: "2025-02-28", acceptDays: "Четверг: 9:00–18:00, Пятница: 9:00–15:00" },
    { destination: "ВБ Тула (Алексин)", deliveryDate: "2025-02-04", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
    { destination: "ВБ Тула (Алексин)", deliveryDate: "2025-02-11", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
    { destination: "ВБ Тула (Алексин)", deliveryDate: "2025-02-18", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
    { destination: "ВБ Тула (Алексин)", deliveryDate: "2025-02-25", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
    { destination: "ВБ Тула (Алексин)", deliveryDate: "2025-02-06", acceptDays: "Среда: 9:00–18:00, Четверг: 9:00–18:00" },
    { destination: "ВБ Тула (Алексин)", deliveryDate: "2025-02-13", acceptDays: "Среда: 9:00–18:00, Четверг: 9:00–18:00" },
    { destination: "ВБ Тула (Алексин)", deliveryDate: "2025-02-20", acceptDays: "Среда: 9:00–18:00, Четверг: 9:00–18:00" },
    { destination: "ВБ Тула (Алексин)", deliveryDate: "2025-02-27", acceptDays: "Среда: 9:00–18:00, Четверг: 9:00–18:00" },
    { destination: "ВБ Тула (Алексин)", deliveryDate: "2025-02-07", acceptDays: "Четверг: 9:00–18:00, Пятница: 9:00–15:00" },
    { destination: "ВБ Тула (Алексин)", deliveryDate: "2025-02-14", acceptDays: "Четверг: 9:00–18:00, Пятница: 9:00–15:00" },
    { destination: "ВБ Тула (Алексин)", deliveryDate: "2025-02-21", acceptDays: "Четверг: 9:00–18:00, Пятница: 9:00–15:00" },
    { destination: "ВБ Тула (Алексин)", deliveryDate: "2025-02-28", acceptDays: "Четверг: 9:00–18:00, Пятница: 9:00–15:00" },
    // ВБ Новосемейкино / Казань / Краснодар / Невинномысск
    { destination: "ВБ Новосемейкино", deliveryDate: "2025-02-05", acceptDays: "Пятница: 9:00–18:00, Понедельник: 9:00–18:00" },
    { destination: "ВБ Новосемейкино", deliveryDate: "2025-02-12", acceptDays: "Пятница: 9:00–18:00, Понедельник: 9:00–18:00" },
    { destination: "ВБ Новосемейкино", deliveryDate: "2025-02-19", acceptDays: "Пятница: 9:00–18:00, Понедельник: 9:00–18:00" },
    { destination: "ВБ Новосемейкино", deliveryDate: "2025-02-26", acceptDays: "Пятница: 9:00–18:00, Понедельник: 9:00–18:00" },
    { destination: "ВБ Казань", deliveryDate: "2025-02-05", acceptDays: "Пятница: 9:00–18:00, Понедельник: 9:00–18:00" },
    { destination: "ВБ Казань", deliveryDate: "2025-02-12", acceptDays: "Пятница: 9:00–18:00, Понедельник: 9:00–18:00" },
    { destination: "ВБ Казань", deliveryDate: "2025-02-19", acceptDays: "Пятница: 9:00–18:00, Понедельник: 9:00–18:00" },
    { destination: "ВБ Казань", deliveryDate: "2025-02-26", acceptDays: "Пятница: 9:00–18:00, Понедельник: 9:00–18:00" },
    { destination: "ВБ Краснодар", deliveryDate: "2025-02-05", acceptDays: "Пятница: 9:00–18:00, Понедельник: 9:00–18:00" },
    { destination: "ВБ Краснодар", deliveryDate: "2025-02-12", acceptDays: "Пятница: 9:00–18:00, Понедельник: 9:00–18:00" },
    { destination: "ВБ Краснодар", deliveryDate: "2025-02-19", acceptDays: "Пятница: 9:00–18:00, Понедельник: 9:00–18:00" },
    { destination: "ВБ Краснодар", deliveryDate: "2025-02-26", acceptDays: "Пятница: 9:00–18:00, Понедельник: 9:00–18:00" },
    { destination: "ВБ Невинномысск", deliveryDate: "2025-02-05", acceptDays: "Пятница: 9:00–18:00, Понедельник: 9:00–18:00" },
    { destination: "ВБ Невинномысск", deliveryDate: "2025-02-12", acceptDays: "Пятница: 9:00–18:00, Понедельник: 9:00–18:00" },
    { destination: "ВБ Невинномысск", deliveryDate: "2025-02-19", acceptDays: "Пятница: 9:00–18:00, Понедельник: 9:00–18:00" },
    { destination: "ВБ Невинномысск", deliveryDate: "2025-02-26", acceptDays: "Пятница: 9:00–18:00, Понедельник: 9:00–18:00" },
    // ВБ Волгоград
    { destination: "ВБ Волгоград", deliveryDate: "2025-02-06", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
    { destination: "ВБ Волгоград", deliveryDate: "2025-02-13", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
    { destination: "ВБ Волгоград", deliveryDate: "2025-02-20", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
    { destination: "ВБ Волгоград", deliveryDate: "2025-02-27", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
    // ВБ Сарапул
    { destination: "ВБ Сарапул", deliveryDate: "2025-02-08", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
    { destination: "ВБ Сарапул", deliveryDate: "2025-02-15", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
    { destination: "ВБ Сарапул", deliveryDate: "2025-02-22", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
    // ВБ Екатеринбург
    { destination: "ВБ Екатеринбург", deliveryDate: "2025-02-09", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
    { destination: "ВБ Екатеринбург", deliveryDate: "2025-02-16", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
    { destination: "ВБ Екатеринбург", deliveryDate: "2025-02-23", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
    // ВБ Воронеж
    { destination: "ВБ Воронеж", deliveryDate: "2025-02-04", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
    { destination: "ВБ Воронеж", deliveryDate: "2025-02-11", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
    { destination: "ВБ Воронеж", deliveryDate: "2025-02-18", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
    { destination: "ВБ Воронеж", deliveryDate: "2025-02-25", acceptDays: "Понедельник: 9:00–18:00, Вторник: 9:00–15:00" },
  ];

  for (const item of scheduleData) {
    await prisma.deliverySchedule.create({
      data: {
        destination: item.destination,
        deliveryDate: new Date(item.deliveryDate),
        acceptDays: item.acceptDays,
      },
    });
  }

  console.log(`Seeded ${scheduleData.length} delivery schedule entries`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
