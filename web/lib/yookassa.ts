import "server-only";

// Позиция чека 54-ФЗ.
export type ReceiptItem = {
  description: string;
  quantity: string;
  amount: { value: string; currency: "RUB" };
  vat_code: number;        // 1 = без НДС (УСН)
  payment_subject: string; // commodity | service
  payment_mode: string;    // full_payment
};

export type ReceiptData = {
  customer: { email?: string; phone?: string };
  items: ReceiptItem[];
};

type CreateArgs = {
  orderId: string;
  amount: number;
  description: string;
  returnUrl: string;
  receipt?: ReceiptData;
};

// Создание платежа в YooKassa. Если ключи не заданы — dev-режим (без реальной оплаты).
// При ошибке API возвращаем mode:"error" — заказ НЕ должен считаться оплаченным.
export type PaymentResult =
  | { mode: "dev" }
  | { mode: "live"; confirmationUrl: string; paymentId: string }
  | { mode: "error"; error: string };

export async function createPayment(args: CreateArgs): Promise<PaymentResult> {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secret = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secret) return { mode: "dev" };

  const body: Record<string, unknown> = {
    amount: { value: args.amount.toFixed(2), currency: "RUB" },
    capture: true,
    confirmation: { type: "redirect", return_url: args.returnUrl },
    description: args.description,
    metadata: { orderId: args.orderId },
  };
  if (args.receipt) body.receipt = args.receipt;

  try {
    const res = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${shopId}:${secret}`).toString("base64"),
        "Idempotence-Key": args.orderId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    const url = data?.confirmation?.confirmation_url;
    if (res.ok && url) {
      return { mode: "live", confirmationUrl: url, paymentId: data.id };
    }
    const msg = data?.description || data?.code || `HTTP ${res.status}`;
    return { mode: "error", error: String(msg) };
  } catch (e) {
    return { mode: "error", error: e instanceof Error ? e.message : "network error" };
  }
}

// Запрос статуса платежа у YooKassa (для проверки вебхука — не доверяем телу запроса).
export async function fetchPayment(paymentId: string): Promise<{ status?: string; orderId?: string } | null> {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secret = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secret) return null;
  try {
    const res = await fetch(`https://api.yookassa.ru/v3/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: "Basic " + Buffer.from(`${shopId}:${secret}`).toString("base64") },
    });
    if (!res.ok) return null;
    const d = await res.json().catch(() => null);
    return { status: d?.status, orderId: d?.metadata?.orderId };
  } catch {
    return null;
  }
}
