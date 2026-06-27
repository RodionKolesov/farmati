import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/money";
import { createProduct, deleteProduct, updateStock } from "@/lib/actions/admin";
import ConfirmSubmit from "@/components/ConfirmSubmit";

export const dynamic = "force-dynamic";

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const products = await prisma.product.findMany({ orderBy: { category: "asc" } });
  return (
    <>
      <div className="card">
        <h2 style={{ marginBottom: 12 }}>Добавить товар</h2>
        <form action={createProduct} className="form-grid">
          <div><label>Название</label><input name="name" required placeholder="Сыворотка с витамином С" /></div>
          <div><label>Категория</label><input name="category" placeholder="Сыворотки" /></div>
          <div><label>Цена, ₽</label><input name="price" type="number" min="0" placeholder="1700" /></div>
          <div><label>Остаток, шт.</label><input name="stock" type="number" min="0" placeholder="10" /></div>
          <div className="full"><label>Фото товара (можно выбрать несколько)</label><input name="imageFile" type="file" accept="image/*" multiple /></div>
          <div className="full"><label>Описание</label><textarea name="description" rows={2} placeholder="Краткое описание товара" /></div>
          <div className="full"><button className="btn btn--primary">Добавить товар</button></div>
        </form>
        <p className="muted" style={{ fontSize: "0.8rem", marginTop: 8 }}>
          Выберите одно или несколько фото с компьютера (с зажатым Ctrl можно отметить сразу несколько) — они загрузятся автоматически и будут показаны галереей. Первое фото — главное. Если фото нет — будет «Фото скоро».
        </p>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          <h2 style={{ margin: 0 }}>Товары ({products.length})</h2>
          <a className="btn btn--ghost btn--sm" href="/admin/products/export">⬇ Выгрузить в Excel</a>
        </div>
        <table className="admin-table">
          <thead><tr><th>Название</th><th>Категория</th><th>Цена</th><th>Остаток</th><th>Фото</th><th></th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} style={p.stock <= 0 ? { opacity: 0.55 } : undefined}>
                <td data-label="Название">{p.name}{p.stock <= 0 && <span className="muted"> · скрыт</span>}</td>
                <td data-label="Категория">{p.category}</td>
                <td data-label="Цена">{money(p.price)}</td>
                <td data-label="Остаток">
                  <form action={updateStock} className="stock-edit">
                    <input type="hidden" name="id" value={p.id} />
                    <input name="stock" type="number" min="0" defaultValue={p.stock} />
                    <button className="btn-ok" title="Сохранить остаток">ОК</button>
                    {saved === p.id && <span className="saved-check" title="Сохранено">✓</span>}
                  </form>
                </td>
                <td data-label="Фото">{p.image ? "✅" : "— нет"}</td>
                <td data-label="Действия">
                  <div className="inline-actions">
                    <Link className="link" href={`/admin/products/${p.id}`}>Изменить</Link>
                    <form action={deleteProduct}>
                      <input type="hidden" name="id" value={p.id} />
                      <ConfirmSubmit className="link" style={{ color: "var(--minus)" }} message={`Удалить товар «${p.name}»? Это действие нельзя отменить.`}>Удалить</ConfirmSubmit>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
