import "server-only";
import crypto from "crypto";

const CODE_SECRET = process.env.AUTH_SECRET || "farmati-tg";

// Код для deep-link бота: userId + подпись (чтобы нельзя было подставить чужой id).
export function makeStartCode(userId: string): string {
  const sig = crypto.createHmac("sha256", CODE_SECRET).update(userId).digest("hex").slice(0, 10);
  return `${userId}-${sig}`;
}
export function parseStartCode(code: string): string | null {
  const i = code.lastIndexOf("-");
  if (i < 0) return null;
  const userId = code.slice(0, i);
  const sig = code.slice(i + 1);
  const expect = crypto.createHmac("sha256", CODE_SECRET).update(userId).digest("hex").slice(0, 10);
  return userId && sig === expect ? userId : null;
}

// Отправка сообщения в Telegram через бота. Ошибки гасим — уведомления не должны ломать заказ.
export async function sendTelegram(chatId: string, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Статус участника канала: member/administrator/creator = подписан, left/kicked = нет.
// null — если бот не админ канала или ошибка.
export async function getChatMemberStatus(chatId: string, userId: string | number): Promise<string | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/getChatMember?chat_id=${encodeURIComponent(chatId)}&user_id=${encodeURIComponent(String(userId))}`,
    );
    const d = await res.json().catch(() => null);
    if (!d?.ok) return null;
    return d.result?.status ?? null;
  } catch {
    return null;
  }
}

// Рассылка на все ID из TELEGRAM_NOTIFY_IDS (через запятую).
export async function notifyAdmins(text: string): Promise<void> {
  const ids = (process.env.TELEGRAM_NOTIFY_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!ids.length) return;
  await Promise.all(ids.map((id) => sendTelegram(id, text)));
}
