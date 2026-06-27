import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { updateProduct, addProductPhotos, deleteProductPhoto, moveProductPhoto } from "@/lib/actions/admin";
import { productImages } from "@/lib/images";
import ConfirmSubmit from "@/components/ConfirmSubmit";

export const dynamic = "force-dynamic";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await prisma.product.findUnique({ where: { id } });
  if (!p) notFound();
  const imgs = productImages(p);
  return (
    <div style={{ maxWidth: 640 }}>
      <div className="card">
        <h2 style={{ marginBottom: 12 }}>Изменить товар</h2>
        <form action={updateProduct} className="form-grid">
          <input type="hidden" name="id" value={p.id} />
          <div><label>Название</label><input name="name" defaultValue={p.name} required /></div>
          <div><label>Категория</label><input name="category" defaultValue={p.category} /></div>
          <div><label>Цена, ₽</label><input name="price" type="number" defaultValue={p.price} /></div>
          <div><label>Остаток, шт. (0 = скрыт)</label><input name="stock" type="number" min="0" defaultValue={p.stock} /></div>
          <div className="full"><label>Описание</label><textarea name="description" rows={3} defaultValue={p.description} /></div>
          <div className="full inline-actions">
            <button className="btn btn--primary">Сохранить</button>
            <Link className="btn btn--ghost" href="/admin/products">Назад к товарам</Link>
          </div>
        </form>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 4 }}>Фото товара ({imgs.length})</h2>
        <p className="muted" style={{ fontSize: "0.82rem", marginBottom: 12 }}>
          Первое фото — главное (показывается в каталоге). Меняйте порядок стрелками, удаляйте крестиком, добавляйте новые ниже.
        </p>

        {imgs.length === 0 ? (
          <p className="empty-note">Пока нет фото. Добавьте ниже.</p>
        ) : (
          <div className="photo-manage">
            {imgs.map((src, i) => (
              <div key={src} className="photo-item">
                <img src={src} alt="" />
                {i === 0 && <span className="photo-badge">главное</span>}
                <div className="photo-ctrl">
                  <form action={moveProductPhoto}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="url" value={src} />
                    <input type="hidden" name="dir" value="up" />
                    <button title="Левее / выше" disabled={i === 0}>↑</button>
                  </form>
                  <form action={moveProductPhoto}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="url" value={src} />
                    <input type="hidden" name="dir" value="down" />
                    <button title="Правее / ниже" disabled={i === imgs.length - 1}>↓</button>
                  </form>
                  <form action={deleteProductPhoto}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="url" value={src} />
                    <ConfirmSubmit className="photo-del" message="Удалить это фото?">✕</ConfirmSubmit>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}

        <form action={addProductPhotos} style={{ marginTop: 16 }}>
          <input type="hidden" name="id" value={p.id} />
          <label>Добавить фото (можно выбрать несколько)</label>
          <input name="imageFile" type="file" accept="image/*" multiple />
          <button className="btn btn--primary btn--sm" style={{ marginTop: 10 }}>Добавить фото</button>
        </form>
      </div>
    </div>
  );
}
