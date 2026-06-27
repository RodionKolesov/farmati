import { prisma } from "@/lib/prisma";
import { createCertificate, deleteCertificate } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminCertificates() {
  const items = await prisma.certificate.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] });
  return (
    <>
      <div className="card">
        <h2 style={{ marginBottom: 12 }}>Добавить диплом / сертификат</h2>
        <form action={createCertificate} className="form-grid">
          <div><label>Фото диплома/сертификата</label><input name="image" type="file" accept="image/*" required /></div>
          <div><label>Порядок</label><input name="order" type="number" placeholder="0" /></div>
          <div className="full"><label>Подпись (необязательно)</label><input name="title" placeholder="Например: Facialist Level 1 — Natural Biolifting" /></div>
          <div className="full"><button className="btn btn--primary">Добавить</button></div>
        </form>
        <p className="muted" style={{ fontSize: "0.8rem", marginTop: 8 }}>
          Загруженные сертификаты сразу появятся в ленте «Дипломы и сертификаты» на главной странице.
        </p>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 12 }}>Сертификаты ({items.length})</h2>
        {items.length === 0 ? (
          <p className="empty-note">Пока пусто. Добавьте первый диплом выше.</p>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Фото</th><th>Подпись</th><th>Порядок</th><th></th></tr></thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <td data-label="Фото"><img src={c.image} alt="" style={{ width: 54, height: 70, objectFit: "cover", borderRadius: 8 }} /></td>
                  <td data-label="Подпись">{c.title || "—"}</td>
                  <td data-label="Порядок">{c.order}</td>
                  <td data-label="Действия">
                    <form action={deleteCertificate}>
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
