import { prisma } from "@/lib/prisma";
import { createChecklist, deleteChecklist } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminChecklists() {
  const items = await prisma.checklist.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] });
  return (
    <>
      <div className="card">
        <h2 style={{ marginBottom: 12 }}>Добавить чек-лист / рекомендацию</h2>
        <form action={createChecklist} className="form-grid">
          <div><label>Название</label><input name="title" required placeholder="Утренний уход за 5 минут" /></div>
          <div><label>Порядок</label><input name="order" type="number" placeholder="0" /></div>
          <div className="full"><label>Описание</label><textarea name="description" rows={2} placeholder="Короткое пояснение" /></div>
          <div><label>Файл PDF (загрузить)</label><input name="file" type="file" accept="application/pdf" /></div>
          <div><label>…или ссылка</label><input name="fileUrl" placeholder="https://…" /></div>
          <div><label>Картинка-обложка (необяз.)</label><input name="imageFile" type="file" accept="image/*" /></div>
          <div className="full"><button className="btn btn--primary">Добавить</button></div>
        </form>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 12 }}>Чек-листы ({items.length})</h2>
        {items.length === 0 ? (
          <p className="empty-note">Пока пусто. Добавьте первый чек-лист выше.</p>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Название</th><th>Файл</th><th></th></tr></thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <td>{c.title}</td>
                  <td>{c.fileUrl ? <a className="link" href={c.fileUrl} target="_blank">открыть</a> : "—"}</td>
                  <td>
                    <form action={deleteChecklist}>
                      <input type="hidden" name="id" value={c.id} />
                      <button className="link" style={{ color: "var(--minus)" }}>Удалить</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
