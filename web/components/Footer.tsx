import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <Link href="/" className="logo logo--light">
            FARMATI<span>.cosmetics</span>
          </Link>
          <p className="muted" style={{ marginTop: 10, maxWidth: 250, color: "#b3a3bb" }}>
            Женский клуб «Формула красоты». Уходовая косметика с душой и курсы по уходу за собой.
          </p>
        </div>
        <div>
          <h4>Каталог</h4>
          <Link href="/catalog">Сыворотки</Link>
          <Link href="/catalog">Кремы</Link>
          <Link href="/catalog">Тоники</Link>
          <Link href="/courses">Курсы</Link>
        </div>
        <div>
          <h4>Компания</h4>
          <Link href="/#about">О бренде</Link>
          <Link href="/#bonus">Бонусы</Link>
          <Link href="/account">Личный кабинет</Link>
        </div>
        <div>
          <h4>Контакты</h4>
          <a href="tel:+78000000000">8 800 000-00-00</a>
          <a href="mailto:hello@farmati.ru">hello@farmati.ru</a>
        </div>
      </div>
      <div className="container footer__bottom">
        <span>© 2026 FARMATI.cosmetics. Все права защищены.</span>
        <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/privacy">Политика конфиденциальности</Link>
          <Link className="btn btn--light btn--sm" href="/offer">Публичная оферта</Link>
        </span>
      </div>
    </footer>
  );
}
