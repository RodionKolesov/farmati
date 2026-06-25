"use client";

import { useEffect } from "react";

// При клике на ссылку, ведущую к #consult, плавно центрируем блок формы по экрану
// (а не прокручиваем к самому низу страницы).
export default function SmoothConsult() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest?.('a[href$="#consult"]') as HTMLAnchorElement | null;
      if (!a) return;
      const el = document.getElementById("consult");
      if (!el) return; // секции нет на этой странице — обычная навигация
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      history.replaceState(null, "", "#consult");
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  return null;
}
