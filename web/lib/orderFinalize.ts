import "server-only";
import { prisma } from "@/lib/prisma";
import { earnedFor } from "@/lib/bonus";

// Перевод заказа в статус "оплачен": начисление 5% бонусами. Идемпотентно —
// повторный вызов (например, дубль вебхука) ничего не меняет.
export async function finalizeOrder(orderId: string, paymentId?: string): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status === "paid") return;

  // Бонусы начисляем на стоимость товаров (без доставки).
  const earned = earnedFor(Math.max(0, order.amount - order.deliveryCost));

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: "paid", bonusEarned: earned, paymentId: paymentId ?? order.paymentId },
    });
    if (earned > 0) {
      await tx.bonusTransaction.create({
        data: { userId: order.userId, orderId, delta: earned, type: "earn", note: "Начисление за заказ" },
      });
      await tx.user.update({ where: { id: order.userId }, data: { bonusBalance: { increment: earned } } });
    }
  });
}
