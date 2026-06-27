import "server-only";

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

// Рассылка на все ID из TELEGRAM_NOTIFY_IDS (через запятую).
export async function notifyAdmins(text: string): Promise<void> {
  const ids = (process.env.TELEGRAM_NOTIFY_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!ids.length) return;
  await Promise.all(ids.map((id) => sendTelegram(id, text)));
}
