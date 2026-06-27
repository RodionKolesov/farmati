import "server-only";
import { prisma } from "@/lib/prisma";
import { earnedFor } from "@/lib/bonus";
import { grantBonus } from "@/lib/bonusLedger";
import { notifyAdmins } from "@/lib/telegram";

const DELIVERY_LABELS: Record<string, string> = { courier: "Курьер", pickup: "Самовывоз", cdek: "СДЭК до ПВЗ", post: "Почта России" };

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

  // Уведомление в Telegram о новом оплаченном заказе (не критично — ошибки внутри гасятся).
  try {
    const items = await prisma.orderItem.findMany({ where: { orderId } });
    const lines = items.map((i) => `• ${i.title} ×${i.qty}`).join("\n");
    const delivery = DELIVERY_LABELS[order.deliveryMethod] ?? order.deliveryMethod;
    const text =
      `🛍 Новый оплаченный заказ #${order.id.slice(-6)}\n\n` +
      `${lines}\n\n` +
      `Сумма: ${order.amount} ₽\n` +
      `Бонусами списано: ${order.bonusSpent}\n` +
      `Клиент: ${order.customerName || "—"}\n` +
      `Телефон: ${order.customerPhone || "—"}\n` +
      `Email: ${order.customerEmail || "—"}\n` +
      `Доставка: ${delivery}${order.address ? `, ${order.address}` : ""}` +
      (order.comment ? `\n💬 ${order.comment}` : "");
    await notifyAdmins(text);
  } catch {
    // уведомление не должно влиять на заказ
  }
}
