import { finalizeOrder } from "@/lib/orderFinalize";

// Вебхук YooKassa: при успешной оплате финализируем заказ (идемпотентно).
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const obj = body?.object;
  if (body?.event === "payment.succeeded" && obj?.metadata?.orderId) {
    await finalizeOrder(obj.metadata.orderId, obj.id);
  }
  return new Response("ok", { status: 200 });
}
