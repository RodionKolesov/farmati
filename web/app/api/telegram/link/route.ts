import { NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { grantBonus } from "@/lib/bonusLedger";
import { getChatMemberStatus } from "@/lib/telegram";

const CHANNEL = "@BeautEnergyBusiness";
const TG_BONUS = 100;

// Telegram «Вход через Telegram» перенаправляет сюда с данными пользователя.
// Проверяем подпись, подписку на канал и начисляем 100 бонусов один раз.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const back = (code: string) => NextResponse.redirect(new URL(`/account?tg=${code}`, url.origin));

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return back("err");

  const params = url.searchParams;
  const hash = params.get("hash") || "";

  // 1) Проверка подписи (данные действительно от Telegram).
  const pairs: string[] = [];
  params.forEach((v, k) => { if (k !== "hash") pairs.push(`${k}=${v}`); });
  pairs.sort();
  const checkString = pairs.join("\n");
  const secret = crypto.createHash("sha256").update(token).digest();
  const hmac = crypto.createHmac("sha256", secret).update(checkString).digest("hex");
  if (hmac !== hash) return back("badhash");

  // 2) Данные не старше суток.
  const authDate = Number(params.get("auth_date") || 0);
  if (!authDate || Math.floor(Date.now() / 1000) - authDate > 86400) return back("expired");

  const tgId = params.get("id");
  if (!tgId) return back("err");

  // 3) Нужен вход на сайте — привязываем Telegram к аккаунту.
  const session = await auth();
  if (!session?.user?.id) return back("login");
  const userId = session.user.id;

  // 4) Этот Telegram уже привязан к другому аккаунту?
  const other = await prisma.user.findFirst({ where: { telegramId: tgId } });
  if (other && other.id !== userId) return back("used");

  // 5) Уже получал бонус?
  const me = await prisma.user.findUnique({ where: { id: userId } });
  if (!me) return back("err");
  if (me.tgBonusGranted) return back("already");

  // 6) Проверяем подписку на канал.
  const status = await getChatMemberStatus(CHANNEL, tgId);
  if (status === null) return back("checkfail"); // бот не админ канала / ошибка
  if (!["member", "administrator", "creator"].includes(status)) return back("notsub");

  // 7) Начисляем 100 бонусов один раз + привязываем Telegram.
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { telegramId: tgId, tgBonusGranted: true } });
    await grantBonus(tx, userId, TG_BONUS, "Бонус за подписку на Telegram");
  });

  return back("ok");
}
