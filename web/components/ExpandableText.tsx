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
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
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
