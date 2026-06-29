import { NextRequest } from "next/server";
import { cdekServiceProxy } from "@/lib/cdek";

// Бэкенд для виджета СДЭК: проксирует список ПВЗ и расчёт тарифа к CDEK API
// (ключи на сервере). Контракт совпадает с эталонным service.php от СДЭК.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handle(req: NextRequest) {
  const url = new URL(req.url);
  let body: any = null;
  if (req.method === "POST") {
    try { body = await req.json(); } catch { body = null; }
  }
  const action = url.searchParams.get("action") || body?.action || "";
  const { status, body: out } = await cdekServiceProxy(action, url.searchParams, body);
  return Response.json(out ?? {}, { status });
}

export const GET = handle;
export const POST = handle;
