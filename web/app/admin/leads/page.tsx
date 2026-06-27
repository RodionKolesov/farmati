import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function fmt(d: Date) {
  return new Date(d).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default async function AdminLeads() {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <h2 style={{ margin: 0 }}>Заявки на консультацию ({leads.length})</h2>
        <a className="btn btn--ghost btn--sm" href="/admin/leads/export">⬇ Выгрузить в Excel</a>
      </div>
      <table className="admin-table">
        <thead><tr><th>Дата</th><th>Имя</th><th>Телефон</th><th>Вопрос</th></tr></thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id}>
              <td data-label="Дата">{fmt(l.createdAt)}</td>
              <td data-label="Имя">{l.name}</td>
              <td data-label="Телефон"><a href={`tel:${l.phone}`}>{l.phone}</a></td>
              <td data-label="Вопрос">{l.message || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {leads.length === 0 && <p className="empty-note">Заявок пока нет.</p>}
    </div>
  );
}
