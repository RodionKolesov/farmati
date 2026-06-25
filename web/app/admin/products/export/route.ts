import { getAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

function cell(v: unknown) {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

// Выгрузка товаров (остатки/цены) в CSV (открывается в Excel).
export async function GET() {
  const admin = await getAdmin();
  if (!admin) return new Response("Forbidden", { status: 403 });

  const products = await prisma.product.findMany({ orderBy: { category: "asc" } });
  const header = ["Название", "Категория", "Цена", "Остаток", "Виден в каталоге"];
  const lines = [header.map(cell).join(";")];
  for (const p of products) {
    lines.push([p.name, p.category, p.price, p.stock, p.stock > 0 ? "да" : "нет"].map(cell).join(";"));
  }
  const csv = "﻿" + lines.join("\r\n");

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="products.csv"`,
    },
  });
}
