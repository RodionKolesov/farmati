"use client";

import { useEffect } from "react";

// Лёгкое смещение фона hero за курсором. Ничего не рендерит — только вешает
// слушатель на секцию .hero и двигает фон через CSS-переменные.
export default function HeroParallax() {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>(".hero");
    if (!hero) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const MAX = 14; // максимальное смещение в пикселях
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      const r = hero.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        hero.style.setProperty("--hero-px", `${(-dx * MAX).toFixed(1)}px`);
        hero.style.setProperty("--hero-py", `${(-dy * MAX).toFixed(1)}px`);
      });
    };
    const onLeave = () => {
      hero.style.setProperty("--hero-px", "0px");
      hero.style.setProperty("--hero-py", "0px");
    };

    hero.addEventListener("mousemove", onMove);
    hero.addEventListener("mouseleave", onLeave);
    return () => {
      hero.removeEventListener("mousemove", onMove);
      hero.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
