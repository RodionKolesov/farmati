// Бегущая строка: текст непрерывно движется справа налево (чистый CSS-marquee).
const ITEMS = [
  "Бесплатная доставка от 3 500 ₽",
  "Кэшбэк бонусами 5% с каждой покупки",
  "Натуральные формулы без парабенов и сульфатов",
];

// Повторяем набор, чтобы строка заполняла всю ширину экрана без пустых разрывов.
const REPS = Array.from({ length: 4 }).flatMap(() => ITEMS);

function Sequence({ hidden = false }: { hidden?: boolean }) {
  return (
    <span className="ticker__seq" aria-hidden={hidden || undefined}>
      {REPS.map((text, i) => (
        <span key={i} className="ticker__item">
          {text}
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
