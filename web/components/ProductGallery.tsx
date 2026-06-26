"use client";

import { useState } from "react";

export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return <div className="gallery__main gallery__main--empty">Фото скоро</div>;
  }

  const idx = Math.min(active, images.length - 1);
  const many = images.length > 1;
  const prev = () => setActive((a) => (a - 1 + images.length) % images.length);
  const next = () => setActive((a) => (a + 1) % images.length);

  return (
    <div className="gallery">
      <div className="gallery__stage">
        <img className="gallery__main" src={images[idx]} alt={name} />
        {many && (
          <>
            <button type="button" className="gallery__nav gallery__nav--prev" onClick={prev} aria-label="Предыдущее фото">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button type="button" className="gallery__nav gallery__nav--next" onClick={next} aria-label="Следующее фото">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
            </button>
            <span className="gallery__counter">{idx + 1} / {images.length}</span>
          </>
        )}
      </div>
      {many && (
        <div className="gallery__thumbs">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              className={"gallery__thumb" + (i === idx ? " is-active" : "")}
              style={{ backgroundImage: `url('${src}')` }}
              onClick={() => setActive(i)}
              aria-label={`Фото ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
