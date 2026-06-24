import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { updateProduct } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await prisma.product.findUnique({ where: { id } });
  if (!p) notFound();
  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <h2 style={{ marginBottom: 12 }}>Изменить товар</h2>
      <form action={updateProduct} className="form-grid">
        <input type="hidden" name="id" value={p.id} />
        <div><label>Название</label><input name="name" defaultValue={p.name} required /></div>
        <div><label>Категория</label><input name="category" defaultValue={p.category} /></div>
        <div><label>Цена, ₽</label><input name="price" type="number" defaultValue={p.price} /></div>
        <div><label>Загрузить новое фото</label><input name="imageFile" type="file" accept="image/*" /></div>
        <div><label>…или ссылка на фото</label><input name="image" defaultValue={p.image} placeholder="https://…" /></div>
        {p.image && (
          <div className="full" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src={p.image} alt="" style={{ width: 64, height: 84, objectFit: "cover", borderRadius: 8 }} />
            <span className="muted" style={{ fontSize: "0.85rem" }}>Текущее фото (загрузите новое, чтобы заменить)</span>
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
