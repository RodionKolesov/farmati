import { prisma } from "@/lib/prisma";
import { money } from "@/lib/money";
import { DELIVERY_STATUSES } from "@/lib/orderStatus";
import { updateDeliveryStatus } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

function fmt(d: Date) {
  return new Date(d).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default async function AdminOrders() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { items: true, user: true },
  });
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <h2 style={{ margin: 0 }}>Заказы ({orders.length})</h2>
        <a className="btn btn--ghost btn--sm" href="/admin/orders/export">⬇ Выгрузить в Excel</a>
      </div>
      <table className="admin-table">
        <thead><tr><th>Дата</th><th>Клиент</th><th>Состав</th><th>Доставка</th><th>Сумма</th><th>Бонусы</th><th>Оплата</th><th>Статус доставки</th></tr></thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>{fmt(o.createdAt)}</td>
              <td>
                {o.customerName || o.user?.name || o.user?.email || "—"}
                {o.customerPhone && <div className="muted" style={{ fontSize: "0.82rem" }}>{o.customerPhone}</div>}
              </td>
              <td>{o.items.map((i) => i.title).join(", ")}</td>
              <td style={{ fontSize: "0.85rem" }}>
                {({ courier: "Курьер", pickup: "Самовывоз", cdek: "СДЭК до ПВЗ", post: "Почта России" } as Record<string, string>)[o.deliveryMethod] ?? o.deliveryMethod}
                {o.address && <div className="muted">{o.address}</div>}
                {o.deliveryCost > 0 && <div className="muted">{money(o.deliveryCost)}</div>}
                {o.comment && <div className="muted">💬 {o.comment}</div>}
              </td>
              <td>{money(o.amount)}</td>
              <td className="muted">+{o.bonusEarned} / −{o.bonusSpent}</td>
              <td><span className={o.status === "paid" ? "tag" : "muted"}>{o.status === "paid" ? "оплачен" : "ожидает"}</span></td>
              <td>
                <form action={updateDeliveryStatus} className="stock-edit">
                  <input type="hidden" name="id" value={o.id} />
                  <select name="status" defaultValue={o.deliveryStatus}>
                    {DELIVERY_STATUSES.map((s) => (
                      <option key={s.code} value={s.code}>{s.label}</option>
                    ))}
                  </select>
                  <button className="link">OK</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && <p className="empty-note">Заказов пока нет.</p>}
    </div>
  );
}
