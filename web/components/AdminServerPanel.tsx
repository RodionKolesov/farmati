"use client";

import { useActionState } from "react";
import { cleanCache, type CleanState, type ServerStats } from "@/lib/actions/maintenance";

function gb(bytes: number) {
  return (bytes / 1024 / 1024 / 1024).toFixed(1);
}
function mb(bytes: number) {
  return Math.round(bytes / 1024 / 1024);
}
function barColor(pct: number) {
  if (pct >= 90) return "#c0392b";
  if (pct >= 75) return "#d98a00";
  return "#2e7d4f";
}

export default function AdminServerPanel({ stats }: { stats: ServerStats }) {
  const [state, action, pending] = useActionState<CleanState, FormData>(cleanCache, undefined);
  const disk = stats.disk;
  const diskFull = !!disk && disk.pct >= 85;

  return (
    <div className="card srv-panel">
      <div className="srv-head">
        <h2 style={{ margin: 0 }}>Состояние сервера</h2>
        <form action={action}>
          <button className="btn btn--primary btn--sm" disabled={pending}>
            {pending ? "Очищаем…" : "🧹 Очистить кэш"}
          </button>
        </form>
      </div>

      {disk && (
        <div className="srv-metric">
          <div className="srv-metric__top">
            <span>Диск сервера</span>
            <span>
              <b>{gb(disk.used)}</b> из {gb(disk.total)} ГБ занято · свободно {gb(disk.free)} ГБ
            </span>
          </div>
          <div className="srv-bar">
            <span style={{ width: `${disk.pct}%`, background: barColor(disk.pct) }} />
          </div>
        </div>
      )}

      <div className="srv-metric">
        <div className="srv-metric__top">
          <span>Оперативная память</span>
          <span>
            <b>{stats.mem.pct}%</b> занято
          </span>
        </div>
        <div className="srv-bar">
          <span style={{ width: `${stats.mem.pct}%`, background: barColor(stats.mem.pct) }} />
        </div>
      </div>

      <p className="muted" style={{ fontSize: ".85rem", marginTop: 4 }}>
        Временный кэш сайта сейчас занимает ~{mb(stats.cacheBytes)} МБ.
        {diskFull && <strong style={{ color: "#c0392b" }}> Диск заполнен — рекомендуем очистить кэш.</strong>}
      </p>

      {state?.ok && (
        <div className="srv-done">
          ✅ Готово. Освобождено ~{mb(state.freed ?? 0)} МБ.
          {state.steps && state.steps.length > 0 && (
            <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {state.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          )}
          <button className="btn btn--ghost btn--sm" style={{ marginTop: 8 }} onClick={() => location.reload()}>
            Обновить показатели
          </button>
        </div>
      )}

      <details className="srv-note">
        <summary>Что именно чистит эта кнопка?</summary>
        <div>
          <p style={{ margin: "8px 0 4px" }}>
            <b>Очищается (безопасно, восстановится само):</b>
          </p>
          <ul>
            <li>
              Временный кэш сборки сайта (<code>.next/cache</code>) — ускоряет загрузку страниц и картинок,
              пересоздаётся автоматически.
            </li>
            <li>Кэш загрузок npm — нужен только во время обновления сайта.</li>
            <li>Старые логи приложения.</li>
          </ul>
          <p style={{ margin: "8px 0 4px" }}>
            <b>НЕ трогается (ваши данные в полной безопасности):</b>
          </p>
          <ul>
            <li>База данных: товары, заказы, участники, бонусы, заявки на консультацию.</li>
            <li>Загруженные фото товаров и отзывов, файлы чек-листов (PDF).</li>
            <li>Сам сайт, его настройки и оформление.</li>
          </ul>
          <p className="muted" style={{ fontSize: ".82rem", margin: "8px 0 0" }}>
            После очистки первые несколько открытий страниц могут быть чуть медленнее — это нормально, кэш
            наполняется заново. Нажимайте кнопку, когда диск заполнен примерно на 85% и выше.
          </p>
        </div>
      </details>
    </div>
  );
}
