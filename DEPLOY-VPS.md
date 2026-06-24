# Деплой сайта на VPS (бюджетный боевой хостинг)

Разворачиваем `web` (Next.js + PostgreSQL) на одном сервере. Всё, включая сборку, делается
на сервере. Данные в РФ → 152-ФЗ соблюдён.

## Рекомендованный сервер

- **Reg.ru VDS SSD-2** (или Timeweb Cloud-аналог): **2 ядра / 2 ГБ RAM / 40 ГБ SSD**
- ОС: **Ubuntu 22.04 LTS**
- ~590 ₽/мес + домен ~250 ₽/год
- Регион — Россия (любой ЦОД провайдера в РФ)

После заказа провайдер пришлёт **IP, root-пароль** (или вы добавите SSH-ключ).

---

## Шаг 0. Подключиться к серверу

```bash
ssh root@ВАШ_IP
```

## Шаг 1. Базовая настройка + swap (страховка по памяти)

```bash
apt update && apt upgrade -y
# swap 2 ГБ — чтобы сборка не падала по памяти
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
# фаервол: только SSH и веб
apt install -y ufw && ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw --force enable
```

## Шаг 2. Node.js 20 + PostgreSQL + nginx

```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm i -g pm2

# PostgreSQL
apt install -y postgresql
sudo -u postgres psql -c "CREATE USER farmati WITH PASSWORD 'ПРИДУМАЙТЕ_ПАРОЛЬ';"
sudo -u postgres psql -c "CREATE DATABASE farmati OWNER farmati;"

# nginx + certbot (HTTPS)
apt install -y nginx certbot python3-certbot-nginx
```

## Шаг 3. Загрузить проект (через git)

```bash
apt install -y git
cd /opt && git clone ВАШ_РЕПОЗИТОРИЙ farmati && cd farmati/web
```

> Если репозиторий приватный — добавьте на сервере SSH deploy-key или используйте
> токен доступа (HTTPS): `git clone https://ТОКЕН@github.com/USER/REPO.git farmati`.
> Убедитесь, что в репозитории есть `.gitignore` с `node_modules/` и `.next/` —
> их не коммитят, они ставятся/собираются на сервере (Шаг 5).

## Шаг 4. Настроить окружение и Prisma (Postgres)

В `web/prisma/schema.prisma` провайдер должен быть **postgresql**:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Создать `web/.env.production` (на основе `.env.production.example`):
```
DATABASE_URL="postgresql://farmati:ПАРОЛЬ@localhost:5432/farmati"
AUTH_TRUST_HOST=true
AUTH_SECRET="ВСТАВЬТЕ_РЕЗУЛЬТАТ_openssl_rand_base64_32"
NEXT_PUBLIC_BASE_URL="https://ваш-домен.ru"
```
Сгенерировать секрет: `openssl rand -base64 32`

## Шаг 5. Установить, создать схему БД, собрать

```bash
cd /opt/farmati/web
npm ci                       # или npm install
npx prisma generate
npx prisma db push           # создаёт таблицы в PostgreSQL (миграций нет — db push)
node seed.mjs                # начальные товары/курсы (без ПДн)
npm run build                # сборка прямо на сервере (swap страхует память)
```

## Шаг 6. Запустить через pm2 (автостарт, перезапуск при падении)

```bash
pm2 start "npm run start" --name farmati-web
pm2 save
pm2 startup            # выполните команду, которую он напечатает
```
По умолчанию Next.js слушает порт **3000**.

## Шаг 7. nginx + HTTPS

Создать `/etc/nginx/sites-available/farmati`:
```nginx
server {
    server_name ваш-домен.ru www.ваш-домен.ru;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Включить и выпустить сертификат:
```bash
ln -s /etc/nginx/sites-available/farmati /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d ваш-домен.ru -d www.ваш-домен.ru   # бесплатный HTTPS, автопродление
```

> Перед этим в DNS домена пропишите A-запись на IP сервера (в панели Reg.ru/регистратора).

## Шаг 8. Проверка

- Открыть `https://ваш-домен.ru` — сайт работает по HTTPS.
- `pm2 logs farmati-web` — логи приложения.
- `pm2 restart farmati-web` — перезапуск после изменений.

---

## Обновление сайта в будущем

```bash
cd /opt/farmati/web
git pull                 # или заново scp
npm ci && npx prisma db push && npm run build
pm2 restart farmati-web
```

## Бэкап базы (важно — делайте регулярно)

```bash
# ручной дамп
sudo -u postgres pg_dump farmati > /opt/backup_$(date +%F).sql
```
Позже можно повесить в cron ежедневно и копировать дампы в облако/на другой диск.

---

## Памятка по ресурсам

- 2 ГБ RAM + 2 ГБ swap — сборка `next build` проходит, сайт работает стабильно при низком/среднем трафике.
- Если сайт начнёт тормозить под нагрузкой (много заказов в акции) — поднять тариф до 4 ГБ (смена тарифа у провайдера за пару минут, без переустановки).
- Не поднимайте на этом сервере self-hosted Supabase — ему 2 ГБ мало; кабинет и бонусы уже встроены в `web`.
