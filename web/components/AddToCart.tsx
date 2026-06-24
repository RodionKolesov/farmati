"use client";

import { useState } from "react";
import { useCart, type CartItem } from "@/lib/cart";

type Props = {
  item: Omit<CartItem, "qty" | "id">;
  variant?: "icon" | "button";
  label?: string;
};

export default function AddToCart({ item, variant = "icon", label = "В корзину" }: Props) {
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);

  function onClick() {
    add(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  if (variant === "button") {
    return (
      <button className="btn btn--primary btn--sm" onClick={onClick}>
        {added ? "Добавлено ✓" : label}
      </button>
    );
  }
  return (
    <button className="iconbtn" onClick={onClick} title={label} aria-label={label}>
      {added ? (
        "✓"
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8h12l-1 11.5a1 1 0 0 1-1 .9H8a1 1 0 0 1-1-.9L6 8z" />
          <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
        </svg>
      )}
    </button>
  );
}
