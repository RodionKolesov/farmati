// Возвращает список фото товара. Поддерживает старое поле image (одно фото)
// и новое images (JSON-массив путей). image всегда идёт первым.
export function productImages(p: { image?: string | null; images?: string | null }): string[] {
  const out: string[] = [];
  if (p.images) {
    try {
      const arr = JSON.parse(p.images);
      if (Array.isArray(arr)) {
        for (const s of arr) if (typeof s === "string" && s.trim()) out.push(s.trim());
      }
    } catch {
      // невалидный JSON — игнорируем
    }
  }
  const main = (p.image ?? "").trim();
  if (main && !out.includes(main)) out.unshift(main);
  return out;
}
