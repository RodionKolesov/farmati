"use client";

import { useEffect, useState } from "react";
import VideoEmbed from "./VideoEmbed";

type Item = { id: string; title: string; description: string; videoUrl: string; fileUrl: string; image: string };

const kindOf = (it: Item) =>
  it.videoUrl ? { ico: "🎬", label: "Видео" } : it.image ? { ico: "🖼", label: "Обзор" } : { ico: "📝", label: "Статья" };

export default function ChecklistsCarousel({ items }: { items: Item[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = items.length;

  // Автосмена активного материала раз в 6 сек, пауза при наведении.
  useEffect(() => {
    if (paused || n <= 1) return;
    const t = setInterval(() => setActive((a) => (a + 1) % n), 6000);
    return () => clearInterval(t);
  }, [paused, n]);

  if (!n) return null;
  const c = items[active];
  const k = kindOf(c);

  return (
    <div className="chk" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {/* Крупный активный материал */}
      <article className="chk-feature" key={c.id}>
        <div className="chk-feature__media">
          {c.videoUrl ? (
            <VideoEmbed url={c.videoUrl} title={c.title} />
          ) : c.image ? (
            <img className="chk-banner" src={c.image} alt={c.title} />
          ) : (
            <div className="chk-feature__ph">{k.ico}</div>
          )}
        </div>
        <div className="chk-feature__body">
          <span className="chk-tag">{k.ico} {k.label}</span>
          <h3 className="chk-feature__title">{c.title}</h3>
          {c.description && <p className="chk-feature__text">{c.description}</p>}
          {c.fileUrl && (
            <a className="btn btn--ghost btn--sm" href={c.fileUrl} target="_blank" rel="noopener noreferrer">
              ⬇ Скачать материал
            </a>
          )}
        </div>
      </article>

      {/* Список всех материалов */}
      <aside className="chk-side">
        <div className="chk-side__head">
          <span>Все материалы</span>
          <b>{n}</b>
        </div>
        <div className="chk-side__list">
          {items.map((it, i) => {
            const ik = kindOf(it);
            return (
              <button
                key={it.id}
                className={`chk-item${i === active ? " is-active" : ""}`}
                onClick={() => setActive(i)}
                aria-label={it.title}
              >
                <span className="chk-item__ico">{ik.ico}</span>
                <span className="chk-item__main">
                  <span className="chk-item__title">{it.title}</span>
                  <span className="chk-item__kind">{ik.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
