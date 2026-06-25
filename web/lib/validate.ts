// Общие проверки email и телефона — используются и на сервере, и на клиенте.
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(s: string): boolean {
  return EMAIL_RE.test((s ?? "").trim());
}

// Телефон считаем корректным, если в нём 10–15 цифр (РФ — обычно 11).
export function isValidPhone(s: string): boolean {
  const digits = (s ?? "").replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}
