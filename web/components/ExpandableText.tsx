"use client";

import { useEffect, useRef, useState } from "react";

// Сворачивает текст до N строк с кнопкой «Читать далее…».
// Кнопка показывается только если текст реально не помещается (мерим по факту, с учётом ширины экрана).
export default function ExpandableText({
  text,
  lines = 3,
  className = "",
}: {
  text: string;
  lines?: number;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const measure = () => {
      const el = ref.current;
      if (!el || expanded) return;
      setClamped(el.scrollHeight > el.clientHeight + 1);
    };
    measure();
    // Пере-замер после загрузки веб-шрифтов и с задержками: иначе на телефоне
    // высота считается по запасному шрифту и кнопка «Читать далее» может не появиться.
    const raf = requestAnimationFrame(measure);
    const t1 = setTimeout(measure, 300);
    const t2 = setTimeout(measure, 1200);
    try { (document as any).fonts?.ready?.then(measure); } catch { /* нет fonts API */ }
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", measure);
    };
  }, [text, lines, expanded]);

  return (
    <div className="expand">
      <p
        ref={ref}
        className={`expand__text${expanded ? " expand__text--open" : ""}${className ? " " + className : ""}`}
        style={!expanded ? ({ WebkitLineClamp: lines } as React.CSSProperties) : undefined}
      >
        {text}
      </p>
      {(clamped || expanded) && (
        <button type="button" className="expand__btn" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Свернуть" : "Читать далее…"}
        </button>
      )}
    </div>
  );
}
