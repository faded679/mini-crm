import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createWarehouseWorker() {
  const email = process.argv[2] || "warehouse@test.ru";
  const password = process.argv[3] || "password123";
  const name = process.argv[4] || "Иван Петров";
  const telegramId = process.argv[5] || String(Date.now());

  console.log("Создание кладовщика...");
  console.log("Email:", email);
  console.log("Пароль:", password);
  console.log("Имя:", name);

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const worker = await (prisma as any).warehouseWorker.create({
      data: {
        telegramId,
        email,
        password: hashedPassword,
        name,
        isActive: true,
      },
    });

    console.log("\n✅ Кладовщик успешно создан!");
    console.log("ID:", worker.id);
    console.log("Email:", worker.email);
    console.log("Имя:", worker.name);
    console.log("\nТеперь можно войти на https://test.ved31.ru/warehouse/login");
  } catch (error: any) {
    if (error.code === "P2002") {
      console.error("\n❌ Ошибка: Кладовщик с таким email уже существует");
    } else {
      console.error("\n❌ Ошибка:", error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createWarehouseWorker();
