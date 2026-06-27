"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Cert = { src: string; alt: string };

export default function Certificates({ certs }: { certs: Cert[] }) {
  const [active, setActive] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showAll, setShowAll] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setActive(null); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [active]);

  if (!certs.length) return null;

  // Размножаем список, чтобы лента всегда заполняла экран и крутилась бесшовно.
  const loop = Array.from({ length: 6 }, () => certs).flat();

  return (
    <div className="certs">
      <div className="container certs__head">
        <h3 className="certs__title">Дипломы и сертификаты</h3>
      </div>

      {/* Десктоп: бегущая лента */}
      <div className="certs__viewport">
        <div className="certs__track">
          {loop.map((c, i) => (
            <button key={i} type="button" className="cert" onClick={() => setActive(c.src)} aria-label={`Открыть: ${c.alt}`}>
              <img src={c.src} alt={c.alt} />
            </button>
          ))}
        </div>
      </div>

      {/* Телефон: статичная сетка — видно 3, остальные по кнопке */}
      <div className="certs__mobile">
        <div className="certs__mgrid">
          {certs.map((c, i) => (
            <button
              key={i}
              type="button"
              className={"cert" + (!showAll && i >= 3 ? " is-hidden" : "")}
              onClick={() => setActive(c.src)}
              aria-label={`Открыть: ${c.alt}`}
            >
              <img src={c.src} alt={c.alt} />
            </button>
          ))}
        </div>
        {!showAll && certs.length > 3 && (
          <button type="button" className="certs__more" onClick={() => setShowAll(true)}>
            Посмотреть все сертификаты
          </button>
        )}
      </div>

      {active && mounted && createPortal(
        <div className="lb-overlay" onClick={() => setActive(null)} role="dialog" aria-modal="true">
          <button className="lb-close" onClick={() => setActive(null)} aria-label="Закрыть">×</button>
          <img className="lb-img" src={active} alt="Сертификат" onClick={(e) => e.stopPropagation()} />
        </div>,
        document.body,
      )}
    </div>
  );
}
