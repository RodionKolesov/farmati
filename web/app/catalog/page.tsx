import { prisma } from "@/lib/prisma";
import CatalogFilter from "@/components/CatalogFilter";

export const metadata = { title: "Каталог — Farmati.cosmetics" };

export default async function CatalogPage() {
  const products = await prisma.product.findMany({ where: { stock: { gt: 0 } } });
  return (
    <main className="page">
      <div className="container">
        <h1>Каталог</h1>
        <CatalogFilter products={products} />
      </div>
    </main>
  );
}
