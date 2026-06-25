import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { expireBonusesNow } from "@/lib/actions/admin";
import { getServerStats } from "@/lib/actions/maintenance";
import AdminServerPanel from "@/components/AdminServerPanel";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [products, courses, orders, paid, leads, users, checklists, reviews, stats] = await Promise.all([
    prisma.product.count(),
    prisma.course.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: "paid" } }),
    prisma.lead.count(),
    prisma.user.count(),
    prisma.checklist.count(),
    prisma.review.count(),
    getServerStats(),
  ]);
  return (
    <>
      <AdminServerPanel stats={stats} />
      <div className="admin-grid">
        <Link href="/admin/products" className="admin-stat"><b>{products}</b>товаров</Link>
        <Link href="/admin/courses" className="admin-stat"><b>{courses}</b>курсов</Link>
        <Link href="/admin/checklists" className="admin-stat"><b>{checklists}</b>чек-листов</Link>
        <Link href="/admin/reviews" className="admin-stat"><b>{reviews}</b>отзывов</Link>
        <Link href="/admin/orders" className="admin-stat"><b>{paid}</b>оплачено заказов</Link>
        <Link href="/admin/orders" className="admin-stat"><b>{orders}</b>всего заказов</Link>
        <Link href="/admin/leads" className="admin-stat"><b>{leads}</b>заявок на консультацию</Link>
        <Link href="/admin/users" className="admin-stat"><b>{users}</b>участников клуба</Link>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginBottom: 8 }}>Бонусы</h2>
        <p className="muted" style={{ fontSize: "0.9rem", marginBottom: 10 }}>
          Бонусы сгорают через 4 месяца с начисления автоматически (при заходе участника в кабинет).
          Кнопка ниже принудительно списывает все просроченные сейчас.
        </p>
        <form action={expireBonusesNow}>
          <button className="btn btn--ghost btn--sm">Списать просроченные бонусы</button>
        </form>
      </div>
    </>
  );
}
