# Настройка Zvonok API для верификации звонком

## Метод: "Звонок на проверочный номер"

Клиент вводит свой номер телефона, получает номер для звонка, звонит на него сам для подтверждения.

## Шаги настройки

### 1. Создайте кампанию в Zvonok

1. Зайдите в личный кабинет: https://zvonok.com/manager/
2. Перейдите в раздел **"Подтверждение номера"** или **"Кампании"**
3. Создайте новую кампанию типа **"Звонок на проверочный номер"** (Verification Call)
4. Настройте параметры кампании

### 2. Получите API credentials

В настройках кампании найдите:
- **Public Key** (публичный ключ API)
- **Campaign ID** (ID кампании)

### 3. Найдите API endpoints

В документации кампании или в разделе API найдите:

**Endpoint для инициации верификации:**
- URL: `https://zvonok.com/manager/cabapi_external/api/v1/phones/verification/` (TODO: уточнить)
- Метод: POST
- Параметры: `public_key`, `campaign_id`, `phone`
- Ответ: должен содержать `verification_number` (номер для звонка) и `session_id`

**Endpoint для проверки статуса:**
- URL: `https://zvonok.com/manager/cabapi_external/api/v1/phones/verification/status/` (TODO: уточнить)
- Метод: GET
- Параметры: `public_key`, `session_id`
- Ответ: должен содержать `verified: true/false`

### 4. Обновите код

После получения точных endpoints из документации Zvonok:

1. Откройте `apps/api/src/server/services/zvonok-service.ts`
2. Замените TODO комментарии на реальные endpoints
3. Проверьте формат ответов и при необходимости скорректируйте парсинг

### 5. Добавьте credentials в .env

На сервере в файле `/root/mini-crm/infra/.env`:

```bash
ZVONOK_PUBLIC_KEY=ваш_public_key
ZVONOK_CAMPAIGN_ID=ваш_campaign_id
```

### 6. Задеплойте изменения

```bash
git add -A
git commit -m "feat: implement verification call method for Zvonok"
git push origin main

# На сервере:
cd /root/mini-crm && git pull && cd infra && docker-compose up -d --build api public
```

## Как работает

1. **Клиент вводит номер** → `POST /api/public-auth/request-verification`
   - API возвращает `sessionId` и `verificationNumber`
   
2. **Клиент видит номер для звонка** → UI показывает номер
   
3. **Клиент звонит на номер** → Zvonok фиксирует входящий звонок
   
4. **Фронтенд проверяет статус** → `GET /api/public-auth/check-verification/:sessionId`
   - Polling каждые 2-3 секунды
   - Когда `verified: true` → клиент авторизован

## Контакты поддержки Zvonok

Если не можете найти документацию по API для "Звонок на проверочный номер":
- Email: support@zvonok.com
- Телефон: +7 (800) 555-86-07
- Документация: https://api-docs.zvonok.com/
