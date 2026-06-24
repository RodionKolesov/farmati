"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/lib/cart";

export default function SuccessPage() {
  const clear = useCart((s) => s.clear);
  useEffect(() => {
    clear();
  }, [clear]);

  return (
    <main className="page">
      <div className="container">
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
