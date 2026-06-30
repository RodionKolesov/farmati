import "server-only";
import { prisma } from "@/lib/prisma";
import { earnedFor } from "@/lib/bonus";
import { grantBonus } from "@/lib/bonusLedger";
import { notifyAdmins } from "@/lib/telegram";
import { createCdekOrder, getCdekTrack, cdekSenderReady } from "@/lib/cdek";

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

  // Автосоздание накладной в СДЭК (только после оплаты). Не критично для заказа:
  // при сбое заказ остаётся оплаченным, админу уходит уведомление создать вручную.
  if (order.deliveryMethod === "cdek" && order.cdekPvzCode && !order.cdekUuid && cdekSenderReady()) {
    try {
      const phys = await prisma.orderItem.findMany({ where: { orderId, productId: { not: null } } });
      const res = await createCdekOrder({
        orderId: order.id,
        pvzCode: order.cdekPvzCode,
        cityCode: order.cdekCityCode,
        recipientName: order.customerName,
        recipientPhone: order.customerPhone,
        items: phys.map((i) => ({ title: i.title, price: i.price, qty: i.qty, productId: i.productId! })),
      });
      if (res.ok && res.uuid) {
        let track = "";
        try { track = await getCdekTrack(res.uuid); } catch { /* трек присвоится позже */ }
        await prisma.order.update({ where: { id: orderId }, data: { cdekUuid: res.uuid, cdekTrack: track } });
      } else {
        await notifyAdmins(`⚠️ Заказ #${order.id.slice(-6)}: не удалось создать в СДЭК автоматически.\nПричина: ${res.error}\nСоздайте вручную: ПВЗ ${order.cdekPvzCode}.`);
      }
    } catch {
      // СДЭК не должен влиять на статус оплаты заказа
    }
  }

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
