import { PrismaClient } from "@prisma/client";
import env from "./env";

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL + "?connection_limit=3&pool_timeout=10",
      },
    },
    log:
      env.NODE_ENV === "development"
        ? [
            { emit: "stdout", level: "query" },
            { emit: "stdout", level: "error" },
            { emit: "stdout", level: "warn" },
          ]
        : [{ emit: "stdout", level: "error" }],
  });

if (env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});