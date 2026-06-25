import { getAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

function cell(v: unknown) {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

// Выгрузка заявок на консультацию в CSV (открывается в Excel).
export async function GET() {
  const admin = await getAdmin();
  if (!admin) return new Response("Forbidden", { status: 403 });

  const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
  const header = ["Дата", "Имя", "Телефон", "Вопрос"];
  const lines = [header.map(cell).join(";")];
  for (const l of leads) {
    lines.push([new Date(l.createdAt).toLocaleString("ru-RU"), l.name, l.phone, l.message].map(cell).join(";"));
  }
  const csv = "﻿" + lines.join("\r\n");

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="leads.csv"`,
    },
  });
}
