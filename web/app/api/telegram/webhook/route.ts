import { prisma } from "@/lib/prisma";
import { grantBonus } from "@/lib/bonusLedger";
import { getChatMemberStatus, sendTelegram, parseStartCode } from "@/lib/telegram";

const CHANNEL = "@BeautEnergyBusiness";
const TG_BONUS = 100;

// Вебхук бота: получаем /start <код> из личного кабинета, проверяем подписку на канал,
// начисляем 100 бонусов один раз. Защита: секрет в заголовке от Telegram.
export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return new Response("forbidden", { status: 403 });
  }

  const update = await req.json().catch(() => null);
  const msg = update?.message;
  const text: string = msg?.text ?? "";
  const chatId = msg?.chat?.id;
  const fromId = msg?.from?.id;
  if (!chatId || !text.startsWith("/start")) return new Response("ok");

  const reply = (t: string) => sendTelegram(String(chatId), t);
  const code = text.split(/\s+/)[1];

  if (!code) {
    await reply("Привет! Чтобы получить 100 бонусов за подписку, откройте бота кнопкой из личного кабинета на сайте farmati.ru.");
    return new Response("ok");
  }
  const userId = parseStartCode(code);
  if (!userId) {
    await reply("Ссылка недействительна. Откройте бота заново кнопкой из личного кабинета.");
    return new Response("ok");
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) { await reply("Аккаунт не найден. Войдите на сайте и попробуйте снова."); return new Response("ok"); }
  if (user.tgBonusGranted) { await reply("Бонус за подписку уже был получен ранее 🙂"); return new Response("ok"); }

  // Этот Telegram уже привязан к другому аккаунту?
  const other = await prisma.user.findFirst({ where: { telegramId: String(fromId) } });
  if (other && other.id !== userId) { await reply("Этот Telegram уже привязан к другому аккаунту."); return new Response("ok"); }

  const status = await getChatMemberStatus(CHANNEL, fromId);
  if (status === null) { await reply("Не удалось проверить подписку. Попробуйте позже."); return new Response("ok"); }
  if (!["member", "administrator", "creator"].includes(status)) {
    await reply("Вы пока не подписаны на канал @BeautEnergyBusiness. Подпишитесь и снова нажмите Start.");
    return new Response("ok");
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { telegramId: String(fromId), tgBonusGranted: true } });
    await grantBonus(tx, userId, TG_BONUS, "Бонус за подписку на Telegram");
  });
  await reply("✅ 100 бонусов за подписку начислены! Вернитесь на сайт и обновите страницу — баланс уже обновлён.");
  return new Response("ok");
}
