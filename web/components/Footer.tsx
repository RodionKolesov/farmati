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
