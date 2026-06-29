"use client";

import { toEmbedUrl } from "@/lib/video";

// Плеер встраивается напрямую (src в HTML) — видео начинает грузиться сразу,
// не дожидаясь JS/гидрации (на телефонах раньше из-за этого был чёрный прямоугольник).
// loading="lazy": на странице с несколькими уроками off-screen видео грузятся по мере прокрутки
// (экономит мобильный трафик), а видимое — сразу.
export default function VideoEmbed({ url, title }: { url: string; title: string }) {
  const src = toEmbedUrl(url);
  return (
    <div className="video" onContextMenu={(e) => e.preventDefault()}>
      <iframe
        src={src}
        title={title}
        loading="lazy"
        allowFullScreen
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
