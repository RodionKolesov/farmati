import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <Link href="/" className="logo logo--light">
            farmati.<span>cosmetics</span>
          </Link>
          <p className="muted" style={{ marginTop: 14, color: "#b3a3bb", whiteSpace: "nowrap" }}>
            Женский клуб «Формула красоты».
          </p>
          <a className="footer__tg-btn" href="https://t.me/BeautEnergyBusiness" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="18" height="18">
              <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
            </svg>
            Наш Telegram-канал
          </a>
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
          <a href="tel:+79029275208">+7 902 927-52-08</a>
          <a href="mailto:Playpoy@list.ru">Playpoy@list.ru</a>
          <a href="https://t.me/BeautEnergyBusiness" target="_blank" rel="noopener noreferrer" style={{ color: "#62b8e6" }}>Telegram-канал</a>
        </div>
      </div>
      <div className="container footer__bottom">
        <span>© 2026 FARMATI.cosmetics. Все права защищены.</span>
        <span style={{ display: "flex", gap: 10 }}>
          <Link href="/privacy">Политика конфиденциальности</Link>
          <Link href="/offer">Публичная оферта</Link>
        </span>
      </div>
    </footer>
  );
}
