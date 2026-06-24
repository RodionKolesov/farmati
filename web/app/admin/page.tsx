import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [products, courses, orders, paid, leads, users] = await Promise.all([
    prisma.product.count(),
    prisma.course.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: "paid" } }),
    prisma.lead.count(),
    prisma.user.count(),
  ]);
  return (
    <div className="admin-grid">
      <Link href="/admin/products" className="admin-stat"><b>{products}</b>товаров</Link>
      <Link href="/admin/courses" className="admin-stat"><b>{courses}</b>курсов</Link>
      <Link href="/admin/orders" className="admin-stat"><b>{paid}</b>оплачено заказов</Link>
      <Link href="/admin/orders" className="admin-stat"><b>{orders}</b>всего заказов</Link>
      <Link href="/admin/leads" className="admin-stat"><b>{leads}</b>заявок на консультацию</Link>
      <Link href="/admin/users" className="admin-stat"><b>{users}</b>участников клуба</Link>
    </div>
  );
}
