# Интеграция T-Bank Acquiring

## Описание

Интеграция эквайринга T-Bank (ранее Тинькофф) для приема онлайн-платежей по счетам.

## Поток работы

1. **Клиент создает заявку** в мини-аппе
2. **Менеджер проверяет заявку** и создает счет-акт (статус: `new`)
3. **Менеджер отправляет ссылку на оплату** → генерируется платежная ссылка T-Bank (статус: `awaiting_payment`)
4. **Клиент получает ссылку** через Telegram бот
5. **Клиент оплачивает** по ссылке
6. **T-Bank отправляет webhook** на `https://test.ved31.ru/api/webhooks/tbank`
7. **Счет обновляется** (статус: `paid`)
8. **Клиент получает уведомление** об успешной оплате

## Настройка

### 1. Получение учетных данных T-Bank

1. Зарегистрируйтесь в [T-Bank Business](https://business.tbank.ru/)
2. Подключите интернет-эквайринг
3. Получите:
   - `TerminalKey` - идентификатор терминала
   - `SecretKey` - секретный ключ для подписи запросов

### 2. Переменные окружения

Добавьте в `.env` файл:

```env
# T-Bank Acquiring
TBANK_TERMINAL_KEY=your_terminal_key_here
TBANK_SECRET_KEY=your_secret_key_here
TBANK_API_URL=https://securepay.tinkoff.ru/v2
API_BASE_URL=https://test.ved31.ru/api
```

### 3. Применение миграции базы данных

```bash
cd apps/api
npx prisma db push
```

Это добавит новые поля в таблицу `invoices`:
- `status` - статус счета (new, awaiting_payment, paid, cancelled)
- `tbankPaymentId` - ID платежа в T-Bank
- `tbankPaymentUrl` - ссылка на оплату
- `tbankOrderId` - ID заказа
- `amount` - сумма счета

### 4. Настройка webhook в T-Bank

1. Войдите в личный кабинет T-Bank Business
2. Перейдите в настройки терминала
3. Укажите URL для уведомлений: `https://test.ved31.ru/api/webhooks/tbank`
4. Сохраните настройки

## API Endpoints

### Создание счета

```http
POST /api/admin/invoices
Content-Type: application/json
Authorization: Bearer <token>

{
  "number": "INV-2024-001",
  "counterpartyId": 1,
  "requestId": 123,
  "items": [
    {
      "description": "Доставка груза",
      "quantity": 1,
      "unit": "услуга",
      "price": 5000,
      "amount": 5000
    }
  ]
}
```

### Отправка ссылки на оплату

```http
POST /api/admin/invoices/:id/send-payment-link
Authorization: Bearer <token>
```

Ответ:
```json
{
  "success": true,
  "paymentUrl": "https://securepay.tinkoff.ru/...",
  "paymentId": "123456789"
}
```

### Получение списка счетов

```http
GET /api/admin/invoices?status=awaiting_payment
Authorization: Bearer <token>
```

### Получение счета

```http
GET /api/admin/invoices/:id
Authorization: Bearer <token>
```

## Webhook от T-Bank

T-Bank отправляет POST запрос на `/api/webhooks/tbank` при изменении статуса платежа.

Пример уведомления:
```json
{
  "TerminalKey": "1234567890",
  "OrderId": "INV-2024-001",
  "Success": true,
  "Status": "CONFIRMED",
  "PaymentId": "123456789",
  "Amount": 500000,
  "Token": "signature_hash"
}
```

Статусы платежа:
- `CONFIRMED` - платеж подтвержден (счет переходит в статус `paid`)
- `REJECTED` - платеж отклонен (счет переходит в статус `cancelled`)
- `CANCELED` - платеж отменен (счет переходит в статус `cancelled`)

## Безопасность

1. **Проверка подписи**: Все уведомления от T-Bank проверяются на подлинность через SHA-256 подпись
2. **HTTPS**: Webhook endpoint доступен только по HTTPS
3. **Секретный ключ**: Не храните `TBANK_SECRET_KEY` в коде, только в переменных окружения

## Тестирование

### Тестовая среда T-Bank

Для тестирования используйте тестовый терминал:
- API URL: `https://rest-api-test.tinkoff.ru/v2`
- Тестовые карты: [документация T-Bank](https://www.tbank.ru/kassa/dev/payments/index.html#tag/Testirovanie)

### Тестовая карта для успешной оплаты

```
Номер: 4300 0000 0000 0777
Срок: 12/24
CVV: 123
```

## Мониторинг

Логи webhook уведомлений можно найти в консоли API:
```bash
docker-compose logs -f api | grep "T-Bank"
```

## Troubleshooting

### Webhook не приходит

1. Проверьте URL в настройках терминала T-Bank
2. Убедитесь что домен доступен извне: `curl https://test.ved31.ru/api/health`
3. Проверьте логи nginx и API

### Ошибка "Invalid signature"

1. Проверьте правильность `TBANK_SECRET_KEY`
2. Убедитесь что webhook приходит от T-Bank (проверьте IP)

### Платеж создается, но ссылка не отправляется клиенту

1. Проверьте что у клиента есть `telegramId`
2. Проверьте что бот запущен и имеет доступ к отправке сообщений
3. Проверьте логи бота

## Дополнительная информация

- [Документация T-Bank API](https://www.tbank.ru/kassa/dev/payments/)
- [Примеры интеграции](https://github.com/TinkoffCreditSystems/tinkoff-acquiring-sdk-php)
