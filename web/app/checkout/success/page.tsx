import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fetchPayment } from "@/lib/yookassa";
import { finalizeOrder } from "@/lib/orderFinalize";
import ClearCart from "@/components/ClearCart";

export const dynamic = "force-dynamic";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;

  // Подстраховка к вебхуку: если заказ ещё не оплачен — проверяем платёж у YooKassa и финализируем.
  if (order) {
    try {
      const o = await prisma.order.findUnique({ where: { id: order } });
      if (o && o.status !== "paid" && o.paymentId) {
        const p = await fetchPayment(o.paymentId);
        if (p?.status === "succeeded") await finalizeOrder(o.id, o.paymentId);
      }
    } catch {
      // не критично — заказ закроет вебхук
    }
  }

  return (
    <main className="page">
      <div className="container">
        <ClearCart />
        <div className="card" style={{ maxWidth: 520, margin: "6vh auto", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem" }}>✅</div>
          <h1 style={{ marginTop: 8 }}>Спасибо за заказ!</h1>
          <p className="muted" style={{ margin: "10px 0 20px" }}>
            Оплата прошла, бонусы начислены. Детали — в личном кабинете.
          </p>
          <Link className="btn btn--primary" href="/account">В личный кабинет</Link>
        </div>
      </div>
    </main>
  );
}
