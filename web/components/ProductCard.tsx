import Link from "next/link";
import AddToCart from "./AddToCart";
import { money } from "@/lib/money";
import { earnedFor } from "@/lib/bonus";
import type { Product } from "@prisma/client";

export default function ProductCard({ p }: { p: Product }) {
  return (
    <article className="product">
      {p.image ? (
        <Link
          href={`/product/${p.slug}`}
          className="product__media"
          style={{ backgroundImage: `url('${p.image}')` }}
          aria-label={p.name}
        />
      ) : (
        <Link href={`/product/${p.slug}`} className="product__media product__media--empty">
          <span>Фото скоро</span>
        </Link>
      )}
      <div className="product__body">
        <Link href={`/product/${p.slug}`} className="product__name">
          {p.name}
        </Link>
        <span className="product__bonus">+{earnedFor(p.price)} бонусов</span>
        {p.stock < 3 && <span className="stock-low">🔥 Осталось {p.stock} шт.</span>}
        <div className="product__foot">
          <span className="product__price">{money(p.price)}</span>
          <AddToCart
            item={{ kind: "product", slug: p.slug, title: p.name, price: p.price, image: p.image }}
          />
        </div>
        <Link className="btn btn--ghost btn--sm btn--block" href={`/product/${p.slug}`} style={{ marginTop: 10 }}>
          Подробнее
        </Link>
      </div>
    </article>
  );
}
