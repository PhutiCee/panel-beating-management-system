import { PrismaClient } from "@prisma/client";

let prisma;

if (!globalThis.prisma) {
  globalThis.prisma = new PrismaClient();
}

prisma = globalThis.prisma;

export default prisma;
