// Статусы доставки заказа. Используются и в админке (смена), и в кабинете (показ).
export const DELIVERY_STATUSES = [
  { code: "processing", label: "В обработке", color: "#b07a2e" },
  { code: "assembling", label: "Собирается", color: "#6c4d7a" },
  { code: "shipped", label: "Передан в доставку", color: "#2f6db0" },
  { code: "delivered", label: "Доставлен", color: "#2e7d4f" },
  { code: "canceled", label: "Отменён", color: "#b0492f" },
] as const;

export function deliveryStatusInfo(code: string) {
  return DELIVERY_STATUSES.find((s) => s.code === code) ?? DELIVERY_STATUSES[0];
}
