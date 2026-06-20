import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "logist@mail.ru";
  const password = "logsolo3212";
  const name = "Логист";

  const existing = await (prisma as any).logist.findUnique({ where: { email } });
  if (existing) {
    console.log(`Logist ${email} already exists, id=${existing.id}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const logist = await (prisma as any).logist.create({
    data: { email, passwordHash, name },
  });
  console.log(`Created logist: id=${logist.id} email=${logist.email}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
