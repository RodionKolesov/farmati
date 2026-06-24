# Развёртывание сайта на сервере Reg.ru (Free Tier) — простая инструкция

Сервер: Ubuntu 26.04, 1 ГБ RAM, 10 ГБ диск. IP: **194.226.163.20**
База — SQLite (без отдельного Postgres), плюс swap для сборки. Всё в РФ → 152-ФЗ соблюдён.

> Везде, где написано `farmati.ru` — подставьте свой домен (например `farmati.ru`).

---

## Шаг 1. Подключиться к серверу
На вашем ПК откройте **PowerShell** и выполните:
```
ssh root@194.226.163.20
```
- Введите root-пароль (он в письме от Reg.ru). Пароль при вводе не отображается — это нормально.
- Если спросит «Are you sure you want to continue connecting?» — напишите `yes`.
- Если попросит сменить пароль при первом входе — придумайте новый.

Дальше все команды (Шаги 2–6) выполняются **внутри сервера** (в этом SSH-окне).

## Шаг 2. Подготовить сервер
Скопируйте и вставьте **весь блок целиком**, нажмите Enter, дождитесь окончания:
```bash
apt update && apt -y upgrade
# swap 2 ГБ — чтобы сборка сайта не падала из-за нехватки памяти
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile && echo '/swapfile none swap sw 0 0' >> /etc/fstab
# Node.js 22 + git + nginx + certbot (для HTTPS)
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt -y install nodejs git nginx certbot python3-certbot-nginx
npm i -g pm2
# фаервол: открываем веб-порты
apt -y install ufw && ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw --force enable
```
Проверка, что Node установился:
```bash
node -v
```
(должно показать v22.x)

## Шаг 3. Загрузить код сайта на сервер (через WinSCP)
На сервере создайте папку:
```bash
mkdir -p /root/web
```
Теперь на **ПК**:
1. Скачайте и установите **WinSCP** (winscp.net).
2. Откройте, в окне входа:
   - **Имя хоста:** `194.226.163.20`
   - **Имя пользователя:** `root`
   - **Пароль:** ваш root-пароль
   - Нажмите **Войти** (на предупреждение о ключе — «Да»).
3. Слева (ваш ПК) откройте `C:\Users\bb_ll\Desktop\cosmetics-loyalty\web`.
4. Справа (сервер) откройте `/root/web`.
5. Выделите **всё содержимое** папки `web`, **КРОМЕ папок `node_modules` и `.next`** (их не копируем — они тяжёлые и пересоберутся на сервере).
6. Перетащите выделенное слева направо. Дождитесь окончания загрузки.

## Шаг 4. Настроить и собрать сайт (снова в SSH)
```bash
cd /root/web
# создаём файл настроек .env
cat > .env <<'EOF'
DATABASE_URL="file:./prod.db"
AUTH_TRUST_HOST=true
NEXT_PUBLIC_BASE_URL="https://farmati.ru"
EOF
# генерируем секрет и дописываем
echo "AUTH_SECRET=\"$(openssl rand -base64 32)\"" >> .env

# установка, база, начальные данные, сборка
npm ci
npx prisma generate
npx prisma db push
node seed.mjs
npm run build
```
> Перед запуском замените `farmati.ru` в `.env`. Открыть редактор: `nano .env` (сохранить — Ctrl+O, Enter; выйти — Ctrl+X).

## Шаг 5. Запустить сайт (чтобы работал постоянно)
```bash
pm2 start "npm run start" --name farmati
pm2 save
pm2 startup
```
Последняя команда напечатает ещё одну команду (начинается с `sudo env ...`) — **скопируйте её и выполните**, чтобы сайт сам поднимался после перезагрузки.

Проверка, что работает:
```bash
curl -I http://127.0.0.1:3000
```
(должно быть `HTTP/1.1 200 OK`)

## Шаг 6. Привязать домен и включить HTTPS

**6.1. DNS.** В управлении вашим доменом (там, где покупали) создайте **A-записи**:
- `@` → `194.226.163.20`
- `www` → `194.226.163.20`

Подождите, пока обновится (от 10 минут до пары часов). Проверить можно так (на ПК): `nslookup farmati.ru` — должен показать ваш IP.

**6.2. Настроить nginx.** На сервере вставьте блок (замените `farmati.ru` в двух местах):
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

**6.3. Выпустить бесплатный HTTPS-сертификат** (после того как DNS заработал):
```bash
certbot --nginx -d farmati.ru -d www.farmati.ru
```
На вопросы: укажите email, согласитесь с условиями (`Y`), при выборе про редирект — выберите вариант с перенаправлением на HTTPS (обычно `2`).

## Шаг 7. Готово!
Откройте в браузере `https://farmati.ru` — сайт работает.

---

## Полезное на будущее

**Обновить сайт** (после изменений в коде — заново загрузите через WinSCP или `git pull`):
```bash
cd /root/web && npm ci && npx prisma db push && npm run build && pm2 restart farmati
```

**Посмотреть логи / перезапустить:**
```bash
pm2 logs farmati      # логи
pm2 restart farmati   # перезапуск
```

**Бэкап базы** (там все заказы и пользователи) — скачайте через WinSCP файл:
```
/root/web/prod.db
```
Делайте это регулярно (диск всего 10 ГБ — бэкапы храните на ПК, не на сервере).

---

## Если что-то пошло не так
- **node -v** не v22 → выполните: `apt -y install nodejs` и проверьте снова.
- **npm run build** упал по памяти → проверьте swap: `free -h` (должно быть Swap: 2.0Gi). Если нет — повторите команду swap из Шага 2.
- **certbot** ругается, что не видит домен → DNS ещё не обновился; подождите и повторите Шаг 6.3.
- В любой непонятной ситуации скопируйте вывод команды и пришлите — разберём.
