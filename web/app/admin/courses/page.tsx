import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/money";
import { createCourse, deleteCourse } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminCourses() {
  const courses = await prisma.course.findMany({
    orderBy: { title: "asc" },
    include: { _count: { select: { lessonItems: true } } },
  });
  return (
    <>
      <div className="card">
        <h2 style={{ marginBottom: 12 }}>Добавить курс</h2>
        <form action={createCourse} className="form-grid">
          <div><label>Название</label><input name="title" required placeholder="Скульптурный массаж лица" /></div>
          <div><label>Цена, ₽</label><input name="price" type="number" placeholder="4900" /></div>
          <div><label>Старая цена, ₽ (необяз.)</label><input name="oldPrice" type="number" placeholder="6900" /></div>
          <div><label>Длительность</label><input name="duration" placeholder="3 часа" /></div>
          <div><label>Уроков (число для карточки)</label><input name="lessonsCount" type="number" placeholder="10" /></div>
          <div><label>Обложка (загрузить файл)</label><input name="imageFile" type="file" accept="image/*" /></div>
          <div><label>…или ссылка на обложку</label><input name="image" placeholder="https://…" /></div>
          <div className="full"><label>Короткое описание</label><textarea name="summary" rows={2} /></div>
          <div className="full"><button className="btn btn--primary">Добавить курс</button></div>
        </form>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 12 }}>Курсы ({courses.length})</h2>
        <table className="admin-table">
          <thead><tr><th>Название</th><th>Цена</th><th>Уроков</th><th></th></tr></thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id}>
                <td>{c.title}</td>
                <td>{money(c.price)}</td>
                <td>{c._count.lessonItems}</td>
                <td>
                  <div className="inline-actions">
                    <Link className="link" href={`/admin/courses/${c.id}`}>Уроки и правка</Link>
                    <form action={deleteCourse}>
                      <input type="hidden" name="id" value={c.id} />
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
