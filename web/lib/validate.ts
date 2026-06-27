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

// Известные российские почтовые сервисы (в т.ч. на .com).
const RU_EMAIL_DOMAINS = new Set([
  "mail.ru", "bk.ru", "list.ru", "inbox.ru", "internet.ru",
  "yandex.ru", "ya.ru", "yandex.com", "yandex.by", "yandex.kz",
  "rambler.ru", "lenta.ru", "autorambler.ru", "myrambler.ru", "ro.ru",
  "vk.com",
]);

// Российская почта: известный сервис ИЛИ домен в зоне .ru / .su / .рф.
// Иностранные (gmail.com, outlook.com, icloud.com и т.п.) — не проходят.
export function isRussianEmail(s: string): boolean {
  const email = (s ?? "").trim().toLowerCase();
  if (!isValidEmail(email)) return false;
  const domain = email.split("@")[1] ?? "";
  if (RU_EMAIL_DOMAINS.has(domain)) return true;
  return /\.(ru|su)$/.test(domain) || /\.(рф|xn--p1ai)$/.test(domain);
}
