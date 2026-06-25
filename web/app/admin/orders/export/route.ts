import { getAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

function cell(v: unknown) {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

const METHODS: Record<string, string> = { courier: "Курьер", pickup: "Самовывоз", cdek: "СДЭК до ПВЗ", post: "Почта России" };

// Выгрузка заказов в CSV (открывается в Excel; разделитель ; и BOM для кириллицы).
export async function GET() {
  const admin = await getAdmin();
  if (!admin) return new Response("Forbidden", { status: 403 });

  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, include: { items: true, user: true } });
  const header = ["Дата", "Клиент", "Телефон", "Email", "Состав", "Доставка", "Адрес", "Сумма", "Бонусы +", "Бонусы −", "Статус"];
  const lines = [header.map(cell).join(";")];
  for (const o of orders) {
    const date = new Date(o.createdAt).toLocaleString("ru-RU");
    const client = o.customerName || o.user?.name || o.user?.email || "";
    const email = o.customerEmail || o.user?.email || "";
    const items = o.items.map((i) => `${i.title} ×${i.qty}`).join(", ");
    const method = METHODS[o.deliveryMethod] ?? o.deliveryMethod;
    const status = o.status === "paid" ? "оплачен" : "ожидает";
    lines.push([date, client, o.customerPhone, email, items, method, o.address, o.amount, o.bonusEarned, o.bonusSpent, status].map(cell).join(";"));
  }
  const csv = "﻿" + lines.join("\r\n");

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="orders.csv"`,
    },
  });
}
