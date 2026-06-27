"use client";

import { useActionState, useState } from "react";
import { loginUser, registerUser, type AuthState } from "@/lib/actions/auth";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loginState, loginAction, loginPending] = useActionState<AuthState, FormData>(loginUser, undefined);
  const [signupState, signupAction, signupPending] = useActionState<AuthState, FormData>(registerUser, undefined);
  // Управляемые поля регистрации — данные не теряются после неудачной отправки.
  const [su, setSu] = useState({ name: "", phone: "", email: "", password: "", password2: "" });
  const errCls = (f: string) => (signupState?.field === f ? "input-error" : undefined);

  return (
    <main className="page">
      <div className="container">
        <div className="card auth-card">
          <div className="tabs2">
            <button className={`t2${mode === "signin" ? " is-active" : ""}`} onClick={() => setMode("signin")}>
              Вход
            </button>
            <button className={`t2${mode === "signup" ? " is-active" : ""}`} onClick={() => setMode("signup")}>
              Регистрация
            </button>
          </div>

          {mode === "signin" ? (
            <form action={loginAction}>
              <label>Email</label>
              <input name="email" type="email" required placeholder="you@mail.ru" autoComplete="email" />
              <label>Пароль</label>
              <input name="password" type="password" required minLength={6} placeholder="••••••" autoComplete="current-password" />
              <button className="btn btn--primary btn--block" style={{ marginTop: 16 }} disabled={loginPending}>
                {loginPending ? "…" : "Войти"}
              </button>
              {loginState?.error && <p className="msg err">{loginState.error}</p>}
            </form>
          ) : (
            <form action={signupAction}>
              <label>Имя</label>
              <input name="name" required placeholder="Анна" autoComplete="name" className={errCls("name")} value={su.name} onChange={(e) => setSu({ ...su, name: e.target.value })} />
              <label>Телефон</label>
              <input name="phone" type="tel" required placeholder="+7 999 000-00-00" autoComplete="tel" className={errCls("phone")} value={su.phone} onChange={(e) => setSu({ ...su, phone: e.target.value })} />
              <label>Email</label>
              <input name="email" type="email" required placeholder="you@mail.ru" autoComplete="email" className={errCls("email")} value={su.email} onChange={(e) => setSu({ ...su, email: e.target.value })} />
              <span className="muted" style={{ fontSize: ".72rem", marginTop: -4 }}>Только российская почта: @mail.ru, @yandex.ru и т.п.</span>
              <label>Пароль</label>
              <input name="password" type="password" required minLength={6} placeholder="••••••" autoComplete="new-password" className={errCls("password")} value={su.password} onChange={(e) => setSu({ ...su, password: e.target.value })} />
              <label>Повторите пароль</label>
              <input name="password2" type="password" required minLength={6} placeholder="••••••" autoComplete="new-password" className={errCls("password2")} value={su.password2} onChange={(e) => setSu({ ...su, password2: e.target.value })} />
              <button className="btn btn--primary btn--block" style={{ marginTop: 16 }} disabled={signupPending}>
                {signupPending ? "…" : "Зарегистрироваться"}
              </button>
              {signupState?.error && <p className="msg err">{signupState.error}</p>}
              <p className="muted" style={{ fontSize: ".72rem", marginTop: 10, whiteSpace: "nowrap" }}>При регистрации начислим 100 приветственных бонусов 🎁</p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
