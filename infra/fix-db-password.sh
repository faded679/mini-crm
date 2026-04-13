#!/bin/bash
# Скрипт восстановления пароля postgres
# Запускать: bash ~/mini-crm/infra/fix-db-password.sh

set -e

COMPOSE_DIR="$(dirname "$0")"
cd "$COMPOSE_DIR"

echo "=== Восстановление пароля postgres ==="

# Переключаем local на trust
docker compose exec db sed -i 's/^local   all             all.*$/local   all             all                                     trust/' /var/lib/postgresql/data/pg_hba.conf
docker compose restart db
sleep 5

# Сбрасываем пароль
docker compose exec db psql -U postgres -c "ALTER USER postgres PASSWORD 'postgres';"

# Возвращаем md5
docker compose exec db sed -i 's/^local   all             all.*$/local   all             all                                     md5/' /var/lib/postgresql/data/pg_hba.conf
docker compose restart db
sleep 5

# Перезапускаем api
docker compose restart api

echo "=== Готово! Проверяем api ==="
sleep 10
docker compose logs api --since 30s | tail -3
