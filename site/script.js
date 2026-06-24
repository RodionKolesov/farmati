// ──────────────────────────────────────────────────────────────────────────
// BELLÉ — лёгкая интерактивность шаблона (без зависимостей)
// ──────────────────────────────────────────────────────────────────────────

// Товары витрины. Замените на свои или подгрузите из API/Supabase через fetch().
const PRODUCTS = [
  { name: "Сыворотка с витамином C",    cat: "Сыворотки", price: 1890, img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600", badge: "Хит" },
  { name: "Сыворотка с гиалуроном",     cat: "Сыворотки", price: 1690, img: "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=600" },
  { name: "Сыворотка с ниацинамидом",   cat: "Сыворотки", price: 1790, img: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600", badge: "New" },
  { name: "Увлажняющий крем",           cat: "Кремы",     price: 1490, img: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600" },
  { name: "Ночной восстанавливающий крем", cat: "Кремы",  price: 1990, img: "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=600", badge: "Хит" },
  { name: "Крем для кожи вокруг глаз",  cat: "Кремы",     price: 1290, img: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600" },
  { name: "Балансирующий тоник",        cat: "Тоники",    price: 990,  img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600" },
  { name: "Альгинатная маска",          cat: "Маски",     price: 690,  img: "https://images.unsplash.com/photo-1556228841-a3c527ebefe5?w=600" },
];

const BONUS_RATE = 0.1; // 10% бонусами — для подписи под ценой
const productsEl = document.getElementById("products");
const tabsEl = document.getElementById("tabs");

function money(n) { return n.toLocaleString("ru-RU") + " ₽"; }

function renderProducts(cat = "Все") {
  const items = PRODUCTS.filter((p) => cat === "Все" || p.cat === cat);
  productsEl.innerHTML = items
    .map(
      (p) => `
      <article class="product">
        <div class="product__media" style="background-image:url('${p.img}')">
          ${p.badge ? `<span class="product__badge">${p.badge}</span>` : ""}
        </div>
        <div class="product__body">
          <span class="product__cat">${p.cat}</span>
          <span class="product__name">${p.name}</span>
          <span class="product__bonus">+${Math.round(p.price * BONUS_RATE)} бонусов</span>
          <div class="product__foot">
            <span class="product__price">${money(p.price)}</span>
            <button class="product__btn" title="В корзину" aria-label="В корзину">+</button>
          </div>
        </div>
      </article>`
    )
    .join("");
}

// Табы каталога
tabsEl?.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if (!btn) return;
  tabsEl.querySelectorAll(".tab").forEach((t) => t.classList.remove("is-active"));
  btn.classList.add("is-active");
  renderProducts(btn.dataset.cat);
});

// Мобильное меню
const burger = document.getElementById("burger");
const nav = document.getElementById("nav");
burger?.addEventListener("click", () => nav.classList.toggle("is-open"));
nav?.addEventListener("click", (e) => {
  if (e.target.tagName === "A") nav.classList.remove("is-open");
});

renderProducts();
