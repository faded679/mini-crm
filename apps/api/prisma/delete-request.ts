import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const idRaw = process.argv[2];
  const id = Number(idRaw);
  if (!Number.isFinite(id)) {
    throw new Error("Usage: tsx prisma/delete-request.ts <requestId>");
  }

  await prisma.$transaction(async (tx) => {
    await tx.requestStatusHistory.deleteMany({ where: { requestId: id } });
    await tx.shipmentRequest.delete({ where: { id } });
  });

  console.log(`Deleted shipment request #${id}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
