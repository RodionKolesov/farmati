import { expireBonuses } from "@/lib/bonusLedger";

export const dynamic = "force-dynamic";

// Глобальное сгорание просроченных бонусов. Защищено секретом CRON_SECRET.
// Вызывать по расписанию (crontab на сервере): curl с заголовком x-cron-secret или ?secret=...
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const url = new URL(req.url);
  const provided = req.headers.get("x-cron-secret") || url.searchParams.get("secret");
  if (!secret || provided !== secret) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const expired = await expireBonuses();
  return Response.json({ ok: true, expired });
}
