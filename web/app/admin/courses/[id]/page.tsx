import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateCourse, createLesson, updateLesson, deleteLesson } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

export default async function EditCourse({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await prisma.course.findUnique({
    where: { id },
    include: { lessonItems: { orderBy: { order: "asc" } } },
  });
  if (!c) notFound();

  return (
    <>
      {/* Параметры курса */}
      <div className="card" style={{ maxWidth: 720 }}>
        <h2 style={{ marginBottom: 12 }}>Курс: {c.title}</h2>
        <form action={updateCourse} className="form-grid">
          <input type="hidden" name="id" value={c.id} />
          <div><label>Название</label><input name="title" defaultValue={c.title} required /></div>
          <div><label>Цена, ₽</label><input name="price" type="number" defaultValue={c.price} /></div>
          <div><label>Старая цена</label><input name="oldPrice" type="number" defaultValue={c.oldPrice ?? ""} /></div>
          <div><label>Длительность</label><input name="duration" defaultValue={c.duration} /></div>
          <div><label>Уроков (для карточки)</label><input name="lessonsCount" type="number" defaultValue={c.lessonsCount} /></div>
          <div><label>Загрузить обложку</label><input name="imageFile" type="file" accept="image/*" /></div>
          <div><label>…или ссылка на обложку</label><input name="image" defaultValue={c.image} /></div>
          <div className="full"><label>Описание</label><textarea name="summary" rows={2} defaultValue={c.summary} /></div>
          <div className="full"><button className="btn btn--primary">Сохранить курс</button></div>
        </form>
      </div>

      {/* Добавить урок */}
      <div className="card" style={{ maxWidth: 720 }}>
        <h2 style={{ marginBottom: 12 }}>Добавить урок</h2>
        <form action={createLesson} className="form-grid">
          <input type="hidden" name="courseId" value={c.id} />
          <div className="full"><label>Название урока</label><input name="title" required placeholder="Урок 1. Подготовка кожи" /></div>
          <div className="full"><label>Ссылка на видео (embed YouTube / VK / Kinescope)</label><input name="videoUrl" placeholder="https://www.youtube.com/embed/XXXX" /></div>
          <div><label>Порядок</label><input name="order" type="number" defaultValue={c.lessonItems.length} /></div>
          <div style={{ display: "flex", alignItems: "end", gap: 8 }}>
            <label style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" name="free" style={{ width: "auto" }} /> Бесплатный (после регистрации)
            </label>
          </div>
          <div className="full"><button className="btn btn--primary">Добавить урок</button></div>
        </form>
        <p className="muted" style={{ fontSize: "0.8rem", marginTop: 8 }}>
          Видео: загрузите на VK Видео или YouTube (по ссылке/unlisted), нажмите «Поделиться → Встроить» и вставьте ссылку вида <code>…/embed/…</code>.
        </p>
      </div>

      {/* Список уроков */}
      <div className="card" style={{ maxWidth: 720 }}>
        <h2 style={{ marginBottom: 12 }}>Уроки ({c.lessonItems.length})</h2>
        {c.lessonItems.length === 0 ? (
          <p className="empty-note">Уроков пока нет — добавьте выше.</p>
        ) : (
          c.lessonItems.map((l) => (
            <form key={l.id} action={updateLesson} className="form-grid" style={{ borderTop: "1px solid var(--line)", paddingTop: 12, marginTop: 12 }}>
              <input type="hidden" name="id" value={l.id} />
              <input type="hidden" name="courseId" value={c.id} />
              <div className="full"><label>Название</label><input name="title" defaultValue={l.title} /></div>
              <div className="full"><label>Ссылка на видео</label><input name="videoUrl" defaultValue={l.videoUrl} placeholder="…/embed/…" /></div>
              <div><label>Порядок</label><input name="order" type="number" defaultValue={l.order} /></div>
              <div style={{ display: "flex", alignItems: "end" }}>
                <label style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" name="free" defaultChecked={l.free} style={{ width: "auto" }} /> Бесплатный
                </label>
              </div>
              <div className="full inline-actions">
                <button className="btn btn--primary btn--sm">Сохранить</button>
                <button className="link" style={{ color: "var(--minus)" }} formAction={deleteLesson}>Удалить</button>
              </div>
            </form>
          ))
        )}
      </div>

      <Link className="link" href="/admin/courses">← Ко всем курсам</Link>
    </>
  );
}
