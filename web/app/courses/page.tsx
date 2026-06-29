import { prisma } from "@/lib/prisma";
import CourseCard from "@/components/CourseCard";

export const metadata = { title: "Курсы по уходу за лицом — Farmati.cosmetics" };

export default async function CoursesPage() {
  const courses = await prisma.course.findMany({ where: { hidden: false }, include: { lessonItems: { where: { free: true }, select: { id: true } } } });
  return (
    <main className="page">
      <div className="container">
        <h1>Курсы по уходу и массажу лица</h1>
        <p className="section__sub">Доступ навсегда.</p>
        <div className="course-grid">
          {courses.map((c) => (
            <CourseCard key={c.id} c={c} />
          ))}
        </div>
      </div>
    </main>
  );
}
