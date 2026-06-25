import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { updateProduct } from "@/lib/actions/admin";
import { productImages } from "@/lib/images";

export const dynamic = "force-dynamic";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await prisma.product.findUnique({ where: { id } });
  if (!p) notFound();
  const imgs = productImages(p);
  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <h2 style={{ marginBottom: 12 }}>Изменить товар</h2>
      <form action={updateProduct} className="form-grid">
        <input type="hidden" name="id" value={p.id} />
        <div><label>Название</label><input name="name" defaultValue={p.name} required /></div>
        <div><label>Категория</label><input name="category" defaultValue={p.category} /></div>
        <div><label>Цена, ₽</label><input name="price" type="number" defaultValue={p.price} /></div>
        <div><label>Остаток, шт. (0 = скрыт)</label><input name="stock" type="number" min="0" defaultValue={p.stock} /></div>
        <div className="full"><label>Загрузить фото (можно несколько — заменят все текущие)</label><input name="imageFile" type="file" accept="image/*" multiple /></div>
        {imgs.length > 0 && (
          <div className="full" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {imgs.map((src, i) => (
              <img key={i} src={src} alt="" style={{ width: 56, height: 74, objectFit: "cover", borderRadius: 8 }} />
            ))}
            <span className="muted" style={{ fontSize: "0.85rem" }}>
              Текущие фото ({imgs.length}) · загрузите новые, чтобы заменить
            </span>
          </div>
        )}
        <div className="full"><label>Описание</label><textarea name="description" rows={3} defaultValue={p.description} /></div>
        <div className="full inline-actions">
          <button className="btn btn--primary">Сохранить</button>
          <Link className="btn btn--ghost" href="/admin/products">Отмена</Link>
        </div>
      </form>
    </div>
  );
}
