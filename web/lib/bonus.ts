// Параметры бонусной программы.
export const WELCOME_BONUS = 100; // приветственные бонусы при регистрации
export const EARN_RATE = 0.05;    // 5% бонусами за оплаченный заказ

export function earnedFor(amount: number): number {
  return Math.floor(Math.max(0, amount) * EARN_RATE);
}
