import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { expireBonuses, nextExpiry } from "@/lib/bonusLedger";

export const dynamic = "force-dynamic";
export const metadata = { title: "Клуб — Farmati.cosmetics" };

function fmt(d: Date) {
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default async function ClubPage() {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  if (userId) await expireBonuses(userId);
  const [user, checklists, expiry] = await Promise.all([
    userId ? prisma.user.findUnique({ where: { id: userId } }) : Promise.resolve(null),
    prisma.checklist.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] }),
    userId ? nextExpiry(userId) : Promise.resolve(null),
  ]);

  return (
    <main className="page">
      <div className="container">
        <div className="section__head">
          <span className="eyebrow">Женский клуб</span>
          <h1>Клуб FARMATI</h1>
          <p className="section__sub">
            Комьюнити заботы о себе: бонусы за покупки, уроки по уходу и массажу лица, чек-листы и личный кабинет.
          </p>
        </div>

        {!user ? (
          <div className="card" style={{ textAlign: "center" }}>
            <h2 style={{ marginBottom: 8 }}>Вступайте в клуб</h2>
            <p className="muted" style={{ marginBottom: 16 }}>
              Регистрация бесплатна — дарим 100 приветственных бонусов, открываем бесплатные уроки и кэшбэк за покупки.
            </p>
            <div className="inline-actions" style={{ justifyContent: "center" }}>
              <Link className="btn btn--primary" href="/login">Вступить в клуб</Link>
              <Link className="btn btn--ghost" href="/courses">Смотреть уроки</Link>
            </div>
          </div>
        ) : (
          <div className="card">
            <p className="muted">С возвращением, {user.name || user.email} 👋</p>
            <p className="balance-value"><span>{user.bonusBalance}</span> бонусов</p>
            {expiry && (
              <p className="muted" style={{ fontSize: ".85rem", color: "var(--minus)" }}>
                ⏳ {expiry.amount} бонусов сгорят {fmt(expiry.date)}
              </p>
            )}
          </div>
        )}

        <div className="club-grid">
          <Link href="/account" className="club-card"><b>Личный кабинет</b><span>Баланс, история бонусов и заказов</span></Link>
          <Link href="/account" className="club-card"><b>Бонусный счёт</b><span>Кэшбэк за покупки, 1 бонус = 1 ₽</span></Link>
          <Link href="/courses" className="club-card"><b>Уроки</b><span>Бесплатные уроки + платные курсы</span></Link>
          <a href="#checklists" className="club-card"><b>Чек-листы</b><span>Рекомендации по уходу</span></a>
        </div>

        <div id="checklists" className="section__head" style={{ marginTop: 40 }}>
          <span className="eyebrow">Полезное</span>
          <h2>Чек-листы и рекомендации</h2>
        </div>
        {checklists.length === 0 ? (
          <p className="empty-note" style={{ textAlign: "center" }}>Скоро здесь появятся чек-листы по уходу. 🌿</p>
        ) : (
          <div className="club-grid">
            {checklists.map((c) => (
              <div key={c.id} className="club-card">
                <b>{c.title}</b>
                {c.description && <span>{c.description}</span>}
                {c.fileUrl && (
                  <a className="link" href={c.fileUrl} target="_blank" style={{ marginTop: 8 }}>Скачать PDF →</a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
