import { prisma } from "@/lib/prisma";
import { createChecklist, updateChecklist, deleteChecklist, toggleChecklistHidden } from "@/lib/actions/admin";
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
          <div><label>Порядок</label><input name="order" type="number" min={1} defaultValue={items.length + 1} /></div>
          <div><label>Ссылка на видео (необяз.)</label><input name="videoUrl" placeholder="RuTube / YouTube — любая ссылка" /></div>
          <div><label>Фото / баннер (необяз., если без видео)</label><input name="imageFile" type="file" accept="image/*" /></div>
          <div className="full"><label>Текст поста (необяз.)</label><textarea name="description" rows={5} placeholder="Текст статьи / обзора. Переносы строк сохраняются." /></div>
          <div className="full"><button className="btn btn--primary">Добавить пост</button></div>
        </form>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 12 }}>Посты / статьи ({items.length})</h2>
        {items.length === 0 ? (
          <p className="empty-note">Пока пусто. Добавьте первый пост выше.</p>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Заголовок</th><th>Тип</th><th></th></tr></thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} style={c.hidden ? { opacity: 0.55 } : undefined}>
                  <td data-label="Заголовок">{c.title}{c.hidden && <span className="muted"> · скрыт</span>}</td>
                  <td data-label="Тип">{c.videoUrl ? "🎬 видео" : c.image ? "🖼 баннер" : "📝 текст"}</td>
                  <td data-label="Действия">
                    <div className="inline-actions">
                      <form action={toggleChecklistHidden}>
                        <input type="hidden" name="id" value={c.id} />
                        <button className="link">{c.hidden ? "Показать" : "Скрыть"}</button>
                      </form>
                      <form action={deleteChecklist}>
                        <input type="hidden" name="id" value={c.id} />
                        <ConfirmSubmit className="link" style={{ color: "var(--minus)" }} message="Удалить пост? Это действие нельзя отменить.">Удалить</ConfirmSubmit>
                      </form>
                    </div>
                    <details className="row-edit">
                      <summary>Изменить</summary>
                      <form action={updateChecklist} className="form-grid">
                        <input type="hidden" name="id" value={c.id} />
                        <div><label>Заголовок</label><input name="title" required defaultValue={c.title} /></div>
                        <div><label>Порядок</label><input name="order" type="number" defaultValue={c.order} /></div>
                        <div><label>Ссылка на видео</label><input name="videoUrl" defaultValue={c.videoUrl} placeholder="RuTube / YouTube" /></div>
                        <div><label>Заменить фото / баннер (необяз.)</label><input name="imageFile" type="file" accept="image/*" /></div>
                        <div className="full"><label>Текст поста</label><textarea name="description" rows={5} defaultValue={c.description} /></div>
                        <div className="full"><button className="btn btn--primary btn--sm">Сохранить</button></div>
                      </form>
                    </details>
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
