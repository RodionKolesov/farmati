// Фронтенд демо-кабинета Farmati. Работает с локальным API того же сервера.

let mode = "signin";
let token = localStorage.getItem("farmati_token") || null;

const $ = (id) => document.getElementById(id);
const authEl = $("auth"), dashEl = $("dash");

async function api(path, opts = {}) {
  const headers = { "content-type": "application/json" };
  if (token) headers["authorization"] = "Bearer " + token;
  const res = await fetch("/api" + path, { ...opts, headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Ошибка");
  return data;
}

// ── переключение вход/регистрация ──
document.querySelectorAll(".t2").forEach((b) =>
  b.addEventListener("click", () => {
    document.querySelectorAll(".t2").forEach((x) => x.classList.remove("is-active"));
    b.classList.add("is-active");
    mode = b.dataset.mode;
    $("nameRow").style.display = mode === "signup" ? "block" : "none";
    $("submitBtn").textContent = mode === "signup" ? "Зарегистрироваться" : "Войти";
    $("authMsg").textContent = "";
  })
);

// ── отправка формы авторизации ──
$("authForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = $("authMsg");
  msg.className = "msg";
  try {
    const payload = { email: $("email").value, password: $("password").value };
    if (mode === "signup") { payload.name = $("name").value; payload.phone = $("phone").value; }
    const data = await api(mode === "signup" ? "/register" : "/login", { method: "POST", body: payload });
    token = data.token;
    localStorage.setItem("farmati_token", token);
    await loadDash();
  } catch (err) {
    msg.className = "msg err";
    msg.textContent = err.message;
  }
});

// ── выход ──
$("logout").addEventListener("click", () => {
  token = null;
  localStorage.removeItem("farmati_token");
  dashEl.style.display = "none";
  authEl.style.display = "block";
  $("logout").style.display = "none";
});

// ── имитация заказа ──
$("orderForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const r = await api("/order", { method: "POST", body: { amount: $("orderAmount").value } });
    $("orderAmount").value = "";
    flash(`Начислено +${r.earned} бонусов`, "ok");
    await loadDash();
  } catch (err) { flash(err.message, "err"); }
});

// ── списание в промокод ──
$("redeemForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const r = await api("/redeem", { method: "POST", body: { amount: $("redeemAmount").value } });
    $("redeemAmount").value = "";
    flash(`Промокод создан: ${r.code}`, "ok");
    await loadDash();
  } catch (err) { flash(err.message, "err"); }
});

function flash(text, type) {
  const m = $("dashMsg");
  m.className = "msg " + type;
  m.textContent = text;
}

function fmtDate(s) { return new Date(s).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" }); }
function li(html) { return `<li>${html}</li>`; }
function empty(t) { return `<li><span class="empty">${t}</span></li>`; }

async function loadDash() {
  const d = await api("/me");
  authEl.style.display = "none";
  dashEl.style.display = "block";
  $("logout").style.display = "inline";
  $("hello").textContent = `Привет, ${d.user.name || d.user.email} 👋`;
  $("balance").textContent = d.user.balance;

  $("promos").innerHTML = d.promos.length
    ? d.promos.map((p) => li(`<code class="code">${p.code}</code><span>−${p.amount} ₽</span><span class="tag">${p.used ? "использован" : "активен"}</span>`)).join("")
    : empty("Пока нет. Спишите бонусы в промокод выше.");

  $("txs").innerHTML = d.txs.length
    ? d.txs.map((t) => li(`<span>${fmtDate(t.created_at)}</span><span>${t.note}</span><span class="${t.delta >= 0 ? "plus" : "minus"}">${t.delta >= 0 ? "+" : ""}${t.delta}</span>`)).join("")
    : empty("Движений пока нет.");

  $("orders").innerHTML = d.orders.length
    ? d.orders.map((o) => li(`<span>${fmtDate(o.created_at)}</span><span>${Number(o.amount).toLocaleString("ru-RU")} ₽</span><span class="plus">+${o.bonus_earned}</span>`)).join("")
    : empty("Заказов пока нет.");
}

// автологин по сохранённому токену
if (token) loadDash().catch(() => { token = null; localStorage.removeItem("farmati_token"); });
