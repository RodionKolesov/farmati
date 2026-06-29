import Link from "next/link";
import AddToCart from "./AddToCart";
import { money } from "@/lib/money";
import type { Course } from "@prisma/client";

// Русские склонения: 1 урок, 2 урока, 5 уроков.
function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

// Карточка может прийти с подгруженными бесплатными уроками (lessonItems отфильтрованы по free)
// или с готовым числом freeLessons.
type CourseWithFree = Course & { lessonItems?: { id: string }[]; freeLessons?: number };

export default function CourseCard({ c }: { c: CourseWithFree }) {
  const freeCount = c.freeLessons ?? c.lessonItems?.length ?? 0;
  return (
    <article className="course">
      <Link
        href={`/course/${c.slug}`}
        className="course__media"
        style={{ backgroundImage: `url('${c.image}')` }}
        aria-label={c.title}
      >
        {freeCount > 0 && (
          <span className="course__free-badge">
            🎁 {freeCount} {plural(freeCount, "урок", "урока", "уроков")} бесплатно
          </span>
        )}
      </Link>
      <div className="course__body">
        <h3>{c.title}</h3>
        <p>{c.summary}</p>
        <ul className="course__meta">
          <li>📹 {c.lessonsCount} {plural(c.lessonsCount, "урок", "урока", "уроков")}</li>
          {c.duration && <li>⏱ {c.duration}</li>}
        </ul>
        <div className="course__foot">
          <div className="price">
            <b>{money(c.price)}</b>
            {c.oldPrice && <s>{money(c.oldPrice)}</s>}
          </div>
          <div className="course__btns">
            <Link className="btn btn--ghost btn--sm" href={`/course/${c.slug}`}>Перейти в курс</Link>
            <AddToCart
              item={{ kind: "course", slug: c.slug, title: c.title, price: c.price, image: c.image }}
              variant="button"
              label="В корзину"
            />
          </div>
        </div>
      </div>
    </article>
  );
}
