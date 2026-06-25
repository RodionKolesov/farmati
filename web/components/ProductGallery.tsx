"use client";

import { useState } from "react";

export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return <div className="gallery__main gallery__main--empty">Фото скоро</div>;
  }

  const idx = Math.min(active, images.length - 1);
  return (
    <div className="gallery">
      <img className="gallery__main" src={images[idx]} alt={name} />
      {images.length > 1 && (
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
