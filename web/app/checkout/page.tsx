"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/money";
import { earnedFor, EARN_RATE } from "@/lib/bonus";
import { isValidEmail, isValidPhone } from "@/lib/validate";
import { createOrder } from "@/lib/actions/order";

const FREE_FROM = 3500;
const FLAT = 350;

export default function CheckoutPage() {
  const { items, subtotal } = useCart();
  const [mounted, setMounted] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [balance, setBalance] = useState(0);
  const [spend, setSpend] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // данные покупателя / доставка
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [method, setMethod] = useState<"courier" | "pickup" | "cdek" | "post">("courier");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    setMounted(true);
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        setAuthed(d.authed);
        setBalance(d.balance ?? 0);
        if (d.name) setName(d.name);
        if (d.phone) setPhone(d.phone);
        if (d.email) setEmail(d.email);
      })
      .catch(() => setAuthed(false));
  }, []);

  if (!mounted) return <main className="page"><div className="container">Загрузка…</div></main>;

  const sub = subtotal();
  const hasPhysical = items.some((i) => i.kind === "product");
  const maxSpend = Math.min(balance, sub);
  const spendClamped = Math.max(0, Math.min(spend, maxSpend));
  const delivery = hasPhysical && method === "courier" ? (sub >= FREE_FROM ? 0 : FLAT) : 0;
  const total = sub - spendClamped + delivery;
  const deliveryLabel =
    method === "cdek" || method === "post"
      ? "рассчитается после оформления"
      : delivery === 0
        ? "бесплатно"
        : money(delivery);

  async function pay() {
    if (!name.trim()) { setError("Укажите имя"); return; }
    if (!isValidPhone(phone)) { setError("Укажите корректный номер телефона"); return; }
    if (!isValidEmail(email)) { setError("Укажите корректный email"); return; }
    setBusy(true);
    setError(null);
    const payload = items.map((i) => ({ kind: i.kind, slug: i.slug, qty: i.qty }));
    const res = await createOrder(payload, spendClamped, {
      name,
      phone,
      email,
      method: hasPhysical ? method : "pickup",
      address,
      comment,
    });
    if (res.ok) {
      window.location.href = res.url;
    } else {
      setBusy(false);
      setError(res.error);
    }
  }

  if (items.length === 0) {
    return (
      <main className="page">
        <div className="container">
          <h1>Оформление</h1>
          <div className="card"><p className="empty-note">Корзина пуста.</p><Link className="btn btn--primary" href="/catalog">В каталог</Link></div>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container">
        <h1>Оформление заказа</h1>
        <div className="grid2">
          <div>
            <div className="card">
              <h2 style={{ marginBottom: 14 }}>Ваш заказ</h2>
              <ul className="list">
                {items.map((i) => (
                  <li key={i.id} className="row">
                    {i.image ? <img src={i.image} alt={i.title} /> : <div style={{ width: 56, height: 56, borderRadius: 10, background: "#f4e6eb" }} />}
                    <div>
                      <div style={{ fontWeight: 600 }}>{i.title}</div>
                      <div className="muted" style={{ fontSize: ".85rem" }}>{i.qty} × {money(i.price)}</div>
                    </div>
                    <div style={{ fontWeight: 700 }}>{money(i.price * i.qty)}</div>
                  </li>
                ))}
              </ul>
            </div>

            {authed !== false && (
              <div className="card">
                <h2 style={{ marginBottom: 14 }}>Получатель и доставка</h2>
                <div className="form-grid">
                  <div><label>Имя</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ваше имя" autoComplete="name" /></div>
                  <div><label>Телефон</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 999 000-00-00" autoComplete="tel" /></div>
                  <div className="full"><label>Email (для чека и связи)</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@mail.ru" autoComplete="email" required /></div>
                </div>
                {hasPhysical && (
                  <>
                    <div style={{ margin: "12px 0 6px", display: "grid", gap: 8 }}>
                      <label style={{ margin: 0, display: "flex", gap: 8, alignItems: "center" }}>
                        <input type="radio" name="m" style={{ width: "auto" }} checked={method === "courier"} onChange={() => setMethod("courier")} />
                        Курьером по городу
                      </label>
                      <label style={{ margin: 0, display: "flex", gap: 8, alignItems: "center" }}>
                        <input type="radio" name="m" style={{ width: "auto" }} checked={method === "cdek"} onChange={() => setMethod("cdek")} />
                        СДЭК до пункта выдачи
                      </label>
                      <label style={{ margin: 0, display: "flex", gap: 8, alignItems: "center" }}>
                        <input type="radio" name="m" style={{ width: "auto" }} checked={method === "post"} onChange={() => setMethod("post")} />
                        Почта России
                      </label>
                      <label style={{ margin: 0, display: "flex", gap: 8, alignItems: "center" }}>
                        <input type="radio" name="m" style={{ width: "auto" }} checked={method === "pickup"} onChange={() => setMethod("pickup")} />
                        Самовывоз (бесплатно)
                      </label>
                    </div>
                    {method !== "pickup" && (
                      <div>
                        <label>{method === "courier" ? "Адрес доставки" : "Город, адрес или пункт выдачи"}</label>
                        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={method === "courier" ? "Город, улица, дом, квартира" : "Например: Москва, СДЭК на ул. Ленина, 5"} />
                      </div>
                    )}
                    {(method === "cdek" || method === "post") && (
                      <p className="muted" style={{ fontSize: ".8rem", marginTop: 6 }}>
                        Стоимость доставки рассчитаем после оформления и сообщим вам.
                      </p>
                    )}
                  </>
                )}
                <div><label>Комментарий (необязательно)</label><textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} /></div>
              </div>
            )}
          </div>

          <div className="card">
            {authed === false ? (
              <>
                <p className="empty-note">Войдите, чтобы оформить заказ и копить бонусы.</p>
                <Link className="btn btn--primary btn--block" href="/login">Войти / регистрация</Link>
              </>
            ) : (
              <>
                <div className="line"><span>Товары</span><span>{money(sub)}</span></div>
                {balance > 0 && (
                  <div style={{ margin: "12px 0" }}>
                    <label>Списать бонусы (доступно {balance})</label>
                    <input type="number" min={0} max={maxSpend} value={spend === 0 ? "" : spend} onChange={(e) => setSpend(Number(e.target.value))} placeholder="0" />
                  </div>
                )}
                {spendClamped > 0 && (
                  <div className="line"><span>Бонусами</span><span className="minus">−{money(spendClamped)}</span></div>
                )}
                {hasPhysical && (
                  <div className="line"><span>Доставка</span><span>{deliveryLabel}</span></div>
                )}
                <div className="line total"><span>К оплате</span><span>{money(total)}</span></div>
                <button className="btn btn--primary btn--block" style={{ marginTop: 16 }} onClick={pay} disabled={busy}>
                  {busy ? "Создаём платёж…" : "Перейти к оплате"}
                </button>
                {error && <p className="msg err">{error}</p>}
                <p className="muted" style={{ fontSize: ".78rem", marginTop: 10 }}>
                  После оплаты начислим {earnedFor(total - delivery)} бонусов ({Math.round(EARN_RATE * 100)}% от товаров).
                  {hasPhysical && sub < FREE_FROM && method === "courier" && ` Доставка бесплатно от ${money(FREE_FROM)}.`}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
