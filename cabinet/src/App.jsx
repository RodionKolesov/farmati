import { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabaseClient";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) return <div className="center muted">Загрузка…</div>;

  return (
    <div className="page">
      <header className="topbar">
        <span className="brand">✦ Личный кабинет</span>
        {session && (
          <button className="link" onClick={() => supabase.auth.signOut()}>
            Выйти
          </button>
        )}
      </header>
      <main className="container">{session ? <Dashboard session={session} /> : <Auth />}</main>
    </div>
  );
}

// --------------------------------------------------------------------------
// Авторизация: вход / регистрация по email + пароль
// --------------------------------------------------------------------------
function Auth() {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          phone: phone || undefined,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        setMsg({ type: "ok", text: "Готово! Проверьте почту для подтверждения, затем войдите." });
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card auth">
      <h1>{mode === "signin" ? "Вход" : "Регистрация"}</h1>
      <form onSubmit={submit}>
        {mode === "signup" && (
          <>
            <label>Имя</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Анна" />
            <label>Телефон</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 999 000-00-00"
            />
          </>
        )}
        <label>Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@mail.ru"
        />
        <label>Пароль</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••"
        />
        <button className="primary" disabled={busy}>
          {busy ? "…" : mode === "signin" ? "Войти" : "Зарегистрироваться"}
        </button>
      </form>
      {msg && <p className={msg.type === "err" ? "error" : "success"}>{msg.text}</p>}
      <p className="switch">
        {mode === "signin" ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
        <button className="link" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
          {mode === "signin" ? "Создать" : "Войти"}
        </button>
      </p>
    </div>
  );
}

// --------------------------------------------------------------------------
// Кабинет: профиль, баланс, история, генерация промокода
// --------------------------------------------------------------------------
function Dashboard({ session }) {
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [txs, setTxs] = useState([]);
  const [promos, setPromos] = useState([]);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    setErr(null);
    const uid = session.user.id;
    const [p, o, t, c] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).single(),
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(20),
      supabase
        .from("bonus_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("promo_codes").select("*").order("created_at", { ascending: false }).limit(20),
    ]);
    if (p.error) setErr(p.error.message);
    setProfile(p.data ?? null);
    setOrders(o.data ?? []);
    setTxs(t.data ?? []);
    setPromos(c.data ?? []);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="grid">
      <BalanceCard profile={profile} onRedeem={load} setErr={setErr} />
      {err && <p className="error">{err}</p>}

      <Section title="Мои промокоды">
        {promos.length === 0 ? (
          <p className="muted">Пока нет. Спишите бонусы в промокод выше.</p>
        ) : (
          <ul className="list">
            {promos.map((c) => (
              <li key={c.code} className="row">
                <code className="code">{c.code}</code>
                <span>−{c.amount} ₽</span>
                <span className={c.used ? "muted" : "tag"}>{c.used ? "использован" : "активен"}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="История бонусов">
        {txs.length === 0 ? (
          <p className="muted">Движений пока нет.</p>
        ) : (
          <ul className="list">
            {txs.map((t) => (
              <li key={t.id} className="row">
                <span>{fmtDate(t.created_at)}</span>
                <span>{t.note}</span>
                <span className={t.delta >= 0 ? "plus" : "minus"}>
                  {t.delta >= 0 ? "+" : ""}
                  {t.delta}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Заказы">
        {orders.length === 0 ? (
          <p className="muted">Заказов пока нет.</p>
        ) : (
          <ul className="list">
            {orders.map((o) => (
              <li key={o.id} className="row">
                <span>{fmtDate(o.created_at)}</span>
                <span>{Number(o.amount).toLocaleString("ru-RU")} ₽</span>
                <span className="plus">+{o.bonus_earned}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function BalanceCard({ profile, onRedeem, setErr }) {
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const balance = profile?.bonus_balance ?? 0;

  async function redeem(e) {
    e.preventDefault();
    const value = parseInt(amount, 10);
    if (!value || value <= 0) return;
    setBusy(true);
    setErr(null);
    const { error } = await supabase.rpc("redeem_bonus_to_promo", { p_amount: value });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setAmount("");
    onRedeem();
  }

  return (
    <div className="card balance">
      <div className="balance-head">
        <div>
          <p className="muted">Привет, {profile?.full_name || profile?.email || "друг"} 👋</p>
          <p className="balance-value">{balance} бонусов</p>
        </div>
      </div>
      <form className="redeem" onSubmit={redeem}>
        <input
          type="number"
          min="1"
          max={balance}
          placeholder="Сколько списать"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button className="primary" disabled={busy || balance <= 0}>
          {busy ? "…" : "В промокод"}
        </button>
      </form>
      <p className="hint">1 бонус = 1 ₽ скидки. Промокод применяется в корзине на сайте.</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

function fmtDate(s) {
  try {
    return new Date(s).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  } catch {
    return s;
  }
}
