"use client";

import { useState } from "react";
import ProductCard from "./ProductCard";
import type { Product } from "@prisma/client";

export default function CatalogFilter({ products }: { products: Product[] }) {
  const cats = ["Все", ...Array.from(new Set(products.map((p) => p.category)))];
  const [active, setActive] = useState("Все");
  const list = products.filter((p) => active === "Все" || p.category === active);

  return (
    <>
      <div className="tabs" style={{ marginBottom: 24 }}>
        {cats.map((c) => (
          <button
            key={c}
            className={`tab${c === active ? " is-active" : ""}`}
            onClick={() => setActive(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="products">
        {list.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </>
  );
}
