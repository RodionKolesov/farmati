// Клиент CDEK API v2 (боевой https://api.cdek.ru).
// Ключи и параметры отправителя — в .env, не в коде.
import "server-only";

const BASE = process.env.CDEK_BASE || "https://api.cdek.ru";
const CLIENT_ID = process.env.CDEK_CLIENT_ID || "";
const CLIENT_SECRET = process.env.CDEK_CLIENT_SECRET || "";

export function cdekConfigured() {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}

// --- OAuth-токен с кэшем в памяти процесса (живёт ~1 час) ---
let tokenCache: { token: string; exp: number } | null = null;

async function getToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.exp > now + 60_000) return tokenCache.token;
  const r = await fetch(`${BASE}/v2/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=client_credentials&client_id=${encodeURIComponent(CLIENT_ID)}&client_secret=${encodeURIComponent(CLIENT_SECRET)}`,
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`CDEK auth ${r.status}`);
  const j = await r.json();
  if (!j.access_token) throw new Error("CDEK auth: no token");
  tokenCache = { token: j.access_token, exp: now + (Number(j.expires_in || 3600) * 1000) };
  return j.access_token;
}

async function api(path: string, init?: RequestInit) {
  const token = await getToken();
  const r = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  const text = await r.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { ok: r.ok, status: r.status, body };
}

// --- Список пунктов выдачи (для виджета / выпадающего списка) ---
export async function deliveryPoints(params: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") qs.set(k, String(v));
  const { ok, body } = await api(`/v2/deliverypoints?${qs.toString()}`);
  return ok && Array.isArray(body) ? body : [];
}

// Режим доставки СДЭК по способу сдачи отправителем:
//   office (склад) -> destination "склад": mode 4 (склад-склад)
//   door   (дверь) -> destination "склад": mode 2 (дверь-склад)
function pvzModes(): number[] {
  return (process.env.CDEK_SENDER_MODE || "office") === "door" ? [2] : [4];
}

export type PvzTariff = { tariff_code: number; tariff_name: string; sum: number; days_min: number; days_max: number };

// Самый дешёвый тариф ДО ПВЗ для маршрута sender -> город ПВЗ.
export async function cheapestPvzTariff(toCityCode: number, weightG: number): Promise<PvzTariff | null> {
  // 44 = Москва — значение по умолчанию, пока отправитель не задан в .env (CDEK_SENDER_CITY_CODE).
  const fromCode = Number(process.env.CDEK_SENDER_CITY_CODE || 44);
  const { ok, body } = await api(`/v2/calculator/tarifflist`, {
    method: "POST",
    body: JSON.stringify({
      type: 1,
      from_location: { code: fromCode },
      to_location: { code: toCityCode },
      packages: [{ weight: Math.max(1, Math.round(weightG)) }],
    }),
  });
  if (!ok || !Array.isArray(body?.tariff_codes)) return null;
  const modes = pvzModes();
  const candidates = body.tariff_codes
    .filter((t: any) => modes.includes(t.delivery_mode))
    .sort((a: any, b: any) => a.delivery_sum - b.delivery_sum);
  const t = candidates[0];
  if (!t) return null;
  return {
    tariff_code: t.tariff_code,
    tariff_name: t.tariff_name,
    sum: Math.round(t.delivery_sum),
    days_min: t.period_min,
    days_max: t.period_max,
  };
}

// --- Прокси для виджета (контракт как у эталонного service.php) ---
// offices  -> GET  /v2/deliverypoints (проброс параметров)
// calculate-> POST /v2/calculator/tarifflist (город отправителя инжектируем из .env)
export async function cdekServiceProxy(
  action: string,
  query: URLSearchParams,
  body: any,
): Promise<{ status: number; body: any }> {
  if (!cdekConfigured()) return { status: 503, body: { message: "CDEK не настроен" } };

  if (action === "offices") {
    const qs = new URLSearchParams(query);
    qs.delete("action");
    const { status, body: out } = await api(`/v2/deliverypoints?${qs.toString()}`);
    return { status, body: out };
  }

  if (action === "calculate") {
    const payload: any = { ...(body || {}) };
    if (!payload.from_location) payload.from_location = { code: Number(process.env.CDEK_SENDER_CITY_CODE || 44) };
    if (payload.type == null) payload.type = 1;
    const { status, body: out } = await api(`/v2/calculator/tarifflist`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return { status, body: out };
  }

  return { status: 400, body: { message: "Unknown action" } };
}

// --- Автосоздание заказа в СДЭК (после оплаты) ---
const ITEM_WEIGHT_G = Number(process.env.CDEK_ITEM_WEIGHT_G || 300);

// Готовы ли данные отправителя для автосоздания накладной.
export function cdekSenderReady(): boolean {
  return cdekConfigured() && Boolean(process.env.CDEK_SHIPMENT_POINT && process.env.CDEK_SENDER_PHONE);
}

function normPhone(raw: string): string {
  let d = (raw || "").replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("8")) d = "7" + d.slice(1);
  if (d.length === 10) d = "7" + d;
  return d ? "+" + d : "";
}

export async function createCdekOrder(input: {
  orderId: string;
  pvzCode: string;
  cityCode: number | null;
  recipientName: string;
  recipientPhone: string;
  items: { title: string; price: number; qty: number; productId: string }[];
}): Promise<{ ok: boolean; uuid?: string; error?: string }> {
  if (!cdekSenderReady()) return { ok: false, error: "Отправитель СДЭК не настроен" };
  const units = input.items.reduce((s, i) => s + i.qty, 0);
  const totalWeight = Math.max(1, units * ITEM_WEIGHT_G);

  const tariff = input.cityCode ? await cheapestPvzTariff(input.cityCode, totalWeight) : null;
  if (!tariff) return { ok: false, error: "Не удалось подобрать тариф до ПВЗ" };

  const payload = {
    type: 1,
    tariff_code: tariff.tariff_code,
    shipment_point: process.env.CDEK_SHIPMENT_POINT,
    delivery_point: input.pvzCode,
    recipient: { name: input.recipientName || "Получатель", phones: [{ number: normPhone(input.recipientPhone) }] },
    sender: { name: process.env.CDEK_SENDER_NAME || "Отправитель", phones: [{ number: normPhone(process.env.CDEK_SENDER_PHONE || "") }] },
    packages: [{
      number: input.orderId.slice(-12),
      weight: totalWeight,
      items: input.items.map((it) => ({
        name: (it.title || "Товар").slice(0, 255),
        ware_key: it.productId.slice(0, 50),
        payment: { value: 0 },
        cost: it.price,
        weight: ITEM_WEIGHT_G,
        amount: it.qty,
      })),
    }],
  };

  const { status, body } = await api(`/v2/orders`, { method: "POST", body: JSON.stringify(payload) });
  const uuid = body?.entity?.uuid;
  if ((status === 200 || status === 202) && uuid) return { ok: true, uuid };
  const errs = body?.requests?.flatMap?.((r: any) => r.errors || []) || body?.errors || [];
  return { ok: false, error: errs.length ? JSON.stringify(errs) : `status ${status}` };
}

// Трек-номер СДЭК (присваивается не сразу — может вернуться пустым).
export async function getCdekTrack(uuid: string): Promise<string> {
  const { ok, body } = await api(`/v2/orders/${uuid}`);
  return ok ? (body?.entity?.cdek_number || "") : "";
}
