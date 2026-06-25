import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { bonusExpiryFrom } from "@/lib/bonus";

type Tx = Prisma.TransactionClient;

// Начислить бонусы: создаёт earn-партию с остатком и сроком сгорания (внутри переданной транзакции).
export async function grantBonus(tx: Tx, userId: string, delta: number, note: string, orderId?: string) {
  if (delta <= 0) return;
  await tx.bonusTransaction.create({
    data: {
      userId,
      orderId: orderId ?? null,
      delta,
      type: "earn",
      note,
      remaining: delta,
      expiresAt: bonusExpiryFrom(new Date()),
    },
  });
  await tx.user.update({ where: { id: userId }, data: { bonusBalance: { increment: delta } } });
}

// Списать бонусы FIFO: уменьшает остаток у старейших (ближе к сгоранию) партий.
// amount должен быть уже валидирован (<= актуального баланса).
export async function spendBonusFIFO(tx: Tx, userId: string, amount: number, note: string, orderId?: string) {
  if (amount <= 0) return;
  let left = amount;
  const batches = await tx.bonusTransaction.findMany({
    where: { userId, type: "earn", remaining: { gt: 0 } },
    orderBy: [{ expiresAt: "asc" }, { createdAt: "asc" }],
  });
  for (const b of batches) {
    if (left <= 0) break;
    const take = Math.min(b.remaining, left);
    await tx.bonusTransaction.update({ where: { id: b.id }, data: { remaining: b.remaining - take } });
    left -= take;
  }
  await tx.bonusTransaction.create({
    data: { userId, orderId: orderId ?? null, delta: -amount, type: "spend", note },
  });
  await tx.user.update({ where: { id: userId }, data: { bonusBalance: { decrement: amount } } });
}

// Сжечь просроченные бонусы (для одного пользователя или для всех). Возвращает сумму сгоревшего.
export async function expireBonuses(userId?: string): Promise<number> {
  const now = new Date();
  const batches = await prisma.bonusTransaction.findMany({
    where: { type: "earn", remaining: { gt: 0 }, expiresAt: { lt: now }, ...(userId ? { userId } : {}) },
  });
  let total = 0;
  for (const b of batches) {
    await prisma.$transaction(async (tx) => {
      const fresh = await tx.bonusTransaction.findUnique({ where: { id: b.id } });
      if (!fresh || fresh.remaining <= 0) return; // успели потратить — пропускаем
      await tx.bonusTransaction.update({ where: { id: fresh.id }, data: { remaining: 0 } });
      await tx.bonusTransaction.create({
        data: { userId: fresh.userId, delta: -fresh.remaining, type: "expire", note: "Сгорание бонусов (срок 4 месяца)" },
      });
      await tx.user.update({ where: { id: fresh.userId }, data: { bonusBalance: { decrement: fresh.remaining } } });
      total += fresh.remaining;
    });
  }
  return total;
}

// Сводка по ближайшему сгоранию для пользователя (для кабинета).
export async function nextExpiry(userId: string): Promise<{ amount: number; date: Date } | null> {
  const b = await prisma.bonusTransaction.findFirst({
    where: { userId, type: "earn", remaining: { gt: 0 }, expiresAt: { not: null } },
    orderBy: [{ expiresAt: "asc" }],
  });
  if (!b || !b.expiresAt) return null;
  return { amount: b.remaining, date: b.expiresAt };
}
