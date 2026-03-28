# Настройка функционала для кладовщиков

## Описание

Функционал позволяет кладовщикам через Telegram бот:
- Просматривать заявки со статусом "Новый"
- Редактировать объем (для FBS) и количество коробок/паллет (для FBO)
- Загружать фото груза (1 фото на заявку)
- Изменять статус заявки на "Склад"

## Установка

### 1. Применить миграцию БД

```bash
cd apps/api
npx prisma migrate dev
npx prisma generate
```

### 2. Добавить кладовщика в базу данных

Выполните SQL запрос для добавления кладовщика:

```sql
INSERT INTO warehouse_workers (telegram_id, name, is_active)
VALUES ('123456789', 'Иван Иванов', true);
```

Где `123456789` - это Telegram ID кладовщика (можно узнать через @userinfobot в Telegram).

### 3. Перезапустить сервисы

```bash
# Локально
npm run dev

# На сервере
cd ~/mini-crm/infra
docker-compose restart api bot
```

## Использование

### Для кладовщика в Telegram:

1. Открыть бота
2. Отправить команду `/warehouse`
3. Выбрать "📋 Новые заявки"
4. Выбрать заявку из списка
5. Использовать кнопки для:
   - ✏️ Указать объем (для FBS)
   - ✏️ Изменить количество (для FBO)
   - 📸 Добавить фото
   - ✅ Перевести на склад

### Для менеджера на сайте:

Фото груза отображается в карточке заявки на странице "Заявки".

## API Endpoints

### Получить новые заявки
```
GET /warehouse/requests/new?telegramId={telegramId}
```

### Получить детали заявки
```
GET /warehouse/requests/:id?telegramId={telegramId}
```

### Обновить объем (FBS)
```
PATCH /warehouse/requests/:id/volume
Body: { volume: 2.5, telegramId: "123456789" }
```

### Обновить количество коробок (FBO)
```
PATCH /warehouse/requests/:id/packaging
Body: { boxCount: 15, telegramId: "123456789" }
```

### Добавить фото
```
POST /warehouse/requests/:id/photo
Body: { fileId: "telegram_file_id", telegramId: "123456789" }
```

### Удалить фото
```
DELETE /warehouse/requests/:id/photo/:photoId?telegramId={telegramId}
```

### Изменить статус на "warehouse"
```
PATCH /warehouse/requests/:id/status
Body: { telegramId: "123456789" }
```

## Структура БД

### Таблица `warehouse_workers`
- `id` - ID кладовщика
- `telegram_id` - Telegram ID (уникальный)
- `name` - Имя кладовщика
- `is_active` - Активен ли аккаунт
- `created_at` - Дата создания

### Таблица `request_photos`
- `id` - ID фото
- `request_id` - ID заявки
- `file_id` - Telegram file_id
- `file_url` - URL для скачивания (опционально)
- `uploaded_at` - Дата загрузки
- `uploaded_by` - Telegram ID загрузившего

## Безопасность

- Все API endpoints проверяют что `telegramId` принадлежит активному кладовщику
- Кладовщики могут редактировать только заявки со статусом "new"
- Все изменения логируются в `request_field_history`

## Troubleshooting

### Кладовщик не видит заявки
1. Проверьте что кладовщик добавлен в БД: `SELECT * FROM warehouse_workers WHERE telegram_id = '123456789';`
2. Проверьте что `is_active = true`
3. Проверьте логи API: `docker-compose logs api --tail=50`

### Фото не отображается
1. Проверьте что фото сохранилось: `SELECT * FROM request_photos WHERE request_id = X;`
2. Telegram `file_id` должен быть валидным
3. Для отображения фото используйте Telegram Bot API: `https://api.telegram.org/bot{BOT_TOKEN}/getFile?file_id={file_id}`

### Ошибка "Access denied"
Убедитесь что `telegramId` передается в запросе и совпадает с записью в `warehouse_workers`.

## Примеры использования

### Добавить нескольких кладовщиков

```sql
INSERT INTO warehouse_workers (telegram_id, name, is_active) VALUES
('111111111', 'Петр Петров', true),
('222222222', 'Сидор Сидоров', true),
('333333333', 'Мария Иванова', true);
```

### Деактивировать кладовщика

```sql
UPDATE warehouse_workers 
SET is_active = false 
WHERE telegram_id = '123456789';
```

### Посмотреть все фото заявки

```sql
SELECT rp.*, sr.id as request_id, sr.status
FROM request_photos rp
JOIN shipment_requests sr ON sr.id = rp.request_id
WHERE rp.request_id = 123;
```

## Следующие шаги

1. Добавить возможность загружать несколько фото (сейчас максимум 1)
2. Добавить автоматическое скачивание фото с Telegram на сервер
3. Добавить уведомления менеджерам при изменении статуса
4. Добавить статистику по работе кладовщиков
