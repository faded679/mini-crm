import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { ApiError } from "../errors.js";
import { sendCallCode } from "../services/zvonok-service.js";

const router = Router();

// Временное хранилище для кодов (в продакшене использовать Redis)
const callCodes = new Map<string, { code: string; phone: string; expiresAt: number }>();

// POST /public-auth/request-call - инициировать звонок
router.post("/request-call", async (req, res, next) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      throw new ApiError(400, "Phone number is required");
    }

    // Нормализация номера телефона
    const normalizedPhone = phone.replace(/\D/g, "");
    
    if (normalizedPhone.length < 10) {
      throw new ApiError(400, "Invalid phone number");
    }

    // Отправляем звонок через Zvonok
    const response = await sendCallCode(normalizedPhone);
    
    // Сохраняем код с временем жизни 5 минут
    callCodes.set(response.request_id, {
      code: response.code,
      phone: normalizedPhone,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    // Очистка старых кодов
    for (const [key, value] of callCodes.entries()) {
      if (value.expiresAt < Date.now()) {
        callCodes.delete(key);
      }
    }

    res.json({ 
      requestId: response.request_id,
      message: "Call initiated. Please enter the last 4 digits of the calling number."
    });
  } catch (err) {
    next(err);
  }
});

// POST /public-auth/verify-call - проверить код и авторизовать
router.post("/verify-call", async (req, res, next) => {
  try {
    const { requestId, code } = req.body;
    
    if (!requestId || !code) {
      throw new ApiError(400, "Request ID and code are required");
    }

    // Проверяем код
    const stored = callCodes.get(requestId);
    
    if (!stored) {
      throw new ApiError(401, "Invalid or expired request");
    }

    if (stored.expiresAt < Date.now()) {
      callCodes.delete(requestId);
      throw new ApiError(401, "Code expired");
    }

    if (stored.code !== code) {
      throw new ApiError(401, "Invalid code");
    }

    // Код верный, удаляем из хранилища
    callCodes.delete(requestId);

    // Ищем или создаем клиента по номеру телефона
    let client = await (prisma as any).client.findUnique({
      where: { phone: stored.phone },
    });

    if (!client) {
      // Создаем нового клиента
      client = await (prisma as any).client.create({
        data: {
          phone: stored.phone,
          telegramId: null,
          username: null,
          firstName: null,
          lastName: null,
        },
      });
    }

    // Возвращаем данные клиента (без токена, так как это публичный сайт)
    res.json({
      success: true,
      client: {
        id: client.id,
        phone: client.phone,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
