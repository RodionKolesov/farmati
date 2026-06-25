"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import HeroTicker from "@/components/HeroTicker";

export default function Header() {
  const count = useCart((s) => s.count());
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    setMounted(true);
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setIsAdmin(!!d.admin))
      .catch(() => {});
  }, []);

  return (
    <div className="topbar">
      <header className="header">
        <div className="container header__inner">
          <Link href="/" className="logo">
            farmati.<span>cosmetics</span>
          </Link>
          <nav className="nav">
            <Link href="/#catalog">Каталог</Link>
            <Link href="/#courses">Курсы</Link>
            <Link href="/club">Клуб</Link>
            <Link href="/#about">О бренде</Link>
            <Link href="/#consult">Консультация</Link>
          </nav>
          <div className="header__actions">
            {isAdmin ? (
              <Link className="icon-btn" href="/admin">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span>Управление</span>
              </Link>
            ) : (
              <>
                <Link className="icon-btn" href="/account">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-3.6 3.6-6 8-6s8 2.4 8 6" />
                  </svg>
                  <span>Кабинет</span>
                </Link>
                <Link className="icon-btn" href="/cart">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M6 8h12l-1 11.5a1 1 0 0 1-1 .9H8a1 1 0 0 1-1-.9L6 8z" />
                    <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
                  </svg>
                  <span>Корзина</span>
                  {mounted && count > 0 && <span className="badge">{count}</span>}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <HeroTicker />
    </div>
  );
}
