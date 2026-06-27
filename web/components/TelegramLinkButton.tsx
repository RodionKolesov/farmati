"use client";

import { useEffect, useRef } from "react";

// Официальная кнопка «Войти через Telegram» (на сайте, без открытия бота).
// После подтверждения Telegram перенаправляет на /api/telegram/link, где
// проверяется подписка на канал и начисляются бонусы.
export default function TelegramLinkButton() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || el.querySelector("script")) return;
    const s = document.createElement("script");
    s.src = "https://telegram.org/js/telegram-widget.js?22";
    s.async = true;
    s.setAttribute("data-telegram-login", "farmati_bot");
    s.setAttribute("data-size", "large");
    s.setAttribute("data-radius", "12");
    s.setAttribute("data-auth-url", `${window.location.origin}/api/telegram/link`);
    s.setAttribute("data-request-access", "write");
    el.appendChild(s);
  }, []);
  return <div ref={ref} />;
}
