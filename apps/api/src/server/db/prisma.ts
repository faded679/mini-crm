import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient() as unknown as PrismaClient;
