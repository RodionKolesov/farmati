"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createPayment } from "@/lib/yookassa";
import { finalizeOrder } from "@/lib/orderFinalize";
import { expireBonuses, spendBonusFIFO } from "@/lib/bonusLedger";

type DeliveryMethod = "courier" | "pickup" | "cdek" | "post";
type ClientItem = { kind: "product" | "course"; slug: string; qty: number };
type CheckoutData = { name: string; phone: string; method: DeliveryMethod; address: string; comment: string };

const DELIVERY_FREE_FROM = 3500; // бесплатная доставка курьером от этой суммы
const DELIVERY_FLAT = 350;        // иначе фикс. стоимость курьера по городу
const METHODS: DeliveryMethod[] = ["courier", "pickup", "cdek", "post"];

// Стоимость доставки. Курьер по городу — фикс/бесплатно. Самовывоз — 0.
// СДЭК и Почта — 0 сейчас (стоимость рассчитывается после оформления;
// при подключении API перевозчика здесь будет реальный расчёт по городу).
function deliveryCostFor(method: DeliveryMethod, subtotal: number): number {
  if (method === "courier") return subtotal >= DELIVERY_FREE_FROM ? 0 : DELIVERY_FLAT;
  return 0;
}

export type CheckoutResult =
  | { ok: true; url: string; orderId: string }
  | { ok: false; error: string; needAuth?: boolean };

export async function createOrder(
  items: ClientItem[],
  bonusToSpend: number,
  checkout: CheckoutData,
): Promise<CheckoutResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Войдите в аккаунт", needAuth: true };
  const userId = session.user.id;

  if (!items?.length) return { ok: false, error: "Корзина пуста" };

  const method: DeliveryMethod = METHODS.includes(checkout?.method) ? checkout.method : "courier";
  if (!checkout?.name?.trim() || !checkout?.phone?.trim())
    return { ok: false, error: "Укажите имя и телефон" };
  if (method !== "pickup" && !checkout?.address?.trim())
    return { ok: false, error: "Укажите адрес или город доставки" };

  // Авторитетные цены — из БД, не доверяем клиенту.
  const orderItems: { title: string; price: number; qty: number; productId?: string; courseId?: string }[] = [];
  for (const it of items) {
    const qty = Math.max(1, Math.floor(it.qty || 1));
    if (it.kind === "product") {
      const p = await prisma.product.findUnique({ where: { slug: it.slug } });
      if (p) orderItems.push({ title: p.name, price: p.price, qty, productId: p.id });
    } else {
      const c = await prisma.course.findUnique({ where: { slug: it.slug } });
      if (c) orderItems.push({ title: c.title, price: c.price, qty: 1, courseId: c.id });
    }
  }
  if (!orderItems.length) return { ok: false, error: "Товары не найдены" };

  const subtotal = orderItems.reduce((s, i) => s + i.price * i.qty, 0);

  // Сначала сжигаем просроченные бонусы этого пользователя (чтобы нельзя было потратить сгоревшее).
  await expireBonuses(userId);

  // Списание бонусов: не больше баланса и не больше суммы заказа.
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const balance = user?.bonusBalance ?? 0;
  const spend = Math.max(0, Math.min(Math.floor(bonusToSpend || 0), balance, subtotal));
  const delivery = deliveryCostFor(method, subtotal);
  const amount = subtotal - spend + delivery;

  // Создаём заказ + позиции, сразу резервируем (списываем) бонусы.
  const order = await prisma.$transaction(async (tx) => {
    const o = await tx.order.create({
      data: {
        userId,
        status: "pending",
        subtotal,
        bonusSpent: spend,
        amount,
        deliveryMethod: method,
        deliveryCost: delivery,
        customerName: checkout.name.trim(),
        customerPhone: checkout.phone.trim(),
        address: checkout.address?.trim() ?? "",
        comment: checkout.comment?.trim() ?? "",
        items: { create: orderItems },
      },
    });
    if (spend > 0) {
      await spendBonusFIFO(tx, userId, spend, "Списание при оплате заказа", o.id);
    }
    return o;
  });

  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const successPath = `/checkout/success?order=${order.id}`;
  const successUrl = `${base}${successPath}`;

  // Сумма к оплате 0 (всё перекрыто бонусами) или нет ключей YooKassa → финализируем сразу.
  const payment =
    amount <= 0
      ? ({ mode: "dev" } as const)
      : await createPayment({
          orderId: order.id,
          amount,
          description: `Заказ Farmati #${order.id.slice(-6)}`,
          returnUrl: successUrl,
        });

  if (payment.mode === "live" && payment.confirmationUrl) {
    await prisma.order.update({ where: { id: order.id }, data: { paymentId: payment.paymentId } });
    return { ok: true, url: payment.confirmationUrl, orderId: order.id };
  }

  // dev-режим: считаем заказ оплаченным и начисляем бонусы немедленно.
  // Возвращаем относительный путь — остаёмся на текущем домене (в т.ч. ngrok).
  await finalizeOrder(order.id);
  return { ok: true, url: successPath, orderId: order.id };
}
