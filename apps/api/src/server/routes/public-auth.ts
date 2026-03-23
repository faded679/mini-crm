import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { ApiError } from "../errors.js";
import { initiateVerificationCall, checkVerificationStatus } from "../services/zvonok-service.js";

const router = Router();

// Временное хранилище для сессий верификации (в продакшене использовать Redis)
const verificationSessions = new Map<string, { phone: string; expiresAt: number; createdAt: string }>();

// POST /public-auth/request-verification - инициировать сессию верификации
router.post("/request-verification", async (req, res, next) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      throw new ApiError(400, "Phone number is required");
    }

    // Нормализация номера телефона
    let normalizedPhone = phone.replace(/\D/g, "");
    
    if (normalizedPhone.length < 10) {
      throw new ApiError(400, "Invalid phone number");
    }

    // Zvonok ожидает номер в формате +7XXXXXXXXXX
    normalizedPhone = "+" + normalizedPhone;

    // Инициируем сессию верификации через Zvonok
    const response = await initiateVerificationCall(normalizedPhone);
    
    // Сохраняем сессию с временем жизни 10 минут
    verificationSessions.set(response.request_id, {
      phone: normalizedPhone,
      expiresAt: Date.now() + 10 * 60 * 1000,
      createdAt: new Date().toISOString(),
    });

    // Очистка старых сессий
    for (const [key, value] of verificationSessions.entries()) {
      if (value.expiresAt < Date.now()) {
        verificationSessions.delete(key);
      }
    }

    res.json({ 
      sessionId: response.request_id,
      verificationNumber: response.verification_number,
      message: `Позвоните на номер ${response.verification_number} для подтверждения`
    });
  } catch (err) {
    next(err);
  }
});

// GET /public-auth/check-verification/:sessionId - проверить статус верификации
router.get("/check-verification/:sessionId", async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      throw new ApiError(400, "Session ID is required");
    }

    // Проверяем существование сессии
    const session = verificationSessions.get(sessionId);
    
    if (!session) {
      throw new ApiError(404, "Session not found or expired");
    }

    if (session.expiresAt < Date.now()) {
      verificationSessions.delete(sessionId);
      throw new ApiError(401, "Session expired");
    }

    // Проверяем статус верификации в Zvonok по номеру телефона
    const status = await checkVerificationStatus(session.phone);

    if (status.verified) {
      console.log("Verification successful for phone:", session.phone);

      // Верификация успешна, удаляем сессию
      verificationSessions.delete(sessionId);

      // Нормализуем номер для поиска (с + и без)
      const phoneWithPlus = session.phone.startsWith("+") ? session.phone : "+" + session.phone;
      const phoneWithoutPlus = session.phone.startsWith("+") ? session.phone.slice(1) : session.phone;

      // Пытаемся найти или создать клиента
      let clientId = 0;
      let clientPhone = session.phone;
      
      try {
        // Ищем клиента по обоим форматам номера
        let client = await (prisma as any).client.findFirst({
          where: { 
            OR: [
              { phone: phoneWithPlus },
              { phone: phoneWithoutPlus },
            ]
          },
        });
        console.log("Found existing client:", client ? client.id : "none");

        if (!client) {
          client = await (prisma as any).client.create({
            data: {
              phone: phoneWithoutPlus,
              telegramId: `phone_${phoneWithoutPlus}_${Date.now()}`,
            },
          });
          console.log("Created new client:", client.id);
        }
        
        clientId = client.id;
        clientPhone = client.phone || session.phone;
      } catch (dbErr: any) {
        console.error("DB error (non-fatal):", dbErr.message);
      }

      res.json({
        verified: true,
        client: {
          id: clientId,
          phone: clientPhone,
        },
      });
    } else {
      // Верификация еще не завершена
      res.json({
        verified: false,
        message: "Ожидание звонка..."
      });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
