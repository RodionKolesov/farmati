# Перенос на Yandex Cloud (хранение данных в РФ) — план миграции

Цель: данные клиентов (граждан РФ) хранятся в базе, **физически расположенной в России**
— требование **ч. 5 ст. 18 152-ФЗ** (локализация). Сейчас прод-варианты ведут на Neon/Supabase
(зарубежные серверы) — это не соответствует закону. Переезжаем на Yandex Cloud (регион `ru-central1`).

> Это технический план соответствия, не юридическое заключение. Формулировки документов
> и нюансы трансграничной передачи подтвердите с юристом.

## Что и куда переезжает

| Стек | Что использует | Цель в Yandex Cloud | Почему так |
|---|---|---|---|
| `web` (Next.js магазин) | Prisma + свои таблицы, next-auth | **Managed PostgreSQL** | Самодостаточен, нужен только Postgres |
| `cabinet` + `supabase` | `auth.users`, `auth.uid()`, RLS, RPC, Edge Functions | **self-hosted Supabase** на Compute VM (Docker) | Сохраняет весь код кабинета без переписывания |

Оба варианта кладут данные в `ru-central1` (Москва/Владимир/Рязань) → соответствие локализации.

---

## Подготовка (один раз)

1. Аккаунт на https://cloud.yandex.ru, привязать платёжный аккаунт (нужна карта РФ).
2. Создать **облако** и **каталог** (folder) — например `farmati-prod`.
3. Установить CLI `yc` (https://yandex.cloud/docs/cli/quickstart) и войти.
   В этом чате интерактивный вход запускайте через `!`:
   ```
   ! yc init
   ```
4. Создать сеть и подсеть в `ru-central1` (или использовать дефолтные `default`).

---

## Часть A. `web` (Next.js) → Managed PostgreSQL

### A1. Создать кластер PostgreSQL
Консоль → **Managed Service for PostgreSQL** → Создать кластер:
- Версия PostgreSQL: 16
- Класс: `b1.medium` (2 vCPU / 4 ГБ) для старта; окружение `PRODUCTION`
- Регион/зона: `ru-central1` (любая зона a/b/d)
- БД: `farmati`, пользователь: `farmati`, задать пароль
- Хосты: 1 (для HA позже — 2+)

Или CLI:
```bash
yc managed-postgresql cluster create \
  --name farmati-pg \
  --environment production \
  --network-name default \
  --host zone-id=ru-central1-a,subnet-name=default-ru-central1-a \
  --resource-preset b1.medium \
  --disk-size 20 --disk-type network-ssd \
  --postgresql-version 16 \
  --user name=farmati,password=ПРИДУМАЙТЕ_ПАРОЛЬ \
  --database name=farmati,owner=farmati
```

### A2. Доступ и SSL
- Включите «Публичный доступ» к хосту (если приложение хостится вне облака) или держите
  всё внутри VPC (рекомендуется).
- Скачайте корневой сертификат YC (он один для всех кластеров):
  ```bash
  mkdir -p web/certs
  curl -o web/certs/yandex-root.crt https://storage.yandexcloud.net/cloud-certs/CA.pem
  ```
- Подключение всегда с `sslmode=verify-full` (см. `web/.env.production.example`).

### A3. Переключить Prisma на Postgres (ТОЛЬКО для прода)
В `web/prisma/schema.prisma` поменять провайдер:
```prisma
datasource db {
  provider = "postgresql"   // было "sqlite"
  url      = env("DATABASE_URL")
}
```
> Локальная разработка на SQLite после этого работать не будет. Варианты:
> (а) держать прод-схему в отдельной ветке/при деплое; (б) и в dev перейти на локальный
> Postgres (docker). Минимально-инвазивно — менять провайдер в CI/деплое, не в dev.

### A4. Применить схему и сиды
```bash
cd web
cp .env.production.example .env.production   # заполнить DATABASE_URL
# создать таблицы по схеме Prisma:
npx prisma migrate deploy        # если есть папка migrations
# или для первого раза:
npx prisma db push
node seed.mjs                    # начальные товары/курсы (data only, без ПДн)
```

### A5. Деплой приложения в РФ
Чтобы и приложение, и БД были в РФ:
- **Compute Cloud VM** (Ubuntu) + `node`/`pm2` или Docker; либо
- **Serverless Containers** Yandex (образ из вашего `Dockerfile`).
Прокинуть env из `web/.env.production`. Поднять reverse-proxy (nginx/Caddy) c HTTPS.

---

## Часть B. `cabinet` + `supabase` → self-hosted Supabase на Compute VM

### B1. Создать ВМ
Консоль → **Compute Cloud** → Создать ВМ:
- Образ: Ubuntu 22.04 LTS
- vCPU/RAM: 2 vCPU / 4 ГБ (старт), диск 30+ ГБ SSD
- Зона: `ru-central1-a`, публичный IP
- SSH-ключ свой

CLI:
```bash
yc compute instance create \
  --name supabase \
  --zone ru-central1-a \
  --network-interface subnet-name=default-ru-central1-a,nat-ip-version=ipv4 \
  --create-boot-disk image-family=ubuntu-2204-lts,size=30,type=network-ssd \
  --ssh-key ~/.ssh/id_ed25519.pub --cores 2 --memory 4
```

### B2. Поставить Docker и Supabase
На ВМ:
```bash
# Docker
curl -fsSL https://get.docker.com | sh
# Supabase self-hosted
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
cp .env.example .env
# ОБЯЗАТЕЛЬНО заменить в .env: POSTGRES_PASSWORD, JWT_SECRET, ANON_KEY,
#   SERVICE_ROLE_KEY, DASHBOARD_USERNAME/PASSWORD, SITE_URL, API_EXTERNAL_URL
docker compose up -d
```
Дашборд Studio: `http://<IP>:8000` (закройте фаерволом, доступ только через reverse-proxy + HTTPS).

### B3. Применить вашу схему
В Studio → SQL Editor вставьте `supabase/migrations/0001_init.sql` → Run.
(Триггер `on_auth_user_created`, RPC `accrue_order_bonus` / `redeem_bonus_to_promo`, RLS — всё перенесётся.)

### B4. HTTPS и домен
- Поднимите Caddy/nginx на ВМ, проксируйте `api.lk.farmati.ru` → `localhost:8000`.
- Выпустите сертификат (Let's Encrypt). Откройте наружу только 80/443.

### B5. Перенастроить кабинет
```bash
cd cabinet
cp .env.production.example .env.production   # VITE_SUPABASE_URL = https://api.lk.farmati.ru, ANON_KEY
npm run build                                # dist/ → залить на хостинг в РФ
```

---

## Чек-лист соответствия 152-ФЗ (после миграции)

- [ ] Основная БД клиентов физически в `ru-central1` (web → Managed PG; cabinet → self-hosted Supabase на VM)
- [ ] Подано **уведомление в РКН** (ст. 22 152-ФЗ)
- [ ] На сайте опубликована **Политика конфиденциальности** (ч.2 ст.18.1)
- [ ] На формах регистрации/заказа — **согласие на обработку ПДн** (ст. 6, 9)
- [ ] Для рассылок — **отдельное согласие на рекламу** (ст. 18 ФЗ-38)
- [ ] Трансграничная передача (если зарубежные копии/сервисы) оформлена по ст. 12
- [ ] Доступ к БД по SSL, секреты не в репозитории, бэкапы включены

---

## Ориентир по стоимости (Yandex Cloud, в месяц, примерно)

| Ресурс | Конфиг | ~Цена/мес |
|---|---|---|
| Managed PostgreSQL | b1.medium, 1 хост, 20 ГБ SSD | ~3 500–5 000 ₽ |
| Compute VM (Supabase) | 2 vCPU/4 ГБ, 30 ГБ SSD | ~2 000–3 000 ₽ |
| Исходящий трафик/IP | немного | ~200–500 ₽ |

Цены приблизительные — сверьте в калькуляторе https://cloud.yandex.ru/prices.
Для экономии на старте можно объединить: поднять self-hosted Supabase на одной VM и
использовать его Postgres и для магазина (тогда часть A не нужна, но web придётся
перевести с Prisma-моделей на ту же БД — это уже доработка кода).

---

## Порядок выполнения (кратко)

1. `yc init`, создать каталог `farmati-prod`.
2. Managed PostgreSQL → применить Prisma-схему → задеплоить `web`.
3. Compute VM → Docker → self-hosted Supabase → применить `0001_init.sql` → перенести Edge Function.
4. HTTPS-домены, перенастроить `.env.production` обоих стеков.
5. Пройти чек-лист 152-ФЗ, подать уведомление в РКН.
