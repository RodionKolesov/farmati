"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const CERTS = [
  { src: "/certs/cert1.jpg", alt: "Facialist Level 1 — Natural Biolifting, Milano" },
  { src: "/certs/cert2.jpg", alt: "Facialist Level 1 — Natural Biolifting" },
  { src: "/certs/cert3.jpg", alt: "Beauty Trainer Level 1 — Natural Biolifting" },
  { src: "/certs/cert4.jpg", alt: "Beauty Trainer Level 1 — Natural Biolifting, Milano" },
  { src: "/certs/cert5.jpg", alt: "Удостоверение — нутрициология и диетотерапия" },
];

export default function Certificates() {
  const [active, setActive] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setActive(null); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [active]);

  // Размножаем список, чтобы лента всегда заполняла экран (без пустоты справа)
  // и крутилась бесшовно. 6 копий → даже на широких мониторах нет пробелов.
  const loop = Array.from({ length: 6 }, () => CERTS).flat();

  return (
    <div className="certs">
      <div className="container certs__head">
        <h3 className="certs__title">Дипломы и сертификаты</h3>
      </div>
      <div className="certs__viewport">
        <div className="certs__track">
          {loop.map((c, i) => (
            <button
              key={i}
              type="button"
              className="cert"
              onClick={() => setActive(c.src)}
              aria-label={`Открыть: ${c.alt}`}
            >
              <img src={c.src} alt={c.alt} loading="lazy" />
            </button>
          ))}
        </div>
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
