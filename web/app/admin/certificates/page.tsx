import { prisma } from "@/lib/prisma";
import { createCertificate, updateCertificate, deleteCertificate, toggleCertificateHidden } from "@/lib/actions/admin";
import ConfirmSubmit from "@/components/ConfirmSubmit";

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
                <tr key={c.id} style={c.hidden ? { opacity: 0.55 } : undefined}>
                  <td data-label="Фото"><img src={c.image} alt="" style={{ width: 54, height: 70, objectFit: "cover", borderRadius: 8 }} /></td>
                  <td data-label="Подпись">{c.title || "—"}{c.hidden && <span className="muted"> · скрыт</span>}</td>
                  <td data-label="Порядок">{c.order}</td>
                  <td data-label="Действия">
                    <div className="inline-actions">
                      <form action={toggleCertificateHidden}>
                        <input type="hidden" name="id" value={c.id} />
                        <button className="link">{c.hidden ? "Показать" : "Скрыть"}</button>
                      </form>
                      <form action={deleteCertificate}>
                        <input type="hidden" name="id" value={c.id} />
                        <ConfirmSubmit className="link" style={{ color: "var(--minus)" }} message="Удалить сертификат? Это действие нельзя отменить.">Удалить</ConfirmSubmit>
                      </form>
                    </div>
                    <details className="row-edit">
                      <summary>Изменить</summary>
                      <form action={updateCertificate} className="form-grid">
                        <input type="hidden" name="id" value={c.id} />
                        <div><label>Подпись</label><input name="title" defaultValue={c.title} /></div>
                        <div><label>Порядок</label><input name="order" type="number" defaultValue={c.order} /></div>
                        <div className="full"><label>Заменить фото (необяз.)</label><input name="image" type="file" accept="image/*" /></div>
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
