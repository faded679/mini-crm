import "../src/server/env.js";

import bcrypt from "bcryptjs";
import { prisma } from "../src/server/db/prisma.js";

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
