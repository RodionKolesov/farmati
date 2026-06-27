import { prisma } from "@/lib/prisma";
import { createReview, deleteReview } from "@/lib/actions/admin";
import ConfirmSubmit from "@/components/ConfirmSubmit";

export const dynamic = "force-dynamic";

export default async function AdminReviews() {
  const items = await prisma.review.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] });
  return (
    <>
      <div className="card">
        <h2 style={{ marginBottom: 12 }}>Добавить отзыв «до/после»</h2>
        <form action={createReview} className="form-grid">
          <div><label>Имя</label><input name="author" required placeholder="Анна" /></div>
          <div><label>Оценка (1–5)</label><input name="rating" type="number" min={1} max={5} defaultValue={5} /></div>
          <div><label>Порядок</label><input name="order" type="number" placeholder="0" /></div>
          <div className="full"><label>Текст отзыва</label><textarea name="text" rows={2} placeholder="«Кожа стала заметно свежее…»" /></div>
          <div><label>Фото «до» (необяз.)</label><input name="beforeImage" type="file" accept="image/*" /></div>
          <div><label>Фото «после» (необяз.)</label><input name="afterImage" type="file" accept="image/*" /></div>
          <div className="full"><button className="btn btn--primary">Добавить отзыв</button></div>
        </form>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 12 }}>Отзывы ({items.length})</h2>
        {items.length === 0 ? (
          <p className="empty-note">Пока пусто. Добавьте первый отзыв выше.</p>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Имя</th><th>Текст</th><th>Фото</th><th></th></tr></thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td>{r.author}</td>
                  <td>{r.text.slice(0, 60)}{r.text.length > 60 ? "…" : ""}</td>
                  <td>{[r.beforeImage && "до", r.afterImage && "после"].filter(Boolean).join("/") || "—"}</td>
                  <td>
                    <form action={deleteReview}>
                      <input type="hidden" name="id" value={r.id} />
                      <ConfirmSubmit className="link" style={{ color: "var(--minus)" }} message="Удалить отзыв? Это действие нельзя отменить.">Удалить</ConfirmSubmit>
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
