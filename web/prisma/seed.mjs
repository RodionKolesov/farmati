// Наполнение БД реальными товарами FARMATI и курсами.
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const products = [
  { slug: "enzyme-powder", name: "Пудра энзимная", category: "Очищение", price: 900, image: "/products/enzyme-powder.jpg",
    description: "Это не скраб и не агрессивное очищение «до скрипа». Мягкая умная эксфолиация: 6% активных энзимов аккуратно растворяют ороговевшие клетки, выравнивают текстуру и запускают обновление — без трения и микротравм. Без силиконов и агрессивной химии, подходит даже чувствительной коже. Для лица, шеи и декольте, 2–3 раза в неделю. 15 г." },
  { slug: "enzyme-foam", name: "Пенка для умывания энзимная", category: "Очищение", price: 1700, image: "/products/enzyme-foam.jpg",
    description: "Лёгкая пенка-мусс с экстрактом черимойи мягко удаляет загрязнения и остатки макияжа, не нарушая баланс кожи. Молочные кислоты обновляют клетки, коллаген и витамины питают и увлажняют. Подходит всем типам кожи, включая чувствительную. 100 мл." },
  { slug: "day-cream", name: "Крем дневной с коллагеном и эластином", category: "Кремы", price: 2700, image: "",
    description: "Дневной крем с коллагеном и эластином питает кожу, повышает упругость и эластичность, разглаживает и защищает в течение дня. Лёгкая текстура быстро впитывается — идеальная основа под макияж." },
  { slug: "night-cream", name: "Крем ночной ламеллярный", category: "Кремы", price: 2700, image: "/products/night-cream.jpg",
    description: "Восстановление кожи во время сна. Ламеллярная структура имитирует естественные липиды кожи, укрепляет защитный барьер и снижает потерю влаги. Сквалан глубоко увлажняет, не забивая поры. Для сухой, обезвоженной и чувствительной кожи. 50 мл." },
  { slug: "serum-vitc", name: "Сыворотка с витамином С", category: "Сыворотки", price: 1700, image: "/products/serum-vitc.jpg",
    description: "Интенсивный уход для свежей и сияющей кожи. Витамин С — мощный антиоксидант — осветляет пигментные пятна и постакне, выравнивает тон. Гиалуроновая кислота увлажняет, масла и экстракты питают. Для всех типов кожи. 30 мл." },
  { slug: "serum-hyaluron", name: "Сыворотка с гиалуроновой кислотой", category: "Сыворотки", price: 1500, image: "/products/serum-jojoba.jpg",
    description: "Интенсивное увлажнение и восстановление. Масло жожоба питает и восстанавливает липидный барьер, гиалуроновая кислота удерживает влагу и придаёт упругость. Лёгкая текстура быстро впитывается. Органическая гипоаллергенная формула для всех типов кожи. 30 мл." },
  { slug: "toner-hyaluron", name: "Тонер с гиалуроновой кислотой", category: "Тоники", price: 1200, image: "",
    description: "Увлажняющий тонер с гиалуроновой кислотой мягко тонизирует кожу после очищения, насыщает влагой и восстанавливает баланс, подготавливая кожу к сыворотке и крему. 100 мл." },
  { slug: "tonic-snail", name: "Тоник с муцином улитки", category: "Тоники", price: 1400, image: "/products/tonic-snail.jpg",
    description: "Нежный уход для сияния и гладкости. Муцин улитки увлажняет, успокаивает и питает кожу, повышает эластичность, ускоряет регенерацию. Удаляет остатки макияжа, сужает поры, восстанавливает pH-баланс. 100 мл." },
];

const courses = [
  { slug: "sculpt-massage", title: "Скульптурный массаж лица дома", price: 4900, oldPrice: 6900, lessonsCount: 10, duration: "3 часа", image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=700", summary: "Техники лифтинга и снятия отёков своими руками." },
  { slug: "buccal-massage", title: "Буккальный массаж: лицо изнутри", price: 5900, oldPrice: 7500, lessonsCount: 8, duration: "2.5 часа", image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=700", summary: "Продвинутая работа со скуловой и щёчной зоной." },
  { slug: "daily-care", title: "Домашний уход: ритуал на каждый день", price: 2900, oldPrice: 3900, lessonsCount: 6, duration: "1.5 часа", image: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=700", summary: "Как подобрать средства под свой тип кожи." },
];

// Уроки курсов. Первые помечены free: бесплатны после регистрации, остальные — после покупки.
// videoUrl — ссылка для встраивания (YouTube/VK embed). Замените на свои ролики.
const SAMPLE = "https://www.youtube.com/embed/ScMzIvxBSi4";
const lessonsByCourse = {
  "sculpt-massage": [
    { title: "Урок 1. Подготовка кожи и разминка", free: true },
    { title: "Урок 2. Базовые приёмы лимфодренажа", free: true },
    { title: "Урок 3. Работа со лбом и зоной вокруг глаз", free: true },
    { title: "Урок 4. Скульптурный лифтинг овала", free: false },
    { title: "Урок 5. Завершение и фиксация результата", free: false },
  ],
  "buccal-massage": [
    { title: "Урок 1. Гигиена и техника безопасности", free: true },
    { title: "Урок 2. Внутренняя проработка щёк", free: false },
    { title: "Урок 3. Скуловая зона", free: false },
  ],
  "daily-care": [
    { title: "Урок 1. Определяем тип кожи", free: true },
    { title: "Урок 2. Утренний ритуал", free: true },
    { title: "Урок 3. Вечерний ритуал и маски", free: false },
  ],
};

// Отзывы участниц. Фото «до/после» добавляются позже через админку.
const reviews = [
  { author: "Анна", rating: 5, text: "Кожа стала заметно свежее, а главное — появилась привычка заботиться о себе каждый день.", order: 0 },
  { author: "Мария", rating: 5, text: "Энзимная пудра — любовь. Кожа гладкая уже после первого применения.", order: 1 },
  { author: "Екатерина", rating: 5, text: "Лучшее в клубе — атмосфера и поддержка. Возвращаюсь сюда как к себе.", order: 2 },
];

async function main() {
  // чистим старые товары, чтобы не осталось демо-позиций
  await prisma.product.deleteMany({});
  for (let i = 0; i < products.length; i++) {
    // первый товар — 2 шт. (демонстрация метки «осталось N шт.»), остальные — 10
    const data = { ...products[i], stock: i === 0 ? 2 : 10 };
    await prisma.product.upsert({ where: { slug: data.slug }, update: data, create: data });
  }

  // отзывы: пересоздаём базовый набор, если их ещё нет
  if ((await prisma.review.count()) === 0) {
    for (const r of reviews) await prisma.review.create({ data: r });
  }

  for (const c of courses) {
    const course = await prisma.course.upsert({ where: { slug: c.slug }, update: c, create: c });
    await prisma.lesson.deleteMany({ where: { courseId: course.id } });
    const list = lessonsByCourse[c.slug] ?? [];
    for (let i = 0; i < list.length; i++) {
      await prisma.lesson.create({
        data: { courseId: course.id, title: list[i].title, free: list[i].free, order: i, videoUrl: SAMPLE },
      });
    }
  }
  console.log(`Seed готов: ${products.length} товаров, ${courses.length} курсов с уроками`);
}

main().finally(() => prisma.$disconnect());
