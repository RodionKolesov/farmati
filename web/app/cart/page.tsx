"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/money";

export default function CartPage() {
  const { items, setQty, remove, subtotal } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <main className="page"><div className="container">Загрузка…</div></main>;

  return (
    <main className="page">
      <div className="container">
        <h1>Корзина</h1>
        {items.length === 0 ? (
          <div className="card">
            <p className="empty-note">Корзина пуста.</p>
            <Link className="btn btn--primary" href="/catalog">В каталог</Link>
          </div>
        ) : (
          <div className="grid2">
            <div className="card">
              <ul className="list">
                {items.map((i) => (
                  <li key={i.id} className="row">
                    <img src={i.image} alt={i.title} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{i.title}</div>
                      <div className="muted" style={{ fontSize: ".85rem" }}>
                        {i.kind === "course" ? "Онлайн-курс" : "Товар"} · {money(i.price)}
                      </div>
                      {i.kind === "product" ? (
                        <div className="qty" style={{ marginTop: 6 }}>
                          <button onClick={() => setQty(i.id, i.qty - 1)}>−</button>
                          <span>{i.qty}</span>
                          <button onClick={() => setQty(i.id, i.qty + 1)}>+</button>
                        </div>
                      ) : null}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700 }}>{money(i.price * i.qty)}</div>
                      <button className="link" onClick={() => remove(i.id)} style={{ fontSize: ".8rem", color: "var(--minus)" }}>
                        удалить
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card">
              <div className="line total"><span>Итого</span><span>{money(subtotal())}</span></div>
              <Link className="btn btn--primary btn--block" href="/checkout" style={{ marginTop: 16 }}>
                Оформить заказ
              </Link>
              <p className="muted" style={{ fontSize: ".8rem", marginTop: 10 }}>
                Бонусы можно списать на следующем шаге.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
