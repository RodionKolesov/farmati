import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/money";
import { earnedFor } from "@/lib/bonus";
import AddToCart from "@/components/AddToCart";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await prisma.product.findUnique({ where: { slug } });
  if (!p || p.stock <= 0) notFound();

  return (
    <main className="page product-page">
      <div className="container">
        <Link href="/catalog" className="back-link" aria-label="Назад в каталог">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Назад в каталог
        </Link>
        <div className="grid2 product-detail">
        {p.image ? (
          <img
            src={p.image}
            alt={p.name}
            style={{ borderRadius: 20, aspectRatio: "3/4", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{ borderRadius: 20, aspectRatio: "3/4", background: "#f4e6eb",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#b489a8", fontWeight: 600 }}
          >
            Фото скоро
          </div>
        )}
        <div>
          <span className="product__cat">{p.category}</span>
          <h1 style={{ margin: "8px 0 12px" }}>{p.name}</h1>
          <p className="muted" style={{ marginBottom: 18 }}>{p.description}</p>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 6 }}>{money(p.price)}</div>
          {p.stock < 3 && <p className="stock-low" style={{ marginBottom: 6 }}>🔥 Осталось {p.stock} шт.</p>}
          <p className="product__bonus" style={{ marginBottom: 18 }}>+{earnedFor(p.price)} бонусов за покупку</p>
          <AddToCart
            item={{ kind: "product", slug: p.slug, title: p.name, price: p.price, image: p.image }}
            variant="button"
            label="В корзину"
          />
        </div>
        </div>
      </div>
    </main>
  );
}
