import { NextRequest } from "next/server";
import { cheapestPvzTariff } from "@/lib/cdek";

// Стоимость доставки СДЭК до ПВЗ выбранного города — считается сразу при выборе пункта,
// до оплаты. Та же логика, что и при списании в заказе (совпадение цены гарантировано).
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ITEM_WEIGHT_G = Number(process.env.CDEK_ITEM_WEIGHT_G || 300);

export async function GET(req: NextRequest) {
  const u = new URL(req.url);
  const cityCode = Number(u.searchParams.get("cityCode") || 0);
  const units = Math.max(1, Number(u.searchParams.get("units") || 1));
  if (!cityCode) return Response.json({ error: "no cityCode" }, { status: 400 });
  try {
    const t = await cheapestPvzTariff(cityCode, units * ITEM_WEIGHT_G);
    if (!t) return Response.json({ error: "no tariff" });
    return Response.json({ sum: t.sum, days_min: t.days_min, days_max: t.days_max, tariff: t.tariff_name });
  } catch {
    return Response.json({ error: "calc failed" });
  }
}
