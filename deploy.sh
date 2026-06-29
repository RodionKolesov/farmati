#!/usr/bin/env bash
# Деплой farmati.ru: commit+push локально -> умная сборка на сервере.
# Использование:  ./deploy.sh "сообщение коммита"
#                 ./deploy.sh            (без коммита, только пересобрать сервер из текущего main)
set -euo pipefail

MSG="${1:-}"
SSH_HOST="farmati"

cd "$(dirname "$0")"

# 1) Локально: коммит, если есть изменения и передано сообщение
if [ -n "$MSG" ]; then
  if [ -n "$(git status --porcelain)" ]; then
    echo ">> commit: $MSG"
    git add -A
    git commit -m "$MSG"
  else
    echo ">> нет локальных изменений — коммит пропущен"
  fi
fi

# 2) Пуш в GitHub
echo ">> git push"
git push origin main

# 3) Сборка на сервере (зависимости/миграция — только при необходимости)
echo ">> деплой на сервере..."
ssh "$SSH_HOST" 'bash -s' <<'REMOTE'
set -euo pipefail
cd /root/farmati
BEFORE=$(git rev-parse HEAD)
git pull --ff-only
AFTER=$(git rev-parse HEAD)
cd web
CHANGED=$(git diff --name-only "$BEFORE" "$AFTER" || true)

if echo "$CHANGED" | grep -q '^web/package-lock.json$'; then
  echo ">> зависимости изменились -> npm ci"
  npm ci
else
  echo ">> зависимости без изменений -> npm ci пропущен"
fi

if echo "$CHANGED" | grep -q '^web/prisma/schema.prisma$'; then
  echo ">> схема БД изменилась -> prisma generate + db push"
  npx prisma generate
  npx prisma db push
else
  echo ">> схема БД без изменений -> prisma пропущен"
fi

echo ">> next build"
npm run build
echo ">> pm2 restart"
pm2 restart farmati --update-env
echo ">> DEPLOY_DONE"
REMOTE

echo ">> Готово: https://farmati.ru"
