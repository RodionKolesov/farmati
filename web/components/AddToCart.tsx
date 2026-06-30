"use client";

import Link from "next/link";
import { useCart, type CartItem } from "@/lib/cart";

type Props = {
  item: Omit<CartItem, "qty" | "id">;
  variant?: "icon" | "button";
  label?: string;
};

export default function AddToCart({ item, variant = "icon", label = "В корзину" }: Props) {
  const add = useCart((s) => s.add);
  const items = useCart((s) => s.items);
  const inCart = items.some((i) => i.id === `${item.kind}:${item.slug}`);

  if (variant === "button") {
    return inCart ? (
      <Link className="btn btn--primary btn--sm" href="/cart">Перейти в корзину →</Link>
    ) : (
      <button className="btn btn--primary btn--sm" onClick={() => add(item)}>{label}</button>
    );
  }

  // icon-вариант (карточка товара)
  return inCart ? (
    <Link className="iconbtn iconbtn--incart" href="/cart" title="Перейти в корзину" aria-label="Перейти в корзину">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    </Link>
  ) : (
    <button className="iconbtn" onClick={() => add(item)} title={label} aria-label={label}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 8h12l-1 11.5a1 1 0 0 1-1 .9H8a1 1 0 0 1-1-.9L6 8z" />
        <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
      </svg>
    </button>
  );
}
