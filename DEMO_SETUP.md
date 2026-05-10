# Запуск демо-режима CRM

## Что это

Полностью изолированный стек (отдельная БД, отдельный API, отдельный web-контейнер) на поддомене `demo.sologo.ru`.
Продакшен данные физически недоступны из демо — разные сети Docker, разные `DATABASE_URL`, разный `JWT_SECRET`.

## Логин в демо

```
demo@demo.com / demo1234
```

## Первый запуск на сервере

### 1. DNS
Добавь A-запись `demo.sologo.ru` → IP сервера.

### 2. SSL (если ещё нет wildcard)
```bash
certbot certonly --nginx -d demo.sologo.ru
# или если уже есть *.sologo.ru — ничего делать не нужно
```

### 3. Создай .env для демо
```bash
cp infra/.env.example infra/.env.demo
```
Отредактируй `infra/.env.demo`:
```env
DEMO_POSTGRES_PASSWORD=сложный_пароль_для_демо_бд
DEMO_JWT_SECRET=другой_секрет_не_как_в_продакшене
DEMO_CORS_ORIGINS=https://demo.sologo.ru
DEMO_API_BASE_URL=https://demo.sologo.ru/api
```

### 4. Запусти демо-стек
```bash
cd infra
docker compose -f docker-compose.demo.yml --env-file .env.demo up -d --build
```

### 5. Выполни миграции и seed в демо-контейнере
```bash
docker exec mini-crm-api-demo npx prisma migrate deploy
docker exec mini-crm-api-demo node -e "
const { execSync } = require('child_process');
execSync('npx tsx prisma/demo-seed.ts', { stdio: 'inherit' });
"
```
Или через npm:
```bash
docker exec mini-crm-api-demo sh -c "cd /app && npm run demo-seed"
```

### 6. Обнови nginx (добавь demo.sologo.ru в основной стек)
```bash
cd infra
docker compose restart nginx
```

## Автосброс данных каждые 24 часа

Добавь на сервере cron:
```bash
crontab -e
```
```cron
0 3 * * * docker exec mini-crm-api-demo sh -c "cd /app && npm run demo-seed" >> /var/log/demo-seed.log 2>&1
```

## Обновление демо после деплоя

После того как CI/CD пересобирает основной стек, пересобери и демо:
```bash
cd infra
docker compose -f docker-compose.demo.yml --env-file .env.demo up -d --build
docker exec mini-crm-api-demo npx prisma migrate deploy
```

## Безопасность

- Демо-БД (`mini_crm_demo`) и продакшен-БД (`mini_crm`) — разные контейнеры PostgreSQL в разных Docker-сетях
- JWT токены несовместимы (разный `DEMO_JWT_SECRET`)
- Telegram, T-Bank, Zvonok, Email в демо отключены (пустые переменные)
- Даже при взломе демо-контейнера атакующий попадает только в изолированную БД с фейковыми данными
