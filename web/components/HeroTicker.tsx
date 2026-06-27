// Бегущая строка: текст непрерывно движется справа налево (чистый CSS-marquee).

function TgIcon() {
  return (
    <svg className="ticker__tg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
    </svg>
  );
}

const ITEMS: { text: string; tg?: boolean }[] = [
  { text: "🎁 100 бонусов за регистрацию" },
  { text: "100 бонусов за подписку на Telegram-канал", tg: true },
  { text: "🚚 Бесплатная доставка от 3 500 ₽" },
  { text: "💸 Кэшбэк бонусами 5% с каждой покупки" },
  { text: "💆 Бесплатная консультация косметолога" },
  { text: "💳 Бонусами оплачивайте до 100% заказа" },
];

// Повторяем набор, чтобы строка заполняла всю ширину экрана без пустых разрывов.
const REPS = Array.from({ length: 4 }).flatMap(() => ITEMS);

function Sequence({ hidden = false }: { hidden?: boolean }) {
  return (
    <span className="ticker__seq" aria-hidden={hidden || undefined}>
      {REPS.map((item, i) => (
        <span key={i} className="ticker__item">
          {item.tg && <TgIcon />}
          {item.text}
        </span>
      ))}
    </span>
  );
}

export default function HeroTicker() {
  return (
    <div className="ticker" aria-label="Преимущества клуба">
      <div className="ticker__track">
        <Sequence />
        <Sequence hidden />
      </div>
    </div>
  );
}
