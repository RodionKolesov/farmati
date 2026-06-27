import { NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// «Войти через Telegram» перенаправляет сюда. Проверяем подпись и ПРИВЯЗЫВАЕМ
// Telegram к аккаунту. Саму подписку проверяет кнопка «Проверить подписку».
export async function GET(req: Request) {
  const url = new URL(req.url);
  const back = (code: string) => NextResponse.redirect(new URL(`/account?tg=${code}`, url.origin));

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return back("err");

  const params = url.searchParams;
  const hash = params.get("hash") || "";
  const pairs: string[] = [];
  params.forEach((v, k) => { if (k !== "hash") pairs.push(`${k}=${v}`); });
  pairs.sort();
  const secret = crypto.createHash("sha256").update(token).digest();
  const hmac = crypto.createHmac("sha256", secret).update(pairs.join("\n")).digest("hex");
  if (hmac !== hash) return back("badhash");

  const authDate = Number(params.get("auth_date") || 0);
  if (!authDate || Math.floor(Date.now() / 1000) - authDate > 86400) return back("expired");

  const tgId = params.get("id");
  if (!tgId) return back("err");

  const session = await auth();
  if (!session?.user?.id) return back("login");
  const userId = session.user.id;

  const other = await prisma.user.findFirst({ where: { telegramId: tgId } });
  if (other && other.id !== userId) return back("used");

  await prisma.user.update({ where: { id: userId }, data: { telegramId: tgId } });
  return back("linked");
}
