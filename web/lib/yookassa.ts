import "server-only";

// Создание платежа в YooKassa. Если ключи не заданы — возвращаем dev-режим
// (заказ финализируется сразу, без реальной оплаты).
type CreateArgs = {
  orderId: string;
  amount: number;
  description: string;
  returnUrl: string;
};

export type PaymentResult =
  | { mode: "dev" }
  | { mode: "live"; confirmationUrl: string; paymentId: string };

export async function createPayment(args: CreateArgs): Promise<PaymentResult> {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secret = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secret) return { mode: "dev" };

  const res = await fetch("https://api.yookassa.ru/v3/payments", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${shopId}:${secret}`).toString("base64"),
      "Idempotence-Key": args.orderId,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: { value: args.amount.toFixed(2), currency: "RUB" },
      capture: true,
      confirmation: { type: "redirect", return_url: args.returnUrl },
      description: args.description,
      metadata: { orderId: args.orderId },
    }),
  });
  const data = await res.json();
  return {
    mode: "live",
    confirmationUrl: data?.confirmation?.confirmation_url,
    paymentId: data?.id,
  };
}
