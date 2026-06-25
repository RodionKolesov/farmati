# Развёртывание farmati.ru на сервере Reg.ru — полная инструкция (от и до)

Сервер: Ubuntu 26.04, 1 ГБ RAM. IP: **194.226.163.20**. Код: https://github.com/RodionKolesov/farmati (публичный).
База — SQLite, со swap для сборки. Всё в РФ → 152-ФЗ соблюдён.

---

## Шаг 0. Сначала — DNS (чтобы успело обновиться)
В управлении доменом **farmati.ru** создайте две A-записи:
- `@` → `194.226.163.20`
- `www` → `194.226.163.20`

Сохраните. Обновляется от 10 минут до пары часов — поэтому делаем это первым, пока идут остальные шаги.

## Шаг 1. Подключиться к серверу
На ПК откройте **PowerShell** (или cmd):
```
ssh root@194.226.163.20
```
- Первый вход: на вопрос — `yes`.
- Введите root-пароль из письма Reg.ru (**при вводе он не виден — это нормально**), Enter.
- Успех = приглашение вида `root@...:~#`. Все команды ниже выполняются здесь.

## Шаг 2. Подготовить сервер (вставьте блок целиком)
```bash
apt update && apt -y upgrade
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile && echo '/swapfile none swap sw 0 0' >> /etc/fstab
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt -y install nodejs git nginx certbot python3-certbot-nginx
npm i -g pm2
apt -y install ufw && ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw --force enable
```
Проверка: `node -v` → `v22.x`.

## Шаг 3. Скачать код с GitHub
```bash
cd /root
git clone https://github.com/RodionKolesov/farmati.git
cd /root/farmati/web
```

## Шаг 4. Настроить и собрать
```bash
cat > .env <<'EOF'
DATABASE_URL="file:./prod.db"
AUTH_TRUST_HOST=true
NEXT_PUBLIC_BASE_URL="https://farmati.ru"
NEXT_PUBLIC_BONUS_EARN_RATE=0.05
ADMIN_EMAIL="ваш-email@пример.ru"
CRON_SECRET="придумайте-секрет"
EOF
echo "AUTH_SECRET=\"$(openssl rand -base64 32)\"" >> .env

npm ci
npx prisma generate
npx prisma db push
node seed.mjs
npm run build
```

## Шаг 5. Запустить сайт (работает постоянно)
```bash
pm2 start "npm run start" --name farmati
pm2 save
pm2 startup
```
Последняя команда напечатает ещё одну (начинается с `sudo env ...`) — **скопируйте и выполните её**, чтобы сайт поднимался после перезагрузок.

Проверка: `curl -I http://127.0.0.1:3000` → `HTTP/1.1 200 OK`.

## Шаг 6. nginx (связать домен с сайтом)
```bash
cat > /etc/nginx/sites-available/farmati <<'EOF'
server {
    server_name farmati.ru www.farmati.ru;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
ln -sf /etc/nginx/sites-available/farmati /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```
После этого `http://farmati.ru` уже должен открываться (если DNS обновился).

## Шаг 7. HTTPS (бесплатный сертификат)
```bash
certbot --nginx -d farmati.ru -d www.farmati.ru
```
Укажите email, согласитесь (`Y`), при выборе редиректа — вариант с переходом на HTTPS (обычно `2`).

## Шаг 8. Готово
Откройте `https://farmati.ru` — сайт работает.

---

## Обновление сайта в будущем
Вы поменяли код и залили его на GitHub (`git push`). На сервере:
```bash
cd /root/farmati && git pull && cd web && npm ci && npx prisma db push && npm run build && pm2 restart farmati
```

## Настройки в `.env` (что значат)
- `NEXT_PUBLIC_BONUS_EARN_RATE` — кэшбэк: `0.05` = 5%, `0.07` = 7%. После изменения: `npm run build && pm2 restart farmati`.
- `ADMIN_EMAIL` — email владельца; зайдя под ним, вы видите кнопку «Управление сайтом» и админку `/admin` (товары, курсы, чек-листы, отзывы).
- `CRON_SECRET` — секрет для автосгорания бонусов (см. ниже).

## Автосгорание бонусов (4 месяца)
Работает само: бонусы сгорают при заходе участника в кабинет, плюс есть кнопка в админке.
Для гарантированного ежедневного сгорания у всех — добавьте крон (по желанию):
```bash
crontab -e
# добавьте строку (раз в день в 3:00), подставив свой CRON_SECRET:
0 3 * * * curl -s "http://127.0.0.1:3000/api/cron/expire-bonuses?secret=ВАШ_CRON_SECRET" >/dev/null
```

## Бэкап базы (заказы, пользователи)
Файл базы: `/root/farmati/web/prod.db`. Скачивайте копию к себе регулярно (диск 10 ГБ).

## Если что-то не так
- `node -v` не v22 → `apt -y install nodejs`, проверить снова.
- `npm run build` упал по памяти → `free -h` (Swap должен быть 2.0Gi); если нет — повторить swap-команду из Шага 2.
- `certbot` не видит домен → DNS ещё не обновился; подождать и повторить Шаг 7.
- Любой непонятный вывод — скопируйте и пришлите, разберём.
