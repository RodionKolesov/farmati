// Самодостаточный демо-бэкенд кабинета Farmati — только встроенные модули Node.
// Регистрация/вход, личный баланс, начисление бонусов за «заказ», списание в промокод.
// Хранилище — JSON-файл. Фронтенд раздаётся с этого же сервера (одно происхождение).

import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";

const __dir = dirname(fileURLToPath(import.meta.url));
const DB_FILE = join(__dir, "data.json");
const PUBLIC = join(__dir, "public");
const PORT = 8090;
const EARN_RATE = 0.05;     // 5% бонусами за заказ
const WELCOME_BONUS = 100;  // приветственные бонусы при регистрации

// ───────────────────────── хранилище ─────────────────────────
function load() {
  if (!existsSync(DB_FILE)) return { users: [], orders: [], txs: [], promos: [] };
  try { return JSON.parse(readFileSync(DB_FILE, "utf8")); }
  catch { return { users: [], orders: [], txs: [], promos: [] }; }
}
function save(db) { writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }
let db = load();

const sessions = new Map(); // token -> userId

// ───────────────────────── утилиты ─────────────────────────
function hash(password, salt = randomBytes(16).toString("hex")) {
  const h = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${h}`;
}
function verify(password, stored) {
  const [salt, h] = stored.split(":");
  const test = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(h, "hex"), Buffer.from(test, "hex"));
}
function uid() { return randomBytes(8).toString("hex"); }
function now() { return new Date().toISOString(); }

function send(res, code, data) {
  res.writeHead(code, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}
function body(req) {
  return new Promise((resolve) => {
    let b = "";
    req.on("data", (c) => (b += c));
    req.on("end", () => { try { resolve(JSON.parse(b || "{}")); } catch { resolve({}); } });
  });
}
function userByToken(req) {
  const auth = req.headers["authorization"] || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  const id = sessions.get(token);
  return id ? db.users.find((u) => u.id === id) : null;
}
function publicUser(u) {
  return { id: u.id, email: u.email, name: u.name, phone: u.phone, balance: u.balance };
}

// ───────────────────────── статика ─────────────────────────
const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml" };
function serveStatic(req, res) {
  let path = req.url.split("?")[0];
  if (path === "/") path = "/index.html";
  const file = join(PUBLIC, path);
  if (!file.startsWith(PUBLIC) || !existsSync(file)) { res.writeHead(404); return res.end("Not found"); }
  res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
}

// ───────────────────────── API ─────────────────────────
const server = createServer(async (req, res) => {
  const url = req.url.split("?")[0];

  if (!url.startsWith("/api/")) return serveStatic(req, res);

  // Регистрация
  if (url === "/api/register" && req.method === "POST") {
    const { email, password, name, phone } = await body(req);
    if (!email || !password) return send(res, 400, { error: "Укажите email и пароль" });
    if (db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()))
      return send(res, 409, { error: "Пользователь с таким email уже есть" });
    const user = { id: uid(), email, name: name || "", phone: phone || "", pass: hash(password), balance: WELCOME_BONUS, created_at: now() };
    db.users.push(user);
    db.txs.push({ id: uid(), user_id: user.id, delta: WELCOME_BONUS, type: "earn", note: "Приветственные бонусы", created_at: now() });
    save(db);
    const token = randomBytes(24).toString("hex");
    sessions.set(token, user.id);
    return send(res, 200, { token, user: publicUser(user) });
  }

  // Вход
  if (url === "/api/login" && req.method === "POST") {
    const { email, password } = await body(req);
    const user = db.users.find((u) => u.email.toLowerCase() === (email || "").toLowerCase());
    if (!user || !verify(password || "", user.pass)) return send(res, 401, { error: "Неверный email или пароль" });
    const token = randomBytes(24).toString("hex");
    sessions.set(token, user.id);
    return send(res, 200, { token, user: publicUser(user) });
  }

  // Данные кабинета
  if (url === "/api/me" && req.method === "GET") {
    const user = userByToken(req);
    if (!user) return send(res, 401, { error: "Не авторизован" });
    return send(res, 200, {
      user: publicUser(user),
      orders: db.orders.filter((o) => o.user_id === user.id).reverse(),
      txs: db.txs.filter((t) => t.user_id === user.id).reverse(),
      promos: db.promos.filter((p) => p.user_id === user.id).reverse(),
    });
  }

  // Имитация заказа (аналог вебхука сайта) — начисляет бонусы
  if (url === "/api/order" && req.method === "POST") {
    const user = userByToken(req);
    if (!user) return send(res, 401, { error: "Не авторизован" });
    const { amount } = await body(req);
    const sum = Math.max(0, Number(amount) || 0);
    const earned = Math.floor(sum * EARN_RATE);
    db.orders.push({ id: uid(), user_id: user.id, amount: sum, bonus_earned: earned, created_at: now() });
    db.txs.push({ id: uid(), user_id: user.id, delta: earned, type: "earn", note: `Начисление за заказ ${sum} ₽`, created_at: now() });
    user.balance += earned;
    save(db);
    return send(res, 200, { balance: user.balance, earned });
  }

  // Списание бонусов в промокод
  if (url === "/api/redeem" && req.method === "POST") {
    const user = userByToken(req);
    if (!user) return send(res, 401, { error: "Не авторизован" });
    const { amount } = await body(req);
    const val = Math.floor(Number(amount) || 0);
    if (val <= 0) return send(res, 400, { error: "Сумма должна быть больше 0" });
    if (user.balance < val) return send(res, 400, { error: `Недостаточно бонусов: доступно ${user.balance}` });
    const code = "FARM-" + randomBytes(4).toString("hex").toUpperCase();
    user.balance -= val;
    db.promos.push({ id: uid(), user_id: user.id, code, amount: val, used: false, created_at: now() });
    db.txs.push({ id: uid(), user_id: user.id, delta: -val, type: "spend", note: `Списание в промокод ${code}`, created_at: now() });
    save(db);
    return send(res, 200, { code, balance: user.balance });
  }

  send(res, 404, { error: "Неизвестный метод" });
});

server.listen(PORT, () => console.log(`Кабинет Farmati (демо) запущен: http://localhost:${PORT}`));
