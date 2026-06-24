import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <main className="admin">
      <div className="container">
        <h1>Управление сайтом</h1>
        <p className="muted" style={{ fontSize: "0.9rem" }}>Панель владельца FARMATI · изменения сразу видны на сайте</p>
        <nav className="admin-nav">
          <Link href="/admin">Обзор</Link>
          <Link href="/admin/products">Товары</Link>
          <Link href="/admin/courses">Курсы и уроки</Link>
          <Link href="/admin/users">Участники</Link>
          <Link href="/admin/orders">Заказы</Link>
          <Link href="/admin/leads">Заявки</Link>
          <Link href="/" style={{ marginLeft: "auto" }}>← На сайт</Link>
        </nav>
        {children}
      </div>
    </main>
  );
}
