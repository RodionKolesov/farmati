import { prisma } from "@/lib/prisma";
import { money } from "@/lib/money";

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
      <h2 style={{ marginBottom: 12 }}>Заказы ({orders.length})</h2>
      <table className="admin-table">
        <thead><tr><th>Дата</th><th>Клиент</th><th>Состав</th><th>Доставка</th><th>Сумма</th><th>Бонусы</th><th>Статус</th></tr></thead>
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
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && <p className="empty-note">Заказов пока нет.</p>}
    </div>
  );
}
