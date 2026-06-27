import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logout } from "@/lib/actions/auth";
import { money } from "@/lib/money";
import { expireBonuses, nextExpiry } from "@/lib/bonusLedger";
import { deliveryStatusInfo } from "@/lib/orderStatus";
import { getAdmin } from "@/lib/admin";
import PasswordForm from "@/components/PasswordForm";
import TelegramLinkButton from "@/components/TelegramLinkButton";

const TG_MESSAGES: Record<string, { text: string; ok: boolean }> = {
  ok: { text: "✅ 100 бонусов за подписку начислены!", ok: true },
  already: { text: "Бонус за подписку уже был получен раньше.", ok: false },
  notsub: { text: "Похоже, вы не подписаны на канал. Подпишитесь и попробуйте снова.", ok: false },
  checkfail: { text: "Не удалось проверить подписку. Попробуйте позже.", ok: false },
  used: { text: "Этот Telegram уже привязан к другому аккаунту.", ok: false },
  login: { text: "Сначала войдите в аккаунт.", ok: false },
  badhash: { text: "Не удалось подтвердить вход через Telegram. Попробуйте ещё раз.", ok: false },
  expired: { text: "Срок входа через Telegram истёк. Попробуйте ещё раз.", ok: false },
  err: { text: "Ошибка. Попробуйте позже.", ok: false },
};

export const metadata = { title: "Личный кабинет — Farmati.cosmetics" };

function fmt(d: Date) {
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ tg?: string }> }) {
  const { tg } = await searchParams;
  const tgMsg = tg ? TG_MESSAGES[tg] : undefined;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  // Админ — это управляющий, а не покупатель: у него нет личного кабинета с бонусами.
  // Отправляем его сразу в панель управления сайтом.
  if (await getAdmin()) redirect("/admin");

  // Сжигаем просроченные бонусы при заходе в кабинет — баланс всегда актуальный.
  await expireBonuses(userId);

  const [user, orders, txs, expiry] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.order.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20, include: { items: true } }),
    prisma.bonusTransaction.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 }),
    nextExpiry(userId),
  ]);

  return (
    <main className="page">
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h1 style={{ margin: 0 }}>Личный кабинет</h1>
          <form action={logout}>
            <button className="btn btn--ghost btn--sm">Выйти</button>
          </form>
        </div>

        <div className="card">
          <p className="muted">Привет, {user?.name || user?.email} 👋</p>
          <p className="balance-value"><span>{user?.bonusBalance ?? 0}</span> бонусов</p>
          <p className="muted" style={{ fontSize: ".85rem" }}>1 бонус = 1 ₽. Списываются прямо в корзине при оформлении заказа.</p>
          {expiry && (
            <p className="muted" style={{ fontSize: ".85rem", color: "var(--minus)" }}>
              ⏳ {expiry.amount} бонусов сгорят {fmt(expiry.date)} (срок — 4 месяца с начисления).
            </p>
          )}
          <div className="inline-actions" style={{ marginTop: 12 }}>
            <Link className="btn btn--primary btn--sm" href="/catalog">За покупками</Link>
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: 8 }}>100 бонусов за подписку на Telegram</h2>
          {tgMsg && <p className="msg" style={{ color: tgMsg.ok ? "var(--plus)" : "var(--minus)" }}>{tgMsg.text}</p>}
          {user?.tgBonusGranted ? (
            <p className="muted" style={{ fontSize: ".9rem" }}>✅ Бонус за подписку уже получен. Спасибо, что вы с нами!</p>
          ) : (
            <>
              <p className="muted" style={{ fontSize: ".9rem", marginBottom: 10 }}>
                1. Подпишитесь на канал <a href="https://t.me/BeautEnergyBusiness" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>@BeautEnergyBusiness</a>.<br />
                2. Нажмите кнопку ниже — мы проверим подписку и начислим <b>100 бонусов</b>.
              </p>
              <TelegramLinkButton />
            </>
          )}
        </div>

        <div className="card">
          <h2 style={{ marginBottom: 8 }}>История бонусов</h2>
          {txs.length === 0 ? (
            <p className="empty-note">Движений пока нет.</p>
          ) : (
            <ul className="list">
              {txs.map((t) => (
                <li key={t.id} className="row" style={{ gridTemplateColumns: "auto 1fr auto" }}>
                  <span className="muted">{fmt(t.createdAt)}</span>
                  <span>{t.note}</span>
                  <span className={t.delta >= 0 ? "plus" : "minus"}>{t.delta >= 0 ? "+" : ""}{t.delta}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 style={{ marginBottom: 8 }}>Заказы</h2>
          {orders.length === 0 ? (
            <p className="empty-note">Заказов пока нет.</p>
          ) : (
            <ul className="list">
              {orders.map((o) => {
                const ds = deliveryStatusInfo(o.deliveryStatus);
                return (
                  <li key={o.id} className="row" style={{ gridTemplateColumns: "auto 1fr auto auto" }}>
                    <span className="muted">{fmt(o.createdAt)}</span>
                    <span>
                      {o.items.map((i) => i.title).join(", ")}
                      <span className="dstatus" style={{ color: ds.color, borderColor: ds.color }}>{ds.label}</span>
                    </span>
                    <span className={o.status === "paid" ? "tag" : "muted"}>{o.status === "paid" ? "оплачен" : "ожидает"}</span>
                    <span style={{ fontWeight: 700 }}>{money(o.amount)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 style={{ marginBottom: 8 }}>Смена пароля</h2>
          <PasswordForm />
        </div>
      </div>
    </main>
  );
}
