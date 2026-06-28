import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { hasPurchasedCourse } from "@/lib/access";
import { money } from "@/lib/money";
import { toEmbedUrl } from "@/lib/video";
import AddToCart from "@/components/AddToCart";

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await prisma.course.findUnique({
    where: { slug },
    include: { lessonItems: { orderBy: { order: "asc" } } },
  });
  if (!c) notFound();

  const session = await auth();
  const loggedIn = !!session?.user?.id;
  const purchased = await hasPurchasedCourse(session?.user?.id, c.id);

  const freeLessons = c.lessonItems.filter((l) => l.free);
  const paidLessons = c.lessonItems.filter((l) => !l.free);

  const renderLesson = (l: (typeof c.lessonItems)[number]) => {
    const canWatch = l.free ? loggedIn : purchased;
    return (
      <li key={l.id} className="lesson">
        <div className="lesson__head">
          <span className="lesson__title">{l.title}</span>
          <span className={`lesson__badge ${l.free ? "free" : "lock"}`}>
            {l.free ? "бесплатно" : "по покупке"}
          </span>
        </div>
        {canWatch && l.videoUrl ? (
          <div className="video">
            <iframe src={toEmbedUrl(l.videoUrl)} title={l.title} allowFullScreen allow="autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-write" />
          </div>
        ) : (
          <div className="lesson__locked">
            {l.free ? (
              <>
                <span>🔒 Войдите, чтобы смотреть бесплатные уроки</span>
                <Link className="btn btn--primary btn--sm" href="/login">Вступить в клуб</Link>
              </>
            ) : (
              <>
                <span>🔒 Урок откроется после покупки курса</span>
                {!purchased && (
                  <AddToCart
                    item={{ kind: "course", slug: c.slug, title: c.title, price: c.price, image: c.image }}
                    variant="button"
                    label="Купить курс"
                  />
                )}
              </>
            )}
          </div>
        )}
      </li>
    );
  };

  return (
    <main className="page">
      <div className="container">
        <div className="grid2" style={{ marginBottom: 36 }}>
          <img
            src={c.image}
            alt={c.title}
            style={{ borderRadius: 20, width: "100%", aspectRatio: "16/10", objectFit: "cover" }}
          />
          <div>
            <span className="eyebrow">Онлайн-курс клуба</span>
            <h1 style={{ margin: "8px 0 12px" }}>{c.title}</h1>
            <p className="muted" style={{ marginBottom: 16 }}>{c.summary}</p>
            <ul className="course__meta" style={{ marginBottom: 18 }}>
              <li>📹 {c.lessonsCount} уроков</li>
              <li>⏱ {c.duration}</li>
            </ul>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 18 }}>
              {money(c.price)} {c.oldPrice && <s className="muted" style={{ fontSize: "1rem" }}>{money(c.oldPrice)}</s>}
            </div>
            {purchased ? (
              <span className="tag" style={{ fontSize: "0.95rem", padding: "8px 16px" }}>Курс куплен ✓ — доступ открыт</span>
            ) : (
              <AddToCart
                item={{ kind: "course", slug: c.slug, title: c.title, price: c.price, image: c.image }}
                variant="button"
                label="Купить курс"
              />
            )}
          </div>
        </div>

        <h2 style={{ fontSize: "1.6rem", marginBottom: 4 }}>Уроки</h2>
        <p className="muted" style={{ fontSize: "0.9rem" }}>
          Бесплатные уроки доступны после регистрации, остальные — после покупки курса.
        </p>

        {freeLessons.length > 0 && (
          <>
            <h3 className="lessons__group">Бесплатные уроки ({freeLessons.length})</h3>
            <ul className="lessons">{freeLessons.map(renderLesson)}</ul>
          </>
        )}
        {paidLessons.length > 0 && (
          <>
            <h3 className="lessons__group">Платные уроки</h3>
            <ul className="lessons">{paidLessons.map(renderLesson)}</ul>
          </>
        )}
      </div>
    </main>
  );
}
