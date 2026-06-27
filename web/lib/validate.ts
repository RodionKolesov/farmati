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

// Разрешённые почтовые домены (строго). Всё остальное — не проходит.
const ALLOWED_EMAIL_DOMAINS = new Set([
  "yandex.ru", "ya.ru",
  "mail.ru", "bk.ru", "inbox.ru", "list.ru", "internet.ru",
  "vk.com",
  "rambler.ru", "lenta.ru", "autorambler.ru", "myrambler.ru", "ro.ru",
]);

// Российская почта: домен строго из списка ALLOWED_EMAIL_DOMAINS.
// Иностранные (gmail.com, outlook.com, icloud.com, proton.me и т.п.) — не проходят.
export function isRussianEmail(s: string): boolean {
  const email = (s ?? "").trim().toLowerCase();
  if (!isValidEmail(email)) return false;
  const domain = email.split("@")[1] ?? "";
  return ALLOWED_EMAIL_DOMAINS.has(domain);
}
