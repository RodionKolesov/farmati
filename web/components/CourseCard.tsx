import Link from "next/link";
import AddToCart from "./AddToCart";
import { money } from "@/lib/money";
import type { Course } from "@prisma/client";

export default function CourseCard({ c }: { c: Course }) {
  return (
    <article className="course">
      <Link
        href={`/course/${c.slug}`}
        className="course__media"
        style={{ backgroundImage: `url('${c.image}')` }}
        aria-label={c.title}
      />
      <div className="course__body">
        <h3>{c.title}</h3>
        <p>{c.summary}</p>
        <ul className="course__meta">
          <li>📹 {c.lessonsCount} уроков</li>
          <li>⏱ {c.duration}</li>
        </ul>
        <div className="course__foot">
          <div className="price">
            <b>{money(c.price)}</b>
            {c.oldPrice && <s>{money(c.oldPrice)}</s>}
          </div>
          <AddToCart
            item={{ kind: "course", slug: c.slug, title: c.title, price: c.price, image: c.image }}
            variant="button"
            label="В корзину"
          />
        </div>
      </div>
    </article>
  );
}
