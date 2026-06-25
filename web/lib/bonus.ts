// Параметры бонусной программы. Чистый модуль без зависимостей от prisma —
// можно импортировать и на клиенте (например, превью начисления в чекауте).
export const WELCOME_BONUS = 100; // приветственные бонусы при регистрации

// Ставка кэшбэка — настраивается через env (NEXT_PUBLIC_, чтобы совпадала на сервере и клиенте).
// Поставьте NEXT_PUBLIC_BONUS_EARN_RATE=0.07 для 7%. По умолчанию 5%.
export const EARN_RATE = Number(process.env.NEXT_PUBLIC_BONUS_EARN_RATE ?? 0.05);

// Срок жизни бонусов — 4 месяца с момента начисления.
export const BONUS_TTL_MONTHS = 4;

export function earnedFor(amount: number): number {
  return Math.floor(Math.max(0, amount) * EARN_RATE);
}

// Дата сгорания партии бонусов, начисленной в момент `from`.
export function bonusExpiryFrom(from: Date): Date {
  const d = new Date(from);
  d.setMonth(d.getMonth() + BONUS_TTL_MONTHS);
  return d;
}
