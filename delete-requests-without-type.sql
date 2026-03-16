-- Удаление заявок без типа доставки (deliveryTypeId IS NULL)
-- Сначала удаляем связанные записи, затем сами заявки

-- 1. Удаляем историю статусов для заявок без типа
DELETE FROM "RequestStatusHistory"
WHERE "requestId" IN (
  SELECT id FROM "ShipmentRequest" WHERE "deliveryTypeId" IS NULL
);

-- 2. Удаляем услуги для заявок без типа
DELETE FROM "RequestService"
WHERE "requestId" IN (
  SELECT id FROM "ShipmentRequest" WHERE "deliveryTypeId" IS NULL
);

-- 3. Удаляем позиции счетов для заявок без типа
DELETE FROM "InvoiceItem"
WHERE "invoiceId" IN (
  SELECT id FROM "Invoice" WHERE "requestId" IN (
    SELECT id FROM "ShipmentRequest" WHERE "deliveryTypeId" IS NULL
  )
);

-- 4. Удаляем счета для заявок без типа
DELETE FROM "Invoice"
WHERE "requestId" IN (
  SELECT id FROM "ShipmentRequest" WHERE "deliveryTypeId" IS NULL
);

-- 5. Удаляем сами заявки без типа доставки
DELETE FROM "ShipmentRequest"
WHERE "deliveryTypeId" IS NULL;

-- Проверка: показать количество оставшихся заявок по типам
SELECT 
  CASE 
    WHEN "deliveryTypeId" = 1 THEN 'FBS'
    WHEN "deliveryTypeId" = 2 THEN 'FBO'
    ELSE 'БЕЗ ТИПА'
  END as type,
  COUNT(*) as count
FROM "ShipmentRequest"
GROUP BY "deliveryTypeId"
ORDER BY "deliveryTypeId";
