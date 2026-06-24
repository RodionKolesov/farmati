"use client";

import { useActionState, useState } from "react";
import { loginUser, registerUser, type AuthState } from "@/lib/actions/auth";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const action = mode === "signin" ? loginUser : registerUser;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, undefined);

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
          <form action={formAction}>
            {mode === "signup" && (
              <>
                <label>Имя</label>
                <input name="name" required placeholder="Анна" />
                <label>Телефон</label>
                <input name="phone" type="tel" required placeholder="+7 999 000-00-00" />
              </>
            )}
            <label>Email</label>
            <input name="email" type="email" required placeholder="you@mail.ru" />
            <label>Пароль</label>
            <input name="password" type="password" required minLength={6} placeholder="••••••" />
            <button className="btn btn--primary btn--block" style={{ marginTop: 16 }} disabled={pending}>
              {pending ? "…" : mode === "signin" ? "Войти" : "Зарегистрироваться"}
            </button>
          </form>
          {state?.error && <p className="msg err">{state.error}</p>}
          {mode === "signup" && <p className="muted" style={{ fontSize: ".8rem", marginTop: 10 }}>При регистрации начислим 100 приветственных бонусов 🎁</p>}
        </div>
      </div>
    </main>
  );
}
