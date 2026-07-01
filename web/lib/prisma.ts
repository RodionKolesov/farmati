import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// SQLite под нагрузкой (несколько админов одновременно + чтение сайта) без этих
// настроек кидает "database is locked" → страница падает с "This page couldn't load".
//  • connection_limit=1 — все запросы Prisma идут через одно соединение и не дерутся за блокировку;
//  • WAL (journal_mode) — разрешает параллельное чтение во время записи;
//  • busy_timeout — писатель ждёт освобождения БД, а не падает мгновенно.
function dbUrl() {
  const url = process.env.DATABASE_URL || "file:./prod.db";
  if (url.startsWith("file:") && !url.includes("connection_limit")) {
    return url + (url.includes("?") ? "&" : "?") + "connection_limit=1";
  }
  return url;
}

function createPrisma() {
  const client = new PrismaClient({ datasources: { db: { url: dbUrl() } } });
  // Соединение одно (connection_limit=1), поэтому PRAGMA достаточно выставить один раз.
  // WAL сохраняется в самом файле БД; busy_timeout действует на всё соединение.
  client.$queryRawUnsafe("PRAGMA journal_mode = WAL;").catch(() => {});
  client.$queryRawUnsafe("PRAGMA busy_timeout = 8000;").catch(() => {});
  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
