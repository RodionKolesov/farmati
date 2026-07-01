import { prisma } from "@/lib/prisma";
import { deleteUser } from "@/lib/actions/admin";
import ConfirmSubmit from "@/components/ConfirmSubmit";

export const dynamic = "force-dynamic";

function fmt(d: Date) {
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const where = query
    ? {
        OR: [
          { name: { contains: query } },
          { email: { contains: query } },
          { phone: { contains: query } },
        ],
      }
    : {};

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 500,
    include: { _count: { select: { orders: true } } },
  });

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <h2 style={{ margin: 0 }}>Участники клуба ({users.length})</h2>
        <a className="btn btn--ghost btn--sm" href="/admin/users/export">⬇ Выгрузить в Excel</a>
      </div>

      <form method="get" className="inline-actions" style={{ marginBottom: 16 }}>
        <input name="q" defaultValue={query} placeholder="Поиск по имени, email или телефону" style={{ maxWidth: 340 }} />
        <button className="btn btn--primary btn--sm">Найти</button>
        {query && <a className="link" href="/admin/users">сбросить</a>}
      </form>

      <table className="admin-table">
        <thead>
          <tr><th>Дата</th><th>Имя</th><th>Email</th><th>Телефон</th><th>Бонусы</th><th>Заказов</th><th></th></tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td data-label="Дата">{fmt(u.createdAt)}</td>
              <td data-label="Имя">{u.name || "—"}</td>
              <td data-label="Email">{u.email}</td>
              <td data-label="Телефон">{u.phone ? <a href={`tel:${u.phone}`}>{u.phone}</a> : "—"}</td>
              <td data-label="Бонусы" className="plus">{u.bonusBalance}</td>
              <td data-label="Заказов">{u._count.orders}</td>
              <td data-label="Действия">
                <form action={deleteUser}>
                  <input type="hidden" name="id" value={u.id} />
                  <ConfirmSubmit
                    className="link"
                    style={{ color: "var(--minus)" }}
                    message={`Удалить участника ${u.name || u.email}? Вместе с ним удалятся его заказы и бонусные операции. Это действие нельзя отменить.`}
                  >
                    Удалить
                  </ConfirmSubmit>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && <p className="empty-note">{query ? "Ничего не найдено." : "Участников пока нет."}</p>}
    </div>
  );
}
