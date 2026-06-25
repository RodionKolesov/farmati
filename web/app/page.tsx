import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import CourseCard from "@/components/CourseCard";
import ConsultForm from "@/components/ConsultForm";
import HeroParallax from "@/components/HeroParallax";

export default async function Home() {
  const [products, courses, reviews] = await Promise.all([
    prisma.product.findMany({ where: { stock: { gt: 0 } }, take: 8 }),
    prisma.course.findMany({ take: 3 }),
    prisma.review.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }], take: 9 }),
  ]);

  return (
    <main>
      {/* Hero */}
      <section className="hero">
        <HeroParallax />
        <div className="hero__inner">
          <div className="hero__brandbox">
            <span className="hero__club">Женский клуб</span>
            <span className="hero__rule" aria-hidden="true"></span>
            <span className="hero__brand">FARMATI.</span>
            <span className="hero__rule" aria-hidden="true"></span>
            <span className="hero__club">Формула красоты</span>
          </div>
          <div className="hero__cta">
            <Link className="btn btn--primary" href="/login">Вступить в клуб</Link>
            <Link className="btn btn--ghost" href="/catalog">Подобрать уход</Link>
            <Link className="btn btn--ghost hero__cta-wide" href="#consult">Консультация косметолога</Link>
          </div>
        </div>
        <p className="hero__tagline">Красота начинается не с идеальной кожи, а с заботы о себе.</p>
      </section>

      {/* О бренде / Татьяна */}
      <section className="section" id="about">
        <div className="container about__inner">
          <div className="about__media">
            <img src="/founder-tatiana.jpg" alt="Татьяна — основатель FARMATI.cosmetic" />
          </div>
          <div className="about__text">
            <span className="eyebrow">FARMATI.cosmetic — косметика с душой</span>
            <h2>Меня зовут Татьяна</h2>
            <p>Я косметолог, фейс-тренер и бьюти-эксперт. FARMATI.cosmetic родилась из желания создать честный, заботливый уход — без перегруза, агрессии и пустых обещаний.</p>
            <p>FARMATI — не просто косметика. Это тепло, которое хочется дарить подруге, маме, себе. Открывая баночку, ты получаешь больше, чем уход — ты чувствуешь заботу.</p>
            <ul className="ticks">
              <li>🌿 Органические, безопасные формулы</li>
              <li>🌿 Мягкое, но эффективное действие</li>
              <li>🌿 Поддержка естественной красоты</li>
            </ul>
            <p className="quote">Ты важна. Ты красива. Ты заслуживаешь лучшего.</p>
          </div>
        </div>
      </section>

      {/* Каталог */}
      <section className="section section--soft" id="catalog">
        <div className="container">
          <div className="section__head section__head--row">
            <div>
              <span className="eyebrow">Каталог</span>
              <h2>Подобрать уход</h2>
            </div>
            <Link className="section__link" href="/catalog">Весь каталог →</Link>
          </div>
          <div className="products">
            {products.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
          <Link className="btn btn--ghost section__more" href="/catalog">Весь каталог</Link>
        </div>
      </section>

      {/* Курсы */}
      <section className="section" id="courses">
        <div className="container">
          <div className="section__head section__head--row">
            <div>
              <span className="eyebrow">Клуб</span>
              <h2>Курсы по уходу и массажу лица</h2>
            </div>
            <Link className="section__link" href="/courses">Все курсы →</Link>
          </div>
          <div className="course-grid">
            {courses.map((c) => <CourseCard key={c.id} c={c} />)}
          </div>
          <Link className="btn btn--ghost section__more" href="/courses">Все курсы</Link>
        </div>
      </section>

      {/* Бонусы */}
      <section className="section bonus" id="bonus">
        <div className="container bonus__inner">
          <div className="bonus__text">
            <span className="eyebrow eyebrow--light">Программа лояльности</span>
            <h2>Кэшбэк с каждой покупки</h2>
            <p>Регистрируйтесь в клубе, копите бонусы за заказы и курсы и тратьте их скидкой прямо в корзине. <span style={{ whiteSpace: "nowrap" }}>1 бонус = 1 ₽.</span></p>
            <Link className="btn btn--light" href="/account">Войти в клуб</Link>
          </div>
          <div className="bonus__cards">
            <div className="tier">
              <span className="tier__num">01</span>
              <strong className="tier__value">5%</strong>
              <span className="tier__label">Старт</span>
              <small>бонусами всем при регистрации</small>
            </div>
            <div className="tier">
              <span className="tier__num">02</span>
              <strong className="tier__value">+ бонусы</strong>
              <span className="tier__label">Курсы</span>
              <small>за каждый купленный курс</small>
            </div>
            <div className="tier">
              <span className="tier__num">03</span>
              <strong className="tier__value">до 100%</strong>
              <span className="tier__label">Скидка</span>
              <small>оплата бонусами в корзине</small>
            </div>
          </div>
        </div>
      </section>

      {/* Отзывы */}
      <section className="section section--soft">
        <div className="container">
          <div className="section__head"><span className="eyebrow">Результаты</span><h2>Отзывы участниц</h2></div>
          <div className="reviews">
            {reviews.map((r) => (
              <figure className="review" key={r.id}>
                {(r.beforeImage || r.afterImage) && (
                  <div className="review__ba">
                    <div className="review__ba-item">
                      {r.beforeImage ? <img src={r.beforeImage} alt="До" /> : <div className="review__ba-empty" />}
                      <span>До</span>
                    </div>
                    <div className="review__ba-item">
                      {r.afterImage ? <img src={r.afterImage} alt="После" /> : <div className="review__ba-empty" />}
                      <span>После</span>
                    </div>
                  </div>
                )}
                <div className="stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                {r.text && <blockquote>«{r.text}»</blockquote>}
                <figcaption>— {r.author}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Консультация */}
      <section className="section" id="consult">
        <div className="container">
          <div className="section__head"><span className="eyebrow">Бесплатно</span><h2>Записаться на консультацию</h2><p className="section__sub">Оставьте контакты — косметолог свяжется с вами и поможет подобрать уход.</p></div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ConsultForm />
          </div>
        </div>
      </section>
    </main>
  );
}
