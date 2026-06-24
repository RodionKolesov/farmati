"use client";

import { useActionState } from "react";
import { submitLead, type LeadState } from "@/lib/actions/lead";

export default function ConsultForm() {
  const [state, action, pending] = useActionState<LeadState, FormData>(submitLead, undefined);

  if (state?.ok) {
    return (
      <div className="card" style={{ maxWidth: 520 }}>
        <h3 style={{ marginBottom: 8 }}>Спасибо! 🌸</h3>
        <p className="muted">Заявка принята — мы свяжемся с вами в ближайшее время.</p>
      </div>
    );
  }

  return (
    <form className="lead-form" action={action}>
      <div className="row">
        <div>
          <label>Имя</label>
          <input name="name" required placeholder="Ваше имя" />
        </div>
        <div>
          <label>Телефон</label>
          <input name="phone" required placeholder="+7 999 000-00-00" />
        </div>
      </div>
      <div>
        <label>Вопрос косметологу (необязательно)</label>
        <textarea name="message" rows={3} placeholder="Опишите, что вас беспокоит" />
      </div>
      <button className="btn btn--primary" disabled={pending} style={{ marginTop: 6 }}>
        {pending ? "Отправляем…" : "Записаться на консультацию"}
      </button>
      {state?.error && <p className="msg err">{state.error}</p>}
    </form>
  );
}
