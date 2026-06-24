"use client";

import { useActionState } from "react";
import { changePassword, type PwState } from "@/lib/actions/auth";

export default function PasswordForm() {
  const [state, action, pending] = useActionState<PwState, FormData>(changePassword, undefined);
  return (
    <form action={action}>
      <div className="form-grid">
        <div><label>Текущий пароль</label><input name="current" type="password" required /></div>
        <div><label>Новый пароль</label><input name="next" type="password" required minLength={6} /></div>
      </div>
      <button className="btn btn--ghost btn--sm" style={{ marginTop: 10 }} disabled={pending}>
        {pending ? "Сохраняем…" : "Сменить пароль"}
      </button>
      {state?.ok && <p className="msg ok">Пароль изменён ✓</p>}
      {state?.error && <p className="msg err">{state.error}</p>}
    </form>
  );
}
