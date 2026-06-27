"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { grantBonus } from "@/lib/bonusLedger";
import { getChatMemberStatus } from "@/lib/telegram";

const CHANNEL = "@BeautEnergyBusiness";
const TG_BONUS = 100;

// Проверка подписки по уже привязанному Telegram + начисление 100 бонусов один раз.
export async function claimTelegramBonus() {
  const session = await auth();
  if (!session?.user?.id) redirect("/account?tg=login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/account?tg=err");
  if (user.tgBonusGranted) redirect("/account?tg=already");
  if (!user.telegramId) redirect("/account?tg=nolink");

  const status = await getChatMemberStatus(CHANNEL, user.telegramId);
  if (status === null) redirect("/account?tg=checkfail");
  if (!["member", "administrator", "creator"].includes(status)) redirect("/account?tg=notsub");

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { tgBonusGranted: true } });
    await grantBonus(tx, user.id, TG_BONUS, "Бонус за подписку на Telegram");
  });
  redirect("/account?tg=ok");
}
