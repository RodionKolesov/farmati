import "server-only";
import { prisma } from "@/lib/prisma";
import { earnedFor } from "@/lib/bonus";
import { grantBonus } from "@/lib/bonusLedger";

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
      await grantBonus(tx, order.userId, earned, "Начисление за заказ", orderId);
    }
    // Списываем остатки купленных товаров (курсы без остатка пропускаем). Не уходим в минус.
    const items = await tx.orderItem.findMany({ where: { orderId, productId: { not: null } } });
    for (const it of items) {
      if (!it.productId) continue;
      const prod = await tx.product.findUnique({ where: { id: it.productId } });
      if (prod) {
        await tx.product.update({ where: { id: it.productId }, data: { stock: Math.max(0, prod.stock - it.qty) } });
      }
    }
  });
}
