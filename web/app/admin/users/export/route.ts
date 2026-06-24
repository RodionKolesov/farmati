import { getAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

function cell(v: unknown) {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

// Выгрузка списка участников в CSV (открывается в Excel; разделитель ; и BOM для кириллицы).
export async function GET() {
  const admin = await getAdmin();
  if (!admin) return new Response("Forbidden", { status: 403 });

  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  const header = ["Дата регистрации", "Имя", "Email", "Телефон", "Бонусы"];
  const lines = [header.map(cell).join(";")];
  for (const u of users) {
    const date = new Date(u.createdAt).toLocaleDateString("ru-RU");
    lines.push([date, u.name, u.email, u.phone, u.bonusBalance].map(cell).join(";"));
  }
  const csv = "﻿" + lines.join("\r\n");

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="participants.csv"`,
    },
  });
}
