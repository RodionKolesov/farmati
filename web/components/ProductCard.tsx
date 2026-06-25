"use client";

import { useEffect, useState } from "react";
import AddToCart from "./AddToCart";
import ProductGallery from "./ProductGallery";
import { money } from "@/lib/money";
import { earnedFor } from "@/lib/bonus";
import { productImages } from "@/lib/images";
import type { Product } from "@prisma/client";

export default function ProductCard({ p }: { p: Product }) {
  const [open, setOpen] = useState(false);
  const imgs = productImages(p);
  const cartItem = { kind: "product" as const, slug: p.slug, title: p.name, price: p.price, image: imgs[0] ?? "" };

  // Блокируем прокрутку фона и закрываем по Esc, пока окно открыто.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <article className="product">
      <button
        type="button"
        className={"product__media" + (imgs.length ? "" : " product__media--empty")}
        style={imgs.length ? { backgroundImage: `url('${imgs[0]}')` } : undefined}
        onClick={() => setOpen(true)}
        aria-label={`Открыть ${p.name}`}
      >
        {imgs.length === 0 && <span>Фото скоро</span>}
        {imgs.length > 1 && <span className="product__count">{imgs.length} фото</span>}
      </button>
      <div className="product__body">
        <button type="button" className="product__name product__name--btn" onClick={() => setOpen(true)}>
          {p.name}
        </button>
        <span className="product__bonus">+{earnedFor(p.price)} бонусов</span>
        {p.stock < 3 && <span className="stock-low">🔥 Осталось {p.stock} шт.</span>}
        <div className="product__foot">
          <span className="product__price">{money(p.price)}</span>
          <AddToCart item={cartItem} />
        </div>
        <button
          type="button"
          className="btn btn--ghost btn--sm btn--block"
          style={{ marginTop: 10 }}
          onClick={() => setOpen(true)}
        >
          Подробнее
        </button>
      </div>

      {open && (
        <div className="qv-overlay" onClick={() => setOpen(false)} role="dialog" aria-modal="true">
          <div className="qv" onClick={(e) => e.stopPropagation()}>
            <button className="qv__close" onClick={() => setOpen(false)} aria-label="Закрыть">×</button>
            <div className="qv__media">
              <ProductGallery images={imgs} name={p.name} />
            </div>
            <div className="qv__info">
              <span className="product__cat">{p.category}</span>
              <h2 className="qv__name">{p.name}</h2>
              <div className="qv__price">{money(p.price)}</div>
              {p.stock < 3 && <p className="stock-low" style={{ marginBottom: 6 }}>🔥 Осталось {p.stock} шт.</p>}
              <p className="product__bonus" style={{ marginBottom: 14 }}>+{earnedFor(p.price)} бонусов за покупку</p>
              {p.description && <p className="muted qv__desc">{p.description}</p>}
              <AddToCart item={cartItem} variant="button" label="В корзину" />
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
