import { prisma } from "@/lib/prisma";
import { createChecklist, deleteChecklist } from "@/lib/actions/admin";
import ConfirmSubmit from "@/components/ConfirmSubmit";

export const dynamic = "force-dynamic";

export default async function AdminChecklists() {
  const items = await prisma.checklist.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] });
  return (
    <>
      <div className="card">
        <h2 style={{ marginBottom: 4 }}>Добавить пост / статью / обзор</h2>
        <p className="muted" style={{ fontSize: "0.82rem", marginBottom: 12 }}>
          Появится в карусели «Полезное» на главной. Можно добавить фото, текст и видео — пост читается прямо на сайте.
        </p>
        <form action={createChecklist} className="form-grid">
          <div><label>Заголовок</label><input name="title" required placeholder="Обзор: ночной крем с коллагеном" /></div>
          <div><label>Порядок</label><input name="order" type="number" placeholder="0" /></div>
          <div className="full"><label>Текст поста</label><textarea name="description" rows={5} placeholder="Текст статьи / обзора. Переносы строк сохраняются." /></div>
          <div><label>Фото к посту</label><input name="imageFile" type="file" accept="image/*" /></div>
          <div><label>Ссылка на видео (необяз.)</label><input name="videoUrl" placeholder="RuTube / YouTube — любая ссылка" /></div>
          <div><label>PDF (необяз.)</label><input name="file" type="file" accept="application/pdf" /></div>
          <div><label>…или ссылка на PDF</label><input name="fileUrl" placeholder="https://…" /></div>
          <div className="full"><button className="btn btn--primary">Добавить пост</button></div>
        </form>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 12 }}>Посты / статьи ({items.length})</h2>
        {items.length === 0 ? (
          <p className="empty-note">Пока пусто. Добавьте первый пост выше.</p>
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
                      <ConfirmSubmit className="link" style={{ color: "var(--minus)" }} message="Удалить чек-лист? Это действие нельзя отменить.">Удалить</ConfirmSubmit>
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
