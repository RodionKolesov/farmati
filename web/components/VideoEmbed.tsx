"use client";

import { useEffect, useRef } from "react";
import { toEmbedUrl } from "@/lib/video";

// Встраивание видео с базовой защитой:
// • ссылку плеера подставляем уже в браузере (её нет в исходном коде страницы);
// • запрет правой кнопки на области плеера;
// • для YouTube — без «похожих» видео и логотипа.
// Полностью защитить онлайн-видео нельзя (запись экрана), но «на бытовом уровне» — усложняет.
export default function VideoEmbed({ url, title }: { url: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const src = toEmbedUrl(url);
    if (ref.current && src) ref.current.src = src;
  }, [url]);

  return (
    <div className="video" onContextMenu={(e) => e.preventDefault()}>
      <iframe
        ref={ref}
        title={title}
        allowFullScreen
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
