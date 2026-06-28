// Превращает обычную ссылку на видео в embed-ссылку для iframe.
// Поддержка: RuTube, YouTube (watch / youtu.be / shorts). Остальное — как есть.
export function toEmbedUrl(raw: string): string {
  const url = (raw || "").trim();
  if (!url) return url;

  // RuTube: https://rutube.ru/video/<id>/ -> embed
  const rt = url.match(/rutube\.ru\/video\/([0-9a-zA-Z]+)/);
  if (rt) return `https://rutube.ru/play/embed/${rt[1]}`;
  if (/rutube\.ru\/play\/embed\//.test(url)) return url;

  // YouTube: watch / youtu.be / shorts -> embed
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;

  // Уже embed или другой сервис (VK, Kinescope и т.п.) — оставляем как есть.
  return url;
}
