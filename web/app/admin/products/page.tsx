import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/money";
import { createProduct, deleteProduct } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
  const products = await prisma.product.findMany({ orderBy: { category: "asc" } });
  return (
    <>
      <div className="card">
        <h2 style={{ marginBottom: 12 }}>Добавить товар</h2>
        <form action={createProduct} className="form-grid">
          <div><label>Название</label><input name="name" required placeholder="Сыворотка с витамином С" /></div>
          <div><label>Категория</label><input name="category" placeholder="Сыворотки" /></div>
          <div><label>Цена, ₽</label><input name="price" type="number" min="0" placeholder="1700" /></div>
          <div><label>Фото (загрузить файл)</label><input name="imageFile" type="file" accept="image/*" /></div>
          <div><label>…или ссылка на фото</label><input name="image" placeholder="https://… (необязательно)" /></div>
          <div className="full"><label>Описание</label><textarea name="description" rows={2} placeholder="Краткое описание товара" /></div>
          <div className="full"><button className="btn btn--primary">Добавить товар</button></div>
        </form>
        <p className="muted" style={{ fontSize: "0.8rem", marginTop: 8 }}>
          Просто выберите фото с компьютера — оно загрузится автоматически. Можно вместо этого вставить ссылку. Если ничего нет — будет «Фото скоро».
        </p>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 12 }}>Товары ({products.length})</h2>
        <table className="admin-table">
          <thead><tr><th>Название</th><th>Категория</th><th>Цена</th><th>Фото</th><th></th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>{money(p.price)}</td>
                <td>{p.image ? "✅" : "— нет"}</td>
                <td>
                  <div className="inline-actions">
                    <Link className="link" href={`/admin/products/${p.id}`}>Изменить</Link>
                    <form action={deleteProduct}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="link" style={{ color: "var(--minus)" }}>Удалить</button>
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
