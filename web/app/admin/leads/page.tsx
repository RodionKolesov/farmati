import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function fmt(d: Date) {
  return new Date(d).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default async function AdminLeads() {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <div className="card">
      <h2 style={{ marginBottom: 12 }}>Заявки на консультацию ({leads.length})</h2>
      <table className="admin-table">
        <thead><tr><th>Дата</th><th>Имя</th><th>Телефон</th><th>Вопрос</th></tr></thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id}>
              <td>{fmt(l.createdAt)}</td>
              <td>{l.name}</td>
              <td><a href={`tel:${l.phone}`}>{l.phone}</a></td>
              <td>{l.message || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {leads.length === 0 && <p className="empty-note">Заявок пока нет.</p>}
    </div>
  );
}
