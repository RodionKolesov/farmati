"use client";

import { useEffect, useState } from "react";
import VideoEmbed from "./VideoEmbed";

type Item = { id: string; title: string; description: string; videoUrl: string; fileUrl: string; image: string };

export default function ChecklistsCarousel({ items }: { items: Item[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = items.length;

  // Автолистание раз в 5 сек, пауза при наведении.
  useEffect(() => {
    if (paused || n <= 1) return;
    const t = setInterval(() => setActive((a) => (a + 1) % n), 5000);
    return () => clearInterval(t);
  }, [paused, n]);

  if (!n) return null;
  const prev = () => setActive((a) => (a - 1 + n) % n);
  const next = () => setActive((a) => (a + 1) % n);

  return (
    <div className="chk-carousel" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="chk-viewport">
        <div className="chk-track" style={{ transform: `translateX(-${active * 100}%)` }}>
          {items.map((c) => {
            const hasMedia = !!c.videoUrl || !!c.image;
            return (
              <div className="chk-slide" key={c.id}>
                <div className={"chk-card" + (hasMedia ? "" : " chk-card--text")}>
                  {hasMedia && (
                    <div className="chk-media">
                      {c.videoUrl ? (
                        <VideoEmbed url={c.videoUrl} title={c.title} />
                      ) : (
                        <div className="chk-img" style={{ backgroundImage: `url('${c.image}')` }} />
                      )}
                    </div>
                  )}
                  <div className="chk-body">
                    <h3>{c.title}</h3>
                    {c.description && <div className="chk-text">{c.description}</div>}
                    {c.fileUrl && (
                      <a className="link" href={c.fileUrl} target="_blank" rel="noopener noreferrer" style={{ marginTop: 6 }}>
                        📄 Скачать PDF
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {n > 1 && (
        <>
          <button className="chk-nav chk-nav--prev" onClick={prev} aria-label="Предыдущий">‹</button>
          <button className="chk-nav chk-nav--next" onClick={next} aria-label="Следующий">›</button>
          <div className="chk-dots">
            {items.map((_, i) => (
              <button key={i} className={i === active ? "is-active" : ""} onClick={() => setActive(i)} aria-label={`Пост ${i + 1}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
