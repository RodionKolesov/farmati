import { finalizeOrder } from "@/lib/orderFinalize";
import { fetchPayment } from "@/lib/yookassa";

// Вебхук YooKassa: при оплате финализируем заказ (идемпотентно).
// Безопасность: не доверяем телу запроса — статус платежа перепроверяем у YooKassa.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const paymentId = body?.object?.id;
  if (body?.event === "payment.succeeded" && paymentId) {
    const p = await fetchPayment(String(paymentId));
    if (p?.status === "succeeded" && p.orderId) {
      await finalizeOrder(p.orderId, String(paymentId));
    }
  }
  return new Response("ok", { status: 200 });
}
