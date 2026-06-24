"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: string;          // `${kind}:${slug}`
  kind: "product" | "course";
  slug: string;
  title: string;
  price: number;
  image: string;
  qty: number;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty" | "id">) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => {
        const id = `${item.kind}:${item.slug}`;
        const items = get().items.slice();
        const found = items.find((i) => i.id === id);
        // курсы — без количества (всегда 1), товары можно докидывать
        if (found) {
          if (item.kind === "product") found.qty += 1;
        } else {
          items.push({ ...item, id, qty: 1 });
        }
        set({ items });
      },
      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      setQty: (id, qty) =>
        set({
          items: get().items.map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i)),
        }),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((s, i) => s + i.qty, 0),
      subtotal: () => get().items.reduce((s, i) => s + i.price * i.qty, 0),
    }),
    { name: "farmati_cart" }
  )
);
